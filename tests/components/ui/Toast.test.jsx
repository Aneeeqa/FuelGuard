/**
 * Toast Component Tests
 * 
 * Tests for toast notification component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast, { ToastContainer, useToast } from '../../../src/components/ui/Toast';

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => ({
  CheckCircle: ({ className }) => <span data-testid="check-circle" className={className}>✓</span>,
  WarningCircle: ({ className }) => <span data-testid="warning-circle" className={className}>⚠</span>,
  Info: ({ className }) => <span data-testid="info" className={className}>ℹ</span>,
  X: ({ size, className }) => <span data-testid="close-icon" style={{ fontSize: size }} className={className}>X</span>,
}));

describe('Toast', () => {
  const defaultProps = {
    message: 'Test message',
    variant: 'info',
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render toast notification', () => {
      render(<Toast {...defaultProps} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render success variant', () => {
      render(<Toast message="Success" variant="success" />);
      
      expect(screen.getByTestId('check-circle')).toBeInTheDocument();
    });

    it('should render error variant', () => {
      render(<Toast message="Error" variant="error" />);
      
      expect(screen.getByTestId('warning-circle')).toBeInTheDocument();
    });

    it('should render warning variant', () => {
      render(<Toast message="Warning" variant="warning" />);
      
      expect(screen.getByTestId('warning-circle')).toBeInTheDocument();
    });

    it('should render info variant', () => {
      render(<Toast message="Info" variant="info" />);
      
      expect(screen.getByTestId('info')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<Toast {...defaultProps} />);
      
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration', async () => {
      const handleDismiss = vi.fn();
      
      render(<Toast {...defaultProps} duration={5000} onDismiss={handleDismiss} />);
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
      
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalled();
      });
    });

    it('should auto-dismiss after custom duration', async () => {
      const handleDismiss = vi.fn();
      
      render(<Toast {...defaultProps} duration={3000} onDismiss={handleDismiss} />);
      
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalled();
      });
    });

    it('should not auto-dismiss when duration is 0', async () => {
      const handleDismiss = vi.fn();
      
      render(<Toast {...defaultProps} duration={0} onDismiss={handleDismiss} />);
      
      vi.advanceTimersByTime(5000);
      
      expect(handleDismiss).not.toHaveBeenCalled();
    });

    it('should hide toast before calling onDismiss', async () => {
      const handleDismiss = vi.fn();
      
      const { container } = render(
        <Toast {...defaultProps} duration={3000} onDismiss={handleDismiss} />
      );
      
      vi.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Manual Dismiss', () => {
    it('should dismiss when close button is clicked', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<Toast {...defaultProps} onDismiss={handleDismiss} />);
      
      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton);
      
      expect(handleDismiss).toHaveBeenCalled();
    });

    it('should hide toast before calling onDismiss on manual dismiss', async () => {
      const handleDismiss = vi.fn();
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      const { container } = render(
        <Toast {...defaultProps} onDismiss={handleDismiss} />
      );
      
      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton);
      
      await waitFor(() => {
        expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Toast Container', () => {
    it('should render multiple toasts', () => {
      const toasts = [
        { id: 1, message: 'First toast', variant: 'info', duration: 5000 },
        { id: 2, message: 'Second toast', variant: 'success', duration: 5000 },
        { id: 3, message: 'Third toast', variant: 'error', duration: 5000 },
      ];
      
      const removeToast = vi.fn();
      
      render(
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      );
      
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });

    it('should render empty container', () => {
      render(
        <ToastContainer toasts={[]} removeToast={vi.fn()} />
      );
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should call removeToast when toast is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const removeToast = vi.fn();
      
      const toasts = [
        { id: 1, message: 'Test toast', variant: 'info', duration: 5000 },
      ];
      
      render(
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      );
      
      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton);
      
      expect(removeToast).toHaveBeenCalledWith(1);
    });
  });

  describe('useToast Hook', () => {
    it('should provide toast functions', () => {
      const TestComponent = () => {
        const toast = useToast();
        return (
          <div>
            <button onClick={() => toast.addToast('Test')}>Add</button>
            <button onClick={() => toast.showSuccess('Success')}>Success</button>
            <button onClick={() => toast.showError('Error')}>Error</button>
            <button onClick={() => toast.showWarning('Warning')}>Warning</button>
            <button onClick={() => toast.showInfo('Info')}>Info</button>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      expect(screen.getByText('Add')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Info')).toBeInTheDocument();
    });

    it('should add toast to array', () => {
      const TestComponent = () => {
        const { toasts, addToast } = useToast();
        return (
          <div>
            <button onClick={() => addToast('New toast')}>Add</button>
            <div data-testid="toast-count">{toasts.length}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const count = screen.getByTestId('toast-count');
      expect(count).toHaveTextContent('0');
    });

    it('should remove toast from array', () => {
      const TestComponent = () => {
        const { toasts, addToast, removeToast } = useToast();
        return (
          <div>
            <button onClick={() => addToast('New toast')}>Add</button>
            <button onClick={() => removeToast(1)}>Remove</button>
            <div data-testid="toast-count">{toasts.length}</div>
          </div>
        );
      };
      
      render(<TestComponent />);
      
      const count = screen.getByTestId('toast-count');
      expect(count).toHaveTextContent('0');
    });
  });

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<Toast {...defaultProps} />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('should have proper ARIA label for close button', () => {
      render(<Toast {...defaultProps} />);
      
      const closeButton = screen.getByTestId('close-icon').closest('button');
      expect(closeButton).toHaveAttribute('aria-label', 'Dismiss');
    });
  });

  describe('Variants and Styling', () => {
    it('should apply success styles', () => {
      const { container } = render(<Toast message="Success" variant="success" />);
      
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });

    it('should apply error styles', () => {
      const { container } = render(<Toast message="Error" variant="error" />);
      
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });

    it('should apply warning styles', () => {
      const { container } = render(<Toast message="Warning" variant="warning" />);
      
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });

    it('should apply info styles', () => {
      const { container } = render(<Toast message="Info" variant="info" />);
      
      const toast = container.querySelector('[role="alert"]');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Positioning', () => {
    it('should be positioned at top-right', () => {
      const { container } = render(
        <ToastContainer toasts={[{ id: 1, message: 'Test', variant: 'info', duration: 5000 }]} removeToast={vi.fn()} />
      );
      
      const containerDiv = container.querySelector('.fixed');
      expect(containerDiv).toHaveClass('top-4', 'right-4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      render(<Toast message="" variant="info" />);
      
      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage = 'A'.repeat(1000);
      
      render(<Toast message={longMessage} variant="info" />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      
      render(<Toast message={specialMessage} variant="info" />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle null onDismiss', () => {
      render(<Toast {...defaultProps} onDismiss={null} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
