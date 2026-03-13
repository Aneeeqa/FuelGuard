/**
 * Response Caching Middleware
 *
 * Caches API responses to reduce load on upstream services
 * and improve response times.
 */

import NodeCache from 'node-cache';
import { cacheConfig, logConfig } from '../config/index.js';

/**
 * Initialize cache instance
 */
const cache = new NodeCache({
  stdTTL: cacheConfig.ttl,
  checkperiod: cacheConfig.checkPeriod,
  useClones: true,
  maxKeys: cacheConfig.maxEntries,
});

/**
 * Generate cache key from request
 * @param {string} endpoint - API endpoint
 * @param {Object} query - Query parameters
 * @returns {string} Cache key
 */
export const generateCacheKey = (endpoint, query = {}) => {
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  return queryString ? `${endpoint}?${queryString}` : endpoint;
};

/**
 * Get cached response
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found
 */
export const getCachedResponse = (key) => {
  if (!cacheConfig.enabled) return null;

  const cached = cache.get(key);

  if (cached && logConfig.level === 'debug') {
    console.log(`✅ Cache hit for key: ${key}`);
  }

  return cached || null;
};

/**
 * Cache response
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Custom TTL (optional)
 */
export const setCachedResponse = (key, data, ttl) => {
  if (!cacheConfig.enabled) return false;

  try {
    cache.set(key, data, ttl);
    if (logConfig.level === 'debug') {
      console.log(`💾 Cached response for key: ${key}`);
    }
    return true;
  } catch (error) {
    console.error('❌ Error caching response:', error);
    return false;
  }
};

/**
 * Clear cache by key or pattern
 * @param {string} key - Cache key or pattern
 */
export const clearCache = (key) => {
  if (!cacheConfig.enabled) return;

  if (key) {
    cache.del(key);
    if (logConfig.level === 'debug') {
      console.log(`🗑️  Cleared cache for key: ${key}`);
    }
  } else {
    cache.flushAll();
    console.log('🗑️  Cleared all cache');
  }
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
  const stats = cache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
    hitRate: stats.hits / (stats.hits + stats.misses) * 100 || 0,
  };
};

/**
 * Express middleware for caching
 * Checks cache before forwarding request to upstream API
 */
export const cacheMiddleware = async (req, res, next) => {
  // Skip caching if disabled
  if (!cacheConfig.enabled) {
    return next();
  }

  // Skip caching for non-GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Generate cache key
  const cacheKey = generateCacheKey(req.sanitizedEndpoint, req.query);

  // Check cache
  const cached = getCachedResponse(cacheKey);

  if (cached) {
    // Add cache headers
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('X-Cache-Key', cacheKey);

    return res.json(cached);
  }

  // Mark cache miss and continue
  res.setHeader('X-Cache', 'MISS');

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json to cache response
  res.json = (data) => {
    setCachedResponse(cacheKey, data);
    return originalJson(data);
  };

  next();
};

/**
 * Middleware to add cache headers to response
 */
export const cacheHeadersMiddleware = (req, res, next) => {
  if (req.method === 'GET' && cacheConfig.enabled) {
    // Add cache control header
    res.setHeader('Cache-Control', `public, max-age=${cacheConfig.ttl}`);
    res.setHeader('X-Cache-TTL', cacheConfig.ttl.toString());
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
};

/**
 * Health check endpoint for cache
 */
export const cacheHealthCheck = () => {
  const stats = getCacheStats();
  return {
    status: 'healthy',
    enabled: cacheConfig.enabled,
    stats,
  };
};

export default {
  cache,
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats,
  cacheMiddleware,
  cacheHeadersMiddleware,
  cacheHealthCheck,
};
