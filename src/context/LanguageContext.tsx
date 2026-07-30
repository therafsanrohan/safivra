import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { type Locale, type TranslationKeys } from '@/lib/i18n/translations';
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
  
  // Internal state for immediate UI updates and unauthenticated users
  const [localLocale, setLocalLocale] = useState<Locale>('en');

  // Sync with cloud preference if available
  useEffect(() => {
    if (preferences?.language && (preferences.language === 'en' || preferences.language === 'bn')) {
      setLocalLocale(preferences.language as Locale);
    }
  }, [preferences?.language]);

  useEffect(() => {
    i18n.changeLanguage(localLocale);
  }, [localLocale]);

  const setLocale = useCallback(async (next: Locale) => {
    setLocalLocale(next);
    await i18n.changeLanguage(next);
    if (updatePreferences) {
      updatePreferences({ language: next }).catch(err => {
        console.error('[Language] Failed to sync to cloud:', err);
      });
    }
  }, [updatePreferences]);

  const toggleLocale = useCallback(() => {
    setLocale(localLocale === 'en' ? 'bn' : 'en');
  }, [localLocale, setLocale]);

  const tObject = (i18n?.store?.data?.[localLocale] || {}) as unknown as TranslationKeys;

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
