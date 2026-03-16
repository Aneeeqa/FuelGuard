/**
 * GaugeReadingSelector Component Tests
 * 
 * Tests for gauge reading selector component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GaugeReadingSelector from '../../src/components/GaugeReadingSelector';

// Mock icons and utils
vi.mock('lucide-react', () => ({
  Gauge: ({ size, className }) => <span data-testid="gauge-icon" style={{ fontSize: size }} className={className}>Gauge</span>,
}));

vi.mock('../../src/utils/tankToTankCalculations', () => ({
  estimateFuelLevelFromGauge: vi.fn((gauge, tankCapacity) => {
    const percentMap = { 'Full': 100, '3/4': 75, '1/2': 50, '1/4': 25, 'Empty': 5 };
    const pct = percentMap[gauge] || 0;
    return {
      fuelLevel: (tankCapacity * pct / 100) || 0,
      confidence: 'medium'
    };
  }),
}));

describe('GaugeReadingSelector', () => {
  const defaultProps = {
    value: 75,
    onChange: vi.fn(),
    tankCapacity: 50,
    units: 'L',
  };

  describe('Rendering', () => {
    it('should render gauge options', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      expect(screen.getByText('Full')).toBeInTheDocument();
      expect(screen.getByText('3/4')).toBeInTheDocument();
      expect(screen.getByText('1/2')).toBeInTheDocument();
      expect(screen.getByText('1/4')).toBeInTheDocument();
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should render gauge icons', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      expect(screen.getByTestId('gauge-icon')).toBeInTheDocument();
    });

    it('should render label', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      expect(screen.getByText(/What did your fuel gauge show\?/i)).toBeInTheDocument();
    });

    it('should render manual percentage input', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      expect(input).toBeInTheDocument();
    });

    it('should display selected value', () => {
      render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  describe('Gauge Selection', () => {
    it('should select Full (100%)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const fullButton = screen.getByText('Full').closest('button');
      await user.click(fullButton);
      
      expect(handleChange).toHaveBeenCalledWith(100);
    });

    it('should select 3/4 (75%)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const threeQuarterButton = screen.getByText('3/4').closest('button');
      await user.click(threeQuarterButton);
      
      expect(handleChange).toHaveBeenCalledWith(75);
    });

    it('should select 1/2 (50%)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const halfButton = screen.getByText('1/2').closest('button');
      await user.click(halfButton);
      
      expect(handleChange).toHaveBeenCalledWith(50);
    });

    it('should select 1/4 (25%)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const quarterButton = screen.getByText('1/4').closest('button');
      await user.click(quarterButton);
      
      expect(handleChange).toHaveBeenCalledWith(25);
    });

    it('should select Empty (5%)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const emptyButton = screen.getByText('Empty').closest('button');
      await user.click(emptyButton);
      
      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('should highlight selected gauge', () => {
      render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      const threeQuarterButton = screen.getByText('3/4').closest('button');
      expect(threeQuarterButton).toHaveStyle({
        backgroundColor: expect.any(String)
      });
    });
  });

  describe('Manual Input', () => {
    it('should handle manual percentage input', async () => {
      const handleChange = vi.fn();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      fireEvent.change(input, { target: { value: '60' } });
      
      expect(handleChange).toHaveBeenCalledWith(60);
    });

    it('should validate gauge range (0-100)', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      await user.clear(input);
      await user.type(input, '150');
      
      // Should not call onChange for invalid values
      expect(handleChange).not.toHaveBeenCalledWith(150);
    });

    it('should handle decimal values', async () => {
      const handleChange = vi.fn();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      fireEvent.change(input, { target: { value: '37.5' } });
      
      expect(handleChange).toHaveBeenCalledWith(37.5);
    });

    it('should handle zero value', async () => {
      const handleChange = vi.fn();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      fireEvent.change(input, { target: { value: '0' } });
      
      expect(handleChange).toHaveBeenCalledWith(0);
    });
  });

  describe('Estimated Fuel Level', () => {
    it('should display estimated fuel level', () => {
      render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      expect(screen.getByText(/Estimated:/i)).toBeInTheDocument();
    });

    it('should calculate fuel level based on tank capacity', () => {
      render(<GaugeReadingSelector {...defaultProps} value={50} tankCapacity={100} />);
      
      expect(screen.getByText(/50\.0 L/)).toBeInTheDocument();
    });

    it('should display units correctly', () => {
      render(<GaugeReadingSelector {...defaultProps} value={50} tankCapacity={100} units="gal" />);
      
      expect(screen.getByText(/50\.0 gal/)).toBeInTheDocument();
    });

    it('should hide estimated fuel level when value is 0', () => {
      render(<GaugeReadingSelector {...defaultProps} value={0} />);
      
      expect(screen.queryByText(/Estimated:/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation Warning', () => {
    it('should show warning when fuel level is low (< 10%)', () => {
      render(<GaugeReadingSelector {...defaultProps} value={5} />);
      
      expect(screen.getByText(/Low fuel level:/i)).toBeInTheDocument();
    });

    it('should not show warning when fuel level is normal (>= 10%)', () => {
      render(<GaugeReadingSelector {...defaultProps} value={50} />);
      
      expect(screen.queryByText(/Low fuel level:/i)).not.toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(<GaugeReadingSelector {...defaultProps} value={5} />);
      
      expect(screen.getByText(/5% indicates you were almost out of fuel/i)).toBeInTheDocument();
    });
  });

  describe('Custom Input Toggle', () => {
    it('should show manual input when allowManual is true', () => {
      render(<GaugeReadingSelector {...defaultProps} allowManual={true} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      expect(input).toBeInTheDocument();
    });

    it('should hide manual input when allowManual is false', () => {
      render(<GaugeReadingSelector {...defaultProps} allowManual={false} />);
      
      expect(screen.queryByLabelText(/Manual fuel percentage/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      const fullButton = screen.getByText('Full').closest('button');
      expect(fullButton).toHaveAttribute('aria-label', 'Select Full (100%)');
      expect(fullButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should have aria-pressed for selected gauge', () => {
      render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      const threeQuarterButton = screen.getByText('3/4').closest('button');
      expect(threeQuarterButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should have proper ARIA label for manual input', () => {
      render(<GaugeReadingSelector {...defaultProps} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null onChange', async () => {
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={null} />);
      
      const button = screen.getByText('Full').closest('button');
      await user.click(button);
      
      // Should not throw
      expect(button).toBeInTheDocument();
    });

    it('should handle negative values', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      
      render(<GaugeReadingSelector {...defaultProps} onChange={handleChange} />);
      
      const input = screen.getByLabelText(/Manual fuel percentage/i);
      await user.clear(input);
      await user.type(input, '-10');
      
      expect(handleChange).not.toHaveBeenCalledWith(-10);
    });

    it('should handle very large tank capacity', () => {
      render(<GaugeReadingSelector {...defaultProps} tankCapacity={1000} value={50} />);
      
      expect(screen.getByText(/500\.0 L/)).toBeInTheDocument();
    });

    it('should handle zero tank capacity', () => {
      render(<GaugeReadingSelector {...defaultProps} tankCapacity={0} value={50} />);
      
      expect(screen.getByText(/0\.0 L/)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply selected styles', () => {
      const { container } = render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      const threeQuarterButton = screen.getByText('3/4').closest('button');
      expect(threeQuarterButton).toBeInTheDocument();
    });

    it('should apply unselected styles', () => {
      const { container } = render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      const halfButton = screen.getByText('1/2').closest('button');
      expect(halfButton).toBeInTheDocument();
    });

    it('should have checkmark on selected gauge', () => {
      render(<GaugeReadingSelector {...defaultProps} value={75} />);
      
      const threeQuarterButton = screen.getByText('3/4').closest('button');
      expect(threeQuarterButton.querySelector('.text-xs')).toBeInTheDocument();
    });
  });
});
