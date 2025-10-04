// Helper functions for workflow version management
const fs = require('fs-extra');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');
const gunzip = promisify(zlib.gunzip);

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_DIR = path.join(__dirname, '../data', 'backups');
const VERSIONS_DIR = path.join(BACKUP_DIR, 'versions');
const WORKFLOW_PREFIX = 'wf-';
const KEEP_LIMIT = 1000;

async function listWorkflowVersions() {
  await fs.ensureDir(VERSIONS_DIR);
  const files = await fs.readdir(VERSIONS_DIR);
  return files
    .filter(f => f.startsWith(WORKFLOW_PREFIX) && (f.endsWith('.json') || f.endsWith('.json.gz')))
    .sort()
    .reverse()
    .slice(0, KEEP_LIMIT);
}

async function getWorkflowVersion(versionFile) {
  const filePath = path.join(VERSIONS_DIR, versionFile);
  if (!(await fs.pathExists(filePath))) throw new Error('Version not found');
  
  // Handle compressed files
  if (versionFile.endsWith('.json.gz')) {
    const compressed = await fs.readFile(filePath);
    const decompressed = await gunzip(compressed);
    return JSON.parse(decompressed.toString());
  }
  
  return fs.readJson(filePath);
}

async function restoreWorkflowVersion(versionFile) {
  const src = path.join(VERSIONS_DIR, versionFile);
  if (!(await fs.pathExists(src))) throw new Error('Version not found');
  
  // Determine destination filename (remove timestamp and .gz if present)
  let destFileName = versionFile.replace(/_\d{8}\d{6,7}/, '');
  if (destFileName.endsWith('.json.gz')) {
    destFileName = destFileName.replace('.gz', '');
  }
  const dest = path.join(DATA_DIR, destFileName);
  
  // If source is compressed, decompress to destination
  if (versionFile.endsWith('.json.gz')) {
    const compressed = await fs.readFile(src);
    const decompressed = await gunzip(compressed);
    await fs.writeFile(dest, decompressed);
  } else {
    await fs.copy(src, dest);
  }
  
  return true;
}

module.exports = {
  listWorkflowVersions,
  getWorkflowVersion,
  restoreWorkflowVersion,
};
