const fs = require('fs');
const path = require('path');

const replacements = [
  // Green Hex
  { regex: /#00E054/gi, replacement: '#52A49A' },
  { regex: /#00D24B/gi, replacement: '#52A49A' },
  // Green RGBA
  { regex: /rgba\(\s*0\s*,\s*224\s*,\s*84/g, replacement: 'rgba(82, 164, 154' },
  { regex: /rgba\(\s*0\s*,\s*210\s*,\s*75/g, replacement: 'rgba(82, 164, 154' },
  // Red Hex
  { regex: /#FF453A/gi, replacement: '#DD5E56' },
  { regex: /#EF4444/gi, replacement: '#DD5E56' },
  // Red RGBA
  { regex: /rgba\(\s*255\s*,\s*69\s*,\s*58/g, replacement: 'rgba(221, 94, 86' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && /\.(tsx|ts|css)$/.test(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const r of replacements) {
        if (r.regex.test(content)) {
          content = content.replace(r.regex, r.replacement);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

console.log('Starting theme update...');
processDirectory(path.join(__dirname, 'src'));
console.log('Theme update complete!');
