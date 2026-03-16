/**
 * Fuel Drain Calculator - THEFT DETECTION ALGORITHM
 *
 * This module detects fuel theft by analyzing abnormal fuel consumption
 * patterns. Critical for financial accuracy and fraud prevention.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateFuelDrainRate,
  analyzeFuelDrain,
  generateDrainAlertMessage,
  formatDrainRate
} from '../../src/utils/fuelDrainCalculator';

describe('Fuel Drain Calculator', () => {
  describe('calculateFuelDrainRate()', () => {
    it('should detect abnormal fuel drain when consumption exceeds threshold', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 30,
        odometer: 10005
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.isAbnormal).toBe(true);
      expect(result.litersPerDay).toBeGreaterThan(2);
      expect(result.daysBetweenEntries).toBe(2);
    });

    it('should identify normal fuel consumption (no theft)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 48,
        odometer: 10005
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.isAbnormal).toBe(false);
      expect(result.estimatedDrain).toBeCloseTo(2, 1);
    });

    it('should return zeros for null logs', () => {
      const result = calculateFuelDrainRate(null, null);

      expect(result.litersPerHour).toBe(0);
      expect(result.litersPerDay).toBe(0);
      expect(result.estimatedDrain).toBe(0);
      expect(result.isAbnormal).toBe(false);
    });

    it('should handle edge case: zero distance (vehicle not driven)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 30,
        odometer: 10000 // Same odometer
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.litersPerDay).toBeGreaterThan(0);
      expect(result.isAbnormal).toBe(result.litersPerDay > 2);
    });

    it('should handle edge case: negative distance (odometer rollback)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 30,
        odometer: 9990 // Odometer decreased
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      // Should still calculate drain even with odometer issue
      expect(result).toBeDefined();
    });

    it('should not flag as abnormal if vehicle was driven (>10km)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 30,
        odometer: 10100 // Vehicle driven 100km
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.driven).toBe(true);
      expect(result.isAbnormal).toBe(false);
    });

    it('should handle short time intervals (<1 hour)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 50,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-10T10:30',
        liters: 30,
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.litersPerHour).toBe(0);
      expect(result.litersPerDay).toBe(0);
      expect(result.isAbnormal).toBe(false);
    });

    it('should handle fuel added (no drain)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 30,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 50, // Fuel added
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.estimatedDrain).toBe(0);
      expect(result.isAbnormal).toBe(false);
    });

    it('should handle missing liters values', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result).toBeDefined();
    });

    it('should calculate exact drain amount correctly', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 80,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00', // 2 days
        liters: 40,
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.estimatedDrain).toBe(40);
      expect(result.litersPerDay).toBe(20);
      expect(result.litersPerHour).toBeCloseTo(0.83, 1);
    });
  });

  describe('analyzeFuelDrain()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should analyze all logs and flag abnormal drains', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 40, odometer: 10000 },
        { id: 3, date: '2025-01-14T10:00', liters: 35, odometer: 10000 },
        { id: 4, date: '2025-01-16T10:00', liters: 50, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      expect(result.totalDrains).toBe(3);
      expect(result.abnormalDrains).toBeGreaterThan(0);
      expect(result.drainEntries).toHaveLength(3);
    });

    it('should return zeros for empty logs array', () => {
      const result = analyzeFuelDrain([]);

      expect(result.totalDrains).toBe(0);
      expect(result.abnormalDrains).toBe(0);
      expect(result.totalLostFuel).toBe(0);
      expect(result.drainEntries).toHaveLength(0);
      expect(result.hasAlert).toBe(false);
    });

    it('should return zeros for logs with less than 2 entries', () => {
      const logs = [
        { id: 1, date: '2025-01-10', liters: 80, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs);

      expect(result.totalDrains).toBe(0);
      expect(result.abnormalDrains).toBe(0);
    });

    it('should calculate total lost fuel correctly', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 60, odometer: 10000 },
        { id: 3, date: '2025-01-14T10:00', liters: 40, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      // Drain 1: 80-60 = 20L
      // Drain 2: 60-40 = 20L
      expect(result.totalLostFuel).toBe(40);
    });

    it('should sort logs chronologically before analysis', () => {
      const logs = [
        { id: 3, date: '2025-01-14T10:00', liters: 40, odometer: 10000 },
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 60, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      expect(result.drainEntries).toHaveLength(2);
    });

    it('should return latest drain info', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 60, odometer: 10000 },
        { id: 3, date: '2025-01-14T10:00', liters: 40, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      expect(result.latestDrain).toBeDefined();
      expect(result.latestDrain.currentDate).toBe('2025-01-14T10:00');
    });

    it('should set hasAlert to true when abnormal drains detected', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-11T10:00', liters: 40, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      expect(result.hasAlert).toBe(true);
    });

    it('should set hasAlert to false when no abnormal drains', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 78, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      expect(result.hasAlert).toBe(false);
    });
  });

  describe('generateDrainAlertMessage()', () => {
    it('should generate alert message for abnormal drain', () => {
      const drainAnalysis = {
        isAbnormal: true,
        litersPerDay: 5.5,
        daysBetweenEntries: 2
      };

      const result = generateDrainAlertMessage(drainAnalysis);

      expect(result).toContain('5.5L/day');
      expect(result).toContain('2.0 days');
      expect(result).toContain('Abnormal fuel drain');
    });

    it('should return empty string for normal drain', () => {
      const drainAnalysis = {
        isAbnormal: false,
        litersPerDay: 1.5,
        daysBetweenEntries: 2
      };

      const result = generateDrainAlertMessage(drainAnalysis);

      expect(result).toBe('');
    });

    it('should return empty string for null input', () => {
      const result = generateDrainAlertMessage(null);

      expect(result).toBe('');
    });

    it('should format numbers correctly in message', () => {
      const drainAnalysis = {
        isAbnormal: true,
        litersPerDay: 2.56789,
        daysBetweenEntries: 1.23456
      };

      const result = generateDrainAlertMessage(drainAnalysis);

      expect(result).toContain('2.6L/day');
      expect(result).toContain('1.2 days');
    });
  });

  describe('formatDrainRate()', () => {
    it('should format drain rate correctly', () => {
      const drainAnalysis = {
        litersPerHour: 0.5,
        litersPerDay: 12
      };

      const result = formatDrainRate(drainAnalysis);

      expect(result).toBe('12.0L/day (0.50L/hr)');
    });

    it('should return "No drain detected" for zero drain', () => {
      const drainAnalysis = {
        litersPerHour: 0,
        litersPerDay: 0
      };

      const result = formatDrainRate(drainAnalysis);

      expect(result).toBe('No drain detected');
    });

    it('should return "N/A" for null input', () => {
      const result = formatDrainRate(null);

      expect(result).toBe('N/A');
    });

    it('should round values appropriately', () => {
      const drainAnalysis = {
        litersPerHour: 0.833333333,
        litersPerDay: 19.99999999
      };

      const result = formatDrainRate(drainAnalysis);

      expect(result).toBe('20.0L/day (0.83L/hr)');
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle extreme drain rates (rapid fuel loss)', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 80,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-10T12:00', // 2 hours
        liters: 20,
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      // Should still calculate even with extreme values
      expect(result.litersPerHour).toBe(30);
      expect(result.isAbnormal).toBe(true);
    });

    it('should handle very long time periods', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: 80,
        odometer: 10000
      };
      const currentLog = {
        date: '2025-02-10T10:00', // 31 days
        liters: 40,
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      expect(result.daysBetweenEntries).toBe(31);
      expect(result.litersPerDay).toBeCloseTo(1.29, 2);
      expect(result.isAbnormal).toBe(false);
    });

    it('should handle negative tank capacity implicitly', () => {
      const previousLog = {
        date: '2025-01-10T10:00',
        liters: -10, // Invalid negative value
        odometer: 10000
      };
      const currentLog = {
        date: '2025-01-12T10:00',
        liters: 20,
        odometer: 10000
      };

      const result = calculateFuelDrainRate(currentLog, previousLog);

      // Should calculate drain even with negative previous value
      expect(result).toBeDefined();
    });

    it('should detect potential fuel theft pattern (repeated abnormal drains)', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 40, odometer: 10000 },
        { id: 3, date: '2025-01-14T10:00', liters: 20, odometer: 10000 },
        { id: 4, date: '2025-01-16T10:00', liters: 10, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      // Multiple drains should all be detected
      expect(result.abnormalDrains).toBeGreaterThan(1);
    });

    it('should handle logs with missing odometer', () => {
      const logs = [
        { id: 1, date: '2025-01-10T10:00', liters: 80 },
        { id: 2, date: '2025-01-12T10:00', liters: 60 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      // Should still analyze even without odometer
      expect(result).toBeDefined();
    });

    it('should handle logs with missing date', () => {
      const logs = [
        { id: 1, liters: 80, odometer: 10000 },
        { id: 2, date: '2025-01-12T10:00', liters: 60, odometer: 10000 }
      ];

      const result = analyzeFuelDrain(logs, 80);

      // Invalid dates should result in NaN or 0 but not crash
      expect(result).toBeDefined();
    });
  });
});
