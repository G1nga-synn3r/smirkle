import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('[main] Root element not found. Waiting for DOM...');
    setTimeout(renderApp, 10);
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

renderApp();

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[main] Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[main] Unhandled promise rejection:', event.reason);
});
