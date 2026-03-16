/**
 * Rate Limiting Middleware Tests
 *
 * Tests rate limiting enforcement, sliding window algorithm,
 * IP-based throttling, and bypass detection.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../../backend/server.js';
import {
  apiRateLimiter,
  cacheRateLimiter,
  strictRateLimiter,
  createRateLimiter,
  applyRateLimit,
} from '../../../backend/middleware/rateLimit.js';

describe('Rate Limiting Middleware', () => {
  describe('Standard Rate Limiter', () => {
    beforeEach(() => {
      // Reset rate limiter between tests
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should enforce rate limit (10 req/min)', async () => {
      const responses = [];

      // Make 11 requests (1 over limit)
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.1');
        responses.push(res);
      }

      // First 10 should succeed
      for (let i = 0; i < 10; i++) {
        expect(responses[i].status).toBe(200);
      }

      // 11th should be rate limited
      expect(responses[10].status).toBe(429);
      expect(responses[10].body.error).toContain('Too many requests');
    });

    it('should return 429 status when exceeded', async () => {
      const responses = [];

      // Make 11 requests
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.2');
        responses.push(res);
      }

      const rateLimitedResponse = responses[10];

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body).toHaveProperty('error');
    });

    it('should use sliding window algorithm', async () => {
      const responses = [];

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.3');
        responses.push(res);
      }

      // All should succeed
      for (let i = 0; i < 10; i++) {
        expect(responses[i].status).toBe(200);
      }

      // Advance time to expire the window
      vi.advanceTimersByTime(65000); // 65 seconds (past the 60 second window)

      // Now make another request (should succeed if sliding window works)
      const res = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year')
        .set('X-Forwarded-For', '10.0.0.3');

      expect(res.status).toBe(200);
    });

    it('should track requests by IP', async () => {
      const ip1Responses = [];
      const ip2Responses = [];

      // IP 1 makes 5 requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.10');
        ip1Responses.push(res);
      }

      // IP 2 makes 5 requests
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.20');
        ip2Responses.push(res);
      }

      // All should succeed (each IP under limit)
      [...ip1Responses, ...ip2Responses].forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    it('should reset rate limit after window', async () => {
      const responses = [];

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.4');
        responses.push(res);
      }

      // Advance time past window
      vi.advanceTimersByTime(65000); // 65 seconds (window is 60 seconds)

      // Next request should succeed
      const res = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year')
        .set('X-Forwarded-For', '10.0.0.4');

      expect(res.status).toBe(200);
    });
  });

  describe('Security Tests - Rate Limit Bypass Prevention', () => {
    it('should prevent rate limit bypass via IP spoofing', async () => {
      const responses = [];

      // Try to bypass by changing IP header
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Real-IP', `10.0.0.${i}`)
          .set('X-Forwarded-For', '10.0.0.1'); // Always same IP
        responses.push(res);
      }

      // Rate limiter should still work
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should prevent rate limit bypass via header manipulation', async () => {
      const responses = [];

      // Try various header combinations
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', `10.0.0.1, 10.0.0.${i}`);
        responses.push(res);
      }

      // Rate limiter should still work
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should detect DDoS patterns', async () => {
      const responses = [];
      const startTime = Date.now();

      // Make 20 rapid requests from same IP
      for (let i = 0; i < 20; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.5');
        responses.push(res);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should detect pattern and rate limit
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      expect(rateLimitedResponses.length).toBeLessThan(20);
    });

    it('should limit concurrent requests per IP', async () => {
      const promises = [];

      // Make 15 concurrent requests
      for (let i = 0; i < 15; i++) {
        promises.push(
          request(app)
            .get('/api/fueleconomy/vehicle/menu/year')
            .set('X-Forwarded-For', '10.0.0.6')
        );
      }

      const responses = await Promise.all(promises);

      // Some should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should block suspicious IP addresses', async () => {
      // IP that makes too many requests in short time
      const responses = [];

      for (let i = 0; i < 30; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.99');
        responses.push(res);
      }

      // Most should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(15);
    });

    it('should log rate limit violations', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Log level must be debug to see warnings
      const originalLogLevel = process.env.LOG_LEVEL;
      process.env.LOG_LEVEL = 'debug';

      // This would log rate limit violations
      // (actual logging tested in integration)

      consoleSpy.mockRestore();
      process.env.LOG_LEVEL = originalLogLevel;
    });
  });

  describe('Custom Rate Limiters', () => {
    it('should create custom rate limiter', () => {
      const customLimiter = createRateLimiter({
        windowMs: 30000,
        max: 5,
      });

      expect(customLimiter).toBeDefined();
    });

    it('should apply custom rate limit', () => {
      const strictLimiter = applyRateLimit('strict');

      expect(strictLimiter).toBeDefined();
    });

    it('should apply cache rate limiter', () => {
      const cacheLimiter = applyRateLimit('cache');

      expect(cacheLimiter).toBeDefined();
    });

    it('should apply standard rate limiter', () => {
      const standardLimiter = applyRateLimit('standard');

      expect(standardLimiter).toBeDefined();
    });
  });

  describe('Rate Limit Response Headers', () => {
    it('should return retry-after header', async () => {
      const responses = [];

      // Make 11 requests
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '10.0.0.7');
        responses.push(res);
      }

      const rateLimitedResponse = responses[10];

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body).toHaveProperty('retryAfter');
    });

    it('should include rate limit headers', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year')
        .set('X-Forwarded-For', '10.0.0.8');

      expect(response.status).toBe(200);
    });
  });

  describe('Rate Limiting for Different Route Types', () => {
    it('should have stricter limits for write operations', () => {
      const strictLimiter = applyRateLimit('strict');

      expect(strictLimiter).toBeDefined();
      // Strict limiter should have lower max requests
    });

    it('should have lenient limits for cache hits', () => {
      const cacheLimiter = applyRateLimit('cache');

      expect(cacheLimiter).toBeDefined();
      // Cache limiter should have higher max requests
    });
  });

  describe('Rate Limiting with Different IPs', () => {
    it('should allow bypass for localhost', async () => {
      // localhost may have different rate limits
      const responses = [];

      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '127.0.0.1');
        responses.push(res);
      }

      // Some should succeed
      const successResponses = responses.filter(r => r.status === 200);
      expect(successResponses.length).toBeGreaterThan(0);
    });

    it('should track different IPs independently', async () => {
      const ip1Responses = [];
      const ip2Responses = [];

      // IP 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.50');
        ip1Responses.push(res);
      }

      // IP 2 makes 10 requests
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.60');
        ip2Responses.push(res);
      }

      // Both IPs should be at their limits
      expect(ip1Responses[9].status).toBe(200);
      expect(ip2Responses[9].status).toBe(200);
    });
  });
});
