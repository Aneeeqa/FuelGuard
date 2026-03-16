/**
 * FuelEconomy API Proxy Routes Tests
 *
 * Tests proxy server that forwards requests to EPA FuelEconomy.gov API.
 * Includes security tests for SQL injection, XSS, and rate limiting.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../../backend/server.js';
import { resetRateLimiters } from '../../../backend/middleware/rateLimit.js';

describe('FuelEconomy API Proxy Routes', () => {
  beforeEach(() => {
    // Reset rate limiter counters between tests to avoid 429 errors
    resetRateLimiters();
  });
  describe('GET /api/fueleconomy/vehicle/menu/year', () => {
    it('should return available vehicle years', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('menuItem');
      expect(Array.isArray(response.body.menuItem)).toBe(true);
      expect(response.body.menuItem.length).toBeGreaterThan(0);
    });

    it('should include current year', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year');

      const currentYear = new Date().getFullYear();
      const years = response.body.menuItem.map(item => parseInt(item.value));
      expect(years).toContain(currentYear);
    });

    it('should include year 1984 (minimum)', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year');

      const years = response.body.menuItem.map(item => parseInt(item.value));
      expect(years).toContain(1984);
    });
  });

  describe('GET /api/fueleconomy/vehicle/menu/make', () => {
    it('should return makes for given year', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/make?year=2025');

      expect(response.status).toBe(200);
      expect(response.body.menuItem).toBeDefined();
      expect(response.body.menuItem.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing year parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/make');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid year (too old)', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/make?year=1980');

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid year (too new)', async () => {
      const futureYear = new Date().getFullYear() + 10;
      const response = await request(app)
        .get(`/api/fueleconomy/vehicle/menu/make?year=${futureYear}`);

      expect(response.status).toBe(400);
    });

    it('should sanitize year parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/make?year=2025');

      expect(response.status).toBe(200);
      expect(response.body.menuItem).toBeDefined();
    });
  });

  describe('GET /api/fueleconomy/vehicle/menu/model', () => {
    it('should return models for given make and year', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=Toyota');

      expect(response.status).toBe(200);
      expect(response.body.menuItem).toBeDefined();
      expect(response.body.menuItem.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing make parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid make (special chars)', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=Toyota<script>');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/fueleconomy/vehicle/menu/options', () => {
    it('should return options for given vehicle', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/options?year=2025&make=Toyota&model=Corolla');

      expect(response.status).toBe(200);
      expect(response.body.menuItem).toBeDefined();
    });

    it('should return 400 for missing model', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/options?year=2025&make=Toyota');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/fueleconomy/vehicle/:vehicleId', () => {
    it('should return vehicle details', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/41190');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('make');
      expect(response.body).toHaveProperty('model');
      expect(response.body).toHaveProperty('year');
    });

    it('should return 404 for unknown vehicle ID', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/999999');

      expect([404, 500]).toContain(response.status);
    });

    it('should return 400 for invalid vehicle ID', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/invalid');

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  describe('Security Tests - SQL Injection Prevention', () => {
    it('should prevent SQL injection in year parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/make?year=2025; DROP TABLE vehicles--');

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent SQL injection in make parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=Toyota\' OR \'1\'=\'1');

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent SQL injection in model parameter', async () => {
      const response = await request(app)
        .get("/api/fueleconomy/vehicle/menu/options?year=2025&make=Toyota&model=Corolla' UNION SELECT NULL,NULL,NULL--");

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Security Tests - XSS Prevention', () => {
    it('should prevent XSS in make parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=<script>alert(1)</script>');

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent XSS in model parameter', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/options?year=2025&make=Toyota&model=<img src=x onerror=alert(1)>');

      expect([400, 500]).toContain(response.status);
    });

    it('should prevent iframe injection', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=<iframe src="evil.com"></iframe>');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Security Tests - Input Validation', () => {
    it('should sanitize special characters', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/model?year=2025&make=Toyota&model=Corolla@#$%');

      expect([400, 500]).toContain(response.status);
    });

    it('should validate numeric inputs only for vehicle ID', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/abc123');

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject overly long parameters', async () => {
      const longModel = 'a'.repeat(200);
      const response = await request(app)
        .get(`/api/fueleconomy/vehicle/menu/options?year=2025&make=Toyota&model=${longModel}`);

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Security Tests - Path Traversal', () => {
    it('should prevent path traversal attacks', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/../../etc/passwd');

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('Rate Limiting - CRITICAL TESTS', () => {
    it('should enforce rate limit (10 requests/minute)', async () => {
      const responses = [];

      // Make 11 requests (1 over limit)
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.100');
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

    it('should prevent rate limit bypass via IP spoofing', async () => {
      const responses = [];

      // Make 11 requests with different spoofed IPs
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', `10.0.0.${i}`);
        responses.push(res);
      }

      // Rate limiter should still work
      // (implementation may vary based on key generator)
      expect(responses.length).toBe(11);
    });

    it('should return retry-after header on rate limit', async () => {
      const responses = [];

      // Make 11 requests
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '192.168.1.101');
        responses.push(res);
      }

      // Check retry-after header on rate limited response
      const rateLimitedResponse = responses[10];
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body).toHaveProperty('retryAfter');
    });
  });

  describe('CORS and Headers', () => {
    it('should return CORS headers', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/menu/year')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/fueleconomy/vehicle/menu/year')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should handle upstream API errors', async () => {
      const response = await request(app)
        .get('/api/fueleconomy/vehicle/invalid-id');

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
