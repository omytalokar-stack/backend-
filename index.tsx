
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ ServiceWorker registered:', registration.scope);
        
        // Check for updates periodically (every 6 hours)
        setInterval(() => {
          console.log('🔄 Checking for service worker updates...');
          registration.update().catch(err => {
            console.warn('⚠️ Failed to check for updates:', err);
          });
        }, 6 * 60 * 60 * 1000); // 6 hours

        // Listen for when a new service worker is waiting
        registration.addEventListener('updatefound', () => {
          console.log('🆕 New service worker found');
          const newWorker = registration.installing;
          
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            console.log(`📡 Service Worker state: ${newWorker.state}`);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is waiting
              console.log('🚀 Update available - dispatching event');
              window.dispatchEvent(new CustomEvent('app-update-available', { detail: { registration } }));
            }
          });
        });

        // Handle SKIP_WAITING message from popup
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'SKIP_WAITING') {
            console.log('⏭️ SKIP_WAITING message received');
            registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      })
      .catch(err => console.warn('❌ ServiceWorker registration failed:', err));
  });
}

