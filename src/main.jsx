import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FuelProvider } from './context/FuelContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ThemeProvider>
        <FuelProvider>
          <App />
        </FuelProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}


