import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import '@/i18n'; // Initialize i18n configuration
import { PlatformProvider } from '@/context/PlatformContext';

// Handle dynamic import / SW stale chunk cache failures automatically
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

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PlatformProvider>
      <App />
    </PlatformProvider>
  </React.StrictMode>
);
