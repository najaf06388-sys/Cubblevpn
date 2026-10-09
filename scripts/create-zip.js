import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();
const rootDir = process.cwd();

function addFilesRecursively(dir, zipFolder) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (
      item === 'node_modules' ||
      item === '.git' ||
      item === 'dist' ||
      item === 'bubble-app.zip' ||
      item === '.vite' ||
      item === '.npm'
    ) {
      continue;
    }

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const subFolder = zipFolder.folder(item);
      addFilesRecursively(fullPath, subFolder);
    } else {
      const content = fs.readFileSync(fullPath);
      zipFolder.file(item, content);
    }
  }
}

async function buildZip() {
  console.log('Packing project files...');
  addFilesRecursively(rootDir, zip);

  const publicDir = path.join(rootDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, 'bubble-app.zip');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outPath, buffer);
  console.log(`Successfully created ZIP at: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

buildZip().catch(console.error);
