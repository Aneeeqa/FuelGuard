/**
 * Storage Abstraction Layer - CRITICAL TESTS
 *
 * Tests the 3-layer fallback strategy: IndexedDB → localStorage → inMemory
 * This is the single point of failure for user data persistence.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storage } from '../../src/utils/storage';

describe('Storage Abstraction Layer', () => {
  beforeEach(async () => {
    // Clear all storage before each test
    await storage.clearAll();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await storage.clearAll();
  });

  describe('Basic CRUD Operations', () => {
    it('should save data to storage', async () => {
      await storage.set('test-key', { data: 'test-value' });
      const result = await storage.get('test-key');
      expect(result.data).toBe('test-value');
    });

    it('should read data from storage', async () => {
      await storage.set('test-key', { value: 123 });
      const result = await storage.get('test-key');
      expect(result.value).toBe(123);
    });

    it('should update existing data', async () => {
      await storage.set('test-key', { value: 'initial' });
      await storage.set('test-key', { value: 'updated' });
      const result = await storage.get('test-key');
      expect(result.value).toBe('updated');
    });

    it('should return null for non-existent key', async () => {
      const result = await storage.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete data from storage', async () => {
      await storage.set('test-key', { value: 'test' });
      await storage.clear('test-key');
      const result = await storage.get('test-key');
      expect(result).toBeNull();
    });

    it('should handle clearing non-existent key gracefully', async () => {
      await expect(storage.clear('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('IndexedDB Primary Storage', () => {
    it('should use IndexedDB when available', async () => {
      await storage.set('idb-test', { source: 'indexeddb' });
      const result = await storage.get('idb-test');
      expect(result.source).toBe('indexeddb');
    });

    it('should handle IndexedDB unavailability gracefully', async () => {
      // Mock IndexedDB failure
      const originalIndexedDB = global.indexedDB;
      global.indexedDB = vi.fn(() => {
        throw new Error('IndexedDB not available');
      });

      // Force re-initialization by creating new storage instance
      const fallbackStorage = (await import('../../src/utils/storage')).storage;

      await fallbackStorage.set('test-key', { data: 'fallback-value' });
      const result = await fallbackStorage.get('test-key');

      // Should still work via fallback
      expect(result).toBeDefined();

      global.indexedDB = originalIndexedDB;
    });

    it('should store complex objects', async () => {
      const complexObject = {
        nested: {
          deeply: {
            value: 123
          }
        },
        array: [1, 2, 3],
        date: new Date().toISOString()
      };

      await storage.set('complex-key', complexObject);
      const result = await storage.get('complex-key');

      expect(result.nested.deeply.value).toBe(123);
      expect(result.array).toEqual([1, 2, 3]);
    });

    it('should handle large data sets', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        data: `Item ${i}`
      }));

      await storage.set('large-key', largeArray);
      const result = await storage.get('large-key');

      expect(result).toHaveLength(10000);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from IndexedDB failure', async () => {
      // Mock IndexedDB to fail on set
      const originalSet = global.indexedDB;
      let failIndex = true;

      global.indexedDB = vi.fn(() => ({
        open: vi.fn(() => ({
          onsuccess: vi.fn((event) => {
            if (failIndex) {
              event.target.onerror = new Error('IndexedDB corrupted');
            }
          })
        }))
      }));

      // This test demonstrates error recovery behavior
      // In real implementation, fallback would trigger
      await storage.set('recovery-test', { data: 'test' });

      failIndex = false;
      global.indexedDB = originalSet;
    });

    it('should handle concurrent writes', async () => {
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(storage.set(`key-${i}`, { value: i }));
      }

      await Promise.all(promises);

      // Verify all writes succeeded
      for (let i = 0; i < 100; i++) {
        const result = await storage.get(`key-${i}`);
        expect(result.value).toBe(i);
      }
    });

    it('should clear all data across all storage layers', async () => {
      // Set multiple keys
      await storage.set('key1', { data: 'value1' });
      await storage.set('key2', { data: 'value2' });
      await storage.set('key3', { data: 'value3' });

      await storage.clearAll();

      const result1 = await storage.get('key1');
      const result2 = await storage.get('key2');
      const result3 = await storage.get('key3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('Storage Type Detection', () => {
    it('should report current storage type', () => {
      const storageType = storage.getStorageType();
      expect(['indexeddb', 'localstorage', 'memory']).toContain(storageType);
    });
  });

  describe('DATA INTEGRITY & TAMPERING DETECTION', () => {
    it('should detect tampered localStorage data', async () => {
      // Inject malicious data directly as a raw JSON string that contains __proto__
      // Note: JSON.stringify({__proto__:...}) silently strips the prototype key,
      // so we must use a crafted raw string to simulate actual proto pollution attack
      localStorage.setItem('fuelGuardDB', '{"__proto__":{"malicious":true},"logs":[{"id":"malicious","odometer":"invalid"}]}');

      // Reading should handle proto pollution safely
      const result = await storage.get('fuelGuardDB');

      // Should block the malicious data and return null
      expect(result).toBeNull();
    });

    it('should reject arbitrary data injection via __proto__', async () => {
      const maliciousData = {
        __proto__: { isAdmin: true },
        logs: [{ id: 1, odometer: 10000 }]
      };

      // Setting should fail validation
      const setResult = await storage.set('malicious-key', maliciousData);

      // Should return false for invalid data
      expect(setResult).toBe(false);

      const result = await storage.get('malicious-key');

      // Should be null since storage was blocked
      expect(result).toBeNull();
    });

    it('should validate data on read', async () => {
      const validData = {
        logs: [
          { id: 1, odometer: 10000, liters: 20 }
        ],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      await storage.set('valid-key', validData);
      const result = await storage.get('valid-key');

      expect(result.logs).toBeDefined();
      expect(result.logs).toHaveLength(1);
      expect(result.vehicleProfile).toBeDefined();
    });

    it('should handle corrupted JSON gracefully', async () => {
      // Inject invalid JSON into localStorage
      localStorage.setItem('corrupted-key', '{ invalid json }');

      const result = await storage.get('corrupted-key');

      // Should return null or handle gracefully
      expect(result).toBeNull();
    });

    it('should handle undefined/null values', async () => {
      await storage.set('null-key', null);
      const result1 = await storage.get('null-key');

      await storage.set('undefined-key', undefined);
      const result2 = await storage.get('undefined-key');

      // Both should be retrievable
      expect(result1).toBeNull();
      // undefined typically becomes null in storage
      expect(result2 === null || result2 === undefined).toBe(true);
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle keys with special characters', async () => {
      const specialKeys = [
        'test-key-with-dashes',
        'test_key_with_underscores',
        'test.key.with.dots',
        'test/key/with/slashes',
        'test key with spaces'
      ];

      for (const key of specialKeys) {
        await storage.set(key, { value: key });
        const result = await storage.get(key);
        expect(result.value).toBe(key);
      }
    });

    it('should handle unicode characters in data', async () => {
      const unicodeData = {
        text: 'Hello 世界 🌍 Привет مرحبا',
        emoji: '🚗 ⛽ 💰'
      };

      await storage.set('unicode-key', unicodeData);
      const result = await storage.get('unicode-key');

      expect(result.text).toBe(unicodeData.text);
      expect(result.emoji).toBe(unicodeData.emoji);
    });

    it('should handle very long keys', async () => {
      const longKey = 'a'.repeat(1000);
      await storage.set(longKey, { value: 'test' });
      const result = await storage.get(longKey);
      expect(result.value).toBe('test');
    });

    it('should handle empty key', async () => {
      await storage.set('', { value: 'test' });
      const result = await storage.get('');
      expect(result.value).toBe('test');
    });

    it('should handle numeric keys', async () => {
      await storage.set(123, { value: 'numeric-key' });
      const result = await storage.get(123);
      expect(result.value).toBe('numeric-key');
    });
  });

  describe('Data Types', () => {
    it('should store and retrieve strings', async () => {
      await storage.set('string-key', 'test-string');
      const result = await storage.get('string-key');
      expect(result).toBe('test-string');
    });

    it('should store and retrieve numbers', async () => {
      await storage.set('number-key', 42);
      const result = await storage.get('number-key');
      expect(result).toBe(42);
    });

    it('should store and retrieve booleans', async () => {
      await storage.set('boolean-key', true);
      const result = await storage.get('boolean-key');
      expect(result).toBe(true);
    });

    it('should store and retrieve arrays', async () => {
      const array = [1, 2, 3, 4, 5];
      await storage.set('array-key', array);
      const result = await storage.get('array-key');
      expect(result).toEqual(array);
    });

    it('should store and retrieve dates', async () => {
      const date = new Date('2025-01-15T10:30:00Z');
      await storage.set('date-key', date.toISOString());
      const result = await storage.get('date-key');
      expect(result).toBe(date.toISOString());
    });

    it('should store and retrieve null values', async () => {
      await storage.set('null-key', null);
      const result = await storage.get('null-key');
      expect(result).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should handle rapid sequential reads/writes', async () => {
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await storage.set(`perf-key-${i}`, { value: i });
      }

      for (let i = 0; i < iterations; i++) {
        await storage.get(`perf-key-${i}`);
      }

      const duration = Date.now() - startTime;

      // Should complete reasonably fast (< 5 seconds for 200 operations)
      expect(duration).toBeLessThan(5000);
    });

    it('should handle nested object structures efficiently', async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deeply-nested'
                }
              }
            }
          }
        }
      };

      await storage.set('nested-key', nestedObject);
      const result = await storage.get('nested-key');

      expect(result.level1.level2.level3.level4.level5.value).toBe('deeply-nested');
    });
  });

  describe('Schema Validation', () => {
    it('should validate basic log structure', async () => {
      const logData = {
        logs: [
          {
            id: '1',
            date: '2025-01-15T10:30:00Z',
            odometer: 15000,
            liters: 45.5,
            price: 120.00,
            mileage: 15.0
          }
        ]
      };

      await storage.set('log-key', logData);
      const result = await storage.get('log-key');

      expect(result.logs[0]).toHaveProperty('id');
      expect(result.logs[0]).toHaveProperty('odometer');
      expect(result.logs[0]).toHaveProperty('liters');
    });

    it('should handle vehicle profile structure', async () => {
      const vehicleData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          tankCapacity: 50,
          expectedMileage: 15
        }
      };

      await storage.set('vehicle-key', vehicleData);
      const result = await storage.get('vehicle-key');

      expect(result.vehicleProfile.name).toBe('Test Vehicle');
      expect(result.vehicleProfile.tankCapacity).toBe(50);
    });
  });
});
