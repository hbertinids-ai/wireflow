// --- Admin endpoints for backup and workflow versioning ---
const { listWorkflowVersions, getWorkflowVersion, restoreWorkflowVersion } = require('./admin/workflow_versions');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const { neo4j } = require('neo4j-driver'); // For graph DB option

const app = express();
const PORT = process.env.PORT || 5001;
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'data', 'backups');

// Auth
const { router: authRouter, ensureDefaultUsers, verifyToken, requireRole } = require('./auth');
// Create default users if missing
ensureDefaultUsers().catch(() => {});
// NOTE: mounting of the auth router is done after middleware registration
// so that CORS and body-parsing are applied to /auth responses. See below.

// File-based DB (default)
let useGraphDB = false; // Set to true for Neo4j
let driver; // Neo4j driver

if (useGraphDB) {
  // Neo4j setup (update URI/user/pass)
  driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'password'));
}

// Middleware
// Configure CORS: permissive during development, locked down via ALLOWED_ORIGINS in production.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
let corsOptions;
if (process.env.NODE_ENV === 'production') {
  // In production, only allow explicitly configured origins
  corsOptions = {
    origin: function(origin, callback) {
      // If no origin (e.g., curl/server-side), deny by default
      if (!origin) return callback(new Error('CORS: No origin'), false);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: Origin not allowed'), false);
    }
  };
} else {
  // During development allow any origin (useful for localhost / 127.0.0.1 etc.)
  corsOptions = { origin: true };
}
app.use(cors(corsOptions));
app.use(bodyParser.json());
fs.ensureDirSync(DATA_DIR);

// Content-Security-Policy middleware
// Only set a restrictive CSP in production. During development we avoid
// setting this header so the browser can freely call the local backend.
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "connect-src 'self' http://localhost:5173");
    next();
  });
}

// Mount backup archive endpoints
const backupRouter = require('./server-backup');
app.use(backupRouter);

// Mount /auth router after CORS/bodyParser so responses include CORS headers
app.use('/auth', authRouter);

// --- Admin endpoints for backup and workflow versioning ---
const { exec } = require('child_process');
const tar = require('tar');
app.post('/admin/backup', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Ensure backup directory exists
    await fs.ensureDir(BACKUP_DIR);
    // Timestamp format: YYYYMMDD_HHMMSS (matches existing listing code)
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const ts = `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
    const backupFileName = `data_backup_${ts}.tar.gz`;
    const tmpDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'wf-backup-'));
    const tmpFile = path.join(tmpDir, backupFileName);

    // Create tar.gz of the data directory into a temp file, then move it into BACKUP_DIR.
    // Copy data to a temp folder (excluding backups) and tar that copy to avoid read/write races
    const entries = (await fs.readdir(DATA_DIR)).filter(f => f !== path.basename(BACKUP_DIR));
    const tmpDataDir = path.join(tmpDir, 'data_copy');
    await fs.ensureDir(tmpDataDir);
    // Copy each entry (file or directory) into tmpDataDir
    for (const e of entries) {
      await fs.copy(path.join(DATA_DIR, e), path.join(tmpDataDir, e));
    }
    console.log('Backup: creating tar from temp copy', { tmpFile, tmpDataDir, entriesCount: entries.length });
    try {
      await tar.c({ gzip: true, file: tmpFile, cwd: tmpDataDir }, ['.']);
    } catch (tarErr) {
      console.error('tar.c failed:', tarErr && tarErr.stack ? tarErr.stack : tarErr);
      throw tarErr;
    }
    // Ensure destination exists and move the file
    await fs.ensureDir(BACKUP_DIR);
    await fs.move(tmpFile, path.join(BACKUP_DIR, backupFileName), { overwrite: false });
    // Cleanup temp dir
    await fs.remove(tmpDir);
    res.json({ success: true, message: 'Backup created', file: backupFileName });
  } catch (error) {
    // Log full stack for debugging in dev
    console.error('Backup error:', error && error.stack ? error.stack : error);
    const resp = { success: false, message: 'Backup failed', error: error.message };
    if (process.env.NODE_ENV !== 'production') resp.stack = error.stack;
    res.status(500).json(resp);
  }
});

app.get('/admin/workflow-versions', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const files = await listWorkflowVersions();
    // Map: {id, name, date, version, file}
    const versionInfo = await Promise.all(files.map(async (file, idx) => {
      // Example: wf-1758279897913_202509211846376.json
      const match = file.match(/^(wf-\d+)_([0-9]{8})([0-9]{6,7})\.json$/);
      let id = '', date = '', version = idx + 1;
      if (match) {
        id = match[1];
        // Format date as YYYY-MM-DD HH:mm:ss
        const d = match[2];
        const t = match[3];
        date = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)} ${t.slice(0,2)}:${t.slice(2,4)}:${t.slice(4,6)}`;
      }
      // Read name from version file
      let name = id;
      try {
        const data = await getWorkflowVersion(file);
        if (data && data.name) name = data.name;
      } catch {}
      return { file, id, name, date, version };
    }));
    res.json(versionInfo);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/admin/workflow-versions/:versionFile', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const data = await getWorkflowVersion(req.params.versionFile);
    res.json(data);
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/admin/workflow-versions/restore/:versionFile', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await restoreWorkflowVersion(req.params.versionFile);
    res.json({ success: true, message: 'Workflow version restored' });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
});

app.post('/admin/remove-deletable-edge-types', verifyToken, requireRole('admin'), async (req, res) => {
  // Run the script as a child process for isolation
  exec('node remove-deletable-edge-types.js', { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('Error running remove-deletable-edge-types.js:', error, stderr);
      return res.status(500).json({ success: false, error: error.message, stderr });
    }
    res.json({ success: true, output: stdout });
  });
});

// Helper: sanitize workflow before saving to disk
const sanitizeWorkflowBeforeSave = (workflow) => {
  if (!workflow || typeof workflow !== 'object') return workflow;
  const wf = { ...workflow };
  // Normalize edges
  if (Array.isArray(wf.edges)) {
    wf.edges = wf.edges
      .map((e, i) => {
        if (!e || typeof e !== 'object') return null;
        const edge = { ...e };
        // Remove handles that are null/undefined
        if (edge.sourceHandle == null) delete edge.sourceHandle;
        if (edge.targetHandle == null) delete edge.targetHandle;
        // Normalize source/target to strings if present
        if (edge.source != null) edge.source = String(edge.source);
        if (edge.target != null) edge.target = String(edge.target);
        // If either source or target is missing after normalization, drop the edge
        if (!edge.source || !edge.target) return null;
        // Ensure id exists
        if (!edge.id) edge.id = `edge-${edge.source}-${edge.target}-${i}`;
        return edge;
      })
      .filter(Boolean);
  }

  return wf;
};

// CRUD Endpoints (File-based)
app.get('/api/workflows', async (req, res) => {
  if (useGraphDB) {
    // Graph query example
    const session = driver.session();
    const result = await session.run('MATCH (n:WorkflowNode) RETURN n');
    // Process results to workflows... (simplified; map to JSON)
    await session.close();
    res.json([]); // Placeholder
  } else {
    const files = await fs.readdir(DATA_DIR);
    
    // Load tags and teams for resolving IDs
    let allTags = [];
    let allTeams = [];
    let allOwners = [];
    try {
      if (await fs.pathExists(TAGS_FILE)) {
        allTags = await fs.readJson(TAGS_FILE);
      }
      await initTeamsFile();
      allTeams = await fs.readJson(TEAMS_FILE);
      await initOwnersFile();
      allOwners = await fs.readJson(OWNERS_FILE);
    } catch (error) {
      console.error('Error loading tags/teams/owners:', error);
    }
    
    const workflows = await Promise.all(
      files
        .filter(f => f.endsWith('.json') && f !== 'tags.json' && f !== 'teams.json' && f !== 'owners.json') // Exclude metadata files
        .map(async f => {
          try {
            const data = await fs.readJson(path.join(DATA_DIR, f));
            data.id = f.replace('.json', '');
            
            // Resolve tag IDs to tag objects
            if (data.tags && Array.isArray(data.tags)) {
              data.tags = data.tags
                .map(tagId => {
                  if (typeof tagId === 'string') {
                    return allTags.find(tag => tag.id === tagId);
                  }
                  return tagId; // Already an object
                })
                .filter(Boolean); // Remove undefined tags
            } else {
              data.tags = [];
            }
            
            // Resolve team ID to team object
            if (data.teamId) {
              const team = allTeams.find(team => team.id === data.teamId);
              data.team = team || null;
            } else {
              // Default to first team (usually 'team-default')
              data.team = allTeams[0] || null;
              data.teamId = allTeams[0]?.id || null;
            }
            
            // Resolve owner ID to owner object
            if (data.ownerId) {
              const owner = allOwners.find(owner => owner.id === data.ownerId);
              data.owner = owner || null;
            } else {
              // Default to first owner (usually 'owner-default')
              data.owner = allOwners[0] || null;
              data.ownerId = allOwners[0]?.id || null;
            }
            
            return data;
          } catch (error) {
            console.error(`Error reading workflow file ${f}:`, error);
            return null;
          }
        })
    );
    // Filter out null values from failed reads
    res.json(workflows.filter(w => w !== null));
  }
});

// Search endpoint - MUST be before /:id route
app.get('/api/workflows/search', async (req, res) => {
  const { query, tags: tagIds, team: teamId } = req.query;
  console.log('Search request received:', { query, tagIds, teamId });
  
  const files = await fs.readdir(DATA_DIR);
  
  // Load tags and teams for resolving IDs
  let allTags = [];
  let allTeams = [];
  let allOwners = [];
  try {
    if (await fs.pathExists(TAGS_FILE)) {
      allTags = await fs.readJson(TAGS_FILE);
    }
    await initTeamsFile();
    allTeams = await fs.readJson(TEAMS_FILE);
    await initOwnersFile();
    allOwners = await fs.readJson(OWNERS_FILE);
  } catch (error) {
    console.error('Error loading tags/teams/owners for search:', error);
  }
  
  const workflows = await Promise.all(
    files
      .filter(f => f.endsWith('.json') && f !== 'tags.json' && f !== 'teams.json' && f !== 'owners.json')
      .map(async f => {
        const data = await fs.readJson(path.join(DATA_DIR, f));
        data.id = f.replace('.json', '');
        
        // Resolve tag IDs to tag objects (same as main GET endpoint)
        if (data.tags && Array.isArray(data.tags)) {
          data.tags = data.tags
            .map(tagId => {
              if (typeof tagId === 'string') {
                return allTags.find(tag => tag.id === tagId);
              }
              return tagId; // Already an object
            })
            .filter(Boolean); // Remove undefined tags
        } else {
          data.tags = [];
        }
        
        // Resolve team ID to team object
        if (data.teamId) {
          const team = allTeams.find(team => team.id === data.teamId);
          data.team = team || null;
        } else {
          // Default to first team (usually 'team-default')
          data.team = allTeams[0] || null;
          data.teamId = allTeams[0]?.id || null;
        }
        
        // Resolve owner ID to owner object
        if (data.ownerId) {
          const owner = allOwners.find(owner => owner.id === data.ownerId);
          data.owner = owner || null;
        } else {
          // Default to first owner (usually 'owner-default')
          data.owner = allOwners[0] || null;
          data.ownerId = allOwners[0]?.id || null;
        }
        
        return data;
      })
  );

  console.log('Total workflows loaded:', workflows.length);
  let filteredWorkflows = workflows;

  // Filter by search query (workflow name, node names, node descriptions)
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase();
    console.log('Filtering by search term:', searchTerm);
    const beforeCount = filteredWorkflows.length;
    filteredWorkflows = filteredWorkflows.filter(workflow => {
      // Search in workflow name
      if (workflow.name && workflow.name.toLowerCase().includes(searchTerm)) {
        console.log('Match found in workflow name:', workflow.name);
        return true;
      }
      
      // Search in node names and descriptions
      if (workflow.nodes) {
        const nodeMatch = workflow.nodes.some(node => {
          const label = node.data?.label?.toLowerCase() || '';
          const description = node.data?.description?.toLowerCase() || '';
          return label.includes(searchTerm) || description.includes(searchTerm);
        });
        if (nodeMatch) {
          console.log('Match found in nodes for workflow:', workflow.name);
          return true;
        }
      }
      
      return false;
    });
    console.log(`Search filtering: ${beforeCount} -> ${filteredWorkflows.length} workflows`);
  }

  // Filter by tags
  if (tagIds && tagIds.length > 0) {
    const tagArray = Array.isArray(tagIds) ? tagIds : [tagIds];
    console.log('Filtering by tags:', tagArray);
    const beforeCount = filteredWorkflows.length;
    filteredWorkflows = filteredWorkflows.filter(workflow => {
      if (!workflow.tags) return false;
      // Since tags are now objects, check by tag ID
      const hasMatchingTag = tagArray.some(tagId => 
        workflow.tags.some(tag => 
          (typeof tag === 'object' ? tag.id : tag) === tagId
        )
      );
      if (hasMatchingTag) {
        console.log('Tag match found for workflow:', workflow.name);
      }
      return hasMatchingTag;
    });
    console.log(`Tag filtering: ${beforeCount} -> ${filteredWorkflows.length} workflows`);
  }

  // Filter by team (exclusive filtering)
  if (teamId) {
    console.log('Filtering by team:', teamId);
    const beforeCount = filteredWorkflows.length;
    filteredWorkflows = filteredWorkflows.filter(workflow => {
      const workflowTeamId = workflow.teamId || workflow.team?.id;
      const isMatch = workflowTeamId === teamId;
      if (isMatch) {
        console.log('Team match found for workflow:', workflow.name, 'teamId:', workflowTeamId);
      }
      return isMatch;
    });
    console.log(`Team filtering: ${beforeCount} -> ${filteredWorkflows.length} workflows`);
  }

  console.log('Final filtered workflows:', filteredWorkflows.length);
  res.json(filteredWorkflows);
});

app.post('/api/workflows', async (req, res) => {
  const workflow = req.body;
  const sanitized = sanitizeWorkflowBeforeSave(workflow);
  const filePath = path.join(DATA_DIR, `${workflow.id}.json`);
  const VERSIONS_DIR = path.join(BACKUP_DIR, 'versions');
  await fs.ensureDir(VERSIONS_DIR);
  // If file exists, version it
  if (await fs.pathExists(filePath)) {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
    const versionFile = path.join(VERSIONS_DIR, `${workflow.id}_${ts}.json`);
    await fs.copy(filePath, versionFile);
    // Prune old versions
    const versions = (await fs.readdir(VERSIONS_DIR))
      .filter(f => f.startsWith(`${workflow.id}_`))
      .sort()
      .reverse();
    if (versions.length > 1000) {
      for (const v of versions.slice(1000)) {
        await fs.remove(path.join(VERSIONS_DIR, v));
      }
    }
  }
  await fs.writeJson(filePath, sanitized);
  res.status(201).json(sanitized);
});

app.get('/api/workflows/:id', async (req, res) => {
  if (useGraphDB) {
    // Query Neo4j for nodes/edges
    res.json({}); // Placeholder
  } else {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
    if (await fs.pathExists(filePath)) {
      const workflow = await fs.readJson(filePath);
      
      // Resolve tag IDs to tag objects
      if (workflow.tags && Array.isArray(workflow.tags)) {
        try {
          let allTags = [];
          if (await fs.pathExists(TAGS_FILE)) {
            allTags = await fs.readJson(TAGS_FILE);
          }
          
          workflow.tags = workflow.tags
            .map(tagId => {
              if (typeof tagId === 'string') {
                return allTags.find(tag => tag.id === tagId);
              }
              return tagId; // Already an object
            })
            .filter(Boolean); // Remove undefined tags
        } catch (error) {
          console.error('Error resolving tags for workflow:', error);
          workflow.tags = [];
        }
      } else {
        workflow.tags = [];
      }
      
      // Resolve team ID to team object
      try {
        await initTeamsFile();
        const allTeams = await fs.readJson(TEAMS_FILE);
        
        if (workflow.teamId) {
          const team = allTeams.find(team => team.id === workflow.teamId);
          workflow.team = team || null;
        } else {
          // Default to first team (usually 'team-default')
          workflow.team = allTeams[0] || null;
          workflow.teamId = allTeams[0]?.id || null;
        }
      } catch (error) {
        console.error('Error resolving team for workflow:', error);
        workflow.team = null;
      }
      
      // Resolve owner ID to owner object
      try {
        await initOwnersFile();
        const allOwners = await fs.readJson(OWNERS_FILE);
        
        if (workflow.ownerId) {
          const owner = allOwners.find(owner => owner.id === workflow.ownerId);
          workflow.owner = owner || null;
        } else {
          // Default to first owner (usually 'owner-default')
          workflow.owner = allOwners[0] || null;
          workflow.ownerId = allOwners[0]?.id || null;
        }
      } catch (error) {
        console.error('Error resolving owner for workflow:', error);
        workflow.owner = null;
      }
      
      res.json(workflow);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
});

app.put('/api/workflows/:id', async (req, res) => {
  const workflow = req.body;
  const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
  const sanitized = sanitizeWorkflowBeforeSave(workflow);
  const VERSIONS_DIR = path.join(BACKUP_DIR, 'versions');
  await fs.ensureDir(VERSIONS_DIR);
  // If file exists, version it
  if (await fs.pathExists(filePath)) {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
    const versionFile = path.join(VERSIONS_DIR, `${req.params.id}_${ts}.json`);
    await fs.copy(filePath, versionFile);
    // Prune old versions
    const versions = (await fs.readdir(VERSIONS_DIR))
      .filter(f => f.startsWith(`${req.params.id}_`))
      .sort()
      .reverse();
    if (versions.length > 1000) {
      for (const v of versions.slice(1000)) {
        await fs.remove(path.join(VERSIONS_DIR, v));
      }
    }
  }
  await fs.writeJson(filePath, sanitized);
  res.json(sanitized);
});

// Migration endpoint: sanitize all workflow files on disk
// Migration endpoint removed — migration handled offline or via administrative scripts.

app.delete('/api/workflows/:id', async (req, res) => {
  const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
  await fs.remove(filePath);
  res.status(204).send();
});

// Tags Management Endpoints
const TAGS_FILE = path.join(DATA_DIR, 'tags.json');

// Initialize tags file if it doesn't exist
const initTagsFile = async () => {
  if (!await fs.pathExists(TAGS_FILE)) {
    await fs.writeJson(TAGS_FILE, []);
  }
};

// Get all tags
app.get('/api/tags', async (req, res) => {
  await initTagsFile();
  const tags = await fs.readJson(TAGS_FILE);
  res.json(tags);
});

// Create new tag
app.post('/api/tags', async (req, res) => {
  await initTagsFile();
  const tags = await fs.readJson(TAGS_FILE);
  const newTag = {
    id: req.body.id || `tag-${Date.now()}`,
    name: req.body.name,
    color: req.body.color || '#3b82f6'
  };
  tags.push(newTag);
  await fs.writeJson(TAGS_FILE, tags);
  res.json(newTag);
});

// Update tag
app.put('/api/tags/:id', async (req, res) => {
  await initTagsFile();
  const tags = await fs.readJson(TAGS_FILE);
  const tagIndex = tags.findIndex(tag => tag.id === req.params.id);
  if (tagIndex !== -1) {
    tags[tagIndex] = { ...tags[tagIndex], ...req.body };
    await fs.writeJson(TAGS_FILE, tags);
    res.json(tags[tagIndex]);
  } else {
    res.status(404).json({ error: 'Tag not found' });
  }
});

// Delete tag
app.delete('/api/tags/:id', async (req, res) => {
  await initTagsFile();
  const tags = await fs.readJson(TAGS_FILE);
  const filteredTags = tags.filter(tag => tag.id !== req.params.id);
  await fs.writeJson(TAGS_FILE, filteredTags);
  res.status(204).send();
});

// Teams Management Endpoints
const TEAMS_FILE = path.join(DATA_DIR, 'teams.json');

// Initialize teams file if it doesn't exist
const initTeamsFile = async () => {
  if (!await fs.pathExists(TEAMS_FILE)) {
    await fs.writeJson(TEAMS_FILE, [
      { id: 'team-default', name: 'Default Team', description: 'Default team for all workflows', color: '#6b7280' }
    ]);
  }
};

// Get all teams
app.get('/api/teams', async (req, res) => {
  await initTeamsFile();
  const teams = await fs.readJson(TEAMS_FILE);
  res.json(teams);
});

// Create new team
app.post('/api/teams', async (req, res) => {
  await initTeamsFile();
  const teams = await fs.readJson(TEAMS_FILE);
  const newTeam = {
    id: req.body.id || `team-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || '',
    color: req.body.color || '#3b82f6'
  };
  teams.push(newTeam);
  await fs.writeJson(TEAMS_FILE, teams);
  res.json(newTeam);
});

// Update team
app.put('/api/teams/:id', async (req, res) => {
  await initTeamsFile();
  const teams = await fs.readJson(TEAMS_FILE);
  const teamIndex = teams.findIndex(team => team.id === req.params.id);
  if (teamIndex !== -1) {
    teams[teamIndex] = { ...teams[teamIndex], ...req.body };
    await fs.writeJson(TEAMS_FILE, teams);
    res.json(teams[teamIndex]);
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
});

// Delete team
app.delete('/api/teams/:id', async (req, res) => {
  await initTeamsFile();
  const teams = await fs.readJson(TEAMS_FILE);
  
  // Prevent deletion of default team
  if (req.params.id === 'team-default') {
    return res.status(400).json({ error: 'Cannot delete default team' });
  }
  
  const filteredTeams = teams.filter(team => team.id !== req.params.id);
  await fs.writeJson(TEAMS_FILE, filteredTeams);
  res.status(204).send();
});

// Owners Management Endpoints
const OWNERS_FILE = path.join(DATA_DIR, 'owners.json');

// Initialize owners file if it doesn't exist
const initOwnersFile = async () => {
  if (!await fs.pathExists(OWNERS_FILE)) {
    await fs.writeJson(OWNERS_FILE, [
      { id: 'owner-default', name: 'Default Owner', description: 'Default owner for workflows', color: '#8b5cf6' }
    ]);
  }
};

// Get all owners
app.get('/api/owners', async (req, res) => {
  await initOwnersFile();
  const owners = await fs.readJson(OWNERS_FILE);
  res.json(owners);
});

// Create new owner
app.post('/api/owners', async (req, res) => {
  await initOwnersFile();
  const owners = await fs.readJson(OWNERS_FILE);
  const newOwner = {
    id: req.body.id || `owner-${Date.now()}`,
    name: req.body.name,
    description: req.body.description || '',
    color: req.body.color || '#8b5cf6'
  };
  owners.push(newOwner);
  await fs.writeJson(OWNERS_FILE, owners);
  res.json(newOwner);
});

// Update owner
app.put('/api/owners/:id', async (req, res) => {
  await initOwnersFile();
  const owners = await fs.readJson(OWNERS_FILE);
  const ownerIndex = owners.findIndex(owner => owner.id === req.params.id);
  if (ownerIndex !== -1) {
    owners[ownerIndex] = { ...owners[ownerIndex], ...req.body };
    await fs.writeJson(OWNERS_FILE, owners);
    res.json(owners[ownerIndex]);
  } else {
    res.status(404).json({ error: 'Owner not found' });
  }
});

// Delete owner
app.delete('/api/owners/:id', async (req, res) => {
  await initOwnersFile();
  const owners = await fs.readJson(OWNERS_FILE);
  
  // Prevent deletion of default owner
  if (req.params.id === 'owner-default') {
    return res.status(400).json({ error: 'Cannot delete default owner' });
  }
  
  const filteredOwners = owners.filter(owner => owner.id !== req.params.id);
  await fs.writeJson(OWNERS_FILE, filteredOwners);

  res.status(204).send();
});

// Graceful shutdown for Neo4j
process.on('SIGINT', async () => {
  if (driver) await driver.close();
  process.exit(0);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));