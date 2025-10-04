// This script sets animated: true on all edges in all workflow JSON files in backend/data/
const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

async function updateAllEdgesAnimated() {
  const files = await fs.readdir(DATA_DIR);
  let changed = 0;
  for (const file of files) {
    if (!file.endsWith('.json') || ['tags.json', 'teams.json', 'owners.json'].includes(file)) continue;
    const filePath = path.join(DATA_DIR, file);
    let data;
    try {
      data = await fs.readJson(filePath);
    } catch (e) {
      console.error('Failed to read', filePath, e);
      continue;
    }
    if (Array.isArray(data.edges)) {
      let updated = false;
      data.edges = data.edges.map(edge => {
        if (!edge.animated) {
          updated = true;
          return { ...edge, animated: true };
        }
        return edge;
      });
      if (updated) {
        await fs.writeJson(filePath, data, { spaces: 2 });
        changed++;
        console.log('Updated edges in', file);
      }
    }
  }
  console.log('Done. Updated', changed, 'workflow files.');
}

updateAllEdgesAnimated();
