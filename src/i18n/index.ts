import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Dynamically and eagerly import all translation JSON files using Vite's glob import
const modules = import.meta.glob('../../locales/**/*.json', { eager: true });

const resources: Record<string, Record<string, any>> = {
  en: {},
  bn: {}
};

for (const path in modules) {
  const match = path.match(/\/locales\/(en|bn)\/([^/]+)\.json$/);
  if (match) {
    const [_, locale, ns] = match;
    resources[locale] = resources[locale] || {};
    resources[locale][ns] = (modules[path] as any).default;
  }
}

const namespaces = Array.from(
  new Set(Object.values(resources).flatMap((res) => Object.keys(res)))
);

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: namespaces,
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
