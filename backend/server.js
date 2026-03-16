/**
 * Fuel Guard Backend Proxy Server
 *
 * Secure backend proxy for EPA FuelEconomy.gov API
 * Replaces vulnerable third-party CORS proxy
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { getCorsOrigins, serverConfig, securityConfig, logConfig } from './config/index.js';
import fueleconomyRoutes from './routes/fueleconomy.js';
import pushRoutes from './routes/push.js';
import { getCacheStats } from './middleware/cache.js';

const app = express();

// Trust proxy for accurate IP detection (needed for rate limiting behind proxies)
app.set('trust proxy', 1);

// =================================================================
// SECURITY MIDDLEWARE
// =================================================================

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API-only backend
  hsts: securityConfig.enableHSTS ? {
    maxAge: securityConfig.hstsMaxAge,
    includeSubDomains: true,
    preload: true,
  } : false,
}));

// CORS configuration
app.use(cors({
  origin: getCorsOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}));

// Compress responses
app.use(compression());

// Request logging (only in non-production)
if (logConfig.enableDebug || !serverConfig.isProduction) {
  app.use(morgan('combined'));
}

// =================================================================
// BODY PARSING
// =================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =================================================================
// HEALTH CHECK ENDPOINT
// =================================================================

app.get('/health', (req, res) => {
  const cacheStats = getCacheStats();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: serverConfig.nodeEnv,
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cache: cacheStats,
  });
});

// =================================================================
// API ROUTES
// =================================================================

// FuelEconomy.gov API proxy routes
app.use(fueleconomyRoutes);

// Push notification routes
app.use('/api/push', pushRoutes);

// =================================================================
// 404 HANDLER
// =================================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    status: 'not_found',
    path: req.path,
  });
});

// =================================================================
// ERROR HANDLER
// =================================================================

app.use((error, req, res, next) => {
  console.error('Server error:', error);

  const status = error.status || 500;
  const message = serverConfig.isProduction
    ? 'Internal server error'
    : error.message;

  res.status(status).json({
    error: message,
    status: 'error',
    ...(logConfig.enableDebug && { stack: error.stack }),
  });
});

// =================================================================
// START SERVER (only when run directly, not when imported by tests)
// =================================================================

const PORT = serverConfig.port;

const isMainModule = process.argv[1] &&
  (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
   import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href);

if (isMainModule || process.env.START_SERVER === 'true') {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Fuel Guard Backend Proxy Server');
    console.log('='.repeat(60));
    console.log(`Environment: ${serverConfig.nodeEnv}`);
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API proxy: http://localhost:${PORT}/api/fueleconomy/*`);
    console.log(`CORS origins: ${getCorsOrigins().join(', ')}`);
    console.log('='.repeat(60));

    if (serverConfig.isDevelopment) {
      console.log('⚠️  Running in DEVELOPMENT mode');
      console.log('⚠️  Debug logging is enabled');
      console.log('⚠️  Do not use in production!');
    }

    if (serverConfig.isProduction) {
      console.log('🔒 Running in PRODUCTION mode');
      console.log('🔒 All security measures are enforced');
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;
