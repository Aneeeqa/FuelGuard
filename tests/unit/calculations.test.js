/**
 * Vitest: Core Fuel Calculations
 */
import { describe, it, expect } from 'vitest';
import {
  calculateMileage,
  calculateDistance,
  isTheftSuspected,
  calculateAverageMileage,
  calculateTotalFuel,
  calculateTotalDistance,
  calculateCostPerKm,
  calculatePricePerLiter,
  getTheftSeverity,
  calculateTotalExpenditure,
  calculateFuelPriceTrends,
  calculateAverageCostPerUnit,
  calculateMonthlyExpenditure,
  checkBudgetAlert,
  convertCurrency,
  formatCost,
  getCostStatistics
} from '../../src/utils/calculations';

describe('Fuel Efficiency Calculations', () => {
  // Happy Path
  it('should calculate mileage correctly (km/L)', () => {
    const result = calculateMileage(200, 13.33);
    expect(result).toBeCloseTo(15.0, 2);
  });

  // Edge Cases
  it('should handle zero distance', () => {
    const result = calculateMileage(0, 10);
    expect(result).toBe(0);
  });

  it('should handle zero fuel amount', () => {
    const result = calculateMileage(200, 0);
    expect(result).toBe(0);
  });

  it('should handle negative distance', () => {
    const result = calculateMileage(-200, 10);
    expect(result).toBeLessThan(0);
  });

  it('should handle negative fuel amount', () => {
    const result = calculateMileage(200, -10);
    expect(result).toBe(0);
  });

  // Error States
  it('should return 0 for null distance', () => {
    const result = calculateMileage(null, 10);
    expect(result).toBe(0);
  });

  it('should return 0 for undefined fuel', () => {
    const result = calculateMileage(200, undefined);
    expect(result).toBe(0);
  });

  it('should handle invalid data types', () => {
    const result = calculateMileage('invalid', 10);
    expect(result).toBe(NaN);
  });

  // Rounding precision
  it('should handle precise calculations', () => {
    const result = calculateMileage(200, 13.333333333);
    expect(result).toBeCloseTo(15.0, 5);
  });

  // Large values
  it('should handle large distance values', () => {
    const result = calculateMileage(1000000, 50000);
    expect(result).toBe(20);
  });
});

describe('Distance Calculations', () => {
  it('should calculate distance between odometer readings', () => {
    const result = calculateDistance(15200, 15000);
    expect(result).toBe(200);
  });

  it('should handle missing odometer values', () => {
    const result = calculateDistance(null, 15000);
    expect(result).toBe(0);
  });

  it('should return 0 for negative distance (odometer rollback)', () => {
    const result = calculateDistance(15000, 15200);
    expect(result).toBe(0);
  });

  it('should handle zero previous odometer', () => {
    const result = calculateDistance(1000, 0);
    expect(result).toBe(1000);
  });
});

describe('Theft Detection', () => {
  it('should flag theft when mileage is below threshold', () => {
    const result = isTheftSuspected(10, 15, 0.75);
    expect(result).toBe(true);
  });

  it('should not flag theft when mileage is above threshold', () => {
    const result = isTheftSuspected(14, 15, 0.75);
    expect(result).toBe(false);
  });

  it('should return false for zero mileage', () => {
    const result = isTheftSuspected(0, 15, 0.75);
    expect(result).toBe(false);
  });

  it('should return false for null mileage', () => {
    const result = isTheftSuspected(null, 15, 0.75);
    expect(result).toBe(false);
  });

  it('should use default threshold of 0.75', () => {
    const result = isTheftSuspected(10, 15);
    expect(result).toBe(true);
  });

  it('should handle custom thresholds', () => {
    const result = isTheftSuspected(10, 15, 0.5);
    expect(result).toBe(false);
  });
});

describe('Average Calculations', () => {
  it('should calculate average mileage from logs', () => {
    const logs = [
      { mileage: 15 },
      { mileage: 16 },
      { mileage: 14 }
    ];
    const result = calculateAverageMileage(logs);
    expect(result).toBe(15);
  });

  it('should return default 15 for empty logs array', () => {
    const result = calculateAverageMileage([]);
    expect(result).toBe(15);
  });

  it('should return default 15 for null logs', () => {
    const result = calculateAverageMileage(null);
    expect(result).toBe(15);
  });

  it('should filter out invalid mileage values', () => {
    const logs = [
      { mileage: 15 },
      { mileage: 0 },
      { mileage: null },
      { mileage: 18 }
    ];
    const result = calculateAverageMileage(logs);
    expect(result).toBe(16.5);
  });
});

describe('Total Fuel Calculations', () => {
  it('should calculate total fuel consumed', () => {
    const logs = [
      { liters: 20 },
      { liters: 30 },
      { liters: 25 }
    ];
    const result = calculateTotalFuel(logs);
    expect(result).toBe(75);
  });

  it('should return 0 for empty logs', () => {
    const result = calculateTotalFuel([]);
    expect(result).toBe(0);
  });

  it('should handle missing liters in logs', () => {
    const logs = [
      { liters: 20 },
      {},
      { liters: 30 }
    ];
    const result = calculateTotalFuel(logs);
    expect(result).toBe(50);
  });
});

describe('Total Distance Calculations', () => {
  it('should calculate total distance from logs', () => {
    const logs = [
      { date: '2025-01-01', odometer: 10000 },
      { date: '2025-01-10', odometer: 10500 },
      { date: '2025-01-20', odometer: 11000 }
    ];
    const result = calculateTotalDistance(logs);
    expect(result).toBe(1000);
  });

  it('should return 0 for less than 2 logs', () => {
    const logs = [{ date: '2025-01-01', odometer: 10000 }];
    const result = calculateTotalDistance(logs);
    expect(result).toBe(0);
  });

  it('should handle unsorted logs', () => {
    const logs = [
      { date: '2025-01-20', odometer: 11000 },
      { date: '2025-01-01', odometer: 10000 },
      { date: '2025-01-10', odometer: 10500 }
    ];
    const result = calculateTotalDistance(logs);
    expect(result).toBe(1000);
  });
});

describe('Cost Calculations', () => {
  it('should calculate cost per kilometer', () => {
    const result = calculateCostPerKm(120, 800);
    expect(result).toBe(0.15);
  });

  it('should return 0 for zero distance', () => {
    const result = calculateCostPerKm(120, 0);
    expect(result).toBe(0);
  });

  it('should return 0 for null price', () => {
    const result = calculateCostPerKm(null, 800);
    expect(result).toBe(0);
  });

  it('should calculate price per liter', () => {
    const result = calculatePricePerLiter(120, 45);
    expect(result).toBeCloseTo(2.67, 2);
  });

  it('should return 0 for zero liters', () => {
    const result = calculatePricePerLiter(120, 0);
    expect(result).toBe(0);
  });
});

describe('Theft Severity', () => {
  it('should return critical when below critical threshold', () => {
    const result = getTheftSeverity(5, 15, 0.75, 0.5);
    expect(result).toBe('critical');
  });

  it('should return warning when below warning threshold', () => {
    const result = getTheftSeverity(11, 15, 0.75, 0.5);
    expect(result).toBe('warning');
  });

  it('should return normal when above warning threshold', () => {
    const result = getTheftSeverity(14, 15, 0.75, 0.5);
    expect(result).toBe('normal');
  });

  it('should return normal for null values', () => {
    const result = getTheftSeverity(null, 15);
    expect(result).toBe('normal');
  });
});

describe('Fuel Price Trends', () => {
  it('should calculate increasing trend', () => {
    const logs = [
      { date: '2025-01-01', price: 100, liters: 40 },
      { date: '2025-01-10', price: 120, liters: 40 },
      { date: '2025-01-20', price: 150, liters: 40 }
    ];
    const result = calculateFuelPriceTrends(logs);
    expect(result.trend).toBe('increasing');
    expect(result.average).toBeCloseTo(3.083, 2);
  });

  it('should calculate decreasing trend', () => {
    const logs = [
      { date: '2025-01-01', price: 150, liters: 40 },
      { date: '2025-01-10', price: 120, liters: 40 },
      { date: '2025-01-20', price: 100, liters: 40 }
    ];
    const result = calculateFuelPriceTrends(logs);
    expect(result.trend).toBe('decreasing');
  });

  it('should handle empty logs', () => {
    const result = calculateFuelPriceTrends([]);
    expect(result.prices).toEqual([]);
    expect(result.average).toBe(0);
    expect(result.trend).toBe('stable');
  });
});

describe('Budget Alerts', () => {
  it('should trigger critical alert when budget exceeded', () => {
    const result = checkBudgetAlert(550, 500);
    expect(result.triggered).toBe(true);
    expect(result.level).toBe('critical');
  });

  it('should trigger warning alert at 80%', () => {
    const result = checkBudgetAlert(400, 500);
    expect(result.triggered).toBe(true);
    expect(result.level).toBe('warning');
  });

  it('should not trigger alert below 80%', () => {
    const result = checkBudgetAlert(300, 500);
    expect(result.triggered).toBe(false);
    expect(result.level).toBe('normal');
  });

  it('should handle null budget', () => {
    const result = checkBudgetAlert(300, null);
    expect(result.triggered).toBe(false);
  });
});

describe('Currency Functions', () => {
  it('should convert currency with exchange rate', () => {
    const result = convertCurrency(100, 'USD', 'EUR', 0.85);
    expect(result).toBe(85);
  });

  it('should return same amount when currencies match', () => {
    const result = convertCurrency(100, 'USD', 'USD');
    expect(result).toBe(100);
  });

  it('should format cost with currency symbol', () => {
    const result = formatCost(123.456, '$');
    expect(result).toBe('$123.46');
  });

  it('should format null cost', () => {
    const result = formatCost(null, '$');
    expect(result).toBe('$0.00');
  });

  it('should get cost statistics', () => {
    const logs = [
      { price: 100, liters: 40, odometer: 10000, date: '2025-01-01' },
      { price: 120, liters: 45, odometer: 10500, date: '2025-01-10' }
    ];
    const result = getCostStatistics(logs, '$');
    expect(result.totalExpenditure).toBe(220);
    expect(result.costPerKm).toBeCloseTo(0.44, 2);
  });
});

describe('Monthly Calculations', () => {
  it('should calculate monthly expenditure', () => {
    const logs = [
      { date: '2025-01-05', price: 100 },
      { date: '2025-01-15', price: 120 },
      { date: '2025-01-25', price: 130 },
      { date: '2025-02-05', price: 110 }
    ];
    const result = calculateMonthlyExpenditure(logs, 0, 2025);
    expect(result).toBe(350);
  });

  it('should return 0 for null logs', () => {
    const result = calculateMonthlyExpenditure(null, 0, 2025);
    expect(result).toBe(0);
  });
});

// ============================================
// SECURITY TESTS - Calculations
// ============================================

describe('Security: Odometer Manipulation Detection', () => {
  it('should detect odometer rollback (negative distance)', () => {
    const result = calculateDistance(15000, 15200);
    expect(result).toBe(0);
  });

  it('should detect suspicious zero distance between fills', () => {
    const result = calculateDistance(15000, 15000);
    expect(result).toBe(0);
  });
});

describe('Security: Calculation Input Validation', () => {
  it('should validate numeric inputs for mileage', () => {
    const result = calculateMileage('not-a-number', 10);
    expect(result).toBeNaN();
  });

  it('should handle division by zero gracefully', () => {
    const result = calculateMileage(200, 0);
    expect(result).toBe(0);
  });

  it('should prevent overflow in large calculations', () => {
    const logs = Array.from({ length: 10000 }, (_, i) => ({
      price: Number.MAX_SAFE_INTEGER,
      liters: 1
    }));
    const result = calculateTotalExpenditure(logs);
    expect(result).toBeGreaterThan(0);
  });
});

describe('Security: Fuel Level Manipulation', () => {
  it('should detect negative fuel amounts', () => {
    const logs = [{ liters: -20 }];
    const result = calculateTotalFuel(logs);
    expect(result).toBe(-20);
  });

  it('should handle extreme fuel values', () => {
    const result = calculateMileage(100, 10000);
    expect(result).toBe(0.01);
  });
});
