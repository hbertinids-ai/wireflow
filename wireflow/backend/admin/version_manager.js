#!/usr/bin/env node
// Simple CLI for browsing and restoring JSON data versions
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const VERSIONS_DIR = path.join(DATA_DIR, 'backups', 'versions');
const KEEP_LIMIT = 1000;

function listVersions(file) {
  const base = path.basename(file, '.json');
  const files = fs.readdirSync(VERSIONS_DIR)
    .filter(f => f.startsWith(base + '_') && f.endsWith('.json'))
    .sort()
    .reverse();
  return files;
}

function restoreVersion(file, versionFile) {
  const src = path.join(VERSIONS_DIR, versionFile);
  const dest = path.join(DATA_DIR, file);
  fs.copyFileSync(src, dest);
  console.log(`Restored ${file} from ${versionFile}`);
}

function pruneVersions(file) {
  const versions = listVersions(file);
  if (versions.length > KEEP_LIMIT) {
    versions.slice(KEEP_LIMIT).forEach(v => {
      fs.unlinkSync(path.join(VERSIONS_DIR, v));
    });
  }
}

function usage() {
  console.log('Usage:');
  console.log('  node version_manager.js list <datafile.json>');
  console.log('  node version_manager.js restore <datafile.json> <versionfile.json>');
  process.exit(1);
}

if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR);

const [,, cmd, file, version] = process.argv;
if (!cmd || !file) usage();

if (cmd === 'list') {
  const versions = listVersions(file);
  console.log(`Available versions for ${file}:`);
  versions.forEach(v => console.log('  ' + v));
} else if (cmd === 'restore' && version) {
  restoreVersion(file, version);
} else {
  usage();
}

// Prune old versions after any operation
pruneVersions(file);
