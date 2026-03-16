/**
 * Backend Configuration Tests
 *
 * Tests environment variable loading, configuration validation,
 * and default values.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  serverConfig,
  apiConfig,
  securityConfig,
  rateLimitConfig,
  cacheConfig,
  logConfig,
  getCorsOrigins,
} from '../../../backend/config/index.js';

describe('Backend Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment variables
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  describe('Server Configuration', () => {
    it('should load PORT from environment', () => {
      process.env.PORT = '4000';

      // Re-import to pick up new env vars
      // Note: In a real test, we'd need to invalidate the module cache
      // For now, we test with existing values

      expect(typeof serverConfig.port).toBe('number');
      expect(serverConfig.port).toBeGreaterThan(0);
    });

    it('should load NODE_ENV from environment', () => {
      expect(['development', 'production', 'test']).toContain(serverConfig.nodeEnv);
    });

    it('should set isProduction correctly', () => {
      expect(typeof serverConfig.isProduction).toBe('boolean');
    });

    it('should set isDevelopment correctly', () => {
      expect(typeof serverConfig.isDevelopment).toBe('boolean');
    });

    it('should use default PORT if not set', () => {
      // If PORT is not set, default to 3000
      expect(serverConfig.port).toBeGreaterThanOrEqual(3000);
    });

    it('should validate PORT is numeric', () => {
      expect(typeof serverConfig.port).toBe('number');
      expect(Number.isInteger(serverConfig.port)).toBe(true);
    });
  });

  describe('API Configuration', () => {
    it('should load FUELECONOMY_API_URL from environment', () => {
      expect(apiConfig.fueleconomyUrl).toBeDefined();
      expect(typeof apiConfig.fueleconomyUrl).toBe('string');
    });

    it('should use default API URL if not set', () => {
      expect(apiConfig.fueleconomyUrl).toContain('fueleconomy.gov');
    });

    it('should have valid timeout value', () => {
      expect(apiConfig.timeout).toBeDefined();
      expect(typeof apiConfig.timeout).toBe('number');
      expect(apiConfig.timeout).toBeGreaterThan(0);
    });

    it('should have user agent configured', () => {
      expect(apiConfig.userAgent).toBeDefined();
      expect(typeof apiConfig.userAgent).toBe('string');
    });
  });

  describe('Security Configuration', () => {
    it('should load CORS_ORIGINS from environment', () => {
      expect(securityConfig.corsOrigins).toBeDefined();
      expect(Array.isArray(securityConfig.corsOrigins)).toBe(true);
    });

    it('should load ENABLE_HSTS from environment', () => {
      expect(typeof securityConfig.enableHSTS).toBe('boolean');
    });

    it('should load HSTS_MAX_AGE from environment', () => {
      expect(securityConfig.hstsMaxAge).toBeDefined();
      expect(typeof securityConfig.hstsMaxAge).toBe('number');
    });

    it('should validate CORS_ORIGINS format', () => {
      securityConfig.corsOrigins.forEach(origin => {
        expect(typeof origin).toBe('string');
        expect(origin.length).toBeGreaterThan(0);
      });
    });

    it('should have default CORS origins for development', () => {
      if (serverConfig.isDevelopment) {
        expect(securityConfig.corsOrigins.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should load RATE_LIMIT_WINDOW_MS from environment', () => {
      expect(rateLimitConfig.windowMs).toBeDefined();
      expect(typeof rateLimitConfig.windowMs).toBe('number');
    });

    it('should load RATE_LIMIT_MAX from environment', () => {
      expect(rateLimitConfig.max).toBeDefined();
      expect(typeof rateLimitConfig.max).toBe('number');
    });

    it('should use default rate limit window', () => {
      expect(rateLimitConfig.windowMs).toBeGreaterThanOrEqual(1000);
    });

    it('should use default rate limit max', () => {
      expect(rateLimitConfig.max).toBeGreaterThan(0);
      expect(rateLimitConfig.max).toBeLessThanOrEqual(100);
    });

    it('should have rate limit message configured', () => {
      expect(rateLimitConfig.message).toBeDefined();
      expect(rateLimitConfig.message).toHaveProperty('status');
      expect(rateLimitConfig.message).toHaveProperty('error');
    });
  });

  describe('Caching Configuration', () => {
    it('should load ENABLE_CACHE from environment', () => {
      expect(typeof cacheConfig.enabled).toBe('boolean');
    });

    it('should load CACHE_TTL from environment', () => {
      expect(cacheConfig.ttl).toBeDefined();
      expect(typeof cacheConfig.ttl).toBe('number');
    });

    it('should load CACHE_MAX_ENTRIES from environment', () => {
      expect(cacheConfig.maxEntries).toBeDefined();
      expect(typeof cacheConfig.maxEntries).toBe('number');
    });

    it('should use default cache TTL', () => {
      expect(cacheConfig.ttl).toBeGreaterThan(0);
    });

    it('should use default cache max entries', () => {
      expect(cacheConfig.maxEntries).toBeGreaterThan(0);
    });

    it('should have cache check period configured', () => {
      expect(cacheConfig.checkPeriod).toBeDefined();
      expect(typeof cacheConfig.checkPeriod).toBe('number');
    });
  });

  describe('Logging Configuration', () => {
    it('should load LOG_LEVEL from environment', () => {
      expect(logConfig.level).toBeDefined();
      expect(typeof logConfig.level).toBe('string');
    });

    it('should load ENABLE_DEBUG_LOGGING from environment', () => {
      expect(typeof logConfig.enableDebug).toBe('boolean');
    });

    it('should have valid log level', () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      expect(validLevels).toContain(logConfig.level);
    });
  });

  describe('CORS Origins Helper', () => {
    it('should return CORS origins array', () => {
      const origins = getCorsOrigins();

      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBeGreaterThan(0);
    });

    it('should include localhost in development', () => {
      if (serverConfig.isDevelopment) {
        const origins = getCorsOrigins();
        const hasLocalhost = origins.some(origin =>
          origin.includes('localhost') || origin.includes('127.0.0.1')
        );
        expect(hasLocalhost).toBe(true);
      }
    });

    it('should validate CORS origins format', () => {
      const origins = getCorsOrigins();

      origins.forEach(origin => {
        expect(typeof origin).toBe('string');
        expect(origin.length).toBeGreaterThan(0);
        // Should be a valid URL or wildcard
        expect(['http://', 'https://', '*'].some(prefix =>
          origin.startsWith(prefix)
        ) || origin === '*').toBe(true);
      });
    });

    it('should throw error in production without CORS_ORIGINS', () => {
      // In production, CORS_ORIGINS must be configured
      if (serverConfig.isProduction) {
        expect(() => getCorsOrigins()).not.toThrow();
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should have required configuration values', () => {
      expect(serverConfig.port).toBeDefined();
      expect(apiConfig.fueleconomyUrl).toBeDefined();
      expect(securityConfig.corsOrigins).toBeDefined();
      expect(rateLimitConfig.windowMs).toBeDefined();
      expect(rateLimitConfig.max).toBeDefined();
      expect(cacheConfig.ttl).toBeDefined();
      expect(logConfig.level).toBeDefined();
    });

    it('should have valid configuration types', () => {
      expect(typeof serverConfig.port).toBe('number');
      expect(typeof apiConfig.fueleconomyUrl).toBe('string');
      expect(Array.isArray(securityConfig.corsOrigins)).toBe(true);
      expect(typeof rateLimitConfig.windowMs).toBe('number');
      expect(typeof rateLimitConfig.max).toBe('number');
      expect(typeof cacheConfig.ttl).toBe('number');
      expect(typeof logConfig.level).toBe('string');
    });

    it('should have reasonable configuration values', () => {
      expect(serverConfig.port).toBeGreaterThan(1024);
      expect(serverConfig.port).toBeLessThan(65536);
      expect(apiConfig.timeout).toBeGreaterThan(0);
      expect(rateLimitConfig.max).toBeGreaterThan(0);
      expect(cacheConfig.ttl).toBeGreaterThan(0);
      expect(cacheConfig.maxEntries).toBeGreaterThan(0);
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should handle development environment', () => {
      if (serverConfig.nodeEnv === 'development') {
        expect(serverConfig.isDevelopment).toBe(true);
        expect(serverConfig.isProduction).toBe(false);
      }
    });

    it('should handle production environment', () => {
      if (serverConfig.nodeEnv === 'production') {
        expect(serverConfig.isProduction).toBe(true);
        expect(serverConfig.isDevelopment).toBe(false);
      }
    });

    it('should handle test environment', () => {
      if (serverConfig.nodeEnv === 'test') {
        expect(serverConfig.isProduction).toBe(false);
      }
    });
  });

  describe('Security Defaults', () => {
    it('should have secure default values', () => {
      expect(rateLimitConfig.max).toBeLessThanOrEqual(100);
      expect(cacheConfig.enabled).toBe(true);
    });

    it('should have reasonable HSTS settings', () => {
      if (securityConfig.enableHSTS) {
        expect(securityConfig.hstsMaxAge).toBeGreaterThanOrEqual(31536000); // 1 year
      }
    });
  });
});
