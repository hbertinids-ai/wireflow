// Express endpoints for backup archive listing, info, and restore
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');

const BACKUP_DIR = path.join(__dirname, 'data', 'backups');
const DATA_DIR = path.join(__dirname, 'data');
const VERSIONS_DIR = path.join(BACKUP_DIR, 'versions');
const router = express.Router();

// List backup archives, sorted descending by date
router.get('/admin/backups', async (req, res) => {
  try {
    const files = (await fs.readdir(BACKUP_DIR))
      .filter(f => f.startsWith('data_backup_') && f.endsWith('.tar.gz'))
      .map(f => ({
        file: f,
        date: f.match(/data_backup_(\d{8})_(\d{6})/)
          ? `${f.slice(12, 16)}-${f.slice(16, 18)}-${f.slice(18, 20)} ${f.slice(21, 23)}:${f.slice(23, 25)}:${f.slice(25, 27)}`
          : '',
        timestamp: f.match(/data_backup_(\d{8})_(\d{6})/)
          ? f.slice(12, 20) + f.slice(21, 27)
          : ''
      }))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Info: extract archive to temp, count teams, owners, tags, workflows, nodes
router.get('/admin/backups/:file/info', async (req, res) => {
  const archive = path.join(BACKUP_DIR, req.params.file);
  const tmpDir = path.join(BACKUP_DIR, 'tmp_' + Date.now());
  try {
    await fs.ensureDir(tmpDir);
    await tar.x({ file: archive, cwd: tmpDir });
    const teams = await fs.readJson(path.join(tmpDir, 'teams.json')).catch(() => []);
    const owners = await fs.readJson(path.join(tmpDir, 'owners.json')).catch(() => []);
    const tags = await fs.readJson(path.join(tmpDir, 'tags.json')).catch(() => []);
    const files = await fs.readdir(tmpDir);
    const workflowFiles = files.filter(f => f.startsWith('wf-') && f.endsWith('.json'));
    let workflowCount = workflowFiles.length;
    let nodeCount = 0;
    for (const wf of workflowFiles) {
      const wfData = await fs.readJson(path.join(tmpDir, wf)).catch(() => null);
      if (wfData && Array.isArray(wfData.nodes)) nodeCount += wfData.nodes.length;
    }
    await fs.remove(tmpDir);
    res.json({
      teams: teams.length,
      owners: owners.length,
      tags: tags.length,
      workflows: workflowCount,
      nodes: nodeCount
    });
  } catch (e) {
    await fs.remove(tmpDir);
    res.status(500).json({ error: e.message });
  }
});

// Restore: extract archive to data dir (after backup)
router.post('/admin/backups/:file/restore', async (req, res) => {
  const archive = path.join(BACKUP_DIR, req.params.file);
  try {
    // 1. Backup current data
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 15);
    const backupFile = path.join(BACKUP_DIR, `data_backup_${ts}.tar.gz`);
    await tar.c({ gzip: true, file: backupFile, cwd: DATA_DIR }, ['.']);
    // 2. Remove current data (except versions)
    const files = await fs.readdir(DATA_DIR);
    for (const f of files) {
      await fs.remove(path.join(DATA_DIR, f));
    }
    // Ensure versions directory exists in BACKUP_DIR
    await fs.ensureDir(VERSIONS_DIR);
    // 3. Extract archive
    await tar.x({ file: archive, cwd: DATA_DIR });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
