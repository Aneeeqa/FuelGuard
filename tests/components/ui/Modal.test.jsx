/**
 * Modal Component Tests
 * 
 * Tests for modal/dialog component with backdrop blur
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../../../src/components/ui/Modal';

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => ({
  X: ({ size, className }) => <span data-testid="close-icon" style={{ fontSize: size }} className={className}>X</span>,
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
  };

  beforeEach(() => {
    // Reset document body styles
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should render modal content', () => {
      render(
        <Modal {...defaultProps}>
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render title', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should render close button by default', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();
    });

    it('should not render close button when showClose is false', () => {
      render(
        <Modal {...defaultProps} showClose={false}>
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.queryByTestId('close-icon')).not.toBeInTheDocument();
    });
  });

  describe('Opening and Closing', () => {
    it('should open modal when isOpen becomes true', () => {
      const { rerender } = render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      
      rerender(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
    });

    it('should close modal when isOpen becomes false', () => {
      const { rerender } = render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      
      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('should close on close button click', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );
      
      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Backdrop Click', () => {
    it('should close on backdrop click when closeOnBackdrop is true', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} onClose={handleClose} closeOnBackdrop={true}>
          <p>Content</p>
        </Modal>
      );
      
      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop);
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on backdrop click when closeOnBackdrop is false', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} onClose={handleClose} closeOnBackdrop={false}>
          <p>Content</p>
        </Modal>
      );
      
      const backdrop = screen.getByRole('dialog').parentElement;
      await user.click(backdrop);
      
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should not close when clicking inside modal', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();
      
      render(
        <Modal {...defaultProps} onClose={handleClose} closeOnBackdrop={true}>
          <p>Content</p>
        </Modal>
      );
      
      const modalContent = screen.getByText('Content').closest('div');
      await user.click(modalContent);
      
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Escape Key', () => {
    it('should close on Escape key press', () => {
      const handleClose = vi.fn();
      
      render(
        <Modal {...defaultProps} onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on other key presses', () => {
      const handleClose = vi.fn();
      
      render(
        <Modal {...defaultProps} onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );
      
      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Space' });
      
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when open', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when closed', async () => {
      const { rerender } = render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('hidden');
      
      rerender(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Sizes', () => {
    it('should render sm size', () => {
      const { container } = render(
        <Modal {...defaultProps} size="sm">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.max-w-sm');
      expect(modal).toBeInTheDocument();
    });

    it('should render md size (default)', () => {
      const { container } = render(
        <Modal {...defaultProps} size="md">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });

    it('should render lg size', () => {
      const { container } = render(
        <Modal {...defaultProps} size="lg">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('should render xl size', () => {
      const { container } = render(
        <Modal {...defaultProps} size="xl">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });

    it('should render full size', () => {
      const { container } = render(
        <Modal {...defaultProps} size="full">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.max-w-5xl');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Modal Footer', () => {
    it('should render footer content', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
          <Modal.Footer>
            <button>Cancel</button>
            <button>Confirm</button>
          </Modal.Footer>
        </Modal>
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should render footer without title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <p>Content</p>
          <Modal.Footer>
            <button>Cancel</button>
          </Modal.Footer>
        </Modal>
      );
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <Modal {...defaultProps} className="custom-modal">
          <p>Content</p>
        </Modal>
      );
      
      const modal = container.querySelector('.custom-modal');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(
        <Modal {...defaultProps}>
          <p>Content</p>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should not have aria-labelledby when title is not provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <p>Content</p>
        </Modal>
      );
      
      const modal = screen.getByRole('dialog');
      expect(modal).not.toHaveAttribute('aria-labelledby');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(
        <Modal {...defaultProps}>
          {null}
        </Modal>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle empty children', () => {
      render(
        <Modal {...defaultProps}>
          {''}
        </Modal>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle missing onClose', () => {
      render(
        <Modal isOpen={true} onClose={undefined} title="Test Modal">
          <p>Content</p>
        </Modal>
      );
      
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
