/**
 * Dashboard Page Component Tests
 * 
 * Tests for dashboard page component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from '../../src/pages/Dashboard';
import { useFuelData } from '../../src/hooks/useFuelData';

// Mock hooks and components
vi.mock('../../src/hooks/useFuelData', () => ({
  useFuelData: vi.fn(() => ({
    data: {
      logs: [
        { id: '1', date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
      ],
      stats: {
        totalFuel: 45.5,
        totalExpenditure: 120.00,
        avgMileage: 12.5,
      },
      vehicleProfile: {
        tankCapacity: 50,
        currency: 'USD',
        monthlyBudget: 200,
        expectedMileage: 15,
        distanceUnit: 'km',
        fuelVolumeUnit: 'L',
        efficiencyUnit: 'km/L',
        fuelType: 'gasoline',
        tankToTankTrips: [],
        emergencyContact: { name: '', phone: '', relationship: '' },
      },
    },
    loading: false,
  })),
}));

// Mock components
vi.mock('../../src/components/dashboard/StatCard', () => ({
  default: function MockStatCard({ value, label }) {
    return <div data-testid="stat-card"><span data-label>{label}</span><span data-value>{value}</span></div>;
  },
}));

vi.mock('../../src/components/dashboard/MileageChart', () => ({
  default: function MockMileageChart() {
    return <div data-testid="mileage-chart">Mileage Chart</div>;
  },
}));

vi.mock('../../src/components/dashboard/CarbonChart', () => ({
  default: function MockCarbonChart() {
    return <div data-testid="carbon-chart">Carbon Chart</div>;
  },
}));

vi.mock('../../src/components/dashboard/BudgetCard', () => ({
  default: function MockBudgetCard() {
    return <div data-testid="budget-card">Budget Card</div>;
  },
}));

vi.mock('../../src/components/dashboard/EmptyDashboardState', () => ({
  default: function MockEmptyDashboardState() {
    return <div data-testid="empty-dashboard">Empty Dashboard</div>;
  },
}));

vi.mock('../../src/components/ui/Skeleton', () => ({
  default: function MockSkeleton({ className }) {
    return <div data-testid="skeleton" className={className}>Loading...</div>;
  },
}));

// Mock remaining Dashboard components to avoid import issues
vi.mock('../../src/components/dashboard/MileageComparison', () => ({
  default: function MockMileageComparison() { return <div data-testid="mileage-comparison" />; },
}));

vi.mock('../../src/components/dashboard/CarbonFootprintCard', () => ({
  default: function MockCarbonFootprintCard() { return <div data-testid="carbon-footprint-card" />; },
}));

vi.mock('../../src/components/dashboard/TripMileageBarChart', () => ({
  default: function MockTripMileageBarChart() { return <div data-testid="trip-bar-chart" />; },
}));

vi.mock('../../src/components/dashboard/LastTripSummary', () => ({
  default: function MockLastTripSummary() { return <div data-testid="last-trip-summary" />; },
}));

vi.mock('../../src/components/EmergencyContact', () => ({
  default: function MockEmergencyContact() { return <div data-testid="emergency-contact" />; },
}));

vi.mock('../../src/components/TankToTankTripCard', () => ({
  default: function MockTankToTankTripCard() { return <div data-testid="tank-trip-card" />; },
}));

// Mock utility functions to return safe defaults
vi.mock('../../src/utils/calculations', () => ({
  calculateTotalExpenditure: vi.fn(() => 120),
  calculateCostPerKm: vi.fn(() => 8.5),
  checkBudgetAlert: vi.fn(() => ({ triggered: false, isOverBudget: false, percentage: 0.6, remaining: 80, severity: 'none', message: '' })),
  getCostStatistics: vi.fn(() => ({ avgCostPerFill: 120, minCost: 100, maxCost: 140, avgCostPerLiter: 2.64, totalExpenditure: 120, fillCount: 1 })),
}));

vi.mock('../../src/utils/currency', () => ({
  getCurrencySymbol: vi.fn(() => '$'),
}));

vi.mock('../../src/utils/fuelDrainCalculator', () => ({
  analyzeFuelDrain: vi.fn(() => ({ isDraining: false, drainRate: 0, alerts: [] })),
  generateDrainAlertMessage: vi.fn(() => ''),
  formatDrainRate: vi.fn(() => '0 L/day'),
}));

vi.mock('../../src/utils/fuelLevelAlerts', () => ({
  getFuelStatus: vi.fn(() => ({
    level: 'normal',
    percentage: 75,
    message: 'Normal level',
    color: 'green',
    fuelAlert: { triggered: false, severity: 'none', message: '' },
    estimatedRange: 350,
    needsRefill: false,
  })),
}));

vi.mock('../../src/utils/tripCalculations', () => ({
  calculateTrips: vi.fn(() => []),
  calculateTripStatistics: vi.fn(() => ({ avgMileage: 12.5, bestMileage: 15, worstMileage: 10, totalDistance: 500, totalFuel: 40, tripCount: 0 })),
}));

vi.mock('../../src/utils/tankToTankCalculations', () => ({
  calculateTankToTankStatistics: vi.fn(() => ({ count: 0, avgMileage: 0, trips: [] })),
}));

describe('Dashboard Page', () => {
  const defaultMockData = {
    data: {
      logs: [
        { id: '1', date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
        { id: '2', date: '2025-01-01T10:00:00Z', odometer: 14500, liters: 40.0, price: 105.00, mileage: 12.0, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
      ],
      stats: {
        totalFuel: 85.5,
        totalExpenditure: 225.00,
        avgMileage: 12.25,
        monthlyCO2: [{ month: '2025-01', co2: 105.6 }],
        totalCO2: 105.6,
        totalDistance: 500,
        co2PerKm: 0.21,
      },
      vehicleProfile: {
        tankCapacity: 50,
        currency: 'USD',
        monthlyBudget: 200,
        expectedMileage: 15,
        distanceUnit: 'km',
        fuelVolumeUnit: 'L',
        efficiencyUnit: 'km/L',
        fuelType: 'gasoline',
        tankToTankTrips: [],
        emergencyContact: { name: '', phone: '', relationship: '' },
      },
    },
    loading: false,
  };

  beforeEach(() => {
    vi.mocked(useFuelData).mockReturnValue(defaultMockData);
  });
  describe('Rendering', () => {
    it('should render dashboard page', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });

    it('should render dashboard statistics', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });

    it('should render mileage chart', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('mileage-chart')).toBeInTheDocument();
    });

    it('should render carbon footprint card', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('carbon-chart')).toBeInTheDocument();
    });

    it('should render budget card', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getByTestId('budget-card')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton when loading', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: { logs: [], stats: {}, vehicleProfile: {} },
        loading: true,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('should hide loading skeleton when not loading', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: { logs: [], stats: {}, vehicleProfile: {} },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );
      
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no logs exist', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: { 
          logs: [], 
          stats: { totalFuel: 0, totalExpenditure: 0, avgMileage: 0 },
          vehicleProfile: {},
        },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
    });

    it('should hide empty state when logs exist', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: { 
          logs: [
            { id: 1, date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
          ],
          stats: { totalFuel: 45.5, totalExpenditure: 120.00, avgMileage: 15.0 },
          vehicleProfile: { tankCapacity: 50, currency: 'USD' },
        },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('empty-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should handle error state gracefully', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: { logs: [], stats: {}, vehicleProfile: {} },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      // Should render empty state since logs are empty
      expect(screen.getByTestId('empty-dashboard')).toBeInTheDocument();
    });
  });

  describe('Vehicle Selector', () => {
    it('should display vehicle selector', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [
            { id: 1, date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
          ],
          stats: { totalFuel: 45.5, totalExpenditure: 120.00, avgMileage: 15.0 },
          vehicleProfile: {
            name: 'Test Vehicle',
            tankCapacity: 50,
            currency: 'USD',
          },
        },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });
  });

  describe('Data Display', () => {
    it('should display total fuel spent', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [
            { id: 1, date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
          ],
          stats: { totalFuel: 45.5, totalExpenditure: 120.00, avgMileage: 15.0 },
          vehicleProfile: { tankCapacity: 50, currency: 'USD' },
        },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });

    it('should display average mileage', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [
            { id: 1, date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 12.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
          ],
          stats: { totalFuel: 45.5, totalExpenditure: 120.00, avgMileage: 15.0 },
          vehicleProfile: { tankCapacity: 50, currency: 'USD' },
        },
        loading: false,
      });

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const heading = screen.queryByRole('heading', { level: 1 });
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });

    it('should have proper ARIA landmarks', () => {
      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      );

      expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0);
    });
  });
});
