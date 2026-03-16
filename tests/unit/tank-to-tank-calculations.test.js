/**
 * Unit Tests for Tank-to-Tank Calculations Module
 *
 * This test suite validates all functions in tankToTankCalculations.js
 */

import { describe, it, expect } from 'vitest';
import {
  estimateFuelLevelFromGauge,
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption,
  calculateTankToTankStatistics,
  getTankToTankTheftSeverity,
  formatTankToTankData,
  calculateTheftCost,
  validateTankCapacity,
  getEfficiencyColor,
  getFuelLevelColor
} from '../../src/utils/tankToTankCalculations.js';

describe('estimateFuelLevelFromGauge()', () => {
  it('Full gauge returns 100%', () => {
    const result = estimateFuelLevelFromGauge('Full', 50);
    expect(result.fuelLevel).toBe(50);
  });

  it('3/4 gauge returns 75%', () => {
    const result = estimateFuelLevelFromGauge('3/4', 50);
    expect(result.fuelLevel).toBe(37.5);
  });

  it('1/2 gauge returns 50%', () => {
    const result = estimateFuelLevelFromGauge('1/2', 50);
    expect(result.fuelLevel).toBe(25);
  });

  it('1/4 gauge returns 25%', () => {
    const result = estimateFuelLevelFromGauge('1/4', 50);
    expect(result.fuelLevel).toBe(12.5);
  });

  it('Empty gauge returns 5% reserve', () => {
    const result = estimateFuelLevelFromGauge('Empty', 50);
    expect(result.fuelLevel).toBe(2.5);
  });

  it('Invalid gauge returns default 50%', () => {
    const result = estimateFuelLevelFromGauge('Unknown', 50);
    expect(result.fuelLevel).toBe(25);
  });
});

describe('isFullTankFill()', () => {
  it('User indicated full tank', () => {
    const result = isFullTankFill({ liters: 45, isFullTank: true, tankCapacity: 50 }, 50);
    expect(result.isFullTank).toBe(true);
  });

  it('Fill amount 90%+ of capacity', () => {
    const result = isFullTankFill({ liters: 45, isFullTank: false, tankCapacity: 50 }, 50);
    expect(result.isFullTank).toBe(true);
  });

  it('Fill amount 80%+ (substantial)', () => {
    const result = isFullTankFill({ liters: 40, isFullTank: false, tankCapacity: 50 }, 50);
    expect(result.isFullTank).toBe(true);
  });

  it('Fill amount <80% (partial)', () => {
    const result = isFullTankFill({ liters: 30, isFullTank: false, tankCapacity: 50 }, 50);
    expect(result.isFullTank).toBe(false);
  });

  it('Edge case: exactly 80% fill', () => {
    const result = isFullTankFill({ liters: 40, isFullTank: false, tankCapacity: 50 }, 50);
    expect(result.isFullTank).toBe(true);
  });
});

describe('findPreviousFullFill()', () => {
  it('Find previous full tank (skips partial)', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 20, isFullTank: false },
      { id: 2, date: '2025-01-10', liters: 45, isFullTank: true },
      { id: 3, date: '2025-01-20', liters: 30, isFullTank: false },
      { id: 4, date: '2025-01-30', liters: 45, isFullTank: true },
    ];

    // findPreviousFullFill(logs, vehicleId, currentDate)
    const result = findPreviousFullFill(logs, undefined, '2025-01-30');
    expect(result?.id).toBe(2);
  });

  it('Find previous full tank from earliest', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 45, isFullTank: true },
      { id: 2, date: '2025-01-10', liters: 45, isFullTank: true },
    ];

    const result = findPreviousFullFill(logs, undefined, '2025-01-10');
    expect(result?.id).toBe(1);
  });

  it('No previous full tank exists', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 30, isFullTank: false },
    ];

    const result = findPreviousFullFill(logs, undefined, '2025-01-01');
    expect(result).toBeNull();
  });

  it('Empty logs array', () => {
    const result = findPreviousFullFill([], undefined, '2025-01-01');
    expect(result).toBeNull();
  });

  it('Wrong vehicle ID', () => {
    const logs = [
      { vehicleId: 1, id: 1, date: '2025-01-01', liters: 45, isFullTank: true },
    ];

    const result = findPreviousFullFill(logs, 2, '2025-01-10');
    expect(result).toBeNull();
  });
});

describe('calculateTankToTankConsumption()', () => {
  it('Normal consumption (no theft)', () => {
    // 300km driven, 20L used = 15 km/L (matches expectedMileage, no theft)
    const logs = [
      { id: 1, date: '2025-01-01', liters: 50, odometer: 10000, isFullTank: true },
      { id: 2, date: '2025-01-10', liters: 20, odometer: 10300, isFullTank: true },
    ];

    const result = calculateTankToTankConsumption(logs[1], logs[0], 15, 50);
    expect(result.distance).toBe(300);
    expect(result.fuelUsed).toBeCloseTo(20, 1);
    expect(result.actualMileage).toBeCloseTo(15, 0.5);
    expect(result.theftAmount).toBeCloseTo(0, 1);
    expect(result.isTheft).toBe(false);
  });

  it('Theft scenario (from implementation plan)', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 45, odometer: 10000, isFullTank: true },
      { id: 2, date: '2025-01-10', liters: 45, odometer: 10500, isFullTank: true },
    ];

    // Simulate theft by reducing odometer reading
    const stolenLogs = [
      logs[0],
      { ...logs[1], odometer: 10400 },
    ];

    const result = calculateTankToTankConsumption(stolenLogs[1], stolenLogs[0], 15, 50);
    expect(result.distance).toBe(400);
    expect(result.actualMileage).toBeCloseTo(8.89, 2);
    expect(result.theftAmount).toBeGreaterThan(0);
    expect(result.isTheft).toBe(true);
  });

  it('First fill (no previous full tank)', () => {
    const currentLog = { id: 1, date: '2025-01-01', liters: 45, odometer: 10000, isFullTank: true };

    const result = calculateTankToTankConsumption(currentLog, null, 15, 50);
    expect(result.isValid).toBe(false);
  });

  it('Invalid odometer (decreased)', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 45, odometer: 10500, isFullTank: true },
      { id: 2, date: '2025-01-10', liters: 45, odometer: 10000, isFullTank: true },
    ];

    const result = calculateTankToTankConsumption(logs[1], logs[0], 15, 50);
    expect(result.isValid).toBe(false);
  });

  it('Missing vehicle profile', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 45, odometer: 10000, isFullTank: true },
    ];

    const result = calculateTankToTankConsumption(logs[0], null, 15, 50);
    expect(result.isValid).toBe(false);
  });

  it('Zero fuel amount', () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 0, odometer: 10000, isFullTank: false },
    ];

    const result = calculateTankToTankConsumption(logs[0], null, 15, 50);
    expect(result.isValid).toBe(false);
  });

  it('Missing current log', () => {
    const result = calculateTankToTankConsumption(null, { id: 1 }, 15, 50);
    expect(result.isValid).toBe(false);
  });
});

describe('calculateTankToTankStatistics()', () => {
  it('Calculate statistics from multiple trips', () => {
    const trips = [
      { distance: 500, fuelUsed: 45, actualMileage: 11.11, theftAmount: 0, isTheft: false },
      { distance: 600, fuelUsed: 50, actualMileage: 12, theftAmount: 0, isTheft: false },
      { distance: 400, fuelUsed: 35, actualMileage: 11.43, theftAmount: 0, isTheft: false },
    ];

    const stats = calculateTankToTankStatistics(trips);
    expect(stats.totalDistance).toBe(1500);
    expect(stats.totalFuelUsed).toBeCloseTo(130, 1);
    expect(stats.averageMileage).toBeCloseTo(11.51, 2);
    expect(stats.theftCount).toBe(0);
  });

  it('Empty trips array', () => {
    const stats = calculateTankToTankStatistics([]);
    expect(stats.totalDistance).toBe(0);
    expect(stats.totalFuelUsed).toBe(0);
  });

  it('All invalid trips', () => {
    const trips = [
      { distance: 0, fuelUsed: 0, actualMileage: 0, theftAmount: 0, isTheft: false },
    ];

    const stats = calculateTankToTankStatistics(trips);
    expect(stats.totalDistance).toBe(0);
  });

  it('Calculate average actual mileage', () => {
    const trips = [
      { distance: 500, fuelUsed: 45, actualMileage: 11.11, theftAmount: 0, isTheft: false },
      { distance: 500, fuelUsed: 50, actualMileage: 10, theftAmount: 0, isTheft: false },
    ];

    const stats = calculateTankToTankStatistics(trips);
    expect(stats.averageMileage).toBeCloseTo(10.56, 2);
  });
});

describe('getTankToTankTheftSeverity()', () => {
  it('Critical severity (30%+)', () => {
    const result = getTankToTankTheftSeverity(30);
    expect(result).toBe('critical');
  });

  it('Warning severity (15-29%)', () => {
    const result = getTankToTankTheftSeverity(20);
    expect(result).toBe('warning');
  });

  it('Normal severity (<15%)', () => {
    const result = getTankToTankTheftSeverity(10);
    expect(result).toBe('normal');
  });

  it('Custom thresholds', () => {
    const result = getTankToTankTheftSeverity(25, 20, 30);
    expect(result).toBe('warning');
  });
});

describe('formatTankToTankData()', () => {
  // formatTankToTankData requires a valid tankToTankData object from calculateTankToTankConsumption
  const makeTrip = () => {
    const logs = [
      { id: 1, date: '2025-01-01', liters: 50, odometer: 10000, isFullTank: true },
      { id: 2, date: '2025-01-10', liters: 20, odometer: 10300, isFullTank: true },
    ];
    return calculateTankToTankConsumption(logs[1], logs[0], 15, 50);
  };

  it('Format with default units', () => {
    const result = formatTankToTankData(makeTrip());
    expect(result.formatted).toBeDefined();
    expect(result.formatted.distance).toContain('km');
  });

  it('Format with custom units', () => {
    const result = formatTankToTankData(makeTrip(), { distanceUnit: 'mi', fuelVolumeUnit: 'gal' });
    expect(result.formatted.distance).toContain('mi');
  });

  it('Format preserves original data', () => {
    const trip = makeTrip();
    const result = formatTankToTankData(trip);
    expect(result.distance).toBe(trip.distance);
    expect(result.actualFuelConsumed).toBe(trip.actualFuelConsumed);
  });
});

describe('calculateTheftCost()', () => {
  it('Calculate theft cost', () => {
    const result = calculateTheftCost(10, 1.50);
    expect(result).toBeCloseTo(15, 1);
  });

  it('Zero theft amount', () => {
    const result = calculateTheftCost(0, 1.50);
    expect(result).toBe(0);
  });

  it('Missing inputs', () => {
    const result = calculateTheftCost(null, null);
    expect(result).toBe(0);
  });
});

describe('validateTankCapacity()', () => {
  it('Valid tank capacity', () => {
    const result = validateTankCapacity(50, 45);
    expect(result.isValid).toBe(true);
  });

  it('Invalid capacity (zero)', () => {
    const result = validateTankCapacity(0, 0);
    expect(result.isValid).toBe(false);
  });

  it('Capacity too small (fill > 110% of capacity)', () => {
    const result = validateTankCapacity(50, 55);
    expect(result.isValid).toBe(false);
  });

  it('Partial fill marked as full', () => {
    const result = validateTankCapacity(50, 30);
    expect(result.isFull).toBe(false);
  });

  it('No fill amount', () => {
    const result = validateTankCapacity(50, null);
    expect(result.isValid).toBe(false);
  });
});

describe('getEfficiencyColor()', () => {
  it('Green efficiency (90%+)', () => {
    const result = getEfficiencyColor(95);
    expect(result).toBe('#22c55e');
  });

  it('Orange efficiency (75-89%)', () => {
    const result = getEfficiencyColor(80);
    expect(result).toBe('#f59e0b');
  });

  it('Red efficiency (50-74%)', () => {
    const result = getEfficiencyColor(60);
    expect(result).toBe('#ef4444');
  });

  it('Dark red efficiency (<50%)', () => {
    const result = getEfficiencyColor(40);
    expect(result).toBe('#991b1b');
  });
});

describe('getFuelLevelColor()', () => {
  it('Green fuel level (70%+)', () => {
    const result = getFuelLevelColor(75);
    expect(result).toBe('#22c55e');
  });

  it('Orange fuel level (40-69%)', () => {
    const result = getFuelLevelColor(50);
    expect(result).toBe('#f59e0b');
  });

  it('Red fuel level (20-39%)', () => {
    const result = getFuelLevelColor(25);
    expect(result).toBe('#ef4444');
  });

  it('Dark red fuel level (<20%)', () => {
    const result = getFuelLevelColor(10);
    expect(result).toBe('#991b1b');
  });
});
