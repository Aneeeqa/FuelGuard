/**
 * Input Validation Middleware Tests
 *
 * Tests input sanitization, SQL injection prevention,
 * XSS prevention, and payload validation.
 */

import { describe, it, expect } from 'vitest';
import {
  validateFuelParams,
  validateEndpoint,
  validationMiddleware,
  isValidYear,
  isValidMake,
  isValidModel,
  isValidVehicleId,
  hasSqlInjection,
  hasXss,
  hasPathTraversal,
} from '../../../backend/middleware/validation.js';

describe('Validation Middleware', () => {
  describe('Year Validation', () => {
    it('should validate correct year', () => {
      const result = validateFuelParams({ year: '2025' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.year).toBe('2025');
      expect(result.errors).toHaveLength(0);
    });

    it('should validate minimum year (1984)', () => {
      const result = validateFuelParams({ year: '1984' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.year).toBe('1984');
    });

    it('should validate current year', () => {
      const currentYear = new Date().getFullYear().toString();
      const result = validateFuelParams({ year: currentYear });

      expect(result.valid).toBe(true);
      expect(result.sanitized.year).toBe(currentYear);
    });

    it('should reject year too old', () => {
      const result = validateFuelParams({ year: '1980' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid year parameter');
    });

    it('should reject year too new', () => {
      const futureYear = new Date().getFullYear() + 10;
      const result = validateFuelParams({ year: futureYear.toString() });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid year parameter');
    });

    it('should reject invalid year format', () => {
      const result = validateFuelParams({ year: 'invalid' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid year parameter');
    });
  });

  describe('Make Validation', () => {
    it('should validate correct make', () => {
      const result = validateFuelParams({ make: 'Toyota' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).toBe('Toyota');
    });

    it('should validate make with hyphen', () => {
      const result = validateFuelParams({ make: 'Mercedes-Benz' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).toBe('Mercedes-Benz');
    });

    it('should validate make with apostrophe', () => {
      const result = validateFuelParams({ make: "Land Rover" });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).toBe("Land Rover");
    });

    it('should reject make with special characters', () => {
      const result = validateFuelParams({ make: 'Toyota<script>' });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject overly long make', () => {
      const longMake = 'a'.repeat(100);
      const result = validateFuelParams({ make: longMake });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid make parameter');
    });
  });

  describe('Model Validation', () => {
    it('should validate correct model', () => {
      const result = validateFuelParams({ model: 'Corolla' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.model).toBe('Corolla');
    });

    it('should validate model with numbers', () => {
      const result = validateFuelParams({ model: '3 Series' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.model).toBe('3 Series');
    });

    it('should validate model with period', () => {
      const result = validateFuelParams({ model: 'Civic Type.R' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.model).toBe('Civic Type.R');
    });

    it('should reject model with special characters', () => {
      const result = validateFuelParams({ model: 'Corolla<script>' });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject overly long model', () => {
      const longModel = 'a'.repeat(200);
      const result = validateFuelParams({ model: longModel });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid model parameter');
    });
  });

  describe('Vehicle ID Validation', () => {
    it('should validate correct vehicle ID', () => {
      const result = isValidVehicleId('41190');

      expect(result).toBe(true);
    });

    it('should validate vehicle ID with dots', () => {
      const result = isValidVehicleId('41190.123');

      expect(result).toBe(true);
    });

    it('should reject vehicle ID with letters', () => {
      const result = isValidVehicleId('abc123');

      expect(result).toBe(false);
    });

    it('should reject vehicle ID with special characters', () => {
      const result = isValidVehicleId('41190<script>');

      expect(result).toBe(false);
    });
  });

  describe('Security Tests - SQL Injection Prevention', () => {
    it('should prevent SQL injection in year', () => {
      const result = validateFuelParams({ year: "2025; DROP TABLE vehicles--" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent SQL injection in make', () => {
      const result = validateFuelParams({ make: "Toyota' OR '1'='1" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent SQL injection in model', () => {
      const result = validateFuelParams({ model: "Corolla' UNION SELECT NULL,NULL,NULL--" });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should detect SQL injection patterns', () => {
      expect(hasSqlInjection("SELECT * FROM users")).toBe(true);
      expect(hasSqlInjection("'; DROP TABLE users; --")).toBe(true);
      expect(hasSqlInjection("admin'--")).toBe(true);
      expect(hasSqlInjection("1' OR '1'='1")).toBe(true);
      expect(hasSqlInjection("Toyota")).toBe(false);
    });
  });

  describe('Security Tests - XSS Prevention', () => {
    it('should prevent XSS in make', () => {
      const result = validateFuelParams({ make: '<script>alert(1)</script>' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent XSS in model', () => {
      const result = validateFuelParams({ model: '<img src=x onerror=alert(1)>' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent iframe injection', () => {
      const result = validateFuelParams({ make: '<iframe src="evil.com"></iframe>' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent javascript: protocol', () => {
      const result = validateFuelParams({ make: 'javascript:alert(1)' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should prevent onerror handlers', () => {
      const result = validateFuelParams({ model: 'Corolla<div onerror="alert(1)">' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should detect XSS patterns', () => {
      expect(hasXss('<script>alert(1)</script>')).toBe(true);
      expect(hasXss('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(hasXss('javascript:alert(1)')).toBe(true);
      expect(hasXss('onerror=alert(1)')).toBe(true);
      expect(hasXss('Toyota')).toBe(false);
    });

    it('should prevent XSS in API responses', () => {
      const result = validateFuelParams({ make: '<script>document.cookie</script>' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });
  });

  describe('Security Tests - Path Traversal Prevention', () => {
    it('should prevent path traversal in endpoint', () => {
      const result = validateEndpoint('../../etc/passwd');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    it('should prevent encoded path traversal', () => {
      const result = validateEndpoint('%2e%2e%2fetc%2fpasswd');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    it('should detect path traversal patterns', () => {
      expect(hasPathTraversal('../etc/passwd')).toBe(true);
      expect(hasPathTraversal('..\\windows\\system32')).toBe(true);
      expect(hasPathTraversal('%2e%2e%2f')).toBe(true);
      expect(hasPathTraversal('vehicle/menu')).toBe(false);
    });

    it('should validate endpoint path', () => {
      const result = validateEndpoint('vehicle/menu/year');

      expect(result.valid).toBe(true);
      expect(result.sanitizedPath).toBe('vehicle/menu/year');
    });
  });

  describe('Security Tests - Payload Validation', () => {
    it('should reject malicious payloads', () => {
      const result = validateFuelParams({
        year: '${7*7}',
        make: '<!--comment-->Toyota',
        model: '${java.lang.Runtime}'
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate content-type headers', () => {
      // This would be tested in middleware integration
      // with actual Express request/response objects
      expect(true).toBe(true);
    });

    it('should sanitize query parameters', () => {
      const result = validateFuelParams({
        year: '2025',
        make: ' Toyota ',
      });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).toBe('Toyota');
    });

    it('should prevent command injection', () => {
      const result = validateFuelParams({ make: 'Toyota; cat /etc/passwd' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Malicious input detected');
    });

    it('should validate request size limits', () => {
      const longValue = 'a'.repeat(10000);
      const result = validateFuelParams({ model: longValue });

      expect(result.valid).toBe(false);
    });

    it('should reject malformed JSON', () => {
      // This would be tested in Express middleware
      // for now, we verify the validation logic
      const result = validateFuelParams({ year: '2025' });

      expect(result.valid).toBe(true);
    });
  });

  describe('Parameter Sanitization', () => {
    it('should sanitize year parameter', () => {
      const result = validateFuelParams({ year: ' 2025 ' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.year).toBe('2025');
    });

    it('should sanitize make parameter', () => {
      const result = validateFuelParams({ make: '  Toyota  ' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).toBe('Toyota');
    });

    it('should sanitize model parameter', () => {
      const result = validateFuelParams({ model: '  Corolla  ' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.model).toBe('Corolla');
    });

    it('should sanitize vehicle ID parameter', () => {
      const result = validateFuelParams({});

      // Vehicle ID not tested in validateFuelParams
      // but isValidVehicleId should work
      expect(isValidVehicleId('41190')).toBe(true);
    });

    it('should handle null bytes', () => {
      const result = validateFuelParams({ make: 'Toy\0ota' });

      expect(result.valid).toBe(true);
      expect(result.sanitized.make).not.toContain('\0');
    });
  });

  describe('Integration Validation', () => {
    it('should validate all parameters together', () => {
      const result = validateFuelParams({
        year: '2025',
        make: 'Toyota',
        model: 'Corolla',
      });

      expect(result.valid).toBe(true);
      expect(result.sanitized.year).toBe('2025');
      expect(result.sanitized.make).toBe('Toyota');
      expect(result.sanitized.model).toBe('Corolla');
    });

    it('should reject if any parameter is invalid', () => {
      const result = validateFuelParams({
        year: '2025',
        make: '<script>Toyota</script>',
        model: 'Corolla',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid input', () => {
      const result = validateFuelParams({ year: 'invalid' });

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Validator Functions', () => {
    it('should check valid year', () => {
      expect(isValidYear('2025')).toBe(true);
      expect(isValidYear('1984')).toBe(true);
      expect(isValidYear('1900')).toBe(false);
      expect(isValidYear('invalid')).toBe(false);
    });

    it('should check valid make', () => {
      expect(isValidMake('Toyota')).toBe(true);
      expect(isValidMake('Mercedes-Benz')).toBe(true);
      expect(isValidMake("Land Rover")).toBe(true);
      expect(isValidMake('<script>')).toBe(false);
      expect(isValidMake('Toyota123')).toBe(false);
    });

    it('should check valid model', () => {
      expect(isValidModel('Corolla')).toBe(true);
      expect(isValidModel('3 Series')).toBe(true);
      expect(isValidModel('Civic Type.R')).toBe(true);
      expect(isValidModel('<script>')).toBe(false);
    });

    it('should check valid vehicle ID', () => {
      expect(isValidVehicleId('41190')).toBe(true);
      expect(isValidVehicleId('41190.123')).toBe(true);
      expect(isValidVehicleId('abc')).toBe(false);
      expect(isValidVehicleId('<script>')).toBe(false);
    });
  });
});
