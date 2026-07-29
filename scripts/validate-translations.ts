import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('locales');
const enDir = path.join(localesDir, 'en');
const bnDir = path.join(localesDir, 'bn');

let hasErrors = false;

const logError = (msg: string) => {
  console.error(`\x1b[31m[i18n Error]\x1b[0m ${msg}`);
  hasErrors = true;
};

// Recursively traverse and collect all leaf key-paths and their values
const getKeys = (obj: any, prefix = ''): Map<string, string> => {
  const keys = new Map<string, string>();
  for (const k in obj) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      const nested = getKeys(obj[k], path);
      nested.forEach((v, nk) => keys.set(nk, v));
    } else {
      keys.set(path, String(obj[k]));
    }
  }
  return keys;
};

const extractVariables = (str: string): string[] => {
  const matches = str.match(/\{[^}]+\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, '')).sort();
};

const validateNamespace = (nsFile: string) => {
  const enPath = path.join(enDir, nsFile);
  const bnPath = path.join(bnDir, nsFile);

  if (!fs.existsSync(enPath)) {
    logError(`Namespace file "${nsFile}" is missing in English (en) locale.`);
    return;
  }
  if (!fs.existsSync(bnPath)) {
    logError(`Namespace file "${nsFile}" is missing in Bengali (bn) locale.`);
    return;
  }

  const enJSON = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const bnJSON = JSON.parse(fs.readFileSync(bnPath, 'utf8'));

  const enKeys = getKeys(enJSON);
  const bnKeys = getKeys(bnJSON);

  // Check English keys against Bengali
  enKeys.forEach((enVal, key) => {
    if (!bnKeys.has(key)) {
      logError(`Key "${key}" in namespace "${nsFile}" is present in English but missing in Bengali.`);
      return;
    }

    const bnVal = bnKeys.get(key) || '';

    if (!enVal.trim()) {
      logError(`Key "${key}" in namespace "${nsFile}" is empty in English.`);
    }
    if (!bnVal.trim()) {
      logError(`Key "${key}" in namespace "${nsFile}" is empty in Bengali.`);
    }

    // Validate interpolation variables match
    const enVars = extractVariables(enVal);
    const bnVars = extractVariables(bnVal);
    if (JSON.stringify(enVars) !== JSON.stringify(bnVars)) {
      logError(
        `Key "${key}" in namespace "${nsFile}" has mismatching interpolation variables.\n` +
        `  English variables: [${enVars.join(', ')}]\n` +
        `  Bengali variables: [${bnVars.join(', ')}]`
      );
    }
  });

  // Check for Bengali keys missing in English
  bnKeys.forEach((_, key) => {
    if (!enKeys.has(key)) {
      logError(`Key "${key}" in namespace "${nsFile}" is present in Bengali but missing in English.`);
    }
  });
};

const run = () => {
  console.log('Validating i18n translation namespaces...');
  
  if (!fs.existsSync(enDir) || !fs.existsSync(bnDir)) {
    logError('Locales directories are missing.');
    process.exit(1);
  }

  const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));

  enFiles.forEach((file) => {
    validateNamespace(file);
  });

  if (hasErrors) {
    console.log('\n\x1b[31mTranslation validation FAILED.\x1b[0m Please fix the errors listed above.');
    process.exit(1);
  } else {
    console.log('\n\x1b[32mAll translations are valid and fully synchronized!\x1b[0m');
    process.exit(0);
  }
};

run();
