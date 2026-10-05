import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export const useFeatureTranslation = (ns: string) => {
  const [loaded, setLoaded] = useState(() => {
    return i18n.hasResourceBundle('en', ns) && i18n.hasResourceBundle('bn', ns);
  });

  useEffect(() => {
    if (loaded) return;

    let active = true;

    const loadNamespace = async () => {
      try {
        const [enModule, bnModule] = await Promise.all([
          import(`../locales/en/${ns}.json`).catch(() => null),
          import(`../locales/bn/${ns}.json`).catch(() => null),
        ]);

        if (!active) return;

        if (enModule?.default) i18n.addResourceBundle('en', ns, enModule.default, true, true);
        if (bnModule?.default) i18n.addResourceBundle('bn', ns, bnModule.default, true, true);
      } catch (err) {
        console.error(`Failed to load i18n namespace: ${ns}`, err);
      } finally {
        if (active) setLoaded(true);
      }
    };

    loadNamespace();

    return () => {
      active = false;
    };
  }, [ns, loaded]);

  const { t } = useTranslation(ns);
  return { t, loaded };
};
