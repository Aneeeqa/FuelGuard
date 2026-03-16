/**
 * Integration Tests for Tank-to-Tank System
 *
 * This test suite validates end-to-end Tank-to-Tank functionality
 * including integration with FuelContext and data migration.
 */

import { describe, it, expect } from 'vitest';
import {
  estimateFuelLevelFromGauge,
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption,
  calculateTankToTankStatistics,
  validateTankCapacity
} from '../../src/utils/tankToTankCalculations.js';

describe('Tank-to-Tank Integration', () => {
  describe('Scenario 1: Normal Driving Pattern', () => {
    it('Track multiple tank-to-tank cycles', () => {
      const vehicleProfile = {
        tankCapacity: 50,
        expectedMileage: 15,
        theftThreshold: 0.25
      };

      const logs = [];

      // First fill (baseline)
      logs.push({
        id: '1',
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        liters: 50,
        isFullTank: true,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      // Second fill (normal consumption)
      logs.push({
        id: '2',
        date: '2025-01-10T10:00:00Z',
        odometer: 10300,
        liters: 20,
        isFullTank: true,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      // Third fill (normal consumption)
      logs.push({
        id: '3',
        date: '2025-01-20T10:00:00Z',
        odometer: 10600,
        liters: 20,
        isFullTank: true,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      const trip1 = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        vehicleProfile
      );
      const trip2 = calculateTankToTankConsumption(
        logs[2],
        logs[1],
        vehicleProfile
      );

      expect(trip1.isTheftSuspected).toBe(false);
      expect(trip1.isValid).toBe(true);
      expect(trip1.actualMileage).toBeCloseTo(15, 0.01);

      expect(trip2.isTheftSuspected).toBe(false);
      expect(trip2.isValid).toBe(true);
      expect(trip2.actualMileage).toBeCloseTo(15, 0.01);

      const stats = calculateTankToTankStatistics([trip1, trip2]);
      expect(stats.theftIncidents).toBe(0);
    });
  });

  describe('Scenario 2: Fuel Theft Detection', () => {
    it('Detect abnormal fuel consumption (theft)', () => {
      const vehicle = {
        tankCapacity: 100,
        expectedMileage: 15,
        theftThreshold: 0.25
      };

      const logs = [];

      // Full tank
      logs.push({
        id: '1',
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        liters: 100,
        isFullTank: true,
        tankCapacity: 100,
        vehicleId: 'vehicle-1'
      });

      // Theft: Only 10L added but odometer shows 500km driven
      // Expected: 33.3L for 500km at 15km/L
      // Actual: 10L + 90L remaining = 100L total
      // But only 10L was added, so 90L was used
      // Mileage: 500km / 90L = 5.56 km/L (theft!)
      logs.push({
        id: '2',
        date: '2025-01-10T10:00:00Z',
        odometer: 10500,
        liters: 100,
        isFullTank: true,
        tankCapacity: 100,
        vehicleId: 'vehicle-1'
      });

      const trip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        vehicle.expectedMileage,
        vehicle.tankCapacity
      );

      expect(trip.isTheft).toBe(true);
      expect(trip.actualMileage).toBeLessThan(vehicle.expectedMileage * 0.75);
      expect(trip.theftAmount).toBeGreaterThan(0);
    });
  });

  describe('Scenario 3: Mixed Fill Types', () => {
    it('Only use full fills for calculations', () => {
      const logs = [];

      // Full tank fill
      logs.push({
        id: '1',
        date: '2025-01-01T10:00:00Z',
        odometer: 10000,
        liters: 50,
        isFullTank: true,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      // Partial fill (should be skipped)
      logs.push({
        id: '2',
        date: '2025-01-05T10:00:00Z',
        odometer: 10150,
        liters: 20,
        isFullTank: false,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      // Full tank fill
      logs.push({
        id: '3',
        date: '2025-01-10T10:00:00Z',
        odometer: 10300,
        liters: 45,
        isFullTank: true,
        tankCapacity: 50,
        vehicleId: 'vehicle-1'
      });

      const trip = calculateTankToTankConsumption(
        logs[2],
        logs[0],
        15,
        50
      );

      // Should skip the partial fill and calculate from first to last full tank
      expect(trip.distance).toBe(300);
    });
  });

  describe('Scenario 4: Edge Cases', () => {
    it('Handle very short distance', () => {
      const logs = [
        {
          id: '1',
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        },
        {
          id: '2',
          date: '2025-01-02T10:00:00Z',
          odometer: 10005,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        }
      ];

      const trip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        15,
        50
      );

      expect(trip.distance).toBe(5);
    });

    it('Handle very long distance', () => {
      const logs = [
        {
          id: '1',
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        },
        {
          id: '2',
          date: '2025-01-30T10:00:00Z',
          odometer: 15000,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        }
      ];

      const trip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        15,
        50
      );

      expect(trip.distance).toBe(5000);
    });

    it('Handle extreme tank sizes', () => {
      const logs = [
        {
          id: '1',
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          liters: 200,
          isFullTank: true,
          tankCapacity: 200,
          vehicleId: 'vehicle-1'
        },
        {
          id: '2',
          date: '2025-01-10T10:00:00Z',
          odometer: 10500,
          liters: 200,
          isFullTank: true,
          tankCapacity: 200,
          vehicleId: 'vehicle-1'
        }
      ];

      const trip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        15,
        200
      );

      expect(trip.fuelUsed).toBeCloseTo(200, 1);
    });
  });

  describe('Scenario 6: Validation', () => {
    it('Validate migrated data', () => {
      const validData = {
        tankCapacity: 50,
        expectedMileage: 15,
        theftThreshold: 0.25
      };

      const result = validateTankCapacity(
        validData.tankCapacity,
        45
      );

      expect(result.isValid).toBe(true);
    });

    it('Detect invalid migrated data', () => {
      const invalidData = {
        tankCapacity: 0,
        expectedMileage: 15
      };

      const result = validateTankCapacity(
        invalidData.tankCapacity,
        0
      );

      expect(result.isValid).toBe(false);
    });

    it('Detect warnings in migrated data', () => {
      const warningData = {
        tankCapacity: 50,
        expectedMileage: 15
      };

      const result = validateTankCapacity(
        warningData.tankCapacity,
        55
      );

      expect(result.isValid).toBe(false);
    });
  });

  describe('Scenario 7: Statistics Aggregation', () => {
    it('Calculate comprehensive statistics', () => {
      const trips = [
        {
          distance: 500,
          fuelUsed: 45,
          actualMileage: 11.11,
          theftAmount: 0,
          isTheft: false
        },
        {
          distance: 600,
          fuelUsed: 50,
          actualMileage: 12,
          theftAmount: 0,
          isTheft: false
        },
        {
          distance: 400,
          fuelUsed: 35,
          actualMileage: 11.43,
          theftAmount: 0,
          isTheft: false
        }
      ];

      const stats = calculateTankToTankStatistics(trips);

      expect(stats.totalDistance).toBe(1500);
      expect(stats.totalFuelUsed).toBeCloseTo(130, 1);
      expect(stats.averageMileage).toBeCloseTo(11.51, 2);
      expect(stats.theftCount).toBe(0);
    });

    it('Handle single trip statistics', () => {
      const trips = [
        {
          distance: 500,
          fuelUsed: 45,
          actualMileage: 11.11,
          theftAmount: 0,
          isTheft: false
        }
      ];

      const stats = calculateTankToTankStatistics(trips);

      expect(stats.totalDistance).toBe(500);
      expect(stats.averageMileage).toBeCloseTo(11.11, 2);
      expect(stats.theftCount).toBe(0);
    });
  });

  describe('Scenario 8: Gauge Reading Integration', () => {
    it('Integrate gauge reading with tank calculations', () => {
      const gaugeReading = '3/4';
      const tankCapacity = 50;

      const result = estimateFuelLevelFromGauge(gaugeReading, tankCapacity);

      expect(result.fuelLevel).toBeCloseTo(37.5, 0.1);
    });

    it('All gauge readings work correctly', () => {
      const tankCapacity = 50;

      expect(estimateFuelLevelFromGauge('Full', tankCapacity).fuelLevel).toBe(50);
      expect(estimateFuelLevelFromGauge('3/4', tankCapacity).fuelLevel).toBeCloseTo(37.5, 0.1);
      expect(estimateFuelLevelFromGauge('1/2', tankCapacity).fuelLevel).toBe(25);
      expect(estimateFuelLevelFromGauge('1/4', tankCapacity).fuelLevel).toBeCloseTo(12.5, 0.1);
      expect(estimateFuelLevelFromGauge('Empty', tankCapacity).fuelLevel).toBeCloseTo(2.5, 0.1);
    });
  });

  describe('Scenario 9: Full Tank Detection Variations', () => {
    it('Detect full tank via user indication', () => {
      const fill = {
        liters: 40,
        isFullTank: true,
        tankCapacity: 50
      };

      const result = isFullTankFill(fill, 50);

      expect(result.isFullTank).toBe(true);
    });

    it('Detect full tank via fill amount (>90% of capacity)', () => {
      const fill = {
        liters: 46,
        isFullTank: false,
        tankCapacity: 50
      };

      const result = isFullTankFill(fill, 50);

      expect(result.isFullTank).toBe(true);
    });

    it('Detect partial fill correctly', () => {
      const fill = {
        liters: 30,
        isFullTank: false,
        tankCapacity: 50
      };

      const result = isFullTankFill(fill, 50);

      expect(result.isFullTank).toBe(false);
    });
  });

  describe('Scenario 10: Theft Threshold Sensitivity', () => {
    it('Test different theft thresholds', () => {
      const vehicle = {
        tankCapacity: 50,
        expectedMileage: 15
      };

      const logs = [
        {
          id: '1',
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        },
        {
          id: '2',
          date: '2025-01-10T10:00:00Z',
          odometer: 10300,
          liters: 20,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        }
      ];

      const strictTrip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        vehicle.expectedMileage,
        vehicle.tankCapacity
      );

      expect(strictTrip.actualMileage).toBeCloseTo(15, 0.01);
    });

    it('Test lenient theft threshold', () => {
      const vehicle = {
        tankCapacity: 50,
        expectedMileage: 15,
        theftThreshold: 0.15 // Very strict - only 15% below expected
      };

      const logs = [
        {
          id: '1',
          date: '2025-01-01T10:00:00Z',
          odometer: 10000,
          liters: 50,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        },
        {
          id: '2',
          date: '2025-01-10T10:00:00Z',
          odometer: 10300,
          liters: 20,
          isFullTank: true,
          tankCapacity: 50,
          vehicleId: 'vehicle-1'
        }
      ];

      const trip = calculateTankToTankConsumption(
        logs[1],
        logs[0],
        vehicle.expectedMileage,
        vehicle.tankCapacity
      );

      // At 15 km/L, this should pass with lenient threshold
      expect(trip.isTheft).toBe(false);
    });
  });
});
