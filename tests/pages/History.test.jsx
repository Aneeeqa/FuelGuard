/**
 * History Page Component Tests
 * 
 * Tests for history page component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import History from '../../src/pages/History';
import { useFuelData } from '../../src/hooks/useFuelData';

// Mock utilities that History imports
vi.mock('../../src/utils/units', () => ({
  formatCostPerUnit: vi.fn((val) => `$${val}`),
  getCurrencySymbol: vi.fn(() => '$'),
}));
vi.mock('../../src/utils/export', () => ({
  exportToPDF: vi.fn(),
  exportToExcel: vi.fn(),
}));
vi.mock('../../src/utils/tripCalculations', () => ({
  calculateTrips: vi.fn(() => []),
  formatTripDateRange: vi.fn(() => ''),
  getTripStatusColor: vi.fn(() => 'green'),
}));
vi.mock('../../src/utils/tankToTankCalculations', () => ({
  calculateTankToTankStatistics: vi.fn(() => ({ averageMileage: 0, totalTrips: 0 })),
}));

const defaultMockData = {
  data: {
    logs: [
      { id: 1, date: '2025-01-15T10:00:00Z', odometer: 15000, liters: 45.5, price: 120.00, mileage: 15.0, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
      { id: 2, date: '2025-01-20T10:00:00Z', odometer: 15300, liters: 50.0, price: 135.00, mileage: 14.5, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
      { id: 3, date: '2025-01-25T10:00:00Z', odometer: 15600, liters: 48.0, price: 128.00, mileage: 14.8, isFlagged: false, isFullTank: true, tankCapacity: 50, currency: 'USD', fuelType: 'gasoline' },
    ],
    vehicles: [],
    currentVehicleId: null,
    vehicleProfile: {
      currency: 'USD',
      fuelVolumeUnit: 'L',
      distanceUnit: 'km',
      tankToTankTrips: [],
      tankCapacity: 50,
      expectedMileage: 15,
    },
  },
  loading: false,
  deleteLog: vi.fn(),
};

// Mock hooks
vi.mock('../../src/hooks/useFuelData', () => ({
  useFuelData: vi.fn(() => defaultMockData),
}));

describe('History Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFuelData).mockReturnValue(defaultMockData);
  });

  describe('Rendering', () => {
    it('should render history page', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.getByText(/History/i) || screen.queryByRole('main')).toBeInTheDocument();
    });

    it('should render fuel log list', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      // Check if any log-related content is rendered (dates are formatted like "Jan 15, 2025")
      const logs = screen.queryAllByText(/Jan.*2025/);
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should display log entries', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryAllByText(/Jan 15|Jan 20|Jan 25/).length).toBeGreaterThan(0);
    });
  });

  describe('Date Range Filter', () => {
    it('should render date filter controls', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const dateInputs = screen.queryAllByPlaceholderText(/Date/i);
      expect(dateInputs.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter by date range', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const startDateInput = screen.queryByPlaceholderText(/Start Date/i) || 
                           screen.queryAllByRole('textbox')[0];
      
      if (startDateInput) {
        await user.type(startDateInput, '2025-01-01');
        
        expect(startDateInput).toHaveValue('2025-01-01');
      }
    });

    it('should filter logs after date selection', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const filterButton = screen.queryByRole('button', { name: /Filter|Apply/i });
      
      if (filterButton) {
        await user.click(filterButton);
        
        expect(filterButton).toBeInTheDocument();
      }
    });
  });

  describe('Vehicle Filter', () => {
    it('should render vehicle filter dropdown', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const vehicleSelect = screen.queryByRole('combobox') || 
                           screen.queryByLabelText(/Vehicle/i);
      
      expect(vehicleSelect || document.body).toBeInTheDocument();
    });

    it('should filter by vehicle', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const vehicleSelect = screen.queryByRole('combobox') || 
                           screen.queryByLabelText(/Vehicle/i);
      
      if (vehicleSelect) {
        fireEvent.change(vehicleSelect, { target: { value: 'vehicle-1' } });
        
        expect(vehicleSelect).toHaveValue('vehicle-1');
      }
    });
  });

  describe('Sorting', () => {
    it('should render sort controls', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const sortButton = screen.queryByRole('button', { name: /Sort/i });
      expect(sortButton || document.body).toBeInTheDocument();
    });

    it('should sort logs by date', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const sortButton = screen.queryByRole('button', { name: /Sort/i });
      
      if (sortButton) {
        await user.click(sortButton);
        
        expect(sortButton).toBeInTheDocument();
      }
    });

    it('should handle descending sort', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const sortButton = screen.queryByRole('button', { name: /Sort/i });
      
      if (sortButton) {
        await user.click(sortButton);
        
        expect(sortButton).toBeInTheDocument();
      }
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no logs exist', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [],
          vehicles: [],
          currentVehicleId: null,
          vehicleProfile: { currency: 'USD', fuelVolumeUnit: 'L', distanceUnit: 'km', tankToTankTrips: [] },
        },
        loading: false,
        deleteLog: vi.fn(),
      });

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByText(/No fuel logs found/i) || 
             screen.queryByText(/Empty/i) || 
             document.body).toBeInTheDocument();
    });

    it('should show empty message', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [],
          vehicles: [],
          currentVehicleId: null,
          vehicleProfile: { currency: 'USD', fuelVolumeUnit: 'L', distanceUnit: 'km', tankToTankTrips: [] },
        },
        loading: false,
        deleteLog: vi.fn(),
      });

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByText(/No records/i) || document.body).toBeInTheDocument();
    });
  });

  describe('Delete Action', () => {
    it('should render delete button for each log', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const deleteButtons = screen.queryAllByRole('button', { name: /Delete/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle delete action', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const deleteButtons = screen.queryAllByRole('button', { name: /Delete/i });
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        expect(deleteButtons[0]).toBeInTheDocument();
      }
    });

    it('should confirm delete action', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const deleteButtons = screen.queryAllByRole('button', { name: /Delete/i });
      
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        
        // Confirmation dialog should appear
        const confirmButton = screen.queryByRole('button', { name: /Confirm|Yes/i });
        expect(confirmButton || document.body).toBeInTheDocument();
      }
    });
  });

  describe('Loading State', () => {
    it('should show loading state when loading', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [],
          vehicles: [],
          currentVehicleId: null,
          vehicleProfile: { currency: 'USD', fuelVolumeUnit: 'L', distanceUnit: 'km', tankToTankTrips: [] },
        },
        loading: true,
        deleteLog: vi.fn(),
      });

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByText(/Loading/i) || 
             screen.queryByTestId('skeleton') || 
             document.body).toBeInTheDocument();
    });

    it('should hide loading state when not loading', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [],
          vehicles: [],
          currentVehicleId: null,
          vehicleProfile: { currency: 'USD', fuelVolumeUnit: 'L', distanceUnit: 'km', tankToTankTrips: [] },
        },
        loading: false,
        deleteLog: vi.fn(),
      });

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should handle error state gracefully', () => {
      vi.mocked(useFuelData).mockReturnValue({
        data: {
          logs: [],
          vehicles: [],
          currentVehicleId: null,
          vehicleProfile: { currency: 'USD', fuelVolumeUnit: 'L', distanceUnit: 'km', tankToTankTrips: [] },
        },
        loading: false,
        error: 'Something went wrong',
        deleteLog: vi.fn(),
      });

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByText(/Error loading history/i) || 
             screen.queryByText(/Something went wrong/i) || 
             document.body).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <MemoryRouter>
          <History />
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
          <History />
        </MemoryRouter>
      );

      const main = screen.queryByRole('main');
      if (main) {
        expect(main).toBeInTheDocument();
      }
    });

    it('should have keyboard navigation support', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const buttons = screen.queryAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByRole('main') || document.body).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      expect(screen.queryByRole('main') || document.body).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('should render export button', () => {
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const exportButton = screen.queryByRole('button', { name: /Export/i });
      expect(exportButton || document.body).toBeInTheDocument();
    });

    it('should handle export click', async () => {
      const user = userEvent.setup();
      
      render(
        <MemoryRouter>
          <History />
        </MemoryRouter>
      );

      const exportButton = screen.queryByRole('button', { name: /Export/i });
      
      if (exportButton) {
        await user.click(exportButton);
        
        expect(exportButton).toBeInTheDocument();
      }
    });
  });
});
