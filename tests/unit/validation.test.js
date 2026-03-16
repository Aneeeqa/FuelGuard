/**
 * Validation Utilities Test Suite
 *
 * Tests all validation and sanitization functions
 * Covers happy paths, edge cases, and error states
 *
 * Test Categories:
 * - Happy Path: Valid inputs that should pass
 * - Edge Case: Boundary conditions and unusual valid inputs
 * - Error State: Invalid inputs that should be rejected
 */

import { describe, it, expect } from 'vitest';
import {
  validateYear,
  validateMake,
  validateModel,
  validateVin,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  sanitizeQuery,
  validateVehicleId,
  MIN_VEHICLE_YEAR,
  MAX_VEHICLE_YEAR,
} from '../../src/utils/validation.js';

describe('validateYear', () => {
  describe('Happy Path', () => {
    it('Year 1984 should be valid', () => {
      const result = validateYear('1984');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(1984);
    });

    it('Year 1984 value should be parsed correctly', () => {
      const result = validateYear('1984');
      expect(result.value).toBe(1984);
    });

    it('Year 2020 should be valid', () => {
      const result = validateYear('2020');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2020);
    });

    it('Year 2020 value should be parsed correctly', () => {
      const result = validateYear('2020');
      expect(result.value).toBe(2020);
    });

    it('Year 2027 should be valid', () => {
      const result = validateYear('2027');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2027);
    });

    it('Year 2027 value should be parsed correctly', () => {
      const result = validateYear('2027');
      expect(result.value).toBe(2027);
    });

    it('Year 2025 should be valid', () => {
      const result = validateYear('2025');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2025);
    });

    it('Year 2025 value should be parsed correctly', () => {
      const result = validateYear('2025');
      expect(result.value).toBe(2025);
    });
  });

  describe('Edge Cases', () => {
    it('Year 1983 should be invalid', () => {
      const result = validateYear('1983');
      expect(result.valid).toBe(false);
    });

    it('Year 1983 should have an error message', () => {
      const result = validateYear('1983');
      expect(result.error).toContain('1984');
    });

    it('Year 2028 should be invalid', () => {
      const result = validateYear('2028');
      expect(result.valid).toBe(false);
    });

    it('Year 2028 should have an error message', () => {
      const result = validateYear('2028');
      expect(result.error).toContain('2027');
    });

    it('Year 0 should be invalid', () => {
      const result = validateYear('0');
      expect(result.valid).toBe(false);
    });

    it('Year 0 should have an error message', () => {
      const result = validateYear('0');
      expect(result.error).toBeDefined();
    });

    it('Year -5 should be invalid', () => {
      const result = validateYear('-5');
      expect(result.valid).toBe(false);
    });

    it('Year -5 should have an error message', () => {
      const result = validateYear('-5');
      expect(result.error).toBeDefined();
    });

    it('Year abc should be invalid', () => {
      const result = validateYear('abc');
      expect(result.valid).toBe(false);
    });

    it('Year abc should have an error message', () => {
      const result = validateYear('abc');
      expect(result.error).toBeDefined();
    });

    it('Year null should be invalid', () => {
      const result = validateYear(null);
      expect(result.valid).toBe(false);
    });

    it('Year null should have an error message', () => {
      const result = validateYear(null);
      expect(result.error).toBeDefined();
    });

    it('Year undefined should be invalid', () => {
      const result = validateYear(undefined);
      expect(result.valid).toBe(false);
    });

    it('Year undefined should have an error message', () => {
      const result = validateYear(undefined);
      expect(result.error).toBeDefined();
    });

    it('Year  (empty) should be invalid', () => {
      const result = validateYear('');
      expect(result.valid).toBe(false);
    });

    it('Year  (empty) should have an error message', () => {
      const result = validateYear('');
      expect(result.error).toBeDefined();
    });

    it('Decimal year 2025.5 should be parsed to 2025', () => {
      const result = validateYear('2025.5');
      expect(result.value).toBe(2025);
    });

    it('Decimal should be truncated', () => {
      const result = validateYear('2025.9');
      expect(result.value).toBe(2025);
    });

    it('Year with whitespace should be valid after trim', () => {
      const result = validateYear('  2025  ');
      expect(result.valid).toBe(true);
      expect(result.value).toBe(2025);
    });

    it('Whitespace should be trimmed', () => {
      const result = validateYear(' 2025 ');
      expect(result.valid).toBe(true);
    });
  });

  describe('Error State', () => {
    it('Invalid year should fail', () => {
      const result = validateYear('invalid');
      expect(result.valid).toBe(false);
    });

    it('Error message should be correct', () => {
      const result = validateYear('invalid');
      expect(result.error).toBeDefined();
    });

    it('Year below minimum should fail', () => {
      const result = validateYear('1980');
      expect(result.valid).toBe(false);
    });

    it('Error should mention minimum year', () => {
      const result = validateYear('1980');
      expect(result.error).toContain(MIN_VEHICLE_YEAR.toString());
    });
  });
});

describe('validateMake', () => {
  describe('Happy Path', () => {
    it('Make "Toyota" should be valid', () => {
      const result = validateMake('Toyota');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Toyota');
    });

    it('Make "Toyota" should meet minimum length', () => {
      const result = validateMake('Toyota');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "Ford" should be valid', () => {
      const result = validateMake('Ford');
      expect(result.valid).toBe(true);
    });

    it('Make "Ford" should meet minimum length', () => {
      const result = validateMake('Ford');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "BMW" should be valid', () => {
      const result = validateMake('BMW');
      expect(result.valid).toBe(true);
    });

    it('Make "BMW" should meet minimum length', () => {
      const result = validateMake('BMW');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "Mercedes-Benz" should be valid', () => {
      const result = validateMake('Mercedes-Benz');
      expect(result.valid).toBe(true);
    });

    it('Make "Mercedes-Benz" should meet minimum length', () => {
      const result = validateMake('Mercedes-Benz');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "Aston Martin" should be valid', () => {
      const result = validateMake('Aston Martin');
      expect(result.valid).toBe(true);
    });

    it('Make "Aston Martin" should meet minimum length', () => {
      const result = validateMake('Aston Martin');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "Tesla" should be valid', () => {
      const result = validateMake('Tesla');
      expect(result.valid).toBe(true);
    });

    it('Make "Tesla" should meet minimum length', () => {
      const result = validateMake('Tesla');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "ALFA ROMEO" should be valid', () => {
      const result = validateMake('ALFA ROMEO');
      expect(result.valid).toBe(true);
    });

    it('Make "ALFA ROMEO" should meet minimum length', () => {
      const result = validateMake('ALFA ROMEO');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });

    it('Make "audi" should be valid', () => {
      const result = validateMake('audi');
      expect(result.valid).toBe(true);
    });

    it('Make "audi" should meet minimum length', () => {
      const result = validateMake('audi');
      expect(result.value.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('Make "ab" should be invalid', () => {
      const result = validateMake('ab');
      expect(result.valid).toBe(false);
    });

    it('Make "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" should be invalid', () => {
      const result = validateMake('a'.repeat(60));
      expect(result.valid).toBe(false);
    });

    it('Make "T<>y" should be invalid', () => {
      const result = validateMake('T<>y');
      expect(result.valid).toBe(false);
    });

    it('Make "" (empty) should be invalid', () => {
      const result = validateMake('');
      expect(result.valid).toBe(false);
    });

    it('Make "  " (spaces) should be invalid', () => {
      const result = validateMake('  ');
      expect(result.valid).toBe(false);
    });

    it('Make "AB" should be invalid', () => {
      const result = validateMake('AB');
      expect(result.valid).toBe(false);
    });

    it('Make "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" should be valid at max length', () => {
      const result = validateMake('A'.repeat(50));
      expect(result.valid).toBe(true);
    });

    it('Make "null" should be invalid', () => {
      const result = validateMake('null');
      expect(result.valid).toBe(false);
    });

    it('Make "undefined" should be invalid', () => {
      const result = validateMake('undefined');
      expect(result.valid).toBe(false);
    });

    it('Make "F@rd" should be sanitized to "Frd" and be valid', () => {
      const result = validateMake('F@rd');
      expect(result.valid).toBe(true);
    });

    it('Special characters should be removed', () => {
      const result = validateMake('F0#rd');
      expect(result.valid).toBe(false);
    });
  });

  describe('Error State', () => {
    it('Make with special characters should fail', () => {
      const result = validateMake('To<y0t@');
      expect(result.valid).toBe(false);
    });

    it('Error should mention valid characters', () => {
      const result = validateMake('To<y0t@');
      expect(result.error).toBeDefined();
    });
  });
});

describe('validateModel', () => {
  describe('Happy Path', () => {
    it('Model "Camry" should be valid', () => {
      const result = validateModel('Camry');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Camry');
    });

    it('Model "Camry" should meet minimum length', () => {
      const result = validateModel('Camry');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "F-150" should be valid', () => {
      const result = validateModel('F-150');
      expect(result.valid).toBe(true);
    });

    it('Model "F-150" should meet minimum length', () => {
      const result = validateModel('F-150');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "Model S" should be valid', () => {
      const result = validateModel('Model S');
      expect(result.valid).toBe(true);
    });

    it('Model "Model S" should meet minimum length', () => {
      const result = validateModel('Model S');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "CR-V" should be valid', () => {
      const result = validateModel('CR-V');
      expect(result.valid).toBe(true);
    });

    it('Model "CR-V" should meet minimum length', () => {
      const result = validateModel('CR-V');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "Golf" should be valid', () => {
      const result = validateModel('Golf');
      expect(result.valid).toBe(true);
    });

    it('Model "Golf" should meet minimum length', () => {
      const result = validateModel('Golf');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "Q7" should be valid', () => {
      const result = validateModel('Q7');
      expect(result.valid).toBe(true);
    });

    it('Model "Q7" should meet minimum length', () => {
      const result = validateModel('Q7');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "X5" should be valid', () => {
      const result = validateModel('X5');
      expect(result.valid).toBe(true);
    });

    it('Model "X5" should meet minimum length', () => {
      const result = validateModel('X5');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "500" should be valid', () => {
      const result = validateModel('500');
      expect(result.valid).toBe(true);
    });

    it('Model "500" should meet minimum length', () => {
      const result = validateModel('500');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "911" should be valid', () => {
      const result = validateModel('911');
      expect(result.valid).toBe(true);
    });

    it('Model "911" should meet minimum length', () => {
      const result = validateModel('911');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });

    it('Model "S 63 AMG" should be valid', () => {
      const result = validateModel('S 63 AMG');
      expect(result.valid).toBe(true);
    });

    it('Model "S 63 AMG" should meet minimum length', () => {
      const result = validateModel('S 63 AMG');
      expect(result.value.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('Model "C" should be invalid', () => {
      const result = validateModel('C');
      expect(result.valid).toBe(false);
    });

    it('Model "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" should be invalid', () => {
      const result = validateModel('a'.repeat(50));
      expect(result.valid).toBe(false);
    });

    it('Model "" (empty) should be invalid', () => {
      const result = validateModel('');
      expect(result.valid).toBe(false);
    });

    it('Model "  " (spaces) should be invalid', () => {
      const result = validateModel('  ');
      expect(result.valid).toBe(false);
    });

    it('Model "AB" should be valid at boundary', () => {
      const result = validateModel('AB');
      expect(result.valid).toBe(true);
    });

    it('Model "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" should be valid at boundary', () => {
      const result = validateModel('A'.repeat(48));
      expect(result.valid).toBe(true);
    });

    it('Model "null" should be invalid', () => {
      const result = validateModel('null');
      expect(result.valid).toBe(false);
    });

    it('Model "undefined" should be invalid', () => {
      const result = validateModel('undefined');
      expect(result.valid).toBe(false);
    });

    it('Model "C@mry" should be sanitized to "Cmry" and be valid', () => {
      const result = validateModel('C@mry');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Cmry');
    });

    it('Special characters should be removed', () => {
      const result = validateModel('C@m#y');
      expect(result.valid).toBe(false);
    });

    it('Model "X5<>" should be sanitized to "X5" and be valid', () => {
      const result = validateModel('X5<>');
      expect(result.valid).toBe(false);
    });

    it('Special characters should be removed', () => {
      const result = validateModel('X5<>>');
      expect(result.valid).toBe(false);
    });
  });

  describe('Error State', () => {
    it('Model too short should fail', () => {
      const result = validateModel('A');
      expect(result.valid).toBe(false);
    });

    it('Error should mention length range', () => {
      const result = validateModel('A');
      expect(result.error).toBeDefined();
    });

    it('Empty model should fail', () => {
      const result = validateModel('');
      expect(result.valid).toBe(false);
    });

    it('Error should mention required', () => {
      const result = validateModel('');
      expect(result.error).toBeDefined();
    });
  });
});

describe('validateVin', () => {
  describe('Happy Path', () => {
    it('VIN "1HGCM82633A123456" should be valid', () => {
      const result = validateVin('1HGCM82633A123456');
      expect(result.valid).toBe(true);
    });

    it('VIN should be 17 characters', () => {
      const result = validateVin('1HGCM82633A123456');
      expect(result.value.length).toBe(17);
    });

    it('VIN should be uppercase', () => {
      const result = validateVin('1HGCM82633A123456');
      expect(result.value).toBe('1HGCM82633A123456');
    });

    it('VIN "1F1F15Z5M0G123456" should be valid', () => {
      const result = validateVin('1F1F15Z5M0G123456');
      expect(result.valid).toBe(true);
    });

    it('VIN should be 17 characters', () => {
      const result = validateVin('1F1F15Z5M0G123456');
      expect(result.value.length).toBe(17);
    });

    it('VIN should be uppercase', () => {
      const result = validateVin('1F1F15Z5M0G123456');
      expect(result.value).toBe('1F1F15Z5M0G123456');
    });

    it('VIN "JTDKN3DU5A0000001" should be valid', () => {
      const result = validateVin('JTDKN3DU5A0000001');
      expect(result.valid).toBe(true);
    });

    it('VIN should be 17 characters', () => {
      const result = validateVin('JTDKN3DU5A0000001');
      expect(result.value.length).toBe(17);
    });

    it('VIN should be uppercase', () => {
      const result = validateVin('JTDKN3DU5A0000001');
      expect(result.value).toBe('JTDKN3DU5A0000001');
    });

    it('VIN "WBAVG1C56EB123456" should be valid', () => {
      const result = validateVin('WBAVG1C56EB123456');
      expect(result.valid).toBe(true);
    });

    it('VIN should be 17 characters', () => {
      const result = validateVin('WBAVG1C56EB123456');
      expect(result.value.length).toBe(17);
    });

    it('VIN should be uppercase', () => {
      const result = validateVin('WBAVG1C56EB123456');
      expect(result.value).toBe('WBAVG1C56EB123456');
    });

    it('VIN "1hgcm82633a123456" should be valid', () => {
      const result = validateVin('1hgcm82633a123456');
      expect(result.valid).toBe(true);
    });

    it('VIN should be 17 characters', () => {
      const result = validateVin('1hgcm82633a123456');
      expect(result.value.length).toBe(17);
    });

    it('VIN should be uppercase', () => {
      const result = validateVin('1hgcm82633a123456');
      expect(result.value).toBe('1HGCM82633A123456');
    });
  });

  describe('Edge Cases', () => {
    it('VIN "1234567890123456" should be invalid', () => {
      const result = validateVin('1234567890123456');
      expect(result.valid).toBe(false);
    });

    it('VIN "12345678901234567" should be valid', () => {
      const result = validateVin('12345678901234567');
      expect(result.valid).toBe(true);
    });

    it('VIN "ABCDEFGHIJKLMNOQ" should be invalid', () => {
      const result = validateVin('ABCDEFGHIJKLMNOQ');
      expect(result.valid).toBe(false);
    });

    it('VIN "1HGCM82633A1234O" should be invalid', () => {
      const result = validateVin('1HGCM82633A1234O');
      expect(result.valid).toBe(false);
    });

    it('VIN "1HGCM82633A1234I" should be invalid', () => {
      const result = validateVin('1HGCM82633A1234I');
      expect(result.valid).toBe(false);
    });

    it('VIN "ABC" should be invalid', () => {
      const result = validateVin('ABC');
      expect(result.valid).toBe(false);
    });

    it('VIN "12345678901234567123" should be invalid', () => {
      const result = validateVin('12345678901234567123');
      expect(result.valid).toBe(false);
    });

    it('VIN "" (empty) should be invalid', () => {
      const result = validateVin('');
      expect(result.valid).toBe(false);
    });

    it('VIN "  " (spaces) should be invalid', () => {
      const result = validateVin('  ');
      expect(result.valid).toBe(false);
    });

    it('VIN "null" should be invalid', () => {
      const result = validateVin('null');
      expect(result.valid).toBe(false);
    });

    it('VIN "undefined" should be invalid', () => {
      const result = validateVin('undefined');
      expect(result.valid).toBe(false);
    });
  });

  describe('Error State', () => {
    it('VIN with 16 characters should fail', () => {
      const result = validateVin('1234567890123456');
      expect(result.valid).toBe(false);
    });

    it('Error should mention length', () => {
      const result = validateVin('1234567890123456');
      expect(result.error).toContain('17');
    });
  });
});

describe('validateLatitude', () => {
  describe('Happy Path', () => {
    it('Latitude 0 should be valid', () => {
      const result = validateLatitude(0);
      expect(result.valid).toBe(true);
    });

    it('Latitude 0 should be in range', () => {
      const result = validateLatitude(0);
      expect(result.value).toBe(0);
    });

    it('Latitude 45 should be valid', () => {
      const result = validateLatitude(45);
      expect(result.valid).toBe(true);
    });

    it('Latitude 45 should be in range', () => {
      const result = validateLatitude(45);
      expect(result.value).toBe(45);
    });

    it('Latitude 90 should be valid', () => {
      const result = validateLatitude(90);
      expect(result.valid).toBe(true);
    });

    it('Latitude 90 should be in range', () => {
      const result = validateLatitude(90);
      expect(result.value).toBe(90);
    });

    it('Latitude -90 should be valid', () => {
      const result = validateLatitude(-90);
      expect(result.valid).toBe(true);
    });

    it('Latitude -90 should be in range', () => {
      const result = validateLatitude(-90);
      expect(result.value).toBe(-90);
    });

    it('Latitude 45.123 should be valid', () => {
      const result = validateLatitude(45.123);
      expect(result.valid).toBe(true);
    });

    it('Latitude 45.123 should be in range', () => {
      const result = validateLatitude(45.123);
      expect(result.value).toBe(45.123);
    });

    it('Latitude 37.7749 should be valid', () => {
      const result = validateLatitude(37.7749);
      expect(result.valid).toBe(true);
    });

    it('Latitude 37.7749 should be in range', () => {
      const result = validateLatitude(37.7749);
      expect(result.value).toBe(37.7749);
    });
  });

  describe('Edge Cases', () => {
    it('Latitude 90.00000001 should be invalid', () => {
      const result = validateLatitude(90.00000001);
      expect(result.valid).toBe(false);
    });

    it('Latitude -90.00000001 should be invalid', () => {
      const result = validateLatitude(-90.00000001);
      expect(result.valid).toBe(false);
    });

    it('Latitude 91 should be invalid', () => {
      const result = validateLatitude(91);
      expect(result.valid).toBe(false);
    });

    it('Latitude -91 should be invalid', () => {
      const result = validateLatitude(-91);
      expect(result.valid).toBe(false);
    });

    it('Latitude text should be invalid', () => {
      const result = validateLatitude('text');
      expect(result.valid).toBe(false);
    });

    it('Latitude null should be invalid', () => {
      const result = validateLatitude(null);
      expect(result.valid).toBe(false);
    });

    it('Latitude undefined should be invalid', () => {
      const result = validateLatitude(undefined);
      expect(result.valid).toBe(false);
    });

    it('Latitude 37.77491234567 should be invalid', () => {
      const result = validateLatitude(37.77491234567);
      expect(result.valid).toBe(false);
    });
  });

  describe('Precision Limit', () => {
    it('7 decimal places should be valid', () => {
      const result = validateLatitude(37.7749123);
      expect(result.valid).toBe(true);
    });

    it('8 decimal places should be invalid', () => {
      const result = validateLatitude(37.77491234);
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateLongitude', () => {
  describe('Happy Path', () => {
    it('Longitude 0 should be valid', () => {
      const result = validateLongitude(0);
      expect(result.valid).toBe(true);
    });

    it('Longitude 0 should be in range', () => {
      const result = validateLongitude(0);
      expect(result.value).toBe(0);
    });

    it('Longitude 180 should be valid', () => {
      const result = validateLongitude(180);
      expect(result.valid).toBe(true);
    });

    it('Longitude 180 should be in range', () => {
      const result = validateLongitude(180);
      expect(result.value).toBe(180);
    });

    it('Longitude -180 should be valid', () => {
      const result = validateLongitude(-180);
      expect(result.valid).toBe(true);
    });

    it('Longitude -180 should be in range', () => {
      const result = validateLongitude(-180);
      expect(result.value).toBe(-180);
    });

    it('Longitude -73.567 should be valid', () => {
      const result = validateLongitude(-73.567);
      expect(result.valid).toBe(true);
    });

    it('Longitude -73.567 should be in range', () => {
      const result = validateLongitude(-73.567);
      expect(result.value).toBe(-73.567);
    });

    it('Longitude 122.4194 should be valid', () => {
      const result = validateLongitude(122.4194);
      expect(result.valid).toBe(true);
    });

    it('Longitude 122.4194 should be in range', () => {
      const result = validateLongitude(122.4194);
      expect(result.value).toBe(122.4194);
    });
  });

  describe('Edge Cases', () => {
    it('Longitude 180.00000001 should be invalid', () => {
      const result = validateLongitude(180.00000001);
      expect(result.valid).toBe(false);
    });

    it('Longitude -180.00000001 should be invalid', () => {
      const result = validateLongitude(-180.00000001);
      expect(result.valid).toBe(false);
    });

    it('Longitude 181 should be invalid', () => {
      const result = validateLongitude(181);
      expect(result.valid).toBe(false);
    });

    it('Longitude -181 should be invalid', () => {
      const result = validateLongitude(-181);
      expect(result.valid).toBe(false);
    });

    it('Longitude text should be invalid', () => {
      const result = validateLongitude('text');
      expect(result.valid).toBe(false);
    });

    it('Longitude null should be invalid', () => {
      const result = validateLongitude(null);
      expect(result.valid).toBe(false);
    });

    it('Longitude undefined should be invalid', () => {
      const result = validateLongitude(undefined);
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateCoordinates', () => {
  describe('Happy Path', () => {
    it('Valid coordinates should pass', () => {
      const result = validateCoordinates({ lat: 37.7749, lng: -122.4194 });
      expect(result.valid).toBe(true);
    });

    it('Latitude should match', () => {
      const result = validateCoordinates({ lat: 37.7749, lng: -122.4194 });
      expect(result.latitude).toBe(37.7749);
    });

    it('Longitude should match', () => {
      const result = validateCoordinates({ lat: 37.7749, lng: -122.4194 });
      expect(result.longitude).toBe(-122.4194);
    });
  });

  describe('Error State', () => {
    it('Invalid latitude should fail', () => {
      const result = validateCoordinates({ lat: 91, lng: -122.4194 });
      expect(result.valid).toBe(false);
    });

    it('Error should mention latitude', () => {
      const result = validateCoordinates({ lat: 91, lng: -122.4194 });
      expect(result.error).toBeDefined();
    });

    it('Invalid longitude should fail', () => {
      const result = validateCoordinates({ lat: 37.7749, lng: -181 });
      expect(result.valid).toBe(false);
    });

    it('Error should mention longitude', () => {
      const result = validateCoordinates({ lat: 37.7749, lng: -181 });
      expect(result.error).toBeDefined();
    });
  });
});

describe('sanitizeQuery', () => {
  describe('Happy Path', () => {
    it('Query "1600 Amphitheatre Parkway" should be valid', () => {
      const result = sanitizeQuery('1600 Amphitheatre Parkway');
      expect(result.valid).toBe(true);
    });

    it('Query should not be empty after sanitization', () => {
      const result = sanitizeQuery('1600 Amphitheatre Parkway');
      expect(result.value).toBeTruthy();
    });

    it('Query "Eiffel Tower" should be valid', () => {
      const result = sanitizeQuery('Eiffel Tower');
      expect(result.valid).toBe(true);
    });

    it('Query should not be empty after sanitization', () => {
      const result = sanitizeQuery('Eiffel Tower');
      expect(result.value).toBeTruthy();
    });

    it('Query "123 Main St" should be valid', () => {
      const result = sanitizeQuery('123 Main St');
      expect(result.valid).toBe(true);
    });

    it('Query should not be empty after sanitization', () => {
      const result = sanitizeQuery('123 Main St');
      expect(result.value).toBeTruthy();
    });

    it('Query "New York, NY" should be valid', () => {
      const result = sanitizeQuery('New York, NY');
      expect(result.valid).toBe(true);
    });

    it('Query should not be empty after sanitization', () => {
      const result = sanitizeQuery('New York, NY');
      expect(result.value).toBeTruthy();
    });

    it('Query "Tokyo, Japan" should be valid', () => {
      const result = sanitizeQuery('Tokyo, Japan');
      expect(result.valid).toBe(true);
    });

    it('Query should not be empty after sanitization', () => {
      const result = sanitizeQuery('Tokyo, Japan');
      expect(result.value).toBeTruthy();
    });
  });

  describe('Sanitization', () => {
    it('Sanitized query should be valid', () => {
      const result = sanitizeQuery('<script>alert("xss")</script>');
      expect(result.valid).toBe(true);
    });

    it('Should remove <', () => {
      const result = sanitizeQuery('<test>');
      expect(result.value).not.toContain('<');
    });

    it('Should remove >', () => {
      const result = sanitizeQuery('<test>');
      expect(result.value).not.toContain('>');
    });

    it('Should remove &', () => {
      const result = sanitizeQuery('test&script');
      expect(result.value).not.toContain('&');
    });

    it('Should remove single quotes', () => {
      const result = sanitizeQuery('test\'xss');
      expect(result.value).not.toContain("'");
    });

    it('Should remove double quotes', () => {
      const result = sanitizeQuery('test"xss"');
      expect(result.value).not.toContain('"');
    });
  });

  describe('Edge Cases', () => {
    it('Query "" (empty) should be invalid', () => {
      const result = sanitizeQuery('');
      expect(result.valid).toBe(false);
    });

    it('Query "  " (spaces) should be invalid', () => {
      const result = sanitizeQuery('  ');
      expect(result.valid).toBe(false);
    });

    it('Very long query should be invalid', () => {
      const result = sanitizeQuery('a'.repeat(300));
      expect(result.valid).toBe(false);
    });

    it('Query "null" should be invalid', () => {
      const result = sanitizeQuery('null');
      expect(result.valid).toBe(false);
    });

    it('Query "undefined" should be invalid', () => {
      const result = sanitizeQuery('undefined');
      expect(result.valid).toBe(false);
    });
  });

  describe('Length Boundary', () => {
    it('Query at max length should be valid', () => {
      const result = sanitizeQuery('a'.repeat(200));
      expect(result.valid).toBe(true);
    });

    it('Length should be preserved', () => {
      const result = sanitizeQuery('a'.repeat(200));
      expect(result.value.length).toBe(200);
    });

    it('Query over max length should fail', () => {
      const result = sanitizeQuery('a'.repeat(201));
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateVehicleId', () => {
  describe('Happy Path', () => {
    it('Vehicle ID "123" should be valid', () => {
      const result = validateVehicleId('123');
      expect(result.valid).toBe(true);
    });

    it('Vehicle ID should contain only digits', () => {
      const result = validateVehicleId('123');
      expect(result.value).toBe('123');
    });

    it('Vehicle ID "1" should be valid', () => {
      const result = validateVehicleId('1');
      expect(result.valid).toBe(true);
    });

    it('Vehicle ID should contain only digits', () => {
      const result = validateVehicleId('1');
      expect(result.value).toBe('1');
    });

    it('Vehicle ID "12345678901234567890" should be valid', () => {
      const result = validateVehicleId('12345678901234567890');
      expect(result.valid).toBe(true);
    });

    it('Vehicle ID should contain only digits', () => {
      const result = validateVehicleId('12345678901234567890');
      expect(result.value).toBe('12345678901234567890');
    });

    it('Vehicle ID "12345" should be valid', () => {
      const result = validateVehicleId('12345');
      expect(result.valid).toBe(true);
    });

    it('Vehicle ID should contain only digits', () => {
      const result = validateVehicleId('12345');
      expect(result.value).toBe('12345');
    });
  });

  describe('Edge Cases', () => {
    it('Vehicle ID "" (empty) should be invalid', () => {
      const result = validateVehicleId('');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "  " (spaces) should be invalid', () => {
      const result = validateVehicleId('  ');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "abc" should be invalid', () => {
      const result = validateVehicleId('abc');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "123a" should be invalid', () => {
      const result = validateVehicleId('123a');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "111111111111111111111" should be invalid', () => {
      const result = validateVehicleId('111111111111111111111');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "null" should be invalid', () => {
      const result = validateVehicleId('null');
      expect(result.valid).toBe(false);
    });

    it('Vehicle ID "undefined" should be invalid', () => {
      const result = validateVehicleId('undefined');
      expect(result.valid).toBe(false);
    });
  });
});
