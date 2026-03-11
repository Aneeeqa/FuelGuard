/**
 * Backend Configuration
 *
 * Centralized configuration management for the backend proxy server
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Validate required environment variables
 */
const validateConfig = () => {
  const required = ['PORT', 'FUELECONOMY_API_URL'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Server Configuration
 */
export const serverConfig = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

/**
 * API Configuration
 */
export const apiConfig = {
  fueleconomyUrl: process.env.FUELECONOMY_API_URL || 'https://www.fueleconomy.gov/ws/rest',
  userAgent: process.env.USER_AGENT || 'FuelGuard-Backend/1.0',
  timeout: parseInt(process.env.API_TIMEOUT, 10) || 10000,
};

/**
 * Security Configuration
 */
export const securityConfig = {
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173'],
  enableHSTS: process.env.ENABLE_HSTS === 'true',
  hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE, 10) || 15768000,
};

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 10,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.',
  },
};

/**
 * Caching Configuration
 */
export const cacheConfig = {
  enabled: process.env.ENABLE_CACHE !== 'false',
  ttl: parseInt(process.env.CACHE_TTL, 10) || 1800,
  maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES, 10) || 1000,
  checkPeriod: parseInt(process.env.CACHE_TTL, 10) * 1000 || 1800000,
};

/**
 * Logging Configuration
 */
export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.ENABLE_DEBUG_LOGGING === 'true',
};

/**
 * Get appropriate CORS origin array
 */
export const getCorsOrigins = () => {
  if (securityConfig.corsOrigins.length > 0) {
    return securityConfig.corsOrigins;
  }

  // Default origins based on environment
  if (serverConfig.isDevelopment) {
    return ['http://localhost:5173', 'https://localhost:5173'];
  }

  // In production, require explicit configuration
  throw new Error('CORS_ORIGINS must be configured in production');
};

/**
 * Validate configuration on load
 */
try {
  validateConfig();
  console.log('✅ Backend configuration validated successfully');
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}

export default {
  server: serverConfig,
  api: apiConfig,
  security: securityConfig,
  rateLimit: rateLimitConfig,
  cache: cacheConfig,
  log: logConfig,
  getCorsOrigins,
};
