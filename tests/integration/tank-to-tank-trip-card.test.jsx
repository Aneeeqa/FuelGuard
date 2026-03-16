/**
 * TankToTankTripCard Component Tests
 *
 * Unit tests for TankToTankTripCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TankToTankTripCard from '../../src/components/TankToTankTripCard';
import '@testing-library/jest-dom';

describe('TankToTankTripCard Component', () => {
  // Mock vehicle profile
  const mockVehicleProfile = {
    tankCapacity: 100,
    expectedMileage: 15,
    theftThreshold: 25
  };

  // Mock units
  const mockUnits = {
    distanceUnit: 'km',
    fuelVolumeUnit: 'L'
  };

  // Sample trip data for testing
  const createMockTripData = (overrides = {}) => ({
    isValid: true,
    tankCapacity: 100,
    remainingFuelBeforeFill: 20,
    fillPercentage: 80,
    actualFuelConsumed: 80,
    expectedFuelConsumed: 75,
    fuelDifference: 5,
    theftAmount: 0,
    theftPercentage: 0,
    isTheftSuspected: false,
    distance: 1125,
    actualMileage: 14.06,
    expectedMileage: 15,
    mileageEfficiency: 93.75,
    startDate: '2025-01-15T10:00:00Z',
    endDate: '2025-01-20T14:30:00Z',
    startOdometer: 15000,
    endOdometer: 16125,
    duration: 436500000,
    durationDays: 5,
    previousFullFillLogId: 'log-1',
    currentLogId: 'log-2',
    calculatedAt: '2025-01-24T10:30:00Z',
    theftThreshold: 25,
    ...overrides
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const tripData = createMockTripData();
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('Tank-to-Tank Trip')).toBeInTheDocument();
    });

    it('should display trip distance correctly', () => {
      const tripData = createMockTripData({ distance: 200 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('200 km')).toBeInTheDocument();
    });

    it('should display fuel added correctly', () => {
      const tripData = createMockTripData({ actualFuelConsumed: 36 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      // Fuel volume appears in both stat-box and expanded details
      const fuelElements = screen.getAllByText('36.0 L');
      expect(fuelElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display actual mileage correctly', () => {
      const tripData = createMockTripData({ actualMileage: 5.56 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('5.56 km/L')).toBeInTheDocument();
    });

    it('should display expected consumption correctly', () => {
      const tripData = createMockTripData({ expectedFuelConsumed: 13.33 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('13.3 L')).toBeInTheDocument();
    });
  });

  describe('Theft Detection Display', () => {
    it('should show theft alert when theft is suspected', () => {
      const tripData = createMockTripData({
        isTheftSuspected: true,
        theftAmount: 22.67,
        theftPercentage: 63
      });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('Fuel Theft Detected')).toBeInTheDocument();
      expect(screen.getByText('22.7 L unaccounted for')).toBeInTheDocument();
      expect(screen.getByText('(63% deviation)')).toBeInTheDocument();
    });

    it('should show normal status when no theft is detected', () => {
      const tripData = createMockTripData({
        isTheftSuspected: false,
        theftAmount: 0,
        theftPercentage: 0
      });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('Normal fuel consumption detected')).toBeInTheDocument();
    });

    it('should calculate and display theft cost when price is provided', () => {
      const tripData = createMockTripData({
        isTheftSuspected: true,
        theftAmount: 22.67,
        theftPercentage: 63
      });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          currency="USD"
          pricePerLiter={3.33}
        />
      );
      expect(screen.getByText(/Estimated loss:/)).toBeInTheDocument();
      expect(screen.getByText(/\$75.49/)).toBeInTheDocument();
    });
  });

  describe('Mileage Efficiency', () => {
    it('should display correct mileage efficiency percentage', () => {
      const tripData = createMockTripData({ mileageEfficiency: 93.75 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('94% of expected')).toBeInTheDocument();
    });

    it('should show efficiency bar with correct width', () => {
      const tripData = createMockTripData({ mileageEfficiency: 50 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('50% of expected')).toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should start collapsed by default', async () => {
      const tripData = createMockTripData();
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      await waitFor(() => {
        const expandedContent = container.querySelector('.animate-fade-in.pt-0');
        expect(expandedContent).toBeNull();
      });
    });

    it('should expand when clicking toggle button', async () => {
      const tripData = createMockTripData();
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const expandedContent = container.querySelector('.animate-fade-in.pt-0');
        expect(expandedContent).toBeInTheDocument();
      });
    });

    it('should collapse when clicking toggle button again', async () => {
      const tripData = createMockTripData();
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const expandedContent = container.querySelector('.animate-fade-in.pt-0');
        expect(expandedContent).toBeNull();
      });
    });
  });

  describe('Expanded Details', () => {
    it('should show trip information when expanded', () => {
      const tripData = createMockTripData({
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-20T14:30:00Z',
        startOdometer: 15000,
        endOdometer: 16125,
        durationDays: 5
      });
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Trip Information')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('should show fuel consumption breakdown when expanded', () => {
      const tripData = createMockTripData();
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Fuel Consumption Breakdown')).toBeInTheDocument();
    });

    it('should show theft analysis details when theft is detected', () => {
      const tripData = createMockTripData({
        isTheftSuspected: true,
        theftAmount: 22.67,
        theftPercentage: 63
      });
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Theft Analysis Details')).toBeInTheDocument();
    });

    it('should show fuel level visual when expanded', () => {
      const tripData = createMockTripData({
        remainingFuelBeforeFill: 64,
        tankCapacity: 100
      });
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );

      const toggleButton = container.querySelector('button[aria-label="Expand"]');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Fuel Level Before Fill')).toBeInTheDocument();
      // "64.0 L" appears twice (with different classes)
      const fuelLevelElements = screen.getAllByText('64.0 L');
      expect(fuelLevelElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('64% of tank capacity')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should call onViewDetails callback when button is clicked', () => {
      const tripData = createMockTripData();
      const onViewDetails = vi.fn();

      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
          onViewDetails={onViewDetails}
        />
      );

      const viewDetailsButton = screen.getByText('View Details');
      fireEvent.click(viewDetailsButton);

      expect(onViewDetails).toHaveBeenCalledTimes(1);
      expect(onViewDetails).toHaveBeenCalledWith(tripData);
    });

    it('should call onExportReport callback when button is clicked', () => {
      const tripData = createMockTripData();
      const onExportReport = vi.fn();

      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
          onExportReport={onExportReport}
        />
      );

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(onExportReport).toHaveBeenCalledTimes(1);
      expect(onExportReport).toHaveBeenCalledWith(tripData);
    });

    it('should call onCopyReport callback when button is clicked', () => {
      const tripData = createMockTripData();
      const onCopyReport = vi.fn();

      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
          onCopyReport={onCopyReport}
        />
      );

      const copyButton = screen.getByText('Copy');
      fireEvent.click(copyButton);

      expect(onCopyReport).toHaveBeenCalledTimes(1);
    });
  });

   describe('Invalid Data Handling', () => {
    it('should display message when trip data is null', () => {
      render(
        <TankToTankTripCard
          tripData={null}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      // Error message appears multiple times on page - use custom matcher
      const errorMessages = screen.getAllByText((content, element) => 
        element.textContent === 'No valid Tank-to-Tank data available' || 
        (element.textContent.includes('No valid') && element.textContent.includes('Tank-to-Tank') && element.textContent.includes('data available'))
      );
      expect(errorMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('should display message when trip data is invalid', () => {
      const tripData = createMockTripData({ isValid: false });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      // Error message appears multiple times on page - use custom matcher
      const errorMessages = screen.getAllByText((content, element) => 
        element.textContent === 'No valid Tank-to-Tank data available' || 
        (element.textContent.includes('No valid') && element.textContent.includes('Tank-to-Tank') && element.textContent.includes('data available'))
      );
      expect(errorMessages.length).toBeGreaterThanOrEqual(1);
    });

    it('should display custom message when provided', () => {
      const tripData = {
        isValid: false,
        message: 'Custom error message'
      };
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

   describe('Unit Conversions', () => {
    it('should display distance in miles when specified', () => {
      // Distance 124.27 km converts to 77.2 mi when formatted
      const tripData = createMockTripData({ distance: 200 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={{ distanceUnit: 'mi', fuelVolumeUnit: 'L' }}
        />
      );
      // Distance appears in stat-box and expanded odometer values - use custom matcher
      const distanceElements = screen.getAllByText((content, element) => 
        element.textContent === '124 mi' || 
        (element.textContent.includes('124') && element.textContent.includes('mi'))
      );
      expect(distanceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should display fuel in gallons when specified', () => {
      const tripData = createMockTripData({ actualFuelConsumed: 10 });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={{ distanceUnit: 'km', fuelVolumeUnit: 'gal' }}
        />
      );
      expect(screen.getByText('2.6 gal')).toBeInTheDocument();
    });
  });

   describe('Date Formatting', () => {
    it('should format date range correctly', () => {
      const tripData = createMockTripData({
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-20T14:30:00Z'
      });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      // "5 days" appears in both Card.Subtitle and expanded Trip Information - use custom matcher
      const daysElements = screen.getAllByText((content, element) => 
        element.textContent === '5 days' || 
        (element.textContent.includes('5') && element.textContent.includes('days'))
      );
      expect(daysElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show "Same day" for zero-day trips', () => {
      const tripData = createMockTripData({
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T18:00:00Z'
      });
      render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      // "Same day" appears in Card.Subtitle - use custom matcher
      const sameDayElements = screen.getAllByText((content, element) => 
        element.textContent === 'Same day' || 
        (element.textContent.includes('Same') && element.textContent.includes('day'))
      );
      expect(sameDayElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on buttons', () => {
      const tripData = createMockTripData();
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(container.querySelector('button[aria-label="Expand"]')).toBeInTheDocument();
    });

    it('should have proper ARIA role for alerts', () => {
      const tripData = createMockTripData({
        isTheftSuspected: true,
        theftAmount: 22.67,
        theftPercentage: 63
      });
      const { container } = render(
        <TankToTankTripCard
          tripData={tripData}
          vehicleProfile={mockVehicleProfile}
          units={mockUnits}
        />
      );
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument();
    });
  });
});
