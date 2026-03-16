/**
 * Backend Test Setup
 *
 * Sets up environment variables for backend tests
 */

// Set required environment variables for backend config
process.env.PORT = '3001';
process.env.NODE_ENV = 'test';
process.env.FUELECONOMY_API_URL = 'https://www.fueleconomy.gov/ws/rest';
process.env.USER_AGENT = 'FuelGuard-Backend/1.0 (test)';
process.env.API_TIMEOUT = '10000';
process.env.RATE_LIMIT_MAX = '10';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.ENABLE_CACHE = 'true';
process.env.CACHE_TTL = '1800';
process.env.CACHE_MAX_ENTRIES = '1000';
process.env.LOG_LEVEL = 'info';
process.env.ENABLE_DEBUG_LOGGING = 'false';
process.env.ENABLE_HSTS = 'false';
process.env.HSTS_MAX_AGE = '15768000';
