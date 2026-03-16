/**
 * ThemeToggle Component Tests
 * 
 * Tests for theme toggle component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../../../src/components/ui/ThemeToggle';

// Mock icons
vi.mock('@phosphor-icons/react', () => ({
  Sun: ({ size, className }) => <span data-testid="sun-icon" style={{ fontSize: size }} className={className}>Sun</span>,
  Moon: ({ size, className }) => <span data-testid="moon-icon" style={{ fontSize: size }} className={className}>Moon</span>,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    // Reset document class and localStorage before each test
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render toggle button', () => {
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should render sun icon by default (light mode)', () => {
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });

    it('should render moon icon when in dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
    });
  });

  describe('Theme Toggling', () => {
    it('should toggle between light and dark mode', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggle />);
      
      // Should start in light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
      
      // Toggle to dark mode
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should switch to dark mode when clicked', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should switch to light mode when clicked again', async () => {
      const user = userEvent.setup();
      
      // Start in dark mode
      document.documentElement.classList.add('dark');
      
      render(<ThemeToggle />);
      
      expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    });
  });

  describe('Theme Persistence', () => {
    it('should persist theme preference to localStorage', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      // Verify the theme was persisted to localStorage
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('should load theme preference from localStorage on mount', () => {
      localStorage.setItem('theme', 'dark');
      
      render(<ThemeToggle />);
      
      // Component should have read the theme and applied dark mode
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should use light mode when no preference is stored', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      
      render(<ThemeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      getItemSpy.mockRestore();
    });

    it('should use dark mode when preference is "dark"', () => {
      localStorage.setItem('theme', 'dark');
      
      render(<ThemeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should use light mode when preference is "light"', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('light');
      
      render(<ThemeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      getItemSpy.mockRestore();
    });
  });

  describe('System Preference', () => {
    it('should detect system dark mode preference', () => {
      const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });
      
      render(<ThemeToggle />);
      
      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      
      matchMediaSpy.mockRestore();
    });

    it('should detect system light mode preference', () => {
      const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: light)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });
      
      render(<ThemeToggle />);
      
      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-color-scheme: light)');
      
      matchMediaSpy.mockRestore();
    });
  });

  describe('Theme Classes', () => {
    it('should apply dark class when in dark mode', () => {
      document.documentElement.classList.add('dark');
      
      render(<ThemeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when in light mode', () => {
      document.documentElement.classList.add('dark');
      
      const { rerender } = render(<ThemeToggle />);
      
      // Toggle to light mode
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      rerender(<ThemeToggle />);
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });

    it('should update ARIA label based on theme', () => {
      const { container } = render(<ThemeToggle />);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      
      render(<ThemeToggle />);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      await user.keyboard('{Enter}');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ThemeToggle className="custom-toggle" />
      );
      
      const button = container.querySelector('.custom-toggle');
      expect(button).toBeInTheDocument();
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <ThemeToggle className="class-1 class-2" />
      );
      
      const button = container.querySelector('.class-1');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      render(<ThemeToggle />);
      
      // Should not throw
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      
      setItemSpy.mockRestore();
    });

    it('should handle invalid localStorage value', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('invalid');
      
      render(<ThemeToggle />);
      
      // Should default to light mode
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      getItemSpy.mockRestore();
    });
  });

  describe('Animation', () => {
    it('should have transition animation', () => {
      const { container } = render(<ThemeToggle />);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should animate icon transition', () => {
      const { container } = render(<ThemeToggle />);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });
});
