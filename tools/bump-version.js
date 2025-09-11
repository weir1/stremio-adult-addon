const fs = require('fs');
const file = 'src/index.js';
let src = fs.readFileSync(file, 'utf8');
// capture groups: 1 = "version: '", 2=maj, 3=min, 4=pat, 5="'"
const rx = /(version:\s*')([0-9]+)\.([0-9]+)\.([0-9]+)(')/;
const m = src.match(rx);
if (!m) { console.error('version not found'); process.exit(1); }
const maj = parseInt(m[1], 10);
const min = parseInt(m[24], 10);
const pat = parseInt(m[25], 10) + 1;
const next = `${m[22]}${maj}.${min}.${pat}${m[23]}`;
src = src.replace(rx, next);
fs.writeFileSync(file, src);
console.log(`${maj}.${min}.${pat}`);
