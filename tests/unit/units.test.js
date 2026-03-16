/**
 * Unit Conversion Tests
 */
import { describe, it, expect } from 'vitest';
import {
  litersToGallons,
  gallonsToLiters,
  formatFuelVolume,
  formatDistance,
  calculateCostPerKm,
  calculateCostPerMile,
  formatCostPerUnit,
  getCurrencySymbol,
  enrichLogWithCostAnalysis,
  convertTankCapacity,
  convertDistance,
  convertEfficiency,
  getUSCUnits,
  getMetricUnits,
  formatEfficiency,
  convertLogFuelVolume,
  UNIT_SYSTEMS,
  DISTANCE_UNITS,
  VOLUME_UNITS,
  EFFICIENCY_UNITS
} from '../../src/utils/units';

describe('Volume Conversions', () => {
  it('should convert liters to US gallons', () => {
    const result = litersToGallons(100);
    expect(result).toBeCloseTo(26.42, 2);
  });

  it('should convert gallons to liters', () => {
    const result = gallonsToLiters(100);
    expect(result).toBeCloseTo(378.54, 2);
  });

  it('should handle zero liters', () => {
    const result = litersToGallons(0);
    expect(result).toBe(0);
  });

  it('should handle negative liters', () => {
    const result = litersToGallons(-100);
    expect(result).toBeLessThan(0);
  });

  it('should handle very large values', () => {
    const result = litersToGallons(1000000);
    expect(result).toBeCloseTo(264172, 0);
  });
});

describe('Format Fuel Volume', () => {
  it('should format in liters', () => {
    const result = formatFuelVolume(50, 'L', 2);
    expect(result).toBe('50.00 L');
  });

  it('should format in gallons', () => {
    const result = formatFuelVolume(50, 'gal', 2);
    expect(result).toBe('13.21 gal');
  });

  it('should use default decimal places', () => {
    const result = formatFuelVolume(50, 'L');
    expect(result).toBe('50.00 L');
  });

  it('should use custom decimal places', () => {
    const result = formatFuelVolume(50, 'L', 1);
    expect(result).toBe('50.0 L');
  });

  it('should handle zero volume', () => {
    const result = formatFuelVolume(0, 'L');
    expect(result).toBe('0.00 L');
  });
});

describe('Format Distance', () => {
  it('should format in kilometers', () => {
    const result = formatDistance(100, 'km', 0);
    expect(result).toBe('100 km');
  });

  it('should format in miles', () => {
    const result = formatDistance(100, 'mi', 0);
    expect(result).toBe('62 mi');
  });

  it('should use default decimal places', () => {
    const result = formatDistance(100.5, 'km');
    expect(result).toBe('101 km');
  });

  it('should use custom decimal places', () => {
    const result = formatDistance(100.5, 'km', 2);
    expect(result).toBe('100.50 km');
  });
});

describe('Cost Calculations', () => {
  it('should calculate cost per kilometer', () => {
    const result = calculateCostPerKm(150, 1000);
    expect(result).toBe(0.15);
  });

  it('should return null for zero distance', () => {
    const result = calculateCostPerKm(150, 0);
    expect(result).toBeNull();
  });

  it('should return null for null cost', () => {
    const result = calculateCostPerKm(null, 1000);
    expect(result).toBeNull();
  });

  it('should calculate cost per mile', () => {
    const result = calculateCostPerMile(150, 1000);
    expect(result).toBeCloseTo(0.24, 2);
  });

  it('should return null for zero distance in miles', () => {
    const result = calculateCostPerMile(150, 0);
    expect(result).toBeNull();
  });
});

describe('Format Cost Per Unit', () => {
  it('should format cost per km', () => {
    const result = formatCostPerUnit(150, 1000, 'km', 'USD');
    expect(result).toBe('$0.150/km');
  });

  it('should format cost per mile', () => {
    const result = formatCostPerUnit(150, 1000, 'mi', 'USD');
    expect(result).toBe('$0.241/mi');
  });

  it('should return null for invalid calculation', () => {
    const result = formatCostPerUnit(150, 0, 'km', 'USD');
    expect(result).toBeNull();
  });
});

describe('Currency Symbols', () => {
  it('should get USD symbol', () => {
    const result = getCurrencySymbol('USD');
    expect(result).toBe('$');
  });

  it('should get EUR symbol', () => {
    const result = getCurrencySymbol('EUR');
    expect(result).toBe('€');
  });

  it('should get GBP symbol', () => {
    const result = getCurrencySymbol('GBP');
    expect(result).toBe('£');
  });

  it('should get INR symbol', () => {
    const result = getCurrencySymbol('INR');
    expect(result).toBe('₹');
  });

  it('should get PKR symbol', () => {
    const result = getCurrencySymbol('PKR');
    expect(result).toBe('₨');
  });

  it('should default to $ for unknown currency', () => {
    const result = getCurrencySymbol('UNKNOWN');
    expect(result).toBe('$');
  });

  it('should default to $ when no currency provided', () => {
    const result = getCurrencySymbol();
    expect(result).toBe('$');
  });
});

describe('Enrich Log with Cost Analysis', () => {
  it('should enrich log with cost calculations', () => {
    const log = {
      price: 120,
      distance: 800,
      liters: 50
    };

    const enriched = enrichLogWithCostAnalysis(log, 'km', 'USD');

    expect(enriched.costPerKm).toBe(0.15);
    expect(enriched.costPerMile).toBeCloseTo(0.24, 2);
    expect(enriched.costPerUnitDisplay).toBe('$0.150/km');
  });

  it('should handle log without price', () => {
    const log = {
      distance: 800,
      liters: 50
    };

    const enriched = enrichLogWithCostAnalysis(log, 'km', 'USD');

    expect(enriched.costPerKm).toBeUndefined();
  });

  it('should handle log without distance', () => {
    const log = {
      price: 120,
      liters: 50
    };

    const enriched = enrichLogWithCostAnalysis(log, 'km', 'USD');

    expect(enriched.costPerKm).toBeUndefined();
  });
});

describe('Tank Capacity Conversion', () => {
  it('should convert liters to gallons', () => {
    const result = convertTankCapacity(50, 'gal');
    expect(result).toBeCloseTo(13.21, 2);
  });

  it('should keep as liters when unit is L', () => {
    const result = convertTankCapacity(50, 'L');
    expect(result).toBe(50);
  });
});

describe('Distance Conversion', () => {
  it('should convert km to miles', () => {
    const result = convertDistance(100, 'km', 'mi');
    expect(result).toBeCloseTo(62.14, 2);
  });

  it('should convert miles to km', () => {
    const result = convertDistance(100, 'mi', 'km');
    expect(result).toBeCloseTo(160.93, 2);
  });

  it('should return same value when units match', () => {
    const result = convertDistance(100, 'km', 'km');
    expect(result).toBe(100);
  });

  it('should handle invalid units', () => {
    const result = convertDistance(100, 'km', 'invalid');
    expect(result).toBe(100);
  });
});

describe('Efficiency Conversion', () => {
  it('should convert km/L to mpg', () => {
    const result = convertEfficiency(15, 'km/L', 'mpg');
    expect(result).toBeCloseTo(35.28, 2);
  });

  it('should convert mpg to km/L', () => {
    const result = convertEfficiency(30, 'mpg', 'km/L');
    expect(result).toBeCloseTo(12.75, 2);
  });

  it('should return same value when units match', () => {
    const result = convertEfficiency(15, 'km/L', 'km/L');
    expect(result).toBe(15);
  });

  it('should handle invalid units', () => {
    const result = convertEfficiency(15, 'km/L', 'invalid');
    expect(result).toBe(15);
  });
});

describe('Unit System Constants', () => {
  it('should export USC unit system', () => {
    expect(UNIT_SYSTEMS.USCS).toBe('USC');
  });

  it('should export Metric unit system', () => {
    expect(UNIT_SYSTEMS.METRIC).toBe('Metric');
  });

  it('should export distance units', () => {
    expect(DISTANCE_UNITS.MILES).toBe('mi');
    expect(DISTANCE_UNITS.KILOMETERS).toBe('km');
  });

  it('should export volume units', () => {
    expect(VOLUME_UNITS.GALLONS).toBe('gal');
    expect(VOLUME_UNITS.LITERS).toBe('L');
  });

  it('should export efficiency units', () => {
    expect(EFFICIENCY_UNITS.MPG).toBe('mpg');
    expect(EFFICIENCY_UNITS.KM_L).toBe('km/L');
  });
});

describe('Get USC Units', () => {
  it('should return USC unit configuration', () => {
    const units = getUSCUnits();

    expect(units.distance).toBe('mi');
    expect(units.volume).toBe('gal');
    expect(units.efficiency).toBe('mpg');
  });
});

describe('Get Metric Units', () => {
  it('should return Metric unit configuration', () => {
    const units = getMetricUnits();

    expect(units.distance).toBe('km');
    expect(units.volume).toBe('L');
    expect(units.efficiency).toBe('km/L');
  });
});

describe('Format Efficiency', () => {
  it('should format km/L', () => {
    const result = formatEfficiency(15.5, 'km/L', 1);
    expect(result).toBe('15.5 km/L');
  });

  it('should format mpg', () => {
    const result = formatEfficiency(30.5, 'mpg', 1);
    expect(result).toBe('30.5 mpg');
  });

  it('should use default decimal places', () => {
    const result = formatEfficiency(15.567, 'km/L');
    expect(result).toBe('15.6 km/L');
  });

  it('should use custom decimal places', () => {
    const result = formatEfficiency(15.567, 'km/L', 3);
    expect(result).toBe('15.567 km/L');
  });
});

describe('Convert Log Fuel Volume', () => {
  it('should return same log when units match', () => {
    const log = { odometer: 10000, liters: 50, distance: 800 };
    const result = convertLogFuelVolume(log, 'L', 'L');

    expect(result).toEqual(log);
  });

  it('should convert liters to gallons', () => {
    const log = { odometer: 10000, liters: 50, distance: 800 };
    const result = convertLogFuelVolume(log, 'L', 'gal');

    expect(result.liters).toBeCloseTo(13.21, 2);
  });

  it('should convert gallons to liters', () => {
    const log = { odometer: 10000, liters: 13.21, distance: 800 };
    const result = convertLogFuelVolume(log, 'gal', 'L');

    expect(result.liters).toBeCloseTo(50, 0);
  });

  it('should recalculate mileage after conversion', () => {
    const log = { odometer: 10000, liters: 50, distance: 800 };
    const result = convertLogFuelVolume(log, 'L', 'gal');

    expect(result.mileage).toBeGreaterThan(0);
  });
});

describe('Edge Cases', () => {
  it('should handle negative volume values', () => {
    const result = litersToGallons(-100);
    expect(result).toBeLessThan(0);
  });

  it('should handle very small volume values', () => {
    const result = litersToGallons(0.001);
    expect(result).toBeGreaterThan(0);
  });

  it('should handle very large distance values', () => {
    const result = formatDistance(1000000, 'km');
    expect(result).toContain('1000000');
  });

  it('should handle negative distance values', () => {
    const result = formatDistance(-100, 'km');
    expect(result).toContain('-100');
  });

  it('should handle null cost in cost per unit', () => {
    const result = formatCostPerUnit(null, 1000, 'km', 'USD');
    expect(result).toBeNull();
  });

  it('should handle zero cost in cost per unit', () => {
    const result = formatCostPerUnit(0, 1000, 'km', 'USD');
    expect(result).toBe('$0.000/km');
  });

  it('should handle unicode currency symbols', () => {
    const result = getCurrencySymbol('CNY');
    expect(result).toBe('¥');
  });

  it('should handle unknown currency code', () => {
    const result = getCurrencySymbol('XYZ');
    expect(result).toBe('$');
  });

  it('should handle negative efficiency values', () => {
    const result = convertEfficiency(-10, 'km/L', 'mpg');
    expect(result).toBeLessThan(0);
  });

  it('should handle zero efficiency values', () => {
    const result = formatEfficiency(0, 'km/L');
    expect(result).toBe('0.0 km/L');
  });
});
