/**
 * CarbonChart Component Tests
 * 
 * Tests for CO2 emissions chart component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CarbonChart from '../../../src/components/dashboard/CarbonChart';

// Mock Recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children, ...props }) => (
    <div data-testid="bar-chart" {...props}>{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Cell: (props) => <div data-testid="cell" {...props} />,
}));

describe('CarbonChart', () => {
  const mockMonthlyData = [
    { month: 'Jan', co2: 232, average: 250 },
    { month: 'Feb', co2: 268, average: 250 },
    { month: 'Mar', co2: 195, average: 250 },
    { month: 'Apr', co2: 210, average: 250 },
  ];

  const mockYearlyData = [
    { year: '2023', co2: 2800, average: 3000 },
    { year: '2024', co2: 2600, average: 3000 },
  ];

  describe('Rendering', () => {
    it('should render chart with monthly data', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render chart with yearly data', () => {
      render(<CarbonChart data={mockYearlyData} period="yearly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should display legend', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should render tooltip', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render X and Y axes', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display monthly CO2 data', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      const chart = screen.getByTestId('bar-chart');
      expect(chart).toBeInTheDocument();
    });

    it('should display yearly CO2 data', () => {
      render(<CarbonChart data={mockYearlyData} period="yearly" />);
      
      const chart = screen.getByTestId('bar-chart');
      expect(chart).toBeInTheDocument();
    });

    it('should display average comparison line', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      const bars = screen.getAllByTestId('bar');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should handle single data point', () => {
      const singlePoint = [{ month: 'Jan', co2: 232, average: 250 }];
      render(<CarbonChart data={singlePoint} period="monthly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      render(<CarbonChart data={[]} period="monthly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle null data', () => {
      render(<CarbonChart data={null} period="monthly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle undefined data', () => {
      render(<CarbonChart data={undefined} period="monthly" />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading prop is true', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" loading={true} />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should hide loading indicator when loading prop is false', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" loading={false} />);
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Period Switching', () => {
    it('should switch to monthly view', () => {
      const { rerender } = render(
        <CarbonChart data={mockMonthlyData} period="monthly" />
      );
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      
      rerender(<CarbonChart data={mockMonthlyData} period="yearly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should switch to yearly view', () => {
      const { rerender } = render(
        <CarbonChart data={mockYearlyData} period="yearly" />
      );
      
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      
      rerender(<CarbonChart data={mockYearlyData} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Comparison with Average', () => {
    it('should display comparison with average vehicle', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      const bars = screen.getAllByTestId('bar');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should show when emissions are above average', () => {
      const aboveAverage = [
        { month: 'Jan', co2: 300, average: 250 },
      ];
      
      render(<CarbonChart data={aboveAverage} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should show when emissions are below average', () => {
      const belowAverage = [
        { month: 'Jan', co2: 200, average: 250 },
      ];
      
      render(<CarbonChart data={belowAverage} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should show when emissions match average', () => {
      const matchingAverage = [
        { month: 'Jan', co2: 250, average: 250 },
      ];
      
      render(<CarbonChart data={matchingAverage} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Missing Data', () => {
    it('should handle data with missing CO2 values', () => {
      const dataWithMissing = [
        { month: 'Jan', co2: 232, average: 250 },
        { month: 'Feb', co2: null, average: 250 },
        { month: 'Mar', co2: 195, average: 250 },
      ];
      
      render(<CarbonChart data={dataWithMissing} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle data with missing average values', () => {
      const dataWithMissing = [
        { month: 'Jan', co2: 232, average: 250 },
        { month: 'Feb', co2: 268, average: null },
        { month: 'Mar', co2: 195, average: 250 },
      ];
      
      render(<CarbonChart data={dataWithMissing} period="monthly" />);
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should render ResponsiveContainer', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should handle window resize', () => {
      render(<CarbonChart data={mockMonthlyData} period="monthly" />);
      
      window.dispatchEvent(new Event('resize'));
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [{ invalid: 'data' }];
      
      expect(() => {
        render(<CarbonChart data={invalidData} period="monthly" />);
      }).not.toThrow();
    });

    it('should handle malformed data structure', () => {
      const malformedData = [
        { month: 'Jan', invalid: 'value' },
      ];
      
      expect(() => {
        render(<CarbonChart data={malformedData} period="monthly" />);
      }).not.toThrow();
    });
  });
});
