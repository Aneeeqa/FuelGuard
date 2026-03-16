import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FuelProvider } from './context/FuelContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// ─── Service Worker registration ───────────────────────────────────────────────
// `immediate: true`  → SW activates as soon as it is installed (skipWaiting).
// `onNeedRefresh`    → Called when a new SW is waiting; show a toast so the
//                      user can reload to get the latest version without being
//                      forced into a surprise page reload.
// `onOfflineReady`   → Called once the SW has cached everything needed to run
//                      fully offline.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Inject a non-intrusive banner at the top of the page
    showUpdateToast(updateSW);
  },
  onOfflineReady() {
    console.log('[PWA] App is ready to work offline.');
    showOfflineReadyToast();
  },
});

function showUpdateToast(updateFn) {
  const existing = document.getElementById('pwa-update-toast');
  if (existing) return; // already showing

  const toast = document.createElement('div');
  toast.id = 'pwa-update-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '9999',
    background: '#1e293b',
    color: '#f8fafc',
    padding: '0.75rem 1.25rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.9rem',
    maxWidth: '90vw',
  });

  const msg = document.createElement('span');
  msg.textContent = 'A new version of Fuel Guard is available.';
  toast.appendChild(msg);

  const btn = document.createElement('button');
  btn.textContent = 'Update';
  Object.assign(btn.style, {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.4rem 0.9rem',
    cursor: 'pointer',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  });
  btn.addEventListener('click', () => {
    toast.remove();
    updateFn(true); // reload page after SW takes over
  });
  toast.appendChild(btn);

  const dismiss = document.createElement('button');
  dismiss.textContent = '✕';
  Object.assign(dismiss.style, {
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    lineHeight: '1',
  });
  dismiss.setAttribute('aria-label', 'Dismiss update notification');
  dismiss.addEventListener('click', () => toast.remove());
  toast.appendChild(dismiss);

  document.body.appendChild(toast);
}

function showOfflineReadyToast() {
  const toast = document.createElement('div');
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '9999',
    background: '#064e3b',
    color: '#d1fae5',
    padding: '0.65rem 1.1rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
    fontSize: '0.875rem',
    maxWidth: '90vw',
    textAlign: 'center',
  });
  toast.textContent = '✓ Fuel Guard is ready to use offline.';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ─── Online / Offline status events ───────────────────────────────────────────
// Dispatch a custom DOM event so any component can react to connectivity changes
// without coupling to a specific state library.
window.addEventListener('online', () =>
  window.dispatchEvent(new CustomEvent('app:online'))
);
window.addEventListener('offline', () =>
  window.dispatchEvent(new CustomEvent('app:offline'))
);

// ─── Service Worker → main-thread bridge ──────────────────────────────────────
// The SW's `sync` and `periodicsync` event handlers post a message when
// Background Sync fires (including when the device regains connectivity while
// the app is backgrounded). Relay those messages as the same `app:online`
// custom event so FuelContext's queue-flush effect triggers automatically.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    const type = event.data?.type;
    if (type === 'SYNC_COMPLETE' || type === 'PERIODIC_SYNC') {
      window.dispatchEvent(new CustomEvent('app:online'));
    }
  });
}

// Fix Leaflet default icon issue - Use local images from public directory
// This prevents Vite from trying to resolve images at build time
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet-images/marker-icon-2x.png',
  iconUrl: '/leaflet-images/marker-icon.png',
  shadowUrl: '/leaflet-images/marker-shadow.png',
});

/**
 * SECURE Error Fallback Component
 *
 * SECURITY FIX (CWE-79): This component replaces the previous innerHTML-based implementation
 * that was vulnerable to Cross-Site Scripting (XSS). Using React JSX ensures all content is
 * properly sanitized before rendering to the DOM.
 *
 * Previous vulnerability (lines 47-72):
 *   rootElement.innerHTML = `...`;  // ❌ VULNERABLE TO XSS
 *
 * Current implementation:
 *   ReactDOM.createRoot(rootElement).render(<ErrorFallback />);  // ✅ SECURE
 *
 * React automatically escapes all dynamic content, preventing injection of malicious scripts.
 *
 * @component
 * @returns {React.ReactElement} A secure error message UI with reload functionality
 */
export function ErrorFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      role="alert"
      aria-live="assertive"
    >
      <h2 style={{ color: '#dc2626', marginBottom: '10px' }}>
        App Failed to Load
      </h2>
      <p style={{ color: '#334155' }}>
        Please refresh the page to try again.
      </p>
      <button
        onClick={handleReload}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
        aria-label="Reload the application"
      >
        Reload
      </button>
    </div>
  );
}

// Ensure proper initialization
let root = document.getElementById('root');

if (!root) {
  console.error('Root element not found!');
  // Create root element if it doesn't exist
  root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

const rootElement = root;

try {
  // REMOVED React.StrictMode - it was causing issues with error boundary
  ReactDOM.createRoot(rootElement).render(
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FuelProvider>
            <App />
          </FuelProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render React app:', error);

  // SECURITY FIX: Use secure React rendering instead of vulnerable innerHTML
  // This prevents XSS attacks (CWE-79) by leveraging React's automatic escaping
  ReactDOM.createRoot(rootElement).render(<ErrorFallback />);
}

