import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Eager load Dashboard (landing page)
import Dashboard from './pages/Dashboard';

// Lazy load other pages for better initial bundle size
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const LogEntry = lazy(() => import('./pages/LogEntry'));

// Mobile-friendly loading skeleton
const PageLoader = () => (
  <div style={{ padding: '16px', backgroundColor: '#f8fafc' }}>
    <div style={{ height: '32px', width: '200px', backgroundColor: '#e2e8f0', borderRadius: '8px' }} />
    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div style={{ height: '96px', backgroundColor: '#e2e8f0', borderRadius: '8px' }} />
      <div style={{ height: '96px', backgroundColor: '#e2e8f0', borderRadius: '8px' }} />
    </div>
  </div>
);

// Error boundary fallback
const ErrorFallback = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: '16px' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>Something went wrong</h1>
      <p style={{ color: '#ef4444' }}>Please refresh the page</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="add" element={<LogEntry />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

