import * as fs from 'fs';
import * as path from 'path';
import { translations } from '../apps/member-web/src/lib/i18n/translations';

// 1. Flatten the English dictionary
function flattenObj(obj: any, prefix = '', res: Record<string, string> = {}) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenObj(obj[key], prefix + key + '.', res);
    } else {
      res[prefix + key] = obj[key];
    }
  }
  return res;
}

const flatMap = flattenObj(translations.en);
console.log(Object.keys(flatMap).length + " translation keys found.");

// 2. Scan all files
function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

let modifiedFiles = 0;

walkDir(path.resolve('apps/member-web/src'), (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (filePath.includes('/lib/i18n/')) return;
  if (filePath.includes('/context/LanguageContext')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Replace `const { t } = useLanguage()` or `const { t, toggleLocale } = useLanguage()`
  // with `const { translate: t } = useLanguage()`
  content = content.replace(/const\s+\{([^}]*)\}\s*=\s*useLanguage\(\)/g, (match, inner) => {
    // If it already has translate: t, leave it
    if (inner.includes('translate: t') || inner.includes('translate')) return match;
    
    // Replace standalone `t` with `translate: t`
    const parts = inner.split(',').map(s => s.trim());
    const newParts = parts.map(p => p === 't' ? 'translate: t' : p);
    
    return `const { ${newParts.join(', ')} } = useLanguage()`;
  });

  // Replace t.something.something with t('The String')
  const regex = /\bt\.([a-zA-Z0-9_.]+)\b/g;
  content = content.replace(regex, (match, pathKey) => {
    if (flatMap[pathKey]) {
      // Escape single quotes
      const escaped = flatMap[pathKey].replace(/'/g, "\\'");
      return `t('${escaped}')`;
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    modifiedFiles++;
  }
});

console.log(`Modified ${modifiedFiles} files.`);
