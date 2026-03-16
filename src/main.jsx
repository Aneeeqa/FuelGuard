import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FuelProvider } from './context/FuelContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

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

