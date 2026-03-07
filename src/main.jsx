import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FuelProvider } from './context/FuelContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

// Ensure proper initialization
const root = document.getElementById('root');

if (!root) {
  console.error('Root element not found!');
  // Create root element if it doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
}

const rootElement = root || document.getElementById('root');

try {
  // REMOVED React.StrictMode - it was causing issues with error boundary
  ReactDOM.createRoot(rootElement).render(
    <ErrorBoundary>
      <ThemeProvider>
        <FuelProvider>
          <App />
        </FuelProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  // Show error message to user
  rootElement.innerHTML = `
    <div style="
      padding: 20px;
      text-align: center;
      font-family: system-ui, sans-serif;
      background: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    ">
      <h2 style="color: #dc2626; margin-bottom: 10px;">App Failed to Load</h2>
      <p style="color: #334155;">Please refresh the page to try again.</p>
      <button onclick="location.reload()" style="
        margin-top: 20px;
        padding: 12px 24px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
      ">Reload</button>
    </div>
  `;
}


