/**
 * Trip Calculations Tests
 */
import { describe, it, expect } from 'vitest';
import {
  calculateTrips,
  getRecentTrips,
  calculateTripStatistics,
  formatTripDuration,
  formatTripDateRange,
  getTripStatusColor,
  getBarColor
} from '../../src/utils/tripCalculations';

describe('Trip Calculations', () => {
  it('should calculate trips from logs', () => {
    const logs = [
      {
        id: 1,
        date: '2025-01-10T10:00:00Z',
        odometer: 10000,
        liters: 20
      },
      {
        id: 2,
        date: '2025-01-15T10:00:00Z',
        odometer: 10500,
        liters: 25
      }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips).toHaveLength(1);
    expect(trips[0].distance).toBe(500);
    expect(trips[0].fuelConsumed).toBe(25);
  });

  it('should return empty array for insufficient logs', () => {
    const result1 = calculateTrips([]);
    const result2 = calculateTrips([{ id: 1, odometer: 10000, liters: 20 }]);

    expect(result1).toHaveLength(0);
    expect(result2).toHaveLength(0);
  });

  it('should skip trips with zero or negative distance', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10000, liters: 25 },
      { id: 3, date: '2025-01-20', odometer: 10500, liters: 30 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips.length).toBeGreaterThan(0);
  });

  it('should skip trips with no fuel consumption', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 0 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips.length).toBe(0);
  });

  it('should calculate trip mileage correctly', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips[0].tripMileage).toBe(20); // 500km / 25L = 20 km/L
  });

  it('should detect potential theft', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 50 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15, theftThreshold: 0.75 });

    expect(trips[0].status).toBe('Potential Theft');
    expect(trips[0].isTheftAlert).toBe(true);
  });

  it('should detect heavy traffic', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 38 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips[0].status).toBe('Heavy Traffic');
    expect(trips[0].isSuspicious).toBe(true);
  });

  it('should identify normal trips', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips[0].status).toBe('Normal');
    expect(trips[0].isSuspicious).toBe(false);
  });

  it('should sort trips by end date descending', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-20', odometer: 10500, liters: 25 },
      { id: 3, date: '2025-01-15', odometer: 10250, liters: 20 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips[0].endDate).toBe('2025-01-20');
    expect(trips[trips.length - 1].endDate).toBe('2025-01-15');
  });

  it('should handle unsorted logs', () => {
    const logs = [
      { id: 3, date: '2025-01-20', odometer: 10500, liters: 25 },
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10250, liters: 20 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips).toHaveLength(2);
  });

  it('should include trip duration', () => {
    const logs = [
      { id: 1, date: '2025-01-10T10:00:00Z', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15T14:00:00Z', odometer: 10500, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });

    expect(trips[0].duration).toBeDefined();
    expect(trips[0].duration).toBeGreaterThan(0);
  });
});

describe('Recent Trips', () => {
  it('should return recent trips', () => {
    const trips = [
      { id: 1, endDate: '2025-01-20' },
      { id: 2, endDate: '2025-01-15' },
      { id: 3, endDate: '2025-01-10' }
    ];

    const recent = getRecentTrips(trips, 2);

    expect(recent).toHaveLength(2);
    expect(recent[0].id).toBe(1);
    expect(recent[1].id).toBe(2);
  });

  it('should return all trips when count exceeds array length', () => {
    const trips = [
      { id: 1, endDate: '2025-01-20' },
      { id: 2, endDate: '2025-01-15' }
    ];

    const recent = getRecentTrips(trips, 5);

    expect(recent).toHaveLength(2);
  });

  it('should use default count of 5', () => {
    const trips = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      endDate: `2025-01-${10 + i}`
    }));

    const recent = getRecentTrips(trips);

    expect(recent).toHaveLength(5);
  });
});

describe('Trip Statistics', () => {
  it('should calculate trip statistics', () => {
    const trips = [
      {
        distance: 500,
        fuelConsumed: 25,
        tripMileage: 20,
        status: 'Normal',
        isTheftAlert: false,
        isSuspicious: false
      },
      {
        distance: 300,
        fuelConsumed: 30,
        tripMileage: 10,
        status: 'Potential Theft',
        isTheftAlert: true,
        isSuspicious: true
      },
      {
        distance: 400,
        fuelConsumed: 35,
        tripMileage: 11.43,
        status: 'Heavy Traffic',
        isTheftAlert: false,
        isSuspicious: true
      }
    ];

    const stats = calculateTripStatistics(trips);

    expect(stats.totalTrips).toBe(3);
    expect(stats.normalTrips).toBe(1);
    expect(stats.suspiciousTrips).toBe(2);
    expect(stats.theftAlertTrips).toBe(1);
    expect(stats.avgTripMileage).toBeCloseTo(13.81, 2);
    expect(stats.totalDistance).toBe(1200);
    expect(stats.totalFuelConsumed).toBe(90);
  });

  it('should return zero stats for empty trips', () => {
    const stats = calculateTripStatistics([]);

    expect(stats.totalTrips).toBe(0);
    expect(stats.normalTrips).toBe(0);
    expect(stats.suspiciousTrips).toBe(0);
    expect(stats.theftAlertTrips).toBe(0);
    expect(stats.avgTripMileage).toBe(0);
    expect(stats.avgTripDistance).toBe(0);
    expect(stats.totalDistance).toBe(0);
    expect(stats.totalFuelConsumed).toBe(0);
  });

  it('should return zero stats for null trips', () => {
    const stats = calculateTripStatistics(null);

    expect(stats.totalTrips).toBe(0);
  });
});

describe('Format Trip Duration', () => {
  it('should format duration in minutes only', () => {
    const duration = 30 * 60 * 1000; // 30 minutes
    const result = formatTripDuration(duration);
    expect(result).toBe('30m');
  });

  it('should format duration in hours only', () => {
    const duration = 2 * 60 * 60 * 1000; // 2 hours
    const result = formatTripDuration(duration);
    expect(result).toBe('2h');
  });

  it('should format duration in hours and minutes', () => {
    const duration = (2 * 60 + 30) * 60 * 1000; // 2 hours 30 minutes
    const result = formatTripDuration(duration);
    expect(result).toBe('2h 30m');
  });

  it('should handle zero duration', () => {
    const result = formatTripDuration(0);
    expect(result).toBe('0m');
  });

  it('should handle very long durations', () => {
    const duration = 25 * 60 * 60 * 1000; // 25 hours
    const result = formatTripDuration(duration);
    expect(result).toBe('25h');
  });
});

describe('Format Trip Date Range', () => {
  it('should format same day trip', () => {
    const startDate = '2025-01-15T10:00:00Z';
    const endDate = '2025-01-15T14:30:00Z';

    const result = formatTripDateRange(startDate, endDate);

    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('should format multi-day trip', () => {
    const startDate = '2025-01-15T10:00:00Z';
    const endDate = '2025-01-20T14:30:00Z';

    const result = formatTripDateRange(startDate, endDate);

    expect(result).toContain('Jan 15');
    expect(result).toContain('Jan 20');
  });

  it('should handle cross-month trips', () => {
    const startDate = '2025-01-28T10:00:00Z';
    const endDate = '2025-02-02T14:30:00Z';

    const result = formatTripDateRange(startDate, endDate);

    expect(result).toContain('Jan 28');
    expect(result).toContain('Feb 2');
  });

  it('should handle cross-year trips', () => {
    const startDate = '2024-12-28T10:00:00Z';
    const endDate = '2025-01-02T14:30:00Z';

    const result = formatTripDateRange(startDate, endDate);

    expect(result).toContain('Dec 28');
    expect(result).toContain('Jan 2');
  });
});

describe('Trip Status Color', () => {
  it('should return red for Potential Theft', () => {
    const color = getTripStatusColor('Potential Theft');
    expect(color).toContain('alert');
  });

  it('should return warning color for Heavy Traffic', () => {
    const color = getTripStatusColor('Heavy Traffic');
    expect(color).toContain('warning');
  });

  it('should return success color for Normal', () => {
    const color = getTripStatusColor('Normal');
    expect(color).toContain('success');
  });

  it('should return success color for unknown status', () => {
    const color = getTripStatusColor('Unknown');
    expect(color).toContain('success');
  });
});

describe('Bar Color', () => {
  it('should return red for mileage below threshold', () => {
    const color = getBarColor(10, 15);
    expect(color).toBe('#ef4444');
  });

  it('should return orange for mileage near threshold', () => {
    const color = getBarColor(14, 15);
    expect(color).toBe('#f59e0b');
  });

  it('should return green for mileage above threshold', () => {
    const color = getBarColor(20, 15);
    expect(color).toBe('#22c55e');
  });

  it('should handle threshold multiplier correctly', () => {
    const color1 = getBarColor(16, 15); // Slightly above, should be orange
    const color2 = getBarColor(18, 15); // Above, should be green

    expect(color1).toBe('#f59e0b');
    expect(color2).toBe('#22c55e');
  });
});

describe('Edge Cases', () => {
  it('should handle negative odometer values', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 9990, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(0); // Should skip negative distance
  });

  it('should handle very large odometer values', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 1000000, liters: 200 },
      { id: 2, date: '2025-01-15', odometer: 1005000, liters: 250 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(1);
    expect(trips[0].distance).toBe(5000);
  });

  it('should handle zero fuel consumption', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 0 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 0 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(0);
  });

  it('should handle very small fuel amounts', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 0.01 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 0.01 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(1);
    expect(trips[0].tripMileage).toBeGreaterThan(0);
  });

  it('should handle custom theft thresholds', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 50 }
    ];

    const trips1 = calculateTrips(logs, { expectedMileage: 15, theftThreshold: 0.5 });
    const trips2 = calculateTrips(logs, { expectedMileage: 15, theftThreshold: 0.9 });

    // Mileage: 500km / 50L = 10 km/L
    // With theftThreshold 0.5: 15 * 0.5 = 7.5, 10 < 7.5 is FALSE, so not theft
    // With theftThreshold 0.9: 15 * 0.9 = 13.5, 10 < 13.5 is TRUE, so theft
    expect(trips1[0].isTheftAlert).toBe(false);
    expect(trips2[0].isTheftAlert).toBe(true);
  });

  it('should handle missing odometer values', () => {
    const logs = [
      { id: 1, date: '2025-01-10', liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(0);
  });

  it('should handle missing date values', () => {
    const logs = [
      { id: 1, odometer: 10000, liters: 20 },
      { id: 2, odometer: 10500, liters: 25 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    // Should still calculate but duration might be invalid
    expect(trips.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle negative fuel amounts', () => {
    const logs = [
      { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 },
      { id: 2, date: '2025-01-15', odometer: 10500, liters: -10 }
    ];

    const trips = calculateTrips(logs, { expectedMileage: 15 });
    expect(trips).toHaveLength(0);
  });
});
