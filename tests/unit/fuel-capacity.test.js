/**
 * Fuel Tank Capacity Service Test Suite
 * Converted to Vitest format
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  estimateEnhancedTankCapacity,
  getFuelTankCapacity,
  clearCache
} from '../../src/services/fuelCapacityService';

describe('fuelCapacityService', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('getFuelTankCapacity()', () => {
    it('should return high confidence for well-known vehicle (Toyota Corolla)', async () => {
      const result = await getFuelTankCapacity({
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        vehicleClass: 'Compact Cars',
        tankCapacity: null
      });

      expect(result.capacity).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.source).toBeDefined();
    });

    it('should use class average for unknown make/model with known class', async () => {
      const result = await getFuelTankCapacity({
        make: 'UnknownMake',
        model: 'UnknownModel',
        year: 2025,
        vehicleClass: 'Compact Cars',
        tankCapacity: null
      });

      expect(result.capacity).toBeGreaterThan(0);
      expect(['medium', 'low', 'very-low']).toContain(result.confidence);
    });

    it('should return a result for completely unknown vehicle', async () => {
      const result = await getFuelTankCapacity({
        make: 'Unknown',
        model: 'Vehicle',
        year: 1900,
        vehicleClass: null,
        tankCapacity: null
      });

      expect(result.capacity).toBeGreaterThan(0);
      expect(result.confidence).toBeDefined();
    });

    it('should use user-provided tank capacity as override', async () => {
      const result = await getFuelTankCapacity({
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        vehicleClass: 'Compact Cars',
        tankCapacity: 75
      });

      expect(result.capacity).toBe(75);
      expect(result.confidence).toBe('high');
    });
  });

  describe('estimateEnhancedTankCapacity()', () => {
    it('should return capacity for known vehicle class', () => {
      const result = estimateEnhancedTankCapacity('Compact Cars', null, null, null);

      expect(result.capacity).toBeGreaterThan(0);
      expect(result.confidence).toBeDefined();
    });

    it('should return capacity for each standard vehicle class', () => {
      const classes = [
        'Two Seaters',
        'Compact Cars',
        'Midsize Cars',
        'Large Cars',
        'Small Pickup Trucks',
        'Standard Pickup Trucks',
        'Small Sport Utility Vehicles',
        'Standard Sport Utility Vehicles',
      ];

      classes.forEach((vehicleClass) => {
        const result = estimateEnhancedTankCapacity(vehicleClass, null, null, null);
        expect(result.capacity).toBeGreaterThan(0);
      });
    });

    it('should return capacity for known make/model combinations', () => {
      const vehicles = [
        { make: 'Toyota', model: 'Prius' },
        { make: 'Honda', model: 'Civic' },
        { make: 'Ford', model: 'F-150' },
      ];

      vehicles.forEach(({ make, model }) => {
        const result = estimateEnhancedTankCapacity(null, make, model, null);
        expect(result.capacity).toBeGreaterThan(0);
      });
    });

    it('should return a default capacity for completely unknown vehicle', () => {
      const result = estimateEnhancedTankCapacity(null, null, null, null);

      expect(result.capacity).toBeGreaterThan(0);
    });
  });

  describe('clearCache()', () => {
    it('should allow cache to be cleared without errors', () => {
      expect(() => clearCache()).not.toThrow();
    });

    it('should return consistent results after cache clear', async () => {
      const vehicle = {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vehicleClass: 'Midsize Cars',
        tankCapacity: null
      };

      const result1 = await getFuelTankCapacity(vehicle);
      clearCache();
      const result2 = await getFuelTankCapacity(vehicle);

      expect(result2.capacity).toBe(result1.capacity);
      expect(result2.confidence).toBe(result1.confidence);
    });
  });
});
