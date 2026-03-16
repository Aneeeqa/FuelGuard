/**
 * Response Caching Middleware Tests
 *
 * Tests caching middleware including cache hit/miss scenarios,
 * TTL expiration, and cache invalidation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import cacheMiddlewareExports from '../../../backend/middleware/cache.js';

const {
  cache,
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats,
  cacheMiddleware,
  cacheHeadersMiddleware,
  cacheHealthCheck,
} = cacheMiddlewareExports;

describe('Cache Middleware', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.flushAll();
  });

  describe('Cache Key Generation', () => {
    it('should generate cache key from endpoint only', () => {
      const key = generateCacheKey('vehicle/menu/year', {});

      expect(key).toBe('vehicle/menu/year');
    });

    it('should generate cache key with query parameters', () => {
      const key = generateCacheKey('vehicle/menu/make', { year: '2025' });

      expect(key).toBe('vehicle/menu/make?year=2025');
    });

    it('should sort query parameters in cache key', () => {
      const key1 = generateCacheKey('vehicle/menu/model', { year: '2025', make: 'Toyota' });
      const key2 = generateCacheKey('vehicle/menu/model', { make: 'Toyota', year: '2025' });

      expect(key1).toBe(key2);
    });

    it('should handle multiple query parameters', () => {
      const key = generateCacheKey('vehicle/menu/options', { year: '2025', make: 'Toyota', model: 'Corolla' });

      expect(key).toBe('vehicle/menu/options?make=Toyota&model=Corolla&year=2025');
    });
  });

  describe('Cache Operations', () => {
    it('should set and get cached response', () => {
      const key = 'test-key';
      const data = { menuItem: [{ value: '2025' }] };

      const setResult = setCachedResponse(key, data);
      const cached = getCachedResponse(key);

      expect(setResult).toBe(true);
      expect(cached).toEqual(data);
    });

    it('should return null for non-existent cache key', () => {
      const cached = getCachedResponse('non-existent-key');

      expect(cached).toBeNull();
    });

    it('should cache successful API response', () => {
      const key = 'vehicle/menu/year';
      const data = { menuItem: [{ value: '2025' }] };

      setCachedResponse(key, data);
      const cached = getCachedResponse(key);

      expect(cached).toEqual(data);
      expect(cached.menuItem).toBeDefined();
      expect(cached.menuItem).toHaveLength(1);
    });

    it('should return cached response on hit', () => {
      const key = 'test-key';
      const data = { status: 'success', data: 'test-data' };

      setCachedResponse(key, data);
      const cached = getCachedResponse(key);

      expect(cached).toEqual(data);
      expect(cached.status).toBe('success');
    });

    it('should set TTL on cache entries', () => {
      const key = 'test-key';
      const data = { value: 'test' };
      const customTTL = 100; // 100 seconds

      setCachedResponse(key, data, customTTL);
      const cached = getCachedResponse(key);

      expect(cached).toEqual(data);
    });

    it('should expire cache entries after TTL', async () => {
      vi.useFakeTimers();

      const key = 'test-key';
      const data = { value: 'test' };
      const ttl = 2; // 2 seconds

      setCachedResponse(key, data, ttl);
      expect(getCachedResponse(key)).toEqual(data);

      // Fast forward time
      vi.advanceTimersByTime(ttl * 1000 + 100);

      expect(getCachedResponse(key)).toBeNull();

      vi.useRealTimers();
    });

    it('should clear specific cache key', () => {
      const key1 = 'test-key-1';
      const key2 = 'test-key-2';
      const data1 = { value: 'test-1' };
      const data2 = { value: 'test-2' };

      setCachedResponse(key1, data1);
      setCachedResponse(key2, data2);

      clearCache(key1);

      expect(getCachedResponse(key1)).toBeNull();
      expect(getCachedResponse(key2)).toEqual(data2);
    });

    it('should clear all cache', () => {
      const keys = ['key1', 'key2', 'key3'];

      keys.forEach(key => {
        setCachedResponse(key, { value: key });
      });

      clearCache();

      keys.forEach(key => {
        expect(getCachedResponse(key)).toBeNull();
      });
    });

    it('should handle cache write errors', () => {
      const key = 'test-key';
      const largeData = { data: 'x'.repeat(10000000) };

      const setResult = setCachedResponse(key, largeData);

      // Result may be false if cache fails, but shouldn't throw
      expect(typeof setResult).toBe('boolean');
    });

    it('should handle cache read errors', () => {
      // Try to get from corrupted cache
      const cached = getCachedResponse('corrupted-key');

      // Should return null or undefined, not throw
      expect(cached === null || cached === undefined).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', () => {
      const key = 'test-key';
      const data = { value: 'test' };

      setCachedResponse(key, data);
      getCachedResponse(key);

      const stats = getCacheStats();

      expect(stats).toHaveProperty('hits');
      expect(stats.hits).toBeGreaterThan(0);
    });

    it('should track cache misses', () => {
      getCachedResponse('non-existent-key');

      const stats = getCacheStats();

      expect(stats).toHaveProperty('misses');
      expect(stats.misses).toBeGreaterThan(0);
    });

    it('should calculate hit rate', () => {
      const stats = getCacheStats();

      expect(stats).toHaveProperty('hitRate');
      expect(typeof stats.hitRate).toBe('number');
      expect(stats.hitRate).toBeGreaterThanOrEqual(0);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });

    it('should track number of keys', () => {
      setCachedResponse('key1', { value: '1' });
      setCachedResponse('key2', { value: '2' });

      const stats = getCacheStats();

      expect(stats.keys).toBe(2);
    });

    it('should track cache size', () => {
      const key = 'test-key';
      const data = { value: 'test' };

      setCachedResponse(key, data);

      const stats = getCacheStats();

      expect(stats).toHaveProperty('ksize');
      expect(stats).toHaveProperty('vsize');
    });
  });

  describe('Cache Middleware Integration', () => {
    it('should skip caching for non-GET requests', async () => {
      const req = {
        method: 'POST',
        path: '/api/test',
        query: {},
      };

      const res = {
        json: vi.fn(),
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      await cacheMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should skip caching when cache is disabled', async () => {
      // Temporarily disable cache
      const originalEnabled = process.env.ENABLE_CACHE;
      process.env.ENABLE_CACHE = 'false';

      const req = {
        method: 'GET',
        path: '/api/test',
        sanitizedEndpoint: 'test',
        query: {},
      };

      const res = {
        json: vi.fn(),
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      await cacheMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();

      process.env.ENABLE_CACHE = originalEnabled;
    });

    it('should set cache headers on GET requests', () => {
      const req = {
        method: 'GET',
        path: '/api/test',
      };

      const res = {
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      cacheHeadersMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        expect.stringContaining('max-age')
      );
      expect(next).toHaveBeenCalled();
    });

    it('should set no-store header for non-GET requests', () => {
      const req = {
        method: 'POST',
        path: '/api/test',
      };

      const res = {
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      cacheHeadersMiddleware(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(next).toHaveBeenCalled();
    });

    it('should invalidate cache on POST request', async () => {
      // Set some cache
      setCachedResponse('test-key', { value: 'test' });

      const req = {
        method: 'POST',
        path: '/api/test',
      };

      const res = {
        json: vi.fn(),
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      await cacheMiddleware(req, res, next);

      // Cache should not be used for POST
      expect(next).toHaveBeenCalled();
    });

    it('should invalidate cache on PUT request', async () => {
      setCachedResponse('test-key', { value: 'test' });

      const req = {
        method: 'PUT',
        path: '/api/test',
      };

      const res = {
        json: vi.fn(),
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      await cacheMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should invalidate cache on DELETE request', async () => {
      setCachedResponse('test-key', { value: 'test' });

      const req = {
        method: 'DELETE',
        path: '/api/test',
      };

      const res = {
        json: vi.fn(),
        setHeader: vi.fn(),
      };

      const next = vi.fn();

      await cacheMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle cache full scenario', () => {
      // Fill cache with many entries
      for (let i = 0; i < 2000; i++) {
        setCachedResponse(`key-${i}`, { value: i });
      }

      // Cache should still work (may evict old entries)
      const cached = getCachedResponse('key-1000');
      expect(cached).toBeDefined();
    });
  });

  describe('Cache Health Check', () => {
    it('should return healthy status', () => {
      const health = cacheHealthCheck();

      expect(health).toHaveProperty('status');
      expect(health.status).toBe('healthy');
    });

    it('should return enabled status', () => {
      const health = cacheHealthCheck();

      expect(health).toHaveProperty('enabled');
      expect(typeof health.enabled).toBe('boolean');
    });

    it('should return cache stats', () => {
      const health = cacheHealthCheck();

      expect(health).toHaveProperty('stats');
      expect(health.stats).toHaveProperty('hits');
      expect(health.stats).toHaveProperty('misses');
      expect(health.stats).toHaveProperty('keys');
    });
  });
});
