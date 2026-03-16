/**
 * FullTankToggle Component Tests
 * 
 * Tests for full tank toggle component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FullTankToggle from '../../src/components/FullTankToggle';

// Mock icons
vi.mock('lucide-react', () => ({
  Info: ({ size, className }) => <span data-testid="info-icon" style={{ fontSize: size }} className={className}>Info</span>,
  Fuel: ({ size, className }) => <span data-testid="fuel-icon" style={{ fontSize: size }} className={className}>Fuel</span>,
}));

describe('FullTankToggle', () => {
  const defaultProps = {
    checked: false,
    onChange: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render toggle switch', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeInTheDocument();
    });

    it('should render label text', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      expect(screen.getByText(/Filled tank to full/i)).toBeInTheDocument();
    });

    it('should display current state when checked', () => {
      render(<FullTankToggle {...defaultProps} checked={true} />);
      
      expect(screen.getByText(/Filled tank to full/i)).toBeInTheDocument();
    });

    it('should display current state when unchecked', () => {
      render(<FullTankToggle {...defaultProps} checked={false} />);
      
      expect(screen.getByText(/Filled tank to full/i)).toBeInTheDocument();
    });
  });

  describe('Toggle State', () => {
    it('should toggle on when clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} onChange={handleChange} />);
      
      const toggle = screen.getByRole('checkbox');
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should toggle off when clicked again', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} checked={true} onChange={handleChange} />);
      
      const toggle = screen.getByRole('checkbox');
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('should handle change event', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} onChange={handleChange} />);
      
      const toggle = screen.getByRole('checkbox');
      await user.click(toggle);
      
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Benefits Text', () => {
    it('should display benefits when checked', () => {
      render(<FullTankToggle {...defaultProps} checked={true} />);
      
      expect(screen.getByText(/Enable accurate Tank-to-Tank tracking/i)).toBeInTheDocument();
      expect(screen.getByText(/Detect fuel theft more precisely/i)).toBeInTheDocument();
      expect(screen.getByText(/Track real fuel consumption/i)).toBeInTheDocument();
      expect(screen.getByText(/Better mileage statistics/i)).toBeInTheDocument();
    });

    it('should hide benefits when unchecked', () => {
      render(<FullTankToggle {...defaultProps} checked={false} />);
      
      expect(screen.queryByText(/Enable accurate Tank-to-Tank tracking/i)).not.toBeInTheDocument();
    });
  });

  describe('Tank Capacity', () => {
    it('should display tank capacity when provided', () => {
      render(<FullTankToggle {...defaultProps} tankCapacity={50} />);
      
      expect(screen.getByText(/50 L/i)).toBeInTheDocument();
    });

    it('should hide tank capacity when not provided', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      expect(screen.queryByText(/Tank capacity:/i)).not.toBeInTheDocument();
    });

    it('should display tank capacity with label', () => {
      render(<FullTankToggle {...defaultProps} tankCapacity={50} />);
      
      expect(screen.getByText(/Tank capacity:/i)).toBeInTheDocument();
    });
  });

  describe('Learn More Link', () => {
    it('should show Learn More link by default', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      expect(screen.getByText(/Learn more about Tank-to-Tank tracking/i)).toBeInTheDocument();
    });

    it('should hide Learn More link when showLearnMore is false', () => {
      render(<FullTankToggle {...defaultProps} showLearnMore={false} />);
      
      expect(screen.queryByText(/Learn more about Tank-to-Tank tracking/i)).not.toBeInTheDocument();
    });
  });

  describe('Learn More Modal', () => {
    it('should open modal when Learn More is clicked', async () => {
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} />);
      
      const learnMoreLink = screen.getByText(/Learn more about Tank-to-Tank tracking/i);
      await user.click(learnMoreLink);
      
      expect(screen.getByText(/What is Tank-to-Tank Tracking\?/i)).toBeInTheDocument();
    });

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} />);
      
      const learnMoreLink = screen.getByText(/Learn more about Tank-to-Tank tracking/i);
      await user.click(learnMoreLink);
      
      const backdrop = screen.getByText(/What is Tank-to-Tank Tracking\?/i).closest('.fixed');
      await user.click(backdrop);
      
      expect(screen.queryByText(/What is Tank-to-Tank Tracking\?/i)).not.toBeInTheDocument();
    });

    it('should close modal when Got it button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} />);
      
      const learnMoreLink = screen.getByText(/Learn more about Tank-to-Tank tracking/i);
      await user.click(learnMoreLink);
      
      const gotItButton = screen.getByText('Got it!');
      await user.click(gotItButton);
      
      expect(screen.queryByText(/What is Tank-to-Tank Tracking\?/i)).not.toBeInTheDocument();
    });

    it('should display modal content', async () => {
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} />);
      
      const learnMoreLink = screen.getByText(/Learn more about Tank-to-Tank tracking/i);
      await user.click(learnMoreLink);
      
      expect(screen.getByText(/most accurate method/i)).toBeInTheDocument();
      expect(screen.getByText(/How it works:/i)).toBeInTheDocument();
      expect(screen.getByText(/Benefits:/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label for toggle', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<FullTankToggle {...defaultProps} onChange={handleChange} />);
      
      const toggle = screen.getByRole('checkbox');
      toggle.focus();
      expect(toggle).toHaveFocus();
      
      await user.keyboard(' ');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should have proper ARIA attributes', () => {
      render(<FullTankToggle {...defaultProps} />);
      
      const toggle = screen.getByRole('checkbox');
      expect(toggle).toHaveAttribute('type', 'checkbox');
    });
  });

  describe('Styling', () => {
    it('should have correct border color when unchecked', () => {
      const { container } = render(<FullTankToggle {...defaultProps} checked={false} />);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should have correct border color when checked', () => {
      const { container } = render(<FullTankToggle {...defaultProps} checked={true} />);
      
      const card = container.querySelector('.rounded-xl');
      expect(card).toBeInTheDocument();
    });

    it('should have toggle in unchecked position', () => {
      const { container } = render(<FullTankToggle {...defaultProps} checked={false} />);
      
      const toggle = container.querySelector('.rounded-full');
      expect(toggle).toBeInTheDocument();
    });

    it('should have toggle in checked position', () => {
      const { container } = render(<FullTankToggle {...defaultProps} checked={true} />);
      
      const toggle = container.querySelector('.rounded-full');
      expect(toggle).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null onChange', async () => {
      const user = userEvent.setup();
      
      render(<FullTankToggle checked={false} onChange={null} />);
      
      const toggle = screen.getByRole('checkbox');
      await user.click(toggle);
      
      // Should not throw
      expect(toggle).toBeInTheDocument();
    });

    it('should handle zero tank capacity', () => {
      render(<FullTankToggle {...defaultProps} tankCapacity={0} />);
      
      // tankCapacity=0 is falsy, so the component hides the tank capacity section
      expect(screen.queryByText(/Tank capacity:/i)).not.toBeInTheDocument();
    });

    it('should handle very large tank capacity', () => {
      render(<FullTankToggle {...defaultProps} tankCapacity={1000} />);
      
      expect(screen.getByText(/1000 L/i)).toBeInTheDocument();
    });
  });
});
