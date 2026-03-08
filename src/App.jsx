import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Eager load Dashboard (landing page)
import Dashboard from './pages/Dashboard';

// Lazy load other pages for better initial bundle size
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const LogEntry = lazy(() => import('./pages/LogEntry'));
const Trips = lazy(() => import('./pages/Trips'));
const Fleet = lazy(() => import('./pages/Fleet'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Vehicles = lazy(() => import('./pages/Vehicles'));
const Contact = lazy(() => import('./pages/Contact'));
const Privacy = lazy(() => import('./pages/Privacy'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));

// Mobile-friendly loading skeleton
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
    <div className="w-full max-w-md space-y-4">
      <div className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
        <div className="h-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
      </div>
      <div className="h-64 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
    </div>
  </div>
);

// Error boundary fallback
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#fee2e2' }}>
        <span className="text-3xl">⚠️</span>
      </div>
      <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--accent-alert)' }}>Something went wrong</h1>
      <p className="mb-4" style={{ color: 'var(--text-muted)' }}>Please refresh the page to try again.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover-lift active-scale"
        style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}
      >
        Reload Page
      </button>
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
            <Route path="trips" element={<Trips />} />
            <Route path="fleet" element={<Fleet />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="system" element={<SystemStatus />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;


