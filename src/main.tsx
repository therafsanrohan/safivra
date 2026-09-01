import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { App } from './App';
import './index.css';
import '@/i18n'; // Initialize i18n configuration
import { PlatformProvider } from '@/context/PlatformContext';

// ─── Sentry Error Tracking ────────────────────────────────────────────────────
// Only activates when VITE_SENTRY_DSN is set in Vercel environment variables.
// Financial data (amounts, balances, account numbers) is NEVER sent to Sentry.
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION ?? '1.0.0',

    // Performance monitoring — sample 10% of transactions (tune per usage)
    tracesSampleRate: 0.1,

    // Never capture personally identifiable or financial information
    beforeSend(event) {
      // Strip request body — may contain transaction amounts or account data
      if (event.request) {
        event.request.data = '[REDACTED]';
      }
      // Remove all breadcrumbs — they may contain URL params with financial IDs
      delete event.breadcrumbs;
      return event;
    },

    // Ignore known benign errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
  });
}

// ─── Stale Service-Worker Cache Recovery ─────────────────────────────────────
// When Vite dynamic chunks are updated, old SW caches may reference deleted
// chunk hashes. This auto-recovers by unregistering the SW and reloading once.
window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('Loading chunk') ||
      event.message.includes('dynamically imported module') ||
      event.message.includes('Importing a module script failed'))
  ) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((r) => r.unregister());
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }
});

// ─── App Bootstrap ────────────────────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PlatformProvider>
      <App />
    </PlatformProvider>
  </React.StrictMode>
);
