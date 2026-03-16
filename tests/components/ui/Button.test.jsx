/**
 * Button Component Tests
 * 
 * Tests for mobile-optimized button component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../../src/components/ui/Button';

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => ({
  Spinner: ({ className }) => <span data-testid="spinner" className={className}>Spinner</span>,
}));

describe('Button', () => {
  describe('Rendering', () => {
    it('should render button text', () => {
      render(<Button>Click me</Button>);
      
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with default variant', () => {
      const { container } = render(<Button>Click me</Button>);
      
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render different variants', () => {
      const { rerender, container } = render(<Button variant="primary">Primary</Button>);
      let button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      rerender(<Button variant="secondary">Secondary</Button>);
      button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      rerender(<Button variant="danger">Danger</Button>);
      button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      rerender(<Button variant="ghost">Ghost</Button>);
      button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });

    it('should render different sizes', () => {
      const { rerender, container } = render(<Button size="sm">Small</Button>);
      let button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      rerender(<Button size="default">Default</Button>);
      button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      
      rerender(<Button size="lg">Large</Button>);
      button = container.querySelector('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click event', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByText('Click me');
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      
      const button = screen.getByText('Click me');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call click when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} loading>Loading</Button>);
      
      const button = screen.getByRole('button', { hidden: true });
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading prop is true', () => {
      render(<Button loading>Loading</Button>);
      
      const button = screen.getByRole('button', { hidden: true });
      expect(button).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      render(<Button loading>Loading</Button>);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should hide children when loading', () => {
      render(<Button loading>Click me</Button>);
      
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('should not show spinner when not loading', () => {
      render(<Button>Click me</Button>);
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('should hide spinner when loading becomes false', () => {
      const { rerender } = render(<Button loading>Loading</Button>);
      
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      
      rerender(<Button loading={false}>Click me</Button>);
      
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon on left', () => {
      const MockIcon = () => <span data-testid="icon">Icon</span>;
      
      render(<Button icon={MockIcon} iconPosition="left">Click me</Button>);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render icon on right', () => {
      const MockIcon = () => <span data-testid="icon">Icon</span>;
      
      render(<Button icon={MockIcon} iconPosition="right">Click me</Button>);
      
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should not render icon when loading', () => {
      const MockIcon = () => <span data-testid="icon">Icon</span>;
      
      render(<Button icon={MockIcon} loading>Loading</Button>);
      
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should not render icon without icon prop', () => {
      render(<Button>Click me</Button>);
      
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('Full Width', () => {
    it('should be full width by default', () => {
      const { container } = render(<Button>Click me</Button>);
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('w-full');
    });

    it('should not be full width when fullWidth is false', () => {
      const { container } = render(<Button fullWidth={false}>Click me</Button>);
      
      const button = container.querySelector('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Button className="custom-class">Click me</Button>
      );
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <Button className="class-1 class-2">Click me</Button>
      );
      
      const button = container.querySelector('button');
      expect(button).toHaveClass('class-1');
      expect(button).toHaveClass('class-2');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('should have focus-visible state', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should be disabled and not focusable when disabled', () => {
      render(<Button disabled>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Ripple Effect', () => {
    it('should have ripple element', () => {
      const { container } = render(<Button>Click me</Button>);
      
      const ripple = container.querySelector('.ripple');
      expect(ripple).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(<Button>{null}</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined onClick', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button');
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });
});
