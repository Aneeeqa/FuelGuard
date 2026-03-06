import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { FuelProvider } from './context/FuelContext.jsx';
import './index.css';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <FuelProvider>
        <App />
      </FuelProvider>
    </React.StrictMode>
  );
}


