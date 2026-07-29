import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';
import '@/i18n'; // Initialize i18n configuration
import { PlatformProvider } from '@/context/PlatformContext';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <PlatformProvider>
      <App />
    </PlatformProvider>
  </React.StrictMode>
);
