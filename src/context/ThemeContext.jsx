import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

console.log('ThemeContext module loaded');

const THEME_KEY = 'fuelGuard_theme';

export const ThemeProvider = ({ children }) => {
  console.log('ThemeProvider: Initializing...');

  // Check for saved theme or system preference
  const getInitialTheme = () => {
    console.log('ThemeProvider: Determining initial theme...');
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_KEY);
    console.log('ThemeProvider: Saved theme:', savedTheme);
    if (savedTheme) {
      return savedTheme;
    }
    // Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('ThemeProvider: System prefers dark:', prefersDark);
    if (prefersDark) {
      return 'dark';
    }
    // Default to light mode
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);
  console.log('ThemeProvider: Initial theme set to:', theme);

  // Apply theme to document
  useEffect(() => {
    console.log('ThemeProvider: Applying theme:', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark'); // Keep for Tailwind compatibility if needed
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
    }

    // Save preference
    localStorage.setItem(THEME_KEY, theme);
    console.log('ThemeProvider: Theme applied to document');
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
