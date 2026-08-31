import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Statically import all namespaces for instant full-site translation
import commonEn from '../../locales/en/common.json';
import commonBn from '../../locales/bn/common.json';
import navEn from '../../locales/en/nav.json';
import navBn from '../../locales/bn/nav.json';
import addTransactionEn from '../../locales/en/addTransaction.json';
import addTransactionBn from '../../locales/bn/addTransaction.json';
import accountsEn from '../../locales/en/accounts.json';
import accountsBn from '../../locales/bn/accounts.json';
import activityEn from '../../locales/en/activity.json';
import activityBn from '../../locales/bn/activity.json';
import creditCardsEn from '../../locales/en/creditCards.json';
import creditCardsBn from '../../locales/bn/creditCards.json';
import dashboardEn from '../../locales/en/dashboard.json';
import dashboardBn from '../../locales/bn/dashboard.json';
import loansEn from '../../locales/en/loans.json';
import loansBn from '../../locales/bn/loans.json';
import moreEn from '../../locales/en/more.json';
import moreBn from '../../locales/bn/more.json';
import notificationsEn from '../../locales/en/notifications.json';
import notificationsBn from '../../locales/bn/notifications.json';
import plansEn from '../../locales/en/plans.json';
import plansBn from '../../locales/bn/plans.json';
import recurringEn from '../../locales/en/recurring.json';
import recurringBn from '../../locales/bn/recurring.json';
import reportsEn from '../../locales/en/reports.json';
import reportsBn from '../../locales/bn/reports.json';
import savingsEn from '../../locales/en/savings.json';
import savingsBn from '../../locales/bn/savings.json';
import settingsEn from '../../locales/en/settings.json';
import settingsBn from '../../locales/bn/settings.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: commonEn,
        nav: navEn,
        addTransaction: addTransactionEn,
        accounts: accountsEn,
        activity: activityEn,
        creditCards: creditCardsEn,
        dashboard: dashboardEn,
        loans: loansEn,
        more: moreEn,
        notifications: notificationsEn,
        plans: plansEn,
        recurring: recurringEn,
        reports: reportsEn,
        savings: savingsEn,
        settings: settingsEn,
      },
      bn: {
        common: commonBn,
        nav: navBn,
        addTransaction: addTransactionBn,
        accounts: accountsBn,
        activity: activityBn,
        creditCards: creditCardsBn,
        dashboard: dashboardBn,
        loans: loansBn,
        more: moreBn,
        notifications: notificationsBn,
        plans: plansBn,
        recurring: recurringBn,
        reports: reportsBn,
        savings: savingsBn,
        settings: settingsBn,
      },
    },
    fallbackLng: 'en',
    ns: [
      'common', 'nav', 'addTransaction', 'accounts', 'activity', 
      'creditCards', 'dashboard', 'loans', 'more', 'notifications', 
      'plans', 'recurring', 'reports', 'savings', 'settings'
    ],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
