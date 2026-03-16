import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock IndexedDB
global.indexedDB = vi.fn();
global.IDBKeyRange = vi.fn();

// =================================================================
// Mock window.matchMedia (JSDOM does not implement it)
// =================================================================
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// =================================================================
// Mock ResizeObserver (JSDOM does not implement it)
// =================================================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// =================================================================
// Mock Recharts – replaces chart components with simple div stubs
// so tests can find the expected data-testid attributes.
// =================================================================
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    BarChart: ({ children }) => React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    LineChart: ({ children }) => React.createElement('div', { 'data-testid': 'line-chart' }, children),
    AreaChart: ({ children }) => React.createElement('div', { 'data-testid': 'area-chart' }, children),
    PieChart: ({ children }) => React.createElement('div', { 'data-testid': 'pie-chart' }, children),
    CartesianGrid: () => React.createElement('div', { 'data-testid': 'cartesian-grid' }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    Tooltip: () => React.createElement('div', { 'data-testid': 'tooltip' }),
    Legend: () => React.createElement('div', { 'data-testid': 'legend' }),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    Area: () => React.createElement('div', { 'data-testid': 'area' }),
    Pie: () => React.createElement('div', { 'data-testid': 'pie' }),
    Cell: () => React.createElement('div', { 'data-testid': 'cell' }),
    ReferenceLine: () => React.createElement('div', { 'data-testid': 'reference-line' }),
  };
});

// Mock localStorage with actual state storage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn(index => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();
global.localStorage = localStorageMock;

// Mock Geolocation API
global.navigator.geolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));
