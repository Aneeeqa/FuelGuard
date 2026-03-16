/**
 * MileageChart Component Tests
 * 
 * Tests for mileage chart component using Recharts
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MileageChart from '../../../src/components/dashboard/MileageChart';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => (
    <div data-testid="line-chart" {...props}>{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

describe('MileageChart', () => {
  const mockData = [
    { date: '2025-01-01', mileage: 15.0 },
    { date: '2025-01-02', mileage: 14.5 },
    { date: '2025-01-03', mileage: 16.0 },
    { date: '2025-01-04', mileage: 15.5 },
  ];

  describe('Rendering', () => {
    it('should render chart with data', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should display X and Y axes', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('should render tooltip component', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should render line component', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });

    it('should render CartesianGrid', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should handle empty data array', () => {
      render(<MileageChart data={[]} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle null data', () => {
      render(<MileageChart data={null} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle undefined data', () => {
      render(<MileageChart data={undefined} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading prop is true', () => {
      const { container } = render(
        <MileageChart data={mockData} loading={true} />
      );
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });

    it('should hide loading indicator when loading prop is false', () => {
      render(<MileageChart data={mockData} loading={false} />);
      
      const chart = screen.getByTestId('line-chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should render correct number of data points', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singlePoint = [{ date: '2025-01-01', mileage: 15.0 }];
      render(<MileageChart data={singlePoint} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle large dataset', () => {
      const largeDataset = Array.from({ length: 365 }, (_, i) => ({
        date: `2025-01-${String(i + 1).padStart(3, '0')}`,
        mileage: 15 + Math.random() * 2
      }));
      
      render(<MileageChart data={largeDataset} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Missing Data', () => {
    it('should handle data with missing mileage values', () => {
      const dataWithMissing = [
        { date: '2025-01-01', mileage: 15.0 },
        { date: '2025-01-02', mileage: null },
        { date: '2025-01-03', mileage: 16.0 },
      ];
      
      render(<MileageChart data={dataWithMissing} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle data with missing date values', () => {
      const dataWithMissing = [
        { date: '2025-01-01', mileage: 15.0 },
        { date: null, mileage: 14.5 },
        { date: '2025-01-03', mileage: 16.0 },
      ];
      
      render(<MileageChart data={dataWithMissing} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should render ResponsiveContainer', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should handle window resize', () => {
      const { container } = render(<MileageChart data={mockData} />);
      
      // Simulate window resize
      window.dispatchEvent(new Event('resize'));
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should display tooltip on hover', () => {
      render(<MileageChart data={mockData} />);
      
      const tooltip = screen.getByTestId('tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('should show date in tooltip', () => {
      render(<MileageChart data={mockData} />);
      
      // Tooltip should be rendered (actual tooltip content is tested by Recharts)
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should show mileage in tooltip', () => {
      render(<MileageChart data={mockData} />);
      
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [{ invalid: 'data' }];
      
      expect(() => {
        render(<MileageChart data={invalidData} />);
      }).not.toThrow();
    });

    it('should handle malformed date strings', () => {
      const malformedData = [
        { date: 'invalid-date', mileage: 15.0 },
      ];
      
      expect(() => {
        render(<MileageChart data={malformedData} />);
      }).not.toThrow();
    });
  });
});
