import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type Locale, type TranslationKeys } from '@/lib/i18n/translations';
import i18n from '@/i18n';

interface LanguageContextValue {
  locale: Locale;
  t: TranslationKeys;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'safivra_locale';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'bn' || saved === 'en') ? saved : 'en';
  });

  // Ensure i18next matches the initial language state
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  const setLocale = useCallback(async (next: Locale) => {
    await i18n.changeLanguage(next);
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'bn' : 'en');
  }, [locale, setLocale]);

  // Merge loaded namespaces from the i18next store for the active locale
  const tObject = (i18n.store.data[locale] || {}) as unknown as TranslationKeys;

  return (
    <LanguageContext.Provider value={{ locale, t: tObject, toggleLocale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};
