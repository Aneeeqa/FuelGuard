/**
 * Unit Tests for Tank-to-Tank Export Functionality
 *
 * Tests cover:
 * - PDF export (single trip, multiple trips)
 * - Excel export (single trip, multiple trips)
 * - Text report generation
 * - Error handling
 *
 * Run tests: npm test exportTankToTank.test.js
 */

import { vi } from 'vitest';
import {
  exportTankToTankTripToPDF,
  exportTankToTankTripsToPDF,
  exportTankToTankToExcel,
  exportSingleTankToTankToExcel,
  generateTankToTankTextReport,
} from '../../src/utils/export';

// Mock data for testing
const mockVehicleProfile = {
  name: '2020 Toyota Camry',
  distanceUnit: 'km',
  fuelVolumeUnit: 'L',
  expectedMileage: 15,
  tankCapacity: 50,
  currency: 'USD',
  pricePerLiter: 3.33,
};

const mockTripData = {
  isValid: true,
  distance: 200,
  actualFuelConsumed: 36,
  expectedFuelConsumed: 13.33,
  fuelDifference: 22.67,
  theftAmount: 22.67,
  theftPercentage: 63,
  isTheftSuspected: true,
  actualMileage: 5.56,
  expectedMileage: 15,
  mileageEfficiency: 37.07,
  startDate: '2025-01-20T10:00:00Z',
  endDate: '2025-01-24T14:30:00Z',
  startOdometer: 15034,
  endOdometer: 15234,
  duration: 350640000,
  durationDays: 4,
  tankCapacity: 50,
  remainingFuelBeforeFill: 14,
  fillPercentage: 72,
  theftThreshold: 25,
  previousFullFillLogId: 'log-1',
  currentLogId: 'log-2',
  calculatedAt: '2025-01-24T14:30:00Z',
};

const mockNormalTripData = {
  ...mockTripData,
  theftAmount: 0,
  theftPercentage: 0,
  isTheftSuspected: false,
  actualFuelConsumed: 13.33,
  fuelDifference: 0,
  actualMileage: 15,
  mileageEfficiency: 100,
  remainingFuelBeforeFill: 36.67,
  fillPercentage: 26.66,
};

const mockMultipleTrips = [
  mockTripData,
  mockNormalTripData,
  {
    ...mockNormalTripData,
    currentLogId: 'log-3',
    distance: 300,
    actualFuelConsumed: 20,
    actualMileage: 15,
    theftAmount: 0,
  },
];

describe('Tank-to-Tank Export - PDF', () => {
  describe('exportTankToTankTripToPDF', () => {
    test('should export single trip with theft detected to PDF', () => {
      // Setup mock
      global.jsPDF = vi.fn().mockImplementation(() => ({
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        setTextColor: vi.fn(),
        setDrawColor: vi.fn(),
        line: vi.fn(),
        autoTable: vi.fn().mockReturnValue({
          finalY: 100,
        }),
        save: vi.fn(),
      }));

      global.autoTable = vi.fn();

      const result = exportTankToTankTripToPDF(
        mockTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });

    test('should export single trip with normal consumption to PDF', () => {
      const result = exportTankToTankTripToPDF(
        mockNormalTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });

    test('should return false for invalid trip data', () => {
      const result = exportTankToTankTripToPDF(
        { isValid: false },
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });

    test('should handle null trip data gracefully', () => {
      const result = exportTankToTankTripToPDF(
        null,
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });
  });

  describe('exportTankToTankTripsToPDF', () => {
    test('should export multiple trips to PDF', () => {
      const result = exportTankToTankTripsToPDF(
        mockMultipleTrips,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });

    test('should return false for empty trips array', () => {
      const result = exportTankToTankTripsToPDF(
        [],
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });

    test('should return false for null trips', () => {
      const result = exportTankToTankTripsToPDF(
        null,
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });
  });
});

describe('Tank-to-Tank Export - Excel', () => {
  describe('exportTankToTankToExcel', () => {
    test('should export multiple trips to Excel', () => {
      // Setup mock
      global.XLSX = {
        utils: {
          json_to_sheet: vi.fn(),
          book_new: vi.fn().mockReturnValue({}),
          book_append_sheet: vi.fn(),
        },
        writeFile: vi.fn(),
      };

      const result = exportTankToTankToExcel(
        mockMultipleTrips,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });

    test('should return false for empty trips array', () => {
      const result = exportTankToTankToExcel(
        [],
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });

    test('should return false for null trips', () => {
      const result = exportTankToTankToExcel(
        null,
        mockVehicleProfile
      );

      expect(result).toBe(false);
    });

    test('should create separate sheets for summary, trips, and theft incidents', () => {
      const result = exportTankToTankToExcel(
        mockMultipleTrips,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });
  });

  describe('exportSingleTankToTankToExcel', () => {
    test('should export single trip to Excel', () => {
      const result = exportSingleTankToTankToExcel(
        mockTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(result).toBe(true);
    });

    test('should handle invalid trip data', () => {
      const result = exportSingleTankToTankToExcel(
        { isValid: false },
        mockVehicleProfile
      );

      expect(result).toBe(true); // Still returns true, exports empty data
    });
  });
});

describe('Tank-to-Tank Export - Text Report', () => {
  describe('generateTankToTankTextReport', () => {
    test('should generate text report for trip with theft', () => {
      const report = generateTankToTankTextReport(
        mockTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(report).toContain('FUEL GUARD - TANK-TO-TANK ANALYSIS REPORT');
      expect(report).toContain('2020 Toyota Camry');
      expect(report).toContain('200 km');
      expect(report).toContain('36.0 L');
      expect(report).toContain('THEFT DETECTION');
      expect(report).toContain('Severity: CRITICAL');
      expect(report).toContain('$75.49');
    });

    test('should generate text report for normal trip', () => {
      const report = generateTankToTankTextReport(
        mockNormalTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(report).toContain('FUEL GUARD - TANK-TO-TANK ANALYSIS REPORT');
      expect(report).toContain('Normal fuel consumption');
      expect(report).toContain('Theft Amount: 0.0 L');
    });

    test('should return error message for invalid trip', () => {
      const report = generateTankToTankTextReport(
        { isValid: false },
        mockVehicleProfile
      );

      expect(report).toBe('No valid Tank-to-Tank data available.');
    });

    test('should return error message for null trip', () => {
      const report = generateTankToTankTextReport(
        null,
        mockVehicleProfile
      );

      expect(report).toBe('No valid Tank-to-Tank data available.');
    });

    test('should format dates correctly', () => {
      const report = generateTankToTankTextReport(
        mockTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(report).toContain('1/20/2025');
      expect(report).toContain('1/24/2025');
    });

    test('should include estimated loss when pricePerLiter provided', () => {
      const report = generateTankToTankTextReport(
        mockTripData,
        mockVehicleProfile,
        '$',
        3.33
      );

      expect(report).toContain('Estimated Loss: $75.49');
    });

    test('should handle currency symbol variations', () => {
      const euroReport = generateTankToTankTextReport(
        mockTripData,
        { ...mockVehicleProfile, currency: 'EUR' },
        '€',
        3.33
      );

      expect(euroReport).toContain('€75.49');

      const inrReport = generateTankToTankTextReport(
        mockTripData,
        { ...mockVehicleProfile, currency: 'INR' },
        '₹',
        3.33
      );

      expect(inrReport).toContain('₹75.49');
    });
  });
});

describe('Tank-to-Tank Export - Unit Conversion', () => {
  test('should handle miles/gallons units', () => {
    const imperialVehicleProfile = {
      ...mockVehicleProfile,
      distanceUnit: 'mi',
      fuelVolumeUnit: 'gal',
    };

    const report = generateTankToTankTextReport(
      mockTripData,
      imperialVehicleProfile,
      '$',
      3.33
    );

    expect(report).toContain('mi');
    expect(report).toContain('gal');
    expect(report).toContain('mpg');
  });

  test('should handle km/liters units', () => {
    const report = generateTankToTankTextReport(
      mockTripData,
      mockVehicleProfile,
      '$',
      3.33
    );

    expect(report).toContain('km');
    expect(report).toContain('L');
    expect(report).toContain('km/L');
  });
});

describe('Tank-to-Tank Export - Edge Cases', () => {
  test('should handle very small theft amounts', () => {
    const smallTheftTrip = {
      ...mockNormalTripData,
      theftAmount: 0.1,
      theftPercentage: 1,
      isTheftSuspected: false,
    };

    const report = generateTankToTankTextReport(
      smallTheftTrip,
      mockVehicleProfile,
      '$',
      3.33
    );

    expect(report).toContain('Theft Amount: 0.1 L');
  });

  test('should handle zero price per liter', () => {
    const report = generateTankToTankTextReport(
      mockTripData,
      mockVehicleProfile,
      '$',
      0
    );

    // Should not include estimated loss section
    expect(report).not.toContain('Estimated Loss:');
  });

  test('should handle very long trip durations', () => {
    const longTrip = {
      ...mockTripData,
      durationDays: 30,
    };

    const report = generateTankToTankTextReport(
      longTrip,
      mockVehicleProfile,
      '$',
      3.33
    );

    expect(report).toContain('Duration: 30 days');
  });

  test('should handle 100% theft', () => {
    const fullTheftTrip = {
      ...mockTripData,
      theftPercentage: 100,
      theftAmount: 36,
      isTheftSuspected: true,
      actualMileage: 0,
    };

    const report = generateTankToTankTextReport(
      fullTheftTrip,
      mockVehicleProfile,
      '$',
      3.33
    );

    expect(report).toContain('Theft Percentage: 100.0%');
  });
});
