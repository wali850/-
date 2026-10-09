// Copies the static web app into www/ for Capacitor (Android wrapper).
// Run: node scripts/copy-web.js
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..');
const DEST = path.join(SRC, 'www');
const FILES = [
  'index.html', 'manifest.webmanifest', 'sw.js',
];
const DIRS = ['css', 'js', 'icons'];

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });
FILES.forEach((f) => {
  if (fs.existsSync(path.join(SRC, f))) fs.copyFileSync(path.join(SRC, f), path.join(DEST, f));
});
DIRS.forEach((d) => fs.cpSync(path.join(SRC, d), path.join(DEST, d), { recursive: true }));
console.log('Copied web app to www/.');
