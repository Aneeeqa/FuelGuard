/**
 * FuelEconomy.gov API Proxy Routes
 *
 * Securely proxies requests to the EPA FuelEconomy.gov API
 * with validation, caching, and rate limiting.
 */

import express from 'express';
import { apiConfig, logConfig, serverConfig } from '../config/index.js';
import { validationMiddleware } from '../middleware/validation.js';
import { apiRateLimiter, cacheRateLimiter } from '../middleware/rateLimit.js';
import { cacheMiddleware, cacheHeadersMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * Apply middleware to all routes
 */
router.use(validationMiddleware);
router.use(apiRateLimiter);
router.use(cacheMiddleware);
router.use(cacheHeadersMiddleware);

/**
 * Helper function to fetch from EPA API
 * @param {string} endpoint - API endpoint path
 * @returns {Promise<Object>} API response data
 */
const fetchFromEpaApi = async (endpoint) => {
  const url = `${apiConfig.fueleconomyUrl}/${endpoint}`;

  if (logConfig.level === 'debug') {
    console.log(`🔗 Fetching from EPA API: ${url}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), apiConfig.timeout);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': apiConfig.userAgent,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`EPA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (logConfig.level === 'debug') {
      console.log(`✅ Successfully fetched data from EPA API`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    console.error('❌ EPA API fetch error:', error.message);
    throw error;
  }
};

/**
 * GET /api/fueleconomy/vehicle/menu/year
 * Fetch available model years
 */
router.get('/api/fueleconomy/vehicle/menu/year', async (req, res) => {
  try {
    const endpoint = 'vehicle/menu/year';
    const data = await fetchFromEpaApi(endpoint);

    return res.json(data);
  } catch (error) {
    console.error('Error fetching years:', error);
    return res.status(500).json({
      error: 'Failed to fetch vehicle years',
      status: 'error',
    });
  }
});

/**
 * GET /api/fueleconomy/vehicle/menu/make
 * Fetch makes for a given year
 * Query params: year
 */
router.get('/api/fueleconomy/vehicle/menu/make', async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({
        error: 'Year parameter is required',
        status: 'invalid_request',
      });
    }

    const endpoint = `vehicle/menu/make?year=${year}`;
    const data = await fetchFromEpaApi(endpoint);

    return res.json(data);
  } catch (error) {
    console.error('Error fetching makes:', error);
    return res.status(500).json({
      error: 'Failed to fetch vehicle makes',
      status: 'error',
    });
  }
});

/**
 * GET /api/fueleconomy/vehicle/menu/model
 * Fetch models for a given year and make
 * Query params: year, make
 */
router.get('/api/fueleconomy/vehicle/menu/model', async (req, res) => {
  try {
    const { year, make } = req.query;

    if (!year || !make) {
      return res.status(400).json({
        error: 'Year and make parameters are required',
        status: 'invalid_request',
      });
    }

    const endpoint = `vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`;
    const data = await fetchFromEpaApi(endpoint);

    return res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({
      error: 'Failed to fetch vehicle models',
      status: 'error',
    });
  }
});

/**
 * GET /api/fueleconomy/vehicle/menu/options
 * Fetch vehicle options/variants for a given year, make, and model
 * Query params: year, make, model
 */
router.get('/api/fueleconomy/vehicle/menu/options', async (req, res) => {
  try {
    const { year, make, model } = req.query;

    if (!year || !make || !model) {
      return res.status(400).json({
        error: 'Year, make, and model parameters are required',
        status: 'invalid_request',
      });
    }

    const endpoint = `vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    const data = await fetchFromEpaApi(endpoint);

    return res.json(data);
  } catch (error) {
    console.error('Error fetching options:', error);
    return res.status(500).json({
      error: 'Failed to fetch vehicle options',
      status: 'error',
    });
  }
});

/**
 * GET /api/fueleconomy/vehicle/:vehicleId
 * Fetch full vehicle details by vehicle ID
 */
router.get('/api/fueleconomy/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (!vehicleId) {
      return res.status(400).json({
        error: 'Vehicle ID is required',
        status: 'invalid_request',
      });
    }

    const endpoint = `vehicle/${vehicleId}`;
    const data = await fetchFromEpaApi(endpoint);

    return res.json(data);
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    return res.status(500).json({
      error: 'Failed to fetch vehicle details',
      status: 'error',
    });
  }
});

/**
 * GET /api/fueleconomy/health
 * Health check endpoint
 */
router.get('/api/fueleconomy/health', async (req, res) => {
  try {
    // Test EPA API connectivity
    const response = await fetch(`${apiConfig.fueleconomyUrl}/vehicle/menu/year`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': apiConfig.userAgent,
      },
    });

    const isHealthy = response.ok;

    return res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      upstream: {
        fueleconomy: {
          status: isHealthy ? 'up' : 'down',
          responseTime: response.headers.get('x-response-time') || 'unknown',
        },
      },
    });
  } catch (error) {
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Error handler
 */
router.use((error, req, res, next) => {
  console.error('Proxy error:', error);

  // Don't leak error details in production
  const message = serverConfig.isProduction
    ? 'Internal server error'
    : error.message;

  res.status(error.status || 500).json({
    error: message,
    status: 'error',
  });
});

export default router;
