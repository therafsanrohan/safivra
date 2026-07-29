import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Statically import core namespaces needed for the initial launch shell
import commonEn from '../../locales/en/common.json';
import commonBn from '../../locales/bn/common.json';
import navEn from '../../locales/en/nav.json';
import navBn from '../../locales/bn/nav.json';
import addTransactionEn from '../../locales/en/addTransaction.json';
import addTransactionBn from '../../locales/bn/addTransaction.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        nav: navEn,
        addTransaction: addTransactionEn,
      },
      bn: {
        common: commonBn,
        nav: navBn,
        addTransaction: addTransactionBn,
      },
    },
    fallbackLng: 'en',
    ns: ['common', 'nav', 'addTransaction'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Prevents loading cascades from blocking render
    },
  });

export default i18n;
