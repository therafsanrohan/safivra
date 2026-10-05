import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations, type Locale, type TranslationKeys } from '@/lib/i18n/translations';
import i18n from '@/i18n';
import { useAuthContext } from '@/context/AuthContext';
import { autoTranslationEngine, generateSourceHashSync, type TranslationContext } from '@/lib/i18n/autoTranslationEngine';

interface LanguageContextValue {
  locale: Locale;
  t: TranslationKeys;
  translate: (text: string, options?: TranslationContext) => string;
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

  // Track cache updates to trigger re-renders when auto-translation finishes
  const [, setTick] = useState(0);

  useEffect(() => {
    autoTranslationEngine.setLocale(localLocale);
    
    const unsubscribe = autoTranslationEngine.subscribe((hash, translated) => {
      // Trigger a re-render so components get the new translation
      setTick(t => t + 1);
    });

    return () => { unsubscribe(); };
  }, [localLocale]);

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

  // The new dynamic Auto-Translation function
  const translate = useCallback((text: string, options?: TranslationContext) => {
    const hash = generateSourceHashSync(text);
    return autoTranslationEngine.translate(text, hash, options);
  }, []);

  // Legacy direct dictionary (preserved for backward compatibility during migration)
  const tObject = translations[localLocale] || translations.en;

  return (
    <LanguageContext.Provider value={{ locale: localLocale, t: tObject, translate, toggleLocale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};


export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
};

