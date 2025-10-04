const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

async function fixEdgeTypes() {
  const files = await fs.readdir(DATA_DIR);
  for (const file of files) {
    if (!file.endsWith('.json') || file === 'tags.json' || file === 'teams.json' || file === 'owners.json') continue;
    const filePath = path.join(DATA_DIR, file);
    const data = await fs.readJson(filePath);
    if (Array.isArray(data.edges)) {
      let changed = false;
      for (const edge of data.edges) {
        if (edge.type === 'deletable') {
          delete edge.type;
          changed = true;
        }
      }
      if (changed) {
        await fs.writeJson(filePath, data, { spaces: 2 });
        console.log(`Fixed: ${file}`);
      }
    }
  }
}

if (require.main === module) {
  fixEdgeTypes().then(() => console.log('Done!'));
}
