const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');
const os = require('os');

(async () => {
  try {
    const DATA_DIR = path.join(__dirname, '..', 'data');
    const BACKUP_DIR = path.join(DATA_DIR, 'backups');
    const entries = (await fs.readdir(DATA_DIR)).filter(f => f !== path.basename(BACKUP_DIR));
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wf-backup-'));
    const tmpFile = path.join(tmpDir, 'test.tar.gz');
    console.log('Will tar', { DATA_DIR, entriesCount: entries.length, tmpFile });
    await tar.c({ gzip: true, file: tmpFile, cwd: DATA_DIR }, entries);
    console.log('Tar created at', tmpFile);
    await fs.remove(tmpDir);
    console.log('Done');
  } catch (e) {
    console.error('Error during tar test:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
})();