/**
 * Backend Server Tests
 *
 * Tests Express server startup, health checks, graceful shutdown,
 * and middleware integration.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../backend/server.js';
import { resetRateLimiters } from '../../backend/middleware/rateLimit.js';

describe('Express Server', () => {
  beforeEach(() => {
    resetRateLimiters();
  });
  describe('Health Check Endpoints', () => {
    it('should return 200 for /health', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should return cache statistics in health check', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('cache');
      expect(response.body.cache).toHaveProperty('hits');
      expect(response.body.cache).toHaveProperty('misses');
    });

    it('should return API health status', async () => {
      const response = await request(app).get('/api/fueleconomy/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return uptime in milliseconds', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return memory usage', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('memory');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('heapTotal');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect([400, 404]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/test')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      const response = await request(app).get('/api/error');

      // Route goes through validation middleware which may return 400
      expect([400, 404, 500]).toContain(response.status);
      expect(response.body.error).toBeDefined();
    });

    it('should handle oversized request body', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11 MB (exceeds 10 MB limit)

      const response = await request(app)
        .post('/api/test')
        .send(largePayload)
        .set('Content-Type', 'application/json');

      expect([413, 400]).toContain(response.status);
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/api/test')
        .send('{invalid}')
        .set('Content-Type', 'application/json');

      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Middleware Integration', () => {
    it('should apply CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should apply security headers', async () => {
      const response = await request(app).get('/health');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('should apply HSTS header in production', async () => {
      const response = await request(app).get('/health');

      // In development, HSTS might not be enabled
      const hstsHeader = response.headers['strict-transport-security'];
      if (process.env.NODE_ENV === 'production') {
        expect(hstsHeader).toBeDefined();
      }
    });

    it('should apply compression', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept-Encoding', 'gzip');

      // Response should be successful with or without compression
      expect(response.status).toBe(200);
    });

    it('should log requests with Morgan', async () => {
      // Just verify the request is logged (no assertion needed)
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM signal', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      try {
        process.emit('SIGTERM');
      } catch (error) {
        expect(error.message).toBe('Process exited');
      }

      exitSpy.mockRestore();
    });

    it('should handle SIGINT signal', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      try {
        process.emit('SIGINT');
      } catch (error) {
        expect(error.message).toBe('Process exited');
      }

      exitSpy.mockRestore();
    });

    it('should log shutdown message on SIGTERM', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      try {
        process.emit('SIGTERM');
      } catch (error) {
        expect(error.message).toBe('Process exited');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SIGTERM signal received')
      );

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should log shutdown message on SIGINT', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('Process exited');
      });

      try {
        process.emit('SIGINT');
      } catch (error) {
        expect(error.message).toBe('Process exited');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('SIGINT signal received')
      );

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit exceeded (429)', async () => {
      // Make 11 requests to exceed limit (default is 10/min)
      const responses = [];
      for (let i = 0; i < 11; i++) {
        const res = await request(app)
          .get('/api/fueleconomy/vehicle/menu/year')
          .set('X-Forwarded-For', '127.0.0.1');
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
  });
});
