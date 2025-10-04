const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

async function migrate() {
  console.log('Scanning data directory:', DATA_DIR);
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  let changed = 0;
  for (const f of jsonFiles) {
    const fp = path.join(DATA_DIR, f);
    try {
      const data = await fs.readJson(fp);
      let updated = false;
      if (data && Array.isArray(data.edges)) {
        const newEdges = data.edges.map(e => {
          if (e && e.type === 'bezier') {
            updated = true;
            return { ...e, type: 'smoothstep' };
          }
          return e;
        });
        if (updated) {
          data.edges = newEdges;
          await fs.writeJson(fp, data, { spaces: 2 });
          console.log('Updated:', f);
          changed++;
        }
      }
    } catch (err) {
      console.error('Error processing', f, err.message);
    }
  }
  console.log(`Done. Files changed: ${changed}`);
}

migrate().catch(err => { console.error(err); process.exit(1); });
