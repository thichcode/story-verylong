const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'stories');
const DEST = path.resolve(__dirname, '..', 'frontend', 'data', 'stories');

if (!fs.existsSync(SRC)) {
  console.warn('No stories directory found.');
  process.exit(0);
}

if (!fs.existsSync(DEST)) {
  fs.mkdirSync(DEST, { recursive: true });
}

fs.readdirSync(SRC)
  .filter((name) => name.endsWith('.json'))
  .forEach((file) => {
    const srcPath = path.join(SRC, file);
    const destPath = path.join(DEST, file);
    fs.copyFileSync(srcPath, destPath);
  });

console.log('Synced', fs.readdirSync(DEST).length, 'story files');
