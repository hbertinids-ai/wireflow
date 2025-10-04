// Helper functions for workflow version management
const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../data', 'backups');
const VERSIONS_DIR = path.join(BACKUP_DIR, 'versions');
const WORKFLOW_PREFIX = 'wf-';
const KEEP_LIMIT = 1000;

async function listWorkflowVersions() {
  await fs.ensureDir(VERSIONS_DIR);
  const files = await fs.readdir(VERSIONS_DIR);
  return files
    .filter(f => f.startsWith(WORKFLOW_PREFIX) && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, KEEP_LIMIT);
}

async function getWorkflowVersion(versionFile) {
  const filePath = path.join(VERSIONS_DIR, versionFile);
  if (!(await fs.pathExists(filePath))) throw new Error('Version not found');
  return fs.readJson(filePath);
}

async function restoreWorkflowVersion(versionFile) {
  const src = path.join(VERSIONS_DIR, versionFile);
  const dest = path.join(DATA_DIR, versionFile.replace(/_\d{8}_\d{6}/, ''));
  if (!(await fs.pathExists(src))) throw new Error('Version not found');
  await fs.copy(src, dest);
  return true;
}

module.exports = {
  listWorkflowVersions,
  getWorkflowVersion,
  restoreWorkflowVersion,
};
