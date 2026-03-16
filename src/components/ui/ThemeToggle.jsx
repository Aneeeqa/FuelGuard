import React from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../../context/ThemeContext';

/**
 * ThemeToggle component
 * - Uses ThemeContext for theme management
 * - Displays Sun/Moon icons based on current theme
 * - Supports className prop for custom styling
 */
const ThemeToggle = ({ className }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '12px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--text-primary)',
      }}
    >
      {isDark ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
};

export default ThemeToggle;
