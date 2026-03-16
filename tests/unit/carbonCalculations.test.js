/**
 * Carbon Footprint Calculations
 */
import { describe, it, expect } from 'vitest';
import {
  getEmissionFactor,
  calculateCO2PerTrip,
  calculateCO2ByDistance,
  calculateTotalCO2,
  calculateCO2PerKm,
  calculateMonthlyCO2,
  calculateYearlyCO2,
  compareWithAverage,
  calculateEcoDrivingScore,
  formatCO2Label
} from '../../src/utils/carbonCalculations';

describe('CO2 Emission Factors', () => {
  it('should return gasoline emission factor', () => {
    const result = getEmissionFactor('gasoline');
    expect(result).toBe(2.31);
  });

  it('should return diesel emission factor', () => {
    const result = getEmissionFactor('diesel');
    expect(result).toBe(2.68);
  });

  it('should return LPG emission factor', () => {
    const result = getEmissionFactor('lpg');
    expect(result).toBe(1.53);
  });

  it('should default to gasoline for null fuel type', () => {
    const result = getEmissionFactor(null);
    expect(result).toBe(2.31);
  });

  it('should default to gasoline for invalid fuel type', () => {
    const result = getEmissionFactor('unknown');
    expect(result).toBe(2.31);
  });

  it('should handle regular gasoline variant', () => {
    const result = getEmissionFactor('regular gasoline');
    expect(result).toBe(2.31);
  });

  it('should handle premium gasoline variant', () => {
    const result = getEmissionFactor('premium gasoline');
    expect(result).toBe(2.31);
  });

  it('should handle hybrid emission factor', () => {
    const result = getEmissionFactor('hybrid');
    expect(result).toBe(1.5);
  });

  it('should return 0 for electric vehicles', () => {
    const result = getEmissionFactor('electric');
    expect(result).toBe(0);
  });
});

describe('CO2 Per Trip Calculations', () => {
  it('should calculate CO2 for gasoline trip', () => {
    const result = calculateCO2PerTrip(100, 'gasoline');
    expect(result).toBeCloseTo(231, 1);
  });

  it('should calculate CO2 for diesel trip', () => {
    const result = calculateCO2PerTrip(100, 'diesel');
    expect(result).toBeCloseTo(268, 1);
  });

  it('should calculate CO2 for LPG trip', () => {
    const result = calculateCO2PerTrip(100, 'lpg');
    expect(result).toBeCloseTo(153, 1);
  });

  it('should return 0 for zero liters', () => {
    const result = calculateCO2PerTrip(0, 'gasoline');
    expect(result).toBe(0);
  });

  it('should return 0 for negative liters', () => {
    const result = calculateCO2PerTrip(-10, 'gasoline');
    expect(result).toBe(0);
  });
});

describe('CO2 By Distance Calculations', () => {
  it('should calculate CO2 by distance', () => {
    const result = calculateCO2ByDistance(100, 'gasoline', 15);
    const expectedLiters = 100 / 15;
    const expectedCO2 = expectedLiters * 2.31;
    expect(result).toBeCloseTo(expectedCO2, 2);
  });

  it('should return 0 for zero distance', () => {
    const result = calculateCO2ByDistance(0, 'gasoline', 15);
    expect(result).toBe(0);
  });

  it('should return 0 for negative distance', () => {
    const result = calculateCO2ByDistance(-100, 'gasoline', 15);
    expect(result).toBe(0);
  });

  it('should return 0 for zero efficiency', () => {
    const result = calculateCO2ByDistance(100, 'gasoline', 0);
    expect(result).toBe(0);
  });

  it('should return 0 for negative efficiency', () => {
    const result = calculateCO2ByDistance(100, 'gasoline', -15);
    expect(result).toBe(0);
  });
});

describe('Total CO2 Calculations', () => {
  it('should calculate total CO2 from multiple trips', () => {
    const logs = [
      { liters: 20, fuelType: 'gasoline' },
      { liters: 30, fuelType: 'gasoline' },
      { liters: 25, fuelType: 'diesel' }
    ];
    const result = calculateTotalCO2(logs, 'gasoline');
    const expected = (20 * 2.31) + (30 * 2.31) + (25 * 2.68);
    expect(result).toBeCloseTo(expected, 1);
  });

  it('should return 0 for empty logs array', () => {
    const result = calculateTotalCO2([]);
    expect(result).toBe(0);
  });

  it('should return 0 for null logs', () => {
    const result = calculateTotalCO2(null);
    expect(result).toBe(0);
  });

  it('should use fallback fuel type when not in log', () => {
    const logs = [
      { liters: 20 }
    ];
    const result = calculateTotalCO2(logs, 'diesel');
    expect(result).toBeCloseTo(20 * 2.68, 1);
  });

  it('should handle logs with fuelType priority', () => {
    const logs = [
      { liters: 20, fuelType: 'gasoline' }
    ];
    const result = calculateTotalCO2(logs, 'diesel');
    expect(result).toBeCloseTo(20 * 2.31, 1);
  });
});

describe('CO2 Per Kilometer', () => {
  it('should calculate CO2 per km', () => {
    const result = calculateCO2PerKm(231, 100);
    expect(result).toBeCloseTo(2.31, 2);
  });

  it('should return 0 for zero total CO2', () => {
    const result = calculateCO2PerKm(0, 100);
    expect(result).toBe(0);
  });

  it('should return 0 for zero distance', () => {
    const result = calculateCO2PerKm(231, 0);
    expect(result).toBe(0);
  });

  it('should handle negative distance', () => {
    const result = calculateCO2PerKm(231, -100);
    expect(result).toBeLessThan(0);
  });
});

describe('Monthly CO2 Calculations', () => {
  it('should aggregate monthly CO2 emissions', () => {
    const logs = [
      { date: '2025-01-05', liters: 20, fuelType: 'gasoline' },
      { date: '2025-01-15', liters: 30, fuelType: 'gasoline' },
      { date: '2025-01-25', liters: 25, fuelType: 'gasoline' },
      { date: '2025-02-05', liters: 20, fuelType: 'gasoline' }
    ];
    const result = calculateMonthlyCO2(logs, 'gasoline');
    const januaryResult = result.find(r => r.month === '2025-01');
    expect(januaryResult).toBeDefined();
    expect(januaryResult.co2).toBeCloseTo(173, 0);
  });

  it('should return empty array for empty logs', () => {
    const result = calculateMonthlyCO2([]);
    expect(result).toEqual([]);
  });

  it('should sort months chronologically', () => {
    const logs = [
      { date: '2025-03-05', liters: 20, fuelType: 'gasoline' },
      { date: '2025-01-05', liters: 20, fuelType: 'gasoline' },
      { date: '2025-02-05', liters: 20, fuelType: 'gasoline' }
    ];
    const result = calculateMonthlyCO2(logs, 'gasoline');
    expect(result[0].month).toBe('2025-01');
    expect(result[1].month).toBe('2025-02');
    expect(result[2].month).toBe('2025-03');
  });
});

describe('Yearly CO2 Calculations', () => {
  it('should aggregate yearly CO2 emissions', () => {
    const logs = [
      { date: '2024-01-05', liters: 20, fuelType: 'gasoline' },
      { date: '2024-06-15', liters: 30, fuelType: 'gasoline' },
      { date: '2025-01-05', liters: 25, fuelType: 'gasoline' }
    ];
    const result = calculateYearlyCO2(logs, 'gasoline');
    const year2024 = result.find(r => r.year === 2024);
    const year2025 = result.find(r => r.year === 2025);
    expect(year2024).toBeDefined();
    expect(year2025).toBeDefined();
  });

  it('should return empty array for empty logs', () => {
    const result = calculateYearlyCO2([]);
    expect(result).toEqual([]);
  });

  it('should sort years chronologically', () => {
    const logs = [
      { date: '2025-01-05', liters: 20, fuelType: 'gasoline' },
      { date: '2023-01-05', liters: 20, fuelType: 'gasoline' },
      { date: '2024-01-05', liters: 20, fuelType: 'gasoline' }
    ];
    const result = calculateYearlyCO2(logs, 'gasoline');
    expect(result[0].year).toBe(2023);
    expect(result[1].year).toBe(2024);
    expect(result[2].year).toBe(2025);
  });
});

describe('Compare With Average', () => {
  it('should return better than average when user CO2 is lower', () => {
    const result = compareWithAverage(0.15, 'sedan');
    expect(result.userCO2).toBe(0.15);
    expect(result.percentage).toBeLessThan(0);
    expect(result.status).toBeDefined();
  });

  it('should return neutral for null user CO2', () => {
    const result = compareWithAverage(null, 'sedan');
    expect(result.userCO2).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.status).toBeDefined();
  });

  it('should return neutral for undefined user CO2', () => {
    const result = compareWithAverage(undefined, 'sedan');
    expect(result.userCO2).toBe(0);
  });

  it('should return neutral for NaN user CO2', () => {
    const result = compareWithAverage(NaN, 'sedan');
    expect(result.userCO2).toBe(0);
  });

  it('should return neutral for zero or negative user CO2', () => {
    const result = compareWithAverage(0, 'sedan');
    expect(result.userCO2).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('should handle different vehicle types', () => {
    const sedanResult = compareWithAverage(0.2, 'sedan');
    const suvResult = compareWithAverage(0.3, 'suv');
    expect(sedanResult.averageCO2).not.toBe(suvResult.averageCO2);
  });
});

describe('Eco-Driving Score', () => {
  it('should return default score for insufficient logs', () => {
    const result = calculateEcoDrivingScore([]);
    expect(result.score).toBe(75);
    expect(result.category).toBe('neutral');
  });

  it('should return default score for 2 logs', () => {
    const logs = [
      { mileage: 15, date: '2025-01-01' },
      { mileage: 16, date: '2025-01-10' }
    ];
    const result = calculateEcoDrivingScore(logs);
    expect(result.score).toBe(75);
  });

  it('should calculate score for sufficient logs', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      mileage: 15 + (i * 0.1),
      date: `2025-01-${(i + 1) * 3}`,
      isFlagged: false
    }));
    const result = calculateEcoDrivingScore(logs);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should clamp score between 0 and 100', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      mileage: 30, // Very high mileage
      date: `2025-01-${(i + 1) * 3}`,
      isFlagged: false
    }));
    const result = calculateEcoDrivingScore(logs);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should include suggestions based on category', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      mileage: 10, // Low mileage (poor)
      date: `2025-01-${(i + 1) * 3}`,
      isFlagged: false
    }));
    const result = calculateEcoDrivingScore(logs);
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('should include flagged entry suggestions', () => {
    const logs = Array.from({ length: 10 }, (_, i) => ({
      mileage: 15,
      date: `2025-01-${(i + 1) * 3}`,
      isFlagged: i < 2 // First 2 entries flagged
    }));
    const result = calculateEcoDrivingScore(logs);
    const flaggedSuggestion = result.suggestions.find(s => s.includes('flagged'));
    expect(flaggedSuggestion).toBeDefined();
  });
});

describe('Format CO2 Label', () => {
  it('should format CO2 in kg for values < 1000', () => {
    const result = formatCO2Label(234.56);
    expect(result).toBe('234.56 kg');
  });

  it('should format CO2 in tonnes for values >= 1000', () => {
    const result = formatCO2Label(1234.56);
    expect(result).toBe('1.23 tonnes');
  });

  it('should return "0 kg" for null value', () => {
    const result = formatCO2Label(null);
    expect(result).toBe('0 kg');
  });

  it('should return "0 kg" for undefined value', () => {
    const result = formatCO2Label(undefined);
    expect(result).toBe('0 kg');
  });

  it('should return "0 kg" for NaN value', () => {
    const result = formatCO2Label(NaN);
    expect(result).toBe('0 kg');
  });

  it('should handle string inputs', () => {
    const result = formatCO2Label('234.56');
    expect(result).toBe('234.56 kg');
  });

  it('should handle negative values', () => {
    const result = formatCO2Label(-100);
    expect(result).toBe('-100.00 kg');
  });
});

describe('Edge Cases', () => {
  it('should handle very large fuel amounts', () => {
    const result = calculateCO2PerTrip(10000, 'gasoline');
    expect(result).toBe(23100);
  });

  it('should handle very small fuel amounts', () => {
    const result = calculateCO2PerTrip(0.001, 'gasoline');
    expect(result).toBeCloseTo(0.00231, 5);
  });

  it('should handle extreme efficiency values', () => {
    const result = calculateCO2ByDistance(1000, 'gasoline', 100);
    expect(result).toBeGreaterThan(0);
  });

  it('should handle dates at month boundaries', () => {
    const logs = [
      { date: '2025-01-31T23:59:59', liters: 20, fuelType: 'gasoline' },
      { date: '2025-02-01T00:00:01', liters: 20, fuelType: 'gasoline' }
    ];
    const result = calculateMonthlyCO2(logs, 'gasoline');
    expect(result).toHaveLength(2);
  });
});
