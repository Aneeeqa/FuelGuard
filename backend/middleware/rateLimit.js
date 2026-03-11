/**
 * Rate Limiting Middleware
 *
 * Protects the API from abuse by limiting request rates
 * per IP address or client.
 */

import rateLimit from 'express-rate-limit';
import { rateLimitConfig, logConfig } from '../config/index.js';

/**
 * Standard rate limiter for FuelEconomy API requests
 * Limits to 10 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitConfig.message,
  handler: (req, res) => {
    if (logConfig.level === 'debug') {
      console.warn(`⚠️  Rate limit exceeded for IP: ${req.ip}`);
    }

    res.status(429).json({
      status: 429,
      error: 'Too many requests',
      message: rateLimitConfig.message.error,
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
    });
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * More lenient rate limiter for cache hits
 * Allows 100 requests per minute
 */
export const cacheRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many cache requests',
    message: 'Please wait before making more requests.',
  },
});

/**
 * Strict rate limiter for write operations (if any)
 * Limits to 5 requests per minute
 */
export const strictRateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many write operations',
    message: 'Please wait before making more requests.',
  },
});

/**
 * Custom key generator to use user ID if available
 */
export const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || rateLimitConfig.windowMs,
    max: options.max || rateLimitConfig.max,
    keyGenerator: options.keyGenerator || ((req) => {
      // Use X-Forwarded-For if available (behind proxy)
      return req.headers['x-forwarded-for']?.split(',')[0] ||
             req.headers['x-real-ip'] ||
             req.ip ||
             req.connection.remoteAddress;
    }),
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message || rateLimitConfig.message,
    skip: options.skip || (() => false),
  });
};

/**
 * Apply rate limiting based on route type
 */
export const applyRateLimit = (routeType = 'standard') => {
  switch (routeType) {
    case 'strict':
      return strictRateLimiter;
    case 'cache':
      return cacheRateLimiter;
    case 'standard':
    default:
      return apiRateLimiter;
  }
};

export default {
  apiRateLimiter,
  cacheRateLimiter,
  strictRateLimiter,
  createRateLimiter,
  applyRateLimit,
};
