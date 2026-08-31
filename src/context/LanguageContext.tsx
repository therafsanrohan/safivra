import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, type Locale, type TranslationKeys } from '@/lib/i18n/translations';
import i18n from '@/i18n';
import { useAuthContext } from '@/context/AuthContext';

interface LanguageContextValue {
  locale: Locale;
  t: TranslationKeys;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences } = useAuthContext();
  
  // Internal state with localStorage fallback for instant switching
  const [localLocale, setLocalLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem('safivra_locale');
    if (saved === 'en' || saved === 'bn') return saved;
    return (preferences?.language as Locale) || 'en';
  });

  // Sync with cloud preference if available
  useEffect(() => {
    if (preferences?.language && (preferences.language === 'en' || preferences.language === 'bn')) {
      setLocalLocale(preferences.language as Locale);
      localStorage.setItem('safivra_locale', preferences.language);
    }
  }, [preferences?.language]);

  useEffect(() => {
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(localLocale);
    }
    localStorage.setItem('safivra_locale', localLocale);
  }, [localLocale]);

  const setLocale = useCallback(async (next: Locale) => {
    setLocalLocale(next);
    localStorage.setItem('safivra_locale', next);
    if (i18n && i18n.changeLanguage) {
      await i18n.changeLanguage(next);
    }
    if (updatePreferences) {
      updatePreferences({ language: next }).catch(err => {
        console.error('[Language] Failed to sync to cloud:', err);
      });
    }
  }, [updatePreferences]);

  const toggleLocale = useCallback(() => {
    setLocale(localLocale === 'en' ? 'bn' : 'en');
  }, [localLocale, setLocale]);

  // Direct, instant, and guaranteed translation dictionary
  const tObject = translations[localLocale] || translations.en;

  return (
    <LanguageContext.Provider value={{ locale: localLocale, t: tObject, toggleLocale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};

