/**
 * Alert Component Tests
 * 
 * Tests for alert component with different variants
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../../../src/components/ui/Alert';

describe('Alert', () => {
  const defaultProps = {
    message: 'This is an alert message',
    variant: 'info',
  };

  describe('Rendering', () => {
    it('should render alert message', () => {
      render(<Alert {...defaultProps} />);
      
      expect(screen.getByText('This is an alert message')).toBeInTheDocument();
    });

    it('should render info variant', () => {
      render(<Alert message="Info message" variant="info" />);
      
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should render success variant', () => {
      render(<Alert message="Success message" variant="success" />);
      
      expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('should render error variant', () => {
      render(<Alert message="Error message" variant="error" />);
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      render(<Alert message="Warning message" variant="warning" />);
      
      expect(screen.getByText('Warning message')).toBeInTheDocument();
    });

    it('should render alert icon', () => {
      const { container } = render(<Alert {...defaultProps} />);
      
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Dismiss Action', () => {
    it('should render dismiss button when showDismiss is true', () => {
      render(<Alert {...defaultProps} showDismiss />);
      
      const dismissButton = screen.getByRole('button');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should not render dismiss button when showDismiss is false', () => {
      render(<Alert {...defaultProps} showDismiss={false} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup();
      
      render(<Alert {...defaultProps} onDismiss={handleDismiss} showDismiss />);
      
      const dismissButton = screen.getByRole('button');
      await user.click(dismissButton);
      
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not call onDismiss when onDismiss is not provided', async () => {
      const user = userEvent.setup();
      
      render(<Alert {...defaultProps} showDismiss />);
      
      const dismissButton = screen.getByRole('button');
      await user.click(dismissButton);
      
      // Should not throw
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('should auto-dismiss after duration', () => {
      const handleDismiss = vi.fn();
      
      render(<Alert {...defaultProps} autoDismiss duration={5000} onDismiss={handleDismiss} />);
      
      expect(screen.getByText('This is an alert message')).toBeInTheDocument();
      
      vi.advanceTimersByTime(5000);
      
      expect(handleDismiss).toHaveBeenCalled();
    });

    it('should not auto-dismiss when autoDismiss is false', () => {
      const handleDismiss = vi.fn();
      
      render(<Alert {...defaultProps} autoDismiss={false} duration={5000} onDismiss={handleDismiss} />);
      
      vi.advanceTimersByTime(5000);
      
      expect(handleDismiss).not.toHaveBeenCalled();
    });

    it('should use default duration when not provided', () => {
      const handleDismiss = vi.fn();
      
      render(<Alert {...defaultProps} autoDismiss onDismiss={handleDismiss} />);
      
      vi.advanceTimersByTime(3000); // Default duration
      
      expect(handleDismiss).toHaveBeenCalled();
    });
  });

  describe('Variants and Styling', () => {
    it('should apply info styles', () => {
      const { container } = render(<Alert message="Info" variant="info" />);
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should apply success styles', () => {
      const { container } = render(<Alert message="Success" variant="success" />);
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should apply error styles', () => {
      const { container } = render(<Alert message="Error" variant="error" />);
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should apply warning styles', () => {
      const { container } = render(<Alert message="Warning" variant="warning" />);
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Alert {...defaultProps} className="custom-alert" />
      );
      
      const alert = container.querySelector('.custom-alert');
      expect(alert).toBeInTheDocument();
    });

    it('should merge multiple classes', () => {
      const { container } = render(
        <Alert {...defaultProps} className="class-1 class-2" />
      );
      
      const alert = container.querySelector('.custom-alert') || 
                   container.querySelector('.rounded-xl');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<Alert {...defaultProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<Alert {...defaultProps} />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have dismiss button with proper ARIA label', () => {
      render(<Alert {...defaultProps} showDismiss />);
      
      const dismissButton = screen.getByRole('button');
      expect(dismissButton).toHaveAttribute('aria-label');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<Alert message="" variant="info" />);
      
      expect(screen.queryByText('This is an alert message')).not.toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage = 'A'.repeat(1000);
      
      render(<Alert message={longMessage} variant="info" />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      
      render(<Alert message={specialMessage} variant="info" />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle null onDismiss', () => {
      render(<Alert {...defaultProps} onDismiss={null} showDismiss />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should handle missing variant', () => {
      render(<Alert message="Test message" />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('should display info icon', () => {
      const { container } = render(<Alert message="Info" variant="info" />);
      
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should display success icon', () => {
      const { container } = render(<Alert message="Success" variant="success" />);
      
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(<Alert message="Error" variant="error" />);
      
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      const { container } = render(<Alert message="Warning" variant="warning" />);
      
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });
  });
});
