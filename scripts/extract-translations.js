// Scripts to extract translations from translations.ts to modular JSON namespaces
import fs from 'fs';
import path from 'path';
import { translations } from '../src/lib/i18n/translations.js';

const enDir = path.resolve('locales/en');
const bnDir = path.resolve('locales/bn');

fs.mkdirSync(enDir, { recursive: true });
fs.mkdirSync(bnDir, { recursive: true });

const namespaces = Object.keys(translations.en);

namespaces.forEach((ns) => {
  const enContent = translations.en[ns];
  const bnContent = translations.bn[ns];

  // If it's a simple string, wrap it or make it part of common.json
  if (typeof enContent === 'string') {
    const commonEnPath = path.join(enDir, 'common.json');
    const commonBnPath = path.join(bnDir, 'common.json');

    const curEn = fs.existsSync(commonEnPath) ? JSON.parse(fs.readFileSync(commonEnPath, 'utf8')) : {};
    const curBn = fs.existsSync(commonBnPath) ? JSON.parse(fs.readFileSync(commonBnPath, 'utf8')) : {};

    curEn[ns] = enContent;
    curBn[ns] = bnContent;

    fs.writeFileSync(commonEnPath, JSON.stringify(curEn, null, 2), 'utf8');
    fs.writeFileSync(commonBnPath, JSON.stringify(curBn, null, 2), 'utf8');
  } else {
    fs.writeFileSync(path.join(enDir, `${ns}.json`), JSON.stringify(enContent, null, 2), 'utf8');
    fs.writeFileSync(path.join(bnDir, `${ns}.json`), JSON.stringify(bnContent, null, 2), 'utf8');
  }
});

console.log('Translations successfully extracted!');
