import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';
import './firebaseClient';

// Vercel Analytics and Speed Insights
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    if (import.meta.env.DEV) {
      console.error('[main] Root element not found. Waiting for DOM...');
    }
    setTimeout(renderApp, 10);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
      <Analytics />
      <SpeedInsights />
    </React.StrictMode>
  );
};

renderApp();

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    console.error('[main] Global error:', event.error);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('[main] Unhandled promise rejection:', event.reason);
  }
});
