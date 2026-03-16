/**
 * Test Suite for Safe JSON Parser
 * Tests prototype pollution protection and security features
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeJsonParse, Schemas } from '../../src/utils/safeJson';

// Mock SecurityLogger
vi.mock('../../src/utils/securityLogger', () => ({
  SecurityLogger: {
    logBlocked: vi.fn(),
    logValidationFailure: vi.fn(),
  },
}));

describe('safeJsonParse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path - Valid JSON', () => {
    it('should parse valid JSON object', () => {
      const validJson = '{"name":"John Doe","age":30,"city":"New York"}';
      const result = safeJsonParse(validJson);

      expect(result).not.toBeNull();
      expect(result.name).toBe('John Doe');
      expect(result.age).toBe(30);
      expect(result.city).toBe('New York');
    });

    it('should parse valid JSON array', () => {
      const validJson = '[1,2,3,4,5]';
      const result = safeJsonParse(validJson);

      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
    });

    it('should parse valid JSON with nested objects', () => {
      const validJson = '{"user":{"name":"John","age":30},"data":[1,2,3]}';
      const result = safeJsonParse(validJson);

      expect(result).not.toBeNull();
      expect(result.user.name).toBe('John');
      expect(result.data).toHaveLength(3);
    });
  });

  describe('Security - Prototype Pollution', () => {
    it('should block __proto__ pollution attack', () => {
      const maliciousJson = '{"__proto__": {"isAdmin": true, "polluted": "property"}}';

      const result = safeJsonParse(maliciousJson);

      expect(result).toBeNull();
    });

    it('should block constructor pollution attack', () => {
      const maliciousJson = JSON.stringify({
        constructor: {
          prototype: {
            isAdmin: true,
          },
        },
      });

      const result = safeJsonParse(maliciousJson);

      expect(result).toBeNull();
    });

    it('should block nested prototype pollution', () => {
      const maliciousJson = '{"user": {"name": "John", "__proto__": {"admin": true}}, "data": [1, 2, 3]}';

      const result = safeJsonParse(maliciousJson);

      expect(result).toBeNull();
    });

    it('should block prototype chain pollution via constructor', () => {
      const maliciousJson = JSON.stringify({
        constructor: {
          prototype: {
            isAdmin: true,
          },
        },
      });

      const result = safeJsonParse(maliciousJson);

      expect(result).toBeNull();
    });
  });

  describe('Error State - Invalid JSON', () => {
    it('should handle invalid JSON syntax gracefully', () => {
      const invalidJson = '{"name":"John",}';
      const result = safeJsonParse(invalidJson);

      expect(result).toBeNull();
    });

    it('should handle empty string', () => {
      const result = safeJsonParse('');

      expect(result).toBeNull();
    });

    it('should handle null input', () => {
      const result = safeJsonParse(null);

      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = safeJsonParse(undefined);

      expect(result).toBeNull();
    });

    it('should handle non-string input', () => {
      const result = safeJsonParse(123);

      expect(result).toBeNull();
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags in JSON', () => {
      const maliciousJson = '{"html":"<script>alert(1)</script>"}';
      const result = safeJsonParse(maliciousJson);

      // The parser should either block it or sanitize it
      if (result !== null) {
        expect(result.html).not.toContain('<script>');
        expect(result.html).not.toContain('</script>');
      }
    });

    it('should sanitize iframe tags', () => {
      const maliciousJson = '{"html":"<iframe src=\'evil.com\'></iframe>"}';
      const result = safeJsonParse(maliciousJson);

      if (result !== null) {
        expect(result.html).not.toContain('<iframe');
      }
    });

    it('should sanitize javascript: protocol', () => {
      const maliciousJson = '{"url":"javascript:alert(1)"}';
      const result = safeJsonParse(maliciousJson);

      if (result !== null) {
        expect(result.url).not.toContain('javascript:');
      }
    });
  });

  describe('Schema Validation', () => {
    it('should validate against schema when provided', () => {
      const validJson = '{"name":"John","age":30}';
      const schema = Schemas.userProfile;

      const result = safeJsonParse(validJson, { schema });

      expect(result).not.toBeNull();
      expect(result.name).toBe('John');
    });

    it('should reject invalid data based on schema', () => {
      const invalidJson = '{"name":"John","age":-5}';
      const schema = Schemas.userProfile;

      const result = safeJsonParse(invalidJson, { schema });

      expect(result).toBeNull();
    });

    it('should handle missing required fields', () => {
      const invalidJson = '{"name":"John"}';
      const schema = Schemas.userProfile;

      const result = safeJsonParse(invalidJson, { schema });

      expect(result).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large JSON objects', () => {
      const largeJson = JSON.stringify({
        data: Array(1000).fill({ id: 1, value: 'test' })
      });
      const result = safeJsonParse(largeJson);

      expect(result).not.toBeNull();
      expect(result.data).toHaveLength(1000);
    });

    it('should handle deeply nested objects', () => {
      const nestedJson = JSON.stringify({
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep'
                }
              }
            }
          }
        }
      });
      const result = safeJsonParse(nestedJson);

      expect(result).not.toBeNull();
      expect(result.level1.level2.level3.level4.level5.value).toBe('deep');
    });

    it('should handle special characters in strings', () => {
      const json = JSON.stringify({
        text: 'Hello <world> & "quoted" \'apostrophe\''
      });
      const result = safeJsonParse(json);

      expect(result).not.toBeNull();
      expect(result.text).toBe('Hello <world> & "quoted" \'apostrophe\'');
    });

    it('should handle unicode characters', () => {
      const json = JSON.stringify({
        text: 'Hello 世界 🌍'
      });
      const result = safeJsonParse(json);

      expect(result).not.toBeNull();
      expect(result.text).toBe('Hello 世界 🌍');
    });

    it('should handle escaped characters', () => {
      const json = JSON.stringify({
        text: 'Line 1\nLine 2\tTabbed'
      });
      const result = safeJsonParse(json);

      expect(result).not.toBeNull();
      expect(result.text).toBe('Line 1\nLine 2\tTabbed');
    });
  });
});

describe('Schemas', () => {
  describe('userProfile Schema', () => {
    it('should validate correct user profile', () => {
      const validData = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com'
      };

      const result = Schemas.userProfile(validData);

      expect(result.valid).toBe(true);
    });

    it('should reject missing name', () => {
      const invalidData = {
        age: 30
      };

      const result = Schemas.userProfile(invalidData);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject negative age', () => {
      const invalidData = {
        name: 'John',
        age: -5
      };

      const result = Schemas.userProfile(invalidData);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('age');
    });

    it('should reject age over maximum', () => {
      const invalidData = {
        name: 'John',
        age: 150
      };

      const result = Schemas.userProfile(invalidData);

      expect(result.valid).toBe(false);
    });
  });

  describe('vehicleProfile Schema', () => {
    it('should validate correct vehicle profile', () => {
      const validData = {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        tankCapacity: 50
      };

      const result = Schemas.vehicleProfile(validData);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid year', () => {
      const invalidData = {
        make: 'Toyota',
        model: 'Corolla',
        year: 1980,
        tankCapacity: 50
      };

      const result = Schemas.vehicleProfile(invalidData);

      expect(result.valid).toBe(false);
    });

    it('should reject zero tank capacity', () => {
      const invalidData = {
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        tankCapacity: 0
      };

      const result = Schemas.vehicleProfile(invalidData);

      expect(result.valid).toBe(false);
    });
  });

  describe('fuelLog Schema', () => {
    it('should validate correct fuel log', () => {
      const validData = {
        date: '2025-01-15T10:00:00Z',
        odometer: 10000,
        liters: 40,
        isFullTank: true
      };

      const result = Schemas.fuelLog(validData);

      expect(result.valid).toBe(true);
    });

    it('should reject negative odometer', () => {
      const invalidData = {
        date: '2025-01-15T10:00:00Z',
        odometer: -100,
        liters: 40
      };

      const result = Schemas.fuelLog(invalidData);

      expect(result.valid).toBe(false);
    });

    it('should reject zero liters', () => {
      const invalidData = {
        date: '2025-01-15T10:00:00Z',
        odometer: 10000,
        liters: 0
      };

      const result = Schemas.fuelLog(invalidData);

      expect(result.valid).toBe(false);
    });
  });
});
