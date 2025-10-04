// --- Custom Color Palettes from provided image ---
const TEAM_COLORS = [
  '#4ecdc4', '#6ed6df', '#a2d8e8', '#c7eae4', '#d6edea',
  '#b7d6c2', '#a3cbb3', '#b0c9bc', '#b6b6d6'
];
const TAG_COLORS = [
  '#f7f6b6', '#ffe5e0', '#f7e6e6', '#f7f6e6', '#f7e6d6',
  '#f7d6c6', '#f7c6b6', '#b7d6c2'
];
const OWNER_COLORS = [
  '#f7b6b6', '#f7c6c7', '#f7d6d6', '#f7b6a6', '#f7a6a6',
  '#f78c8c', '#f77c7c', '#f76c6c'
];

// Deterministic color pickers for each badge type
function getTeamColor(name) {
  if (!name) return TEAM_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
}
function getOwnerColor(name) {
  if (!name) return OWNER_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return OWNER_COLORS[Math.abs(hash) % OWNER_COLORS.length];
}
function getTagColor(name) {
  if (!name) return TAG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import TagManager from './TagManager';
import TeamManager from './TeamManager';
import OwnerManager from './OwnerManager';
import apiFetch from '../api';
import ReactFlow, { ReactFlowProvider, Background } from 'react-flow-renderer';
import { WorkflowReferenceNode, DecisionNode } from './WorkflowEditor';

// Utility: generate a deterministic pastel color from a string
const generatePastelColor = (name) => {
  const s = String(name || '');
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  // Lower saturation to 14% and make lightness 96% (60% more pale than 90%)
  return `hsl(${hue}, 14%, 96%)`;
};

// Utility: pick readable text color (dark or light) for a given background color (hex or hsl)
const getTextColorForBackground = (bg) => {
  if (!bg) return '#fff';
  const s = String(bg).trim();
  // hsl(...) -> extract lightness
  const hsl = s.match(/hsl\((?:\s*)?(\d+)(?:\s*),?(?:\s*)(\d+)%?,?(?:\s*)(\d+)%?\)/i);
  if (hsl) {
    const lightness = parseInt(hsl[3], 10);
    return lightness >= 70 ? '#222' : '#fff';
  }
  // hex (#rgb or #rrggbb)
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000; // 0..255
    return brightness > 200 ? '#222' : '#fff';
  }
  return '#fff';
};

// Memoized nodeTypes for mini ReactFlow in WorkflowCard
const miniNodeTypes = {
  workflowReference: WorkflowReferenceNode,
  decision: DecisionNode
};

// --- WorkflowCard component for each workflow ---
const WorkflowCard = ({ workflow, getWorkflowTeam, getWorkflowOwner, getWorkflowTags, removeTagFromWorkflow, deleteWorkflow, loadWorkflows }) => {
  const miniNodes = useMemo(() => {
    return Array.isArray(workflow.nodes)
      ? workflow.nodes.map((n, i) => ({
          ...n,
          id: n.id != null ? String(n.id) : `n-${i}`,
          type: n.type || 'default',
          position: (n.position && typeof n.position.x === 'number' && typeof n.position.y === 'number')
            ? n.position
            : { x: (i % 4) * 110 + 20, y: Math.floor(i / 4) * 70 + 20 },
          data: n.data || { label: n.label || n.name || '' },
        }))
      : [];
  }, [workflow.nodes]);
  const miniEdges = useMemo(() => {
    const nodeIds = miniNodes.map(n => n.id);
    const edges = Array.isArray(workflow.edges)
      ? workflow.edges.map((e, i) => {
          const source = e.source != null ? String(e.source) : null;
          const target = e.target != null ? String(e.target) : null;
          if (!source || !target || !nodeIds.includes(source) || !nodeIds.includes(target)) return null;
          return {
            ...e,
            id: `mini-edge-${source}-${target}-${i}`,
            source,
            target,
            type: e.type || 'smoothstep',
            style: { stroke: '#ef4444', strokeWidth: 2 },
          };
        }).filter(Boolean)
      : [];
    if (edges.length > 0) {
      // eslint-disable-next-line no-console
      console.debug('MiniMap edges for workflow', workflow.id, edges);
    }
    return edges;
  }, [workflow.edges, miniNodes, workflow.id]);

  // Compute team/owner colors for this card (do not mutate global state)
  const cardTeam = getWorkflowTeam(workflow);
  const teamColor = cardTeam ? (cardTeam.color || generatePastelColor(cardTeam.name)) : null;
  const cardOwner = getWorkflowOwner(workflow);
  const ownerColor = cardOwner ? (cardOwner.color || generatePastelColor(cardOwner.name)) : null;

  // Allow drop on card
  const handleWorkflowDragOver = (event) => {
    console.log('[DND] Workflow drag over', event);
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  return (
    <div
      key={workflow.id}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-200 relative overflow-hidden"
      onDragOver={handleWorkflowDragOver}
      onDrop={event => handleWorkflowDrop(workflow.id, event)}
    >
      {/* Decorative white rectangle with ReactFlow miniature */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: '10%',
          right: '4%',
          width: '40%',
          height: '80%',
          background: '#fff',
          borderRadius: '16px',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '92%', height: '92%' }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={miniNodes}
              edges={miniEdges}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.05}
              maxZoom={1}
              panOnDrag={false}
              zoomOnScroll={false}
              zoomOnPinch={false}
              zoomOnDoubleClick={false}
              panOnScroll={false}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={false}
              style={{ width: '100%', height: '100%', pointerEvents: 'none', background: 'transparent' }}
              nodeTypes={miniNodeTypes}
            >
              <Background style={{ background: 'transparent' }} />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
      <div className="flex flex-row items-start relative z-10">
        {/* Card main content */}
        <div className="flex-1 min-w-0">
          {/* Workflow Title */}
          <span className="font-semibold text-lg text-blue-600 block mb-2">
            {workflow.name || 'Untitled Workflow'}
          </span>
          <div className="flex items-center space-x-2">
            {/* Team Badge */}
            {cardTeam && (
              <div
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[0.7rem] flex-shrink-0"
                style={{ backgroundColor: getTeamColor(cardTeam.name), color: getTextColorForBackground(getTeamColor(cardTeam.name)) }}
                title={`Team: ${cardTeam.name}`}
              >
                <span>👥</span>
                <span>{cardTeam.name}</span>
              </div>
            )}
            {/* Owner Badge */}
            {cardOwner && (
              <div
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[0.7rem] flex-shrink-0"
                style={{ backgroundColor: getOwnerColor(cardOwner.name), color: getTextColorForBackground(getOwnerColor(cardOwner.name)) }}
                title={`Owner: ${cardOwner.name}`}
              >
                <span>👤</span>
                <span>{cardOwner.name}</span>
              </div>
            )}
          </div>
          {/* Workflow Stats */}
          <div className="text-sm text-gray-500 mt-1">
            {workflow.nodes ? `${workflow.nodes.length} nodes` : '0 nodes'} •
            {workflow.edges ? ` ${workflow.edges.length} connections` : ' 0 connections'}
          </div>
          {/* Tags Display */}
          {getWorkflowTags(workflow).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {getWorkflowTags(workflow).map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.7rem]"
                  style={{ backgroundColor: getTagColor(tag.name), color: getTextColorForBackground(getTagColor(tag.name)) }}
                >
                  {tag.name}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeTagFromWorkflow(workflow.id, tag.id, e);
                    }}
                    className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full w-4 h-4 flex items-center justify-center"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Bin icon at far right */}
        <button
          onClick={(e) => deleteWorkflow(workflow.id, e)}
          className="text-red-500 hover:text-red-700 p-1 mt-2"
          title="Delete workflow"
          style={{ alignSelf: 'flex-start' }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};


const WorkflowList = ({ token, role }) => {
  // State hooks
  const [workflows, setWorkflows] = useState([]);
  const [allWorkflows, setAllWorkflows] = useState([]);
  const [tags, setTags] = useState([]);
  const [teams, setTeams] = useState([]);
  const [owners, setOwners] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(() => {
    return localStorage.getItem('wf_selectedTeam') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedTag, setDraggedTag] = useState(null);
  const [draggedTeam, setDraggedTeam] = useState(null);
  const [draggedOwner, setDraggedOwner] = useState(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isOwnerManagerOpen, setIsOwnerManagerOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  // Effects
  useEffect(() => {
    // Don't load or show workflows when there is no authenticated session.
    if (!token) {
      setAllWorkflows([]);
      setTags([]);
      setTeams([]);
      setOwners([]);
      return;
    }
    loadWorkflows(); loadTags(); loadTeams(); loadOwners();
  }, [token]);
  useEffect(() => {
    // Filter workflows based on search, tags, and team
    let filtered = allWorkflows;
    if (selectedTeam) filtered = filtered.filter(wf => wf.team && wf.team.id === selectedTeam);
    if (selectedTags.length > 0) filtered = filtered.filter(wf => wf.tags && selectedTags.every(tagId => wf.tags.some(tag => (typeof tag === 'object' ? tag.id : tag) === tagId)));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(wf => {
        // Match workflow name
        const nameMatch = (wf.name || '').toLowerCase().includes(q);
        // Match team name
        const teamMatch = wf.team && wf.team.name && wf.team.name.toLowerCase().includes(q);
        // Match owner name
        const ownerMatch = wf.owner && wf.owner.name && wf.owner.name.toLowerCase().includes(q);
        return nameMatch || teamMatch || ownerMatch;
      });
    }
    setWorkflows(filtered);
    // Persist selected team
    if (selectedTeam) {
      localStorage.setItem('wf_selectedTeam', selectedTeam);
    } else {
      localStorage.removeItem('wf_selectedTeam');
    }
  }, [allWorkflows, selectedTeam, selectedTags, searchQuery]);
  const loadWorkflows = async () => {
    try {
      const workflowsData = await apiFetch('/api/workflows', { method: 'GET' }, token);
      console.log('Loaded workflows with tags:', workflowsData);
      setAllWorkflows(workflowsData || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    }
  };

  const loadTags = async () => {
    try {
      const tagsData = await apiFetch('/api/tags', { method: 'GET' }, token);
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const deleteWorkflow = async (workflowId, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Validate workflow ID
    if (!workflowId || workflowId === 'undefined' || workflowId === 'null') {
      alert('Cannot delete workflow: Invalid workflow ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await apiFetch(`/api/workflows/${workflowId}`, { method: 'DELETE' }, token);
      loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleTagDragStart = (tag, event) => {
    console.log('[DND] Tag drag start:', tag);
    setDraggedTag(tag);
    event.dataTransfer.setData('application/tag', JSON.stringify(tag));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleTeamDragStart = (team, event) => {
    console.log('[DND] Team drag start:', team);
    setDraggedTeam(team);
    event.dataTransfer.setData('application/team', JSON.stringify(team));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleOwnerDragStart = (owner, event) => {
    console.log('[DND] Owner drag start:', owner);
    setDraggedOwner(owner);
    event.dataTransfer.setData('application/owner', JSON.stringify(owner));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handleWorkflowDragOver = (event) => {
    console.log('[DND] Workflow drag over', event);
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleWorkflowDrop = async (workflowId, event) => {
    console.log('[DND] Workflow drop on', workflowId, event);
    event.preventDefault();
    const workflow = allWorkflows.find(wf => wf.id === workflowId);
    if (!workflow) {
      console.warn('[DND] No workflow found for drop:', workflowId);
      return;
    }

    try {
      let updatedWorkflow = { ...workflow };
      let changed = false;

      // Handle tag drop
      const tagData = event.dataTransfer.getData('application/tag');
      console.log('[DND] tagData:', tagData);
      if (tagData) {
        const tag = JSON.parse(tagData);
        console.log('[DND] Parsed tag:', tag);
        const currentTags = workflow.tags || [];
        const tagAlreadyExists = currentTags.some(t => (typeof t === 'object' ? t.id : t) === tag.id);
        if (!tagAlreadyExists) {
          const currentTagIds = currentTags.map(t => typeof t === 'object' ? t.id : t);
          updatedWorkflow.tags = [...currentTagIds, tag.id];
          changed = true;
          console.log('[DND] Tag will be added to workflow:', workflowId);
        } else {
          console.log('[DND] Tag already exists on workflow:', workflowId);
        }
      }

      // Handle team drop
      const teamData = event.dataTransfer.getData('application/team');
      console.log('[DND] teamData:', teamData);
      if (teamData) {
        const team = JSON.parse(teamData);
        console.log('[DND] Parsed team:', team);
        updatedWorkflow.teamId = team.id;
        changed = true;
      }

      // Handle owner drop
      const ownerData = event.dataTransfer.getData('application/owner');
      console.log('[DND] ownerData:', ownerData);
      if (ownerData) {
        const owner = JSON.parse(ownerData);
        console.log('[DND] Parsed owner:', owner);
        updatedWorkflow.ownerId = owner.id;
        changed = true;
      }

      // Only update if we have changes
      if (changed) {
        console.log('[DND] Updating workflow:', workflowId, updatedWorkflow);
        try {
          await apiFetch(`/api/workflows/${workflowId}`, { method: 'PUT', body: updatedWorkflow }, token);
          console.log('[DND] Workflow updated successfully:', workflowId);
          loadWorkflows();
        } catch (err) {
          console.error('[DND] Failed to update workflow:', workflowId, err);
        }
      } else {
        console.log('[DND] No changes to update for workflow:', workflowId);
      }
    } catch (error) {
      console.error('[DND] Error updating workflow:', error);
    } finally {
      setDraggedTag(null);
      setDraggedTeam(null);
      setDraggedOwner(null);
    }
  };

  const removeTagFromWorkflow = async (workflowId, tagId, event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const workflow = allWorkflows.find(wf => wf.id === workflowId);
      if (!workflow) return;

      // Convert tags to IDs for filtering and storage
      const currentTagIds = (workflow.tags || []).map(tag => 
        typeof tag === 'object' ? tag.id : tag
      );

      const updatedWorkflow = {
        ...workflow,
        tags: currentTagIds.filter(id => id !== tagId)
      };

      try {
        await apiFetch(`/api/workflows/${workflowId}`, { method: 'PUT', body: updatedWorkflow }, token);
        loadWorkflows();
      } catch (err) {
        console.error('Error removing tag from workflow:', err);
      }
    } catch (error) {
      console.error('Error removing tag from workflow:', error);
    }
  };

  // Team handling functions
  const handleTeamChange = (teamId) => {
    console.log('🏆 Team selection changed:', teamId);
    setSelectedTeam(teamId);
    // localStorage update handled in effect
  };

  const getPageTitle = () => {
    if (!selectedTeam) {
      return 'All Workflows';
    }
    const team = teams.find(t => t.id === selectedTeam);
    return team ? `${team.name} Workflows` : 'All Workflows';
  };

  const loadTeams = async () => {
    try {
      const teamsData = await apiFetch('/api/teams', { method: 'GET' }, token);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const loadOwners = async () => {
    try {
      const ownersData = await apiFetch('/api/owners', { method: 'GET' }, token);
      setOwners(ownersData || []);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const toggleTagFilter = (tagId) => {
    console.log('🏷️ Tag filter toggled:', tagId);
    setSelectedTags(prev => {
      const newSelectedTags = prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      console.log('🏷️ Selected tags updated:', newSelectedTags);
      return newSelectedTags;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const getTagById = (tagId) => tags.find(tag => tag.id === tagId);

  const getWorkflowTags = (workflow) => {
    if (!workflow.tags) return [];
    console.log('Getting tags for workflow:', workflow.id, 'tags:', workflow.tags);
    // Since backend now returns resolved tag objects, return them directly
    // Handle both old format (tag IDs) and new format (tag objects) for compatibility
    const resolvedTags = workflow.tags.map(tag => {
      if (typeof tag === 'object' && tag.id && tag.name) {
        return tag; // Already a complete tag object
      } else if (typeof tag === 'string') {
        return getTagById(tag); // Legacy format: resolve tag ID
      }
      return null;
    }).filter(Boolean);
    console.log('Resolved tags:', resolvedTags);
    return resolvedTags;
  };

  const getWorkflowTeam = (workflow) => {
    // Return the resolved team object or null
    return workflow.team || null;
  };

  const getWorkflowOwner = (workflow) => {
    // Return the resolved owner object or null
    return workflow.owner || null;
  };

  // Set document title based on selected team
  useEffect(() => {
    const teamName = selectedTeam ? teams.find(t => t.id === selectedTeam)?.name : "All Workflows";
    document.title = `WireFlow: ${teamName}`;
  }, [selectedTeam, teams]);



  if (!token) {
    return (
      <div className="container mx-auto p-8 text-center text-gray-700">
        <h1 className="text-2xl font-semibold mb-2">Please sign in to view workflows</h1>
        <p className="text-sm">You must be logged in to see workflows and perform actions. Please sign in from the top-right.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Migration control removed */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        <div className="flex gap-2">
          {/* Manage Tags and New Workflow buttons removed from main page as requested */}
        </div>
      </div>



      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              console.log('🔤 Search input changed:', e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search workflows, nodes, descriptions..."
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Team Filters */}
        <div className="mb-2 flex items-center">
          <span className="font-medium mr-2">Teams:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTeamChange(null)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedTeam === null
                  ? 'bg-gray-100 border-gray-400 text-gray-900'
                  : 'text-gray-700 border-gray-300 hover:border-gray-400 bg-white'
              }`}
            >
              All Teams
            </button>
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => handleTeamChange(team.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedTeam === team.id
                    ? 'text-white border-transparent'
                    : 'text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: selectedTeam === team.id ? (team.color || generatePastelColor(team.name)) : 'transparent',
                  borderColor: selectedTeam === team.id ? (team.color || generatePastelColor(team.name)) : undefined,
                  color: selectedTeam === team.id ? getTextColorForBackground(team.color || generatePastelColor(team.name)) : undefined
                }}
              >
                👥 {team.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        <div className="mb-2 flex items-center">
          <span className="font-medium mr-2">Tags:</span>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTagFilter(tag.id)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'text-white border-transparent'
                    : 'text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: selectedTags.includes(tag.id) ? (tag.color || generatePastelColor(tag.name)) : 'transparent',
                  borderColor: selectedTags.includes(tag.id) ? (tag.color || generatePastelColor(tag.name)) : undefined,
                  color: selectedTags.includes(tag.id) ? getTextColorForBackground(tag.color || generatePastelColor(tag.name)) : undefined
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Draggable teams and tags removed as requested */}

        {/* Clear Filters */}
        {(searchQuery || selectedTags.length > 0 || selectedTeam) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedTags([]);
              setSelectedTeam(null);
            }}
            className="text-xs text-green-600 hover:text-green-800"
          >
            Clear all filters
          </button>

        )}
      </div>

      {/* Workflows List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {console.log('Rendering workflows:', workflows.length, 'workflows out of', allWorkflows.length, 'total')}
        {!workflows || workflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {!allWorkflows || allWorkflows.length === 0 
              ? 'No workflows created yet. Create your first workflow!' 
              : 'No workflows match the current filters.'}
          </div>
        ) : (
          workflows.map(workflow => (
            <div key={workflow.id} className="relative focus:outline-none focus:ring-2 focus:ring-blue-400">
              <Link
                to={`/editor/${workflow.id}`}
                tabIndex={0}
                className="absolute inset-0 z-20"
                style={{ textDecoration: 'none', display: 'block' }}
                aria-label={`Open workflow editor for ${workflow.name || workflow.id}`}
              />
              <WorkflowCard
                workflow={workflow}
                getWorkflowTeam={getWorkflowTeam}
                getWorkflowOwner={getWorkflowOwner}
                getWorkflowTags={getWorkflowTags}
                removeTagFromWorkflow={removeTagFromWorkflow}
                deleteWorkflow={deleteWorkflow}
                loadWorkflows={loadWorkflows}
              />
            </div>
          ))
        )}
      </div>

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        onTagsUpdate={loadTags}
        token={token}
      />

      {/* Team Manager (inline instead of modal) */}
      {isTeamManagerOpen && (
        <TeamManager
          inline={true}
          onClose={() => setIsTeamManagerOpen(false)}
          token={token}
        />
      )}

      {/* Owner Manager (inline instead of modal) */}
      {isOwnerManagerOpen && (
        <OwnerManager
          inline={true}
          onClose={() => setIsOwnerManagerOpen(false)}
          token={token}
        />
      )}
    </div>
  );
};

export default WorkflowList;