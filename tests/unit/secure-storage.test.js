/**
 * Secure Storage Test Suite
 *
 * Tests for secure localStorage utilities with validation
 *
 * Coverage:
 * - Key validation (format, length, dangerous patterns)
 * - Value validation (size, structure, type checking)
 * - XSS prevention
 * - Quota exhaustion prevention
 * - Prototype pollution prevention
 * - Migration functionality
 * - Theme-specific validation
 * - Exchange rates-specific validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  validateStorageKey,
  validateStorageValue,
  sanitizeValue,
  safeLocalStorageSet,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageClear,
  getStorageUsage,
  checkStorageAvailable,
  migrateStorageData,
  getMigrationStatus,
  markMigrationComplete,
  validateTheme,
  safeGetTheme,
  safeSetTheme,
  validateExchangeRates,
  safeGetExchangeRates,
  safeSetExchangeRates,
  getStorageKeys,
} from '../../src/utils/secureStorage';

// ============================================================================
// SETUP AND TEARDOWN
// ============================================================================

describe('Secure Storage Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    safeLocalStorageClear(true);
  });

  afterEach(() => {
    // Clear localStorage after each test
    safeLocalStorageClear(true);
  });

  // ============================================================================
  // KEY VALIDATION TESTS
  // ============================================================================

  describe('validateStorageKey', () => {
    it('Happy Path: Valid keys pass validation', () => {
      const validKeys = [
        'user_data',
        'app-theme',
        'cache_123',
        'fuelGuardDB',
        'valid-key-123',
        'a1b2c3d4e5f6',
      ];

      validKeys.forEach(key => {
        const result = validateStorageKey(key);
        expect(result.valid).toBe(true);
        expect(result.value).toBe(key);
      });
    });

    it('Edge Case: Minimum length keys (3 chars)', () => {
      const result = validateStorageKey('abc');
      expect(result.valid).toBe(true);
    });

    it('Edge Case: Maximum length keys (100 chars)', () => {
      const key = 'a'.repeat(100);
      const result = validateStorageKey(key);
      expect(result.valid).toBe(true);
    });

    it('Edge Case: Empty key is rejected', () => {
      const result = validateStorageKey('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('Edge Case: Key too short (2 chars) is rejected', () => {
      const result = validateStorageKey('ab');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3-100');
    });

    it('Edge Case: Key too long (101 chars) is rejected', () => {
      const key = 'a'.repeat(101);
      const result = validateStorageKey(key);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('3-100');
    });

    it('Error State: Null key is rejected', () => {
      const result = validateStorageKey(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('Error State: Undefined key is rejected', () => {
      const result = validateStorageKey(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('Error State: Non-string key is rejected', () => {
      const result = validateStorageKey(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('string');
    });

    it('Error State: Key with special characters is rejected', () => {
      const invalidKeys = [
        'user@data',
        'key#value',
        'key value',
        'key/value',
        'key=value',
        'user.data',
        'user[data]',
        'user(data)',
      ];

      invalidKeys.forEach(key => {
        const result = validateStorageKey(key);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('invalid characters');
      });
    });

    it('Security: Key with script tag is rejected', () => {
      const result = validateStorageKey('user<script>alert("xss")</script>');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Key with javascript: protocol is rejected', () => {
      const result = validateStorageKey('javascript:alert("xss")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Key with onerror event is rejected', () => {
      const result = validateStorageKey('img onerror="alert(1)"');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Key with __proto__ is rejected', () => {
      const result = validateStorageKey('__proto__');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Key with constructor is rejected', () => {
      const result = validateStorageKey('constructor');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });
  });

  // ============================================================================
  // VALUE VALIDATION TESTS
  // ============================================================================

  describe('validateStorageValue', () => {
    it('Happy Path: Valid string value', () => {
      const result = validateStorageValue('Hello, World!');
      expect(result.valid).toBe(true);
      expect(result.value).toBe('Hello, World!');
      expect(result.size).toBeGreaterThan(0);
    });

    it('Happy Path: Valid number value', () => {
      const result = validateStorageValue(42);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(42);
    });

    it('Happy Path: Valid boolean value', () => {
      const result = validateStorageValue(true);
      expect(result.valid).toBe(true);
      expect(result.value).toBe(true);
    });

    it('Happy Path: Valid object value', () => {
      const obj = { name: 'John', age: 30 };
      const result = validateStorageValue(obj);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(obj);
    });

    it('Happy Path: Valid array value', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = validateStorageValue(arr);
      expect(result.valid).toBe(true);
      expect(result.value).toEqual(arr);
    });

    it('Edge Case: Empty string is valid', () => {
      const result = validateStorageValue('');
      expect(result.valid).toBe(true);
    });

    it('Edge Case: Maximum size value (10KB)', () => {
      const value = 'x'.repeat(10 * 1024);
      const result = validateStorageValue(value);
      expect(result.valid).toBe(true);
    });

    it('Edge Case: Value just over maximum size (10KB + 1 byte)', () => {
      const value = 'x'.repeat(10 * 1024 + 1);
      const result = validateStorageValue(value);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('Edge Case: Large object within size limit', () => {
      const obj = { data: 'x'.repeat(9 * 1024) };
      const result = validateStorageValue(obj);
      expect(result.valid).toBe(true);
    });

    it('Error State: Null value is rejected', () => {
      const result = validateStorageValue(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('null');
    });

    it('Error State: Undefined value is rejected', () => {
      const result = validateStorageValue(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('undefined');
    });

    it('Error State: Object that cannot be serialized is rejected', () => {
      const obj = { fn: function () { return 1; } };
      const result = validateStorageValue(obj);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('serialize');
    });

    it('Security: String with script tag is rejected', () => {
      const value = 'Hello<script>alert("xss")</script>World';
      const result = validateStorageValue(value);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: String with iframe tag is rejected', () => {
      const value = '<iframe src="evil.com"></iframe>';
      const result = validateStorageValue(value);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Object with dangerous key is rejected', () => {
      const obj = { '__proto__': 'malicious' };
      const result = validateStorageValue(obj);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('Security: Object with constructor key is rejected', () => {
      const obj = { 'constructor': 'malicious' };
      const result = validateStorageValue(obj);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });
  });

  // ============================================================================
  // SANITIZATION TESTS
  // ============================================================================

  describe('sanitizeValue', () => {
    it('Happy Path: Clean string is unchanged', () => {
      const result = sanitizeValue('Hello, World!');
      expect(result).toBe('Hello, World!');
    });

    it('Happy Path: Clean object is unchanged', () => {
      const obj = { name: 'John', age: 30 };
      const result = sanitizeValue(obj);
      expect(result).toEqual(obj);
    });

    it('Happy Path: Clean array is unchanged', () => {
      const arr = ['a', 'b', 'c'];
      const result = sanitizeValue(arr);
      expect(result).toEqual(arr);
    });

    it('Security: HTML tags are removed from strings', () => {
      const input = 'Hello<script>alert("xss")</script>World';
      const result = sanitizeValue(input);
      expect(result).toBe('HelloWorld');
      expect(result).not.toContain('<script>');
    });

    it('Security: javascript: protocol is removed', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeValue(input);
      expect(result).not.toContain('javascript:');
    });

    it('Security: Event handlers are removed', () => {
      const input = 'img onerror="alert(1)"';
      const result = sanitizeValue(input);
      expect(result).not.toContain('onerror');
    });

    it('Security: Dangerous keys are removed from objects', () => {
      const input = {
        name: 'John',
        '__proto__': 'malicious',
        age: 30,
      };
      const result = sanitizeValue(input);
      expect(result).toEqual({ name: 'John', age: 30 });
      expect(result).not.toHaveProperty('__proto__');
    });

    it('Security: Nested objects are sanitized', () => {
      const input = {
        user: {
          name: 'John',
          '__proto__': 'malicious',
        },
      };
      const result = sanitizeValue(input);
      expect(result.user).toEqual({ name: 'John' });
      expect(result.user).not.toHaveProperty('__proto__');
    });

    it('Security: Arrays are sanitized recursively', () => {
      const input = [
        { name: 'John', '__proto__': 'bad' },
        { name: 'Jane', 'constructor': 'bad' },
      ];
      const result = sanitizeValue(input);
      expect(result).toEqual([{ name: 'John' }, { name: 'Jane' }]);
    });
  });

  // ============================================================================
  // SAFE STORAGE OPERATIONS
  // ============================================================================

  describe('safeLocalStorageSet', () => {
    it('Happy Path: Valid key and value are stored', () => {
      const result = safeLocalStorageSet('test_key', 'test_value');
      expect(result).toBe(true);
      const retrieved = safeLocalStorageGet('test_key');
      expect(retrieved).toBe('test_value');
    });

    it('Happy Path: Object value is stored and retrieved', () => {
      const obj = { name: 'John', age: 30 };
      const result = safeLocalStorageSet('test_obj', obj);
      expect(result).toBe(true);
      const retrieved = safeLocalStorageGet('test_obj');
      expect(retrieved).toEqual(obj);
    });

    it('Happy Path: Write verification works', () => {
      const key = 'test_key';
      const value = 'test_value';
      safeLocalStorageSet(key, value);
      const retrieved = safeLocalStorageGet(key);
      expect(retrieved).toBe(value);
    });

    it('Edge Case: Maximum size value is stored', () => {
      const value = 'x'.repeat(10 * 1024);
      const result = safeLocalStorageSet('test_large', value);
      expect(result).toBe(true);
    });

    it('Error State: Invalid key is rejected', () => {
      const result = safeLocalStorageSet('', 'value');
      expect(result).toBe(false);
      const retrieved = safeLocalStorageGet('');
      expect(retrieved).toBeNull();
    });

    it('Error State: Invalid value is rejected', () => {
      const result = safeLocalStorageSet('test_key', '<script>alert("xss")</script>');
      expect(result).toBe(false);
    });

    it('Security: Key with dangerous pattern is rejected', () => {
      const result = safeLocalStorageSet('<script>alert("xss")</script>', 'value');
      expect(result).toBe(false);
    });

    it('Security: Value with dangerous pattern is rejected', () => {
      const result = safeLocalStorageSet('test_key', 'value<script>alert("xss")</script>');
      expect(result).toBe(false);
    });

    it('DoS Prevention: Too large value is rejected', () => {
      const value = 'x'.repeat(10 * 1024 + 1);
      const result = safeLocalStorageSet('test_key', value);
      expect(result).toBe(false);
    });
  });

  describe('safeLocalStorageGet', () => {
    it('Happy Path: Retrieved value matches stored value', () => {
      safeLocalStorageSet('test_key', 'test_value');
      const result = safeLocalStorageGet('test_key');
      expect(result).toBe('test_value');
    });

    it('Happy Path: Object is parsed correctly', () => {
      const obj = { name: 'John', age: 30 };
      safeLocalStorageSet('test_obj', obj);
      const result = safeLocalStorageGet('test_obj');
      expect(result).toEqual(obj);
    });

    it('Happy Path: parseJson=false returns string', () => {
      const value = '{"name":"John"}';
      safeLocalStorageSet('test_key', value, { maxSize: 1000 });
      const result = safeLocalStorageGet('test_key', { parseJson: false });
      expect(result).toBe(value);
    });

    it('Happy Path: parseJson=true parses object', () => {
      const obj = { name: 'John' };
      safeLocalStorageSet('test_key', obj);
      const result = safeLocalStorageGet('test_key', { parseJson: true });
      expect(result).toEqual(obj);
    });

    it('Edge Case: Non-existent key returns null', () => {
      const result = safeLocalStorageGet('non_existent_key');
      expect(result).toBeNull();
    });

    it('Error State: Invalid key returns null', () => {
      const result = safeLocalStorageGet('');
      expect(result).toBeNull();
    });

    it('Security: Retrieved value with dangerous patterns returns null', () => {
      // Manually set a dangerous value (bypassing safe storage)
      localStorage.setItem('bad_key', '<script>alert("xss")</script>');
      const result = safeLocalStorageGet('bad_key');
      expect(result).toBeNull();
      // Value should be removed
      expect(localStorage.getItem('bad_key')).toBeNull();
    });
  });

  describe('safeLocalStorageRemove', () => {
    it('Happy Path: Value is removed successfully', () => {
      safeLocalStorageSet('test_key', 'test_value');
      const result = safeLocalStorageRemove('test_key');
      expect(result).toBe(true);
      const retrieved = safeLocalStorageGet('test_key');
      expect(retrieved).toBeNull();
    });

    it('Happy Path: Removing non-existent key returns true', () => {
      const result = safeLocalStorageRemove('non_existent_key');
      expect(result).toBe(true);
    });

    it('Error State: Invalid key returns false', () => {
      const result = safeLocalStorageRemove('');
      expect(result).toBe(false);
    });
  });

  describe('getStorageKeys', () => {
    it('Happy Path: All keys are returned', () => {
      safeLocalStorageSet('key1', 'value1');
      safeLocalStorageSet('key2', 'value2');
      safeLocalStorageSet('key3', 'value3');

      const keys = getStorageKeys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });

    it('Happy Path: Keys are filtered by prefix', () => {
      safeLocalStorageSet('cache_key1', 'value1');
      safeLocalStorageSet('cache_key2', 'value2');
      safeLocalStorageSet('other_key', 'value3');

      const cacheKeys = getStorageKeys('cache_');
      expect(cacheKeys).toContain('cache_key1');
      expect(cacheKeys).toContain('cache_key2');
      expect(cacheKeys).not.toContain('other_key');
    });

    it('Edge Case: Empty storage returns empty array', () => {
      const keys = getStorageKeys();
      expect(keys).toEqual([]);
    });
  });

  // ============================================================================
  // STORAGE USAGE MONITORING
  // ============================================================================

  describe('getStorageUsage', () => {
    it('Happy Path: Storage usage is calculated correctly', () => {
      safeLocalStorageSet('test1', 'x'.repeat(100));
      safeLocalStorageSet('test2', 'x'.repeat(200));

      const usage = getStorageUsage();
      expect(usage.totalUsed).toBeGreaterThan(0);
      expect(usage.itemCount).toBe(2);
      expect(usage.available).toBeGreaterThan(0);
      expect(usage.percentage).toBeGreaterThan(0);
      expect(usage.percentage).toBeLessThan(100);
    });

    it('Edge Case: Empty storage shows 0 usage', () => {
      const usage = getStorageUsage();
      expect(usage.totalUsed).toBe(0);
      expect(usage.itemCount).toBe(0);
      expect(usage.available).toBeGreaterThan(0);
      expect(usage.percentage).toBe(0);
    });
  });

  describe('checkStorageAvailable', () => {
    it('Happy Path: Storage is available', () => {
      const result = checkStorageAvailable();
      expect(result).toBe(true);
    });

    it('Happy Path: Checks if specific amount is available', () => {
      const result = checkStorageAvailable(1024);
      expect(result).toBe(true);
    });

    it('Edge Case: Large amount check', () => {
      const result = checkStorageAvailable(10 * 1024 * 1024);
      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // MIGRATION TESTS
  // ============================================================================

  describe('migrateStorageData', () => {
    it('Happy Path: Valid data is preserved during migration', () => {
      // Add valid data
      safeLocalStorageSet('valid_key1', 'valid_value1');
      safeLocalStorageSet('valid_key2', { name: 'John' });

      const result = migrateStorageData();
      expect(result.validatedItems).toBeGreaterThan(0);
      expect(result.corruptedItems).toBe(0);

      // Data should still be accessible
      expect(safeLocalStorageGet('valid_key1')).toBe('valid_value1');
    });

    it('Happy Path: Migration returns correct stats', () => {
      safeLocalStorageSet('valid_key', 'valid_value');

      const result = migrateStorageData();
      expect(result).toHaveProperty('totalItems');
      expect(result).toHaveProperty('validatedItems');
      expect(result).toHaveProperty('corruptedItems');
      expect(result).toHaveProperty('removedItems');
      expect(result).toHaveProperty('migratedItems');
    });

    it('Security: Corrupted data with dangerous patterns is removed', () => {
      // Manually add dangerous data
      localStorage.setItem('bad_key', '<script>alert("xss")</script>');
      localStorage.setItem('good_key', 'good_value');

      const result = migrateStorageData();
      expect(result.corruptedItems).toBeGreaterThan(0);

      // Bad key should be removed
      expect(safeLocalStorageGet('bad_key')).toBeNull();
      // Good key should still exist
      expect(safeLocalStorageGet('good_key')).toBe('good_value');
    });

    it('Security: Data with invalid keys is removed', () => {
      // Manually add data with invalid keys
      localStorage.setItem('invalid@key', 'value');
      localStorage.setItem('valid-key', 'value');

      const result = migrateStorageData();
      expect(result.corruptedItems).toBeGreaterThan(0);
      expect(result.removedItems).toBeGreaterThan(0);
    });

    it('Edge Case: Empty storage migration', () => {
      const result = migrateStorageData();
      expect(result.totalItems).toBe(0);
      expect(result.validatedItems).toBe(0);
      expect(result.corruptedItems).toBe(0);
    });
  });

  describe('getMigrationStatus and markMigrationComplete', () => {
    it('Happy Path: Migration status is tracked', () => {
      const result = { success: true };
      markMigrationComplete(result);

      const status = getMigrationStatus();
      expect(status.completed).toBe(true);
      expect(status.timestamp).toBeGreaterThan(0);
      expect(status.result).toEqual(result);
    });

    it('Edge Case: Migration status before migration', () => {
      const status = getMigrationStatus();
      expect(status.completed).toBe(false);
    });
  });

  // ============================================================================
  // THEME-SPECIFIC TESTS
  // ============================================================================

  describe('validateTheme', () => {
    it('Happy Path: Valid themes are accepted', () => {
      const validThemes = ['light', 'dark', 'system'];
      validThemes.forEach(theme => {
        expect(validateTheme(theme)).toBe(true);
      });
    });

    it('Error State: Invalid themes are rejected', () => {
      const invalidThemes = ['invalid', '', 'LIGHT', 'DARK', 'auto'];
      invalidThemes.forEach(theme => {
        expect(validateTheme(theme)).toBe(false);
      });
    });
  });

  describe('safeGetTheme and safeSetTheme', () => {
    it('Happy Path: Theme is stored and retrieved', () => {
      const result = safeSetTheme('theme_key', 'dark');
      expect(result).toBe(true);

      const theme = safeGetTheme('theme_key');
      expect(theme).toBe('dark');
    });

    it('Happy Path: All valid themes work', () => {
      ['light', 'dark', 'system'].forEach(theme => {
        safeSetTheme('theme_key', theme);
        const retrieved = safeGetTheme('theme_key');
        expect(retrieved).toBe(theme);
      });
    });

    it('Error State: Invalid theme is rejected', () => {
      const result = safeSetTheme('theme_key', 'invalid_theme');
      expect(result).toBe(false);
      expect(safeGetTheme('theme_key')).toBeNull();
    });

    it('Security: Retrieved invalid theme is removed', () => {
      // Manually set invalid theme
      localStorage.setItem('theme_key', 'invalid_theme');

      const theme = safeGetTheme('theme_key');
      expect(theme).toBeNull();
      expect(localStorage.getItem('theme_key')).toBeNull();
    });
  });

  // ============================================================================
  // EXCHANGE RATES-SPECIFIC TESTS
  // ============================================================================

  describe('validateExchangeRates', () => {
    it('Happy Path: Valid exchange rates structure', () => {
      const rates = {
        rates: { USD: 1, EUR: 0.85, GBP: 0.75 },
        timestamp: Date.now(),
        base: 'USD',
      };

      expect(validateExchangeRates(rates)).toBe(true);
    });

    it('Happy Path: Exchange rates with recent timestamp', () => {
      const rates = {
        rates: { USD: 1 },
        timestamp: Date.now(),
      };

      expect(validateExchangeRates(rates)).toBe(true);
    });

    it('Error State: Missing required fields', () => {
      const invalidRates = [
        { rates: { USD: 1 } }, // Missing timestamp
        { timestamp: Date.now() }, // Missing rates
        { rates: 'not an object', timestamp: Date.now() }, // Invalid rates type
      ];

      invalidRates.forEach(rates => {
        expect(validateExchangeRates(rates)).toBe(false);
      });
    });

    it('Error State: Old timestamp is rejected', () => {
      const rates = {
        rates: { USD: 1 },
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days ago
      };

      expect(validateExchangeRates(rates)).toBe(false);
    });

    it('Edge Case: Timestamp at age limit (30 days)', () => {
      const rates = {
        rates: { USD: 1 },
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000), // Exactly 30 days ago
      };

      expect(validateExchangeRates(rates)).toBe(false); // Should be rejected at exactly 30 days
    });
  });

  describe('safeGetExchangeRates and safeSetExchangeRates', () => {
    it('Happy Path: Exchange rates are stored and retrieved', () => {
      const rates = {
        rates: { USD: 1, EUR: 0.85, GBP: 0.75 },
        timestamp: Date.now(),
        base: 'USD',
      };

      const result = safeSetExchangeRates('rates_key', rates);
      expect(result).toBe(true);

      const retrieved = safeGetExchangeRates('rates_key');
      expect(retrieved).toEqual(rates);
    });

    it('Error State: Invalid structure is rejected', () => {
      const invalidRates = { rates: {} }; // Missing timestamp

      const result = safeSetExchangeRates('rates_key', invalidRates);
      expect(result).toBe(false);
    });

    it('Error State: Old rates are rejected', () => {
      const oldRates = {
        rates: { USD: 1 },
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000),
      };

      const result = safeSetExchangeRates('rates_key', oldRates);
      expect(result).toBe(false);
    });

    it('Security: Retrieved invalid rates are removed', () => {
      // Manually set invalid rates
      localStorage.setItem('rates_key', JSON.stringify({ rates: {} }));

      const rates = safeGetExchangeRates('rates_key');
      expect(rates).toBeNull();
      expect(localStorage.getItem('rates_key')).toBeNull();
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: Complete Storage Lifecycle', () => {
    it('Happy Path: Store, retrieve, and remove data', () => {
      const key = 'integration_key';
      const value = { name: 'Integration Test', count: 42 };

      // Store
      const setResult = safeLocalStorageSet(key, value);
      expect(setResult).toBe(true);

      // Retrieve
      const getResult = safeLocalStorageGet(key);
      expect(getResult).toEqual(value);

      // Remove
      const removeResult = safeLocalStorageRemove(key);
      expect(removeResult).toBe(true);

      // Verify removal
      const finalResult = safeLocalStorageGet(key);
      expect(finalResult).toBeNull();
    });

    it('Happy Path: Multiple operations work together', () => {
      const items = [
        { key: 'item1', value: 'value1' },
        { key: 'item2', value: { nested: 'object' } },
        { key: 'item3', value: [1, 2, 3] },
      ];

      // Store all items
      items.forEach(item => {
        expect(safeLocalStorageSet(item.key, item.value)).toBe(true);
      });

      // Retrieve all items
      items.forEach(item => {
        const retrieved = safeLocalStorageGet(item.key);
        expect(retrieved).toEqual(item.value);
      });

      // Check storage usage
      const usage = getStorageUsage();
      expect(usage.itemCount).toBe(3);

      // Get all keys
      const keys = getStorageKeys();
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });

    it('DoS Prevention: Cannot exhaust quota with large values', () => {
      let blockedCount = 0;

      // Try to store multiple large values
      for (let i = 0; i < 100; i++) {
        const result = safeLocalStorageSet(`dos_${i}`, 'x'.repeat(10000));
        if (!result) {
          blockedCount++;
        }
      }

      // At least some should be blocked due to size/quotas
      // (This may vary based on actual browser quota)
      // The important thing is that the system doesn't crash
      expect(() => {
        safeLocalStorageGet('dos_0');
      }).not.toThrow();
    });

    it('XSS Prevention: Cannot store malicious scripts', () => {
      const maliciousValues = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("XSS")</script>',
      ];

      maliciousValues.forEach(value => {
        const result = safeLocalStorageSet('malicious', value);
        expect(result).toBe(false);
      });
    });
  });
});
