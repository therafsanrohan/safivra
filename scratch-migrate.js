const fs = require('fs');
const ts = require('typescript');

// 1. Read translations.ts
const code = fs.readFileSync('apps/member-web/src/lib/i18n/translations.ts', 'utf-8');

// Use a simple trick to extract the en object:
const enMatch = code.match(/en:\s*\{([\s\S]*?)\n  \},\n  bn:/);
if (!enMatch) {
  console.log("Could not find en:");
  process.exit(1);
}

// Convert to a valid JS object string
let enObjString = "{" + enMatch[1] + "}";

// Evaluate it safely (it's our own code)
// We need to replace single quotes with double quotes? No, eval works.
let enObj;
try {
  // wrap in function to eval
  enObj = eval("(" + enObjString + ")");
} catch(e) {
  console.log("Eval error", e);
  process.exit(1);
}

// Flatten object
function flattenObj(obj, prefix = '', res = {}) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenObj(obj[key], prefix + key + '.', res);
    } else {
      res[prefix + key] = obj[key];
    }
  }
  return res;
}

const flatMap = flattenObj(enObj);
console.log(Object.keys(flatMap).length + " translation keys found.");

// 2. Scan all files
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = dir + '/' + f;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) walkDir(dirPath, callback);
    else callback(dirPath);
  });
}

let modifiedFiles = 0;

walkDir('apps/member-web/src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('/lib/i18n/')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace `const { t } = useLanguage()` or `const { t, ... } = useLanguage()`
  // with `const { translate: t } = useLanguage()`
  content = content.replace(/const\s+\{\s*([^}]*?)t([^}]*?)\s*\}\s*=\s*useLanguage\(\)/g, (match, p1, p2) => {
    // If it already has translate: t, ignore
    if (match.includes('translate: t')) return match;
    let newInside = (p1 + p2).split(',').map(s => s.trim()).filter(s => s && s !== 't').join(', ');
    if (newInside) newInside += ', ';
    return `const { ${newInside}translate: t } = useLanguage()`;
  });

  // Replace t.something.something with t('The String')
  // We use a regex that looks for t.something
  let regex = /\bt\.([a-zA-Z0-9_.]+)\b/g;
  content = content.replace(regex, (match, path) => {
    if (flatMap[path]) {
      // Escape single quotes in the string
      const escaped = flatMap[path].replace(/'/g, "\\'");
      return `t('${escaped}')`;
    }
    return match; // leave alone if not found
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    modifiedFiles++;
  }
});

console.log(`Modified ${modifiedFiles} files.`);
