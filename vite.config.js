import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to ' ' to load all ENV variables regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  // =================================================================
  // SECURITY: Environment Variable Validation
  // =================================================================
  // This validates that required environment variables are present
  // and not empty before proceeding with the build.
  // =================================================================

  const requiredEnvVars = [];

  // Add Google Maps API key requirement for production
  if (mode === 'production') {
    // Only require Google Maps key if you're using it in production
    // Comment this out if you're using OpenStreetMap instead
    requiredEnvVars.push({
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Google Maps API Key (get from https://console.cloud.google.com/apis/credentials)',
      optional: true // Set to true if using OpenStreetMap as fallback
    });
  }

  // Validation function
  const validateEnvVars = () => {
    const missingVars = [];

    requiredEnvVars.forEach(envVar => {
      const value = env[envVar.name];

      // Check if variable is missing or empty
      if (!value || value.trim() === '') {
        if (!envVar.optional) {
          missingVars.push(envVar);
        } else {
          // Log optional missing vars as warnings
          console.warn(`⚠️  Optional env var '${envVar.name}' is not set: ${envVar.description}`);
        }
      } else {
        // Validate format for API keys
        if (envVar.name.includes('API_KEY')) {
          // Basic validation: reject placeholder values
          const placeholderPatterns = [
            'your_api_key_here',
            'your_key_here',
            'replace_with_actual_key',
            'your_google_maps_api_key',
            'example_key',
            'test_key',
            'placeholder'
          ];

          if (placeholderPatterns.some(pattern =>
            value.toLowerCase().includes(pattern) || value === ''
          )) {
            missingVars.push({
              ...envVar,
              error: 'Contains placeholder value instead of actual key'
            });
          }
        }
      }
    });

    // If required variables are missing, throw error
    if (missingVars.length > 0) {
      console.error('\n❌ SECURITY ERROR: Missing or invalid environment variables\n');
      console.error('The following environment variables are required but not set:');
      console.error('='.repeat(70));

      missingVars.forEach(v => {
        console.error(`\n  🚨 ${v.name}`);
        console.error(`     ${v.description}`);
        if (v.error) {
          console.error(`     Error: ${v.error}`);
        }
      });

      console.error('\n' + '='.repeat(70));
      console.error('\nTo fix this issue:');
      console.error('1. Copy .env.example to the appropriate .env file:');
      console.error('   - Development: .env.development');
      console.error('   - Testing: .env.test');
      console.error('   - Production: .env.production (or set in CI/CD)');
      console.error('2. Fill in the actual values for the variables above');
      console.error('3. For production, use environment variables or a secrets manager');
      console.error('4. See SECRETS_MANAGEMENT.md for detailed instructions\n');

      throw new Error('Missing required environment variables');
    } else {
      console.log('✅ All required environment variables are validated');
    }
  };

  // Run validation (skip for preview mode)
  if (mode !== 'preview') {
    validateEnvVars();
  }

  // Log environment mode (helpful for debugging)
  console.log(`🔧 Vite Mode: ${mode}`);
  if (mode === 'production') {
    console.log('🔒 Running in PRODUCTION mode - All security checks enforced');
  }

  return {
    resolve: {
    alias: {
      // Fix Leaflet image resolution at build time
      'images/layers.png': '/leaflet-images/layers.png',
      'images/layers-2x.png': '/leaflet-images/layers-2x.png',
      'images/marker-icon.png': '/leaflet-images/marker-icon.png',
      'images/marker-icon-2x.png': '/leaflet-images/marker-icon-2x.png',
      'images/marker-shadow.png': '/leaflet-images/marker-shadow.png',
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.svg', 'icon-512.svg', 'logo.png'],
      manifest: {
        name: 'Fuel Guard',
        short_name: 'FuelGuard',
        description: 'Fuel Theft Detection System - Track mileage efficiency and detect anomalies',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:svg|png|jpg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core + charts (keep together - used on Dashboard which is the landing page)
          if (id.includes('react/') ||
              id.includes('react-dom/') ||
              id.includes('recharts')) {
            return 'vendor-react';
          }

          // React Router (essential for routing)
          if (id.includes('react-router-dom')) {
            return 'vendor-router';
          }

          // Third-party libraries
          if (id.includes('node_modules/')) {
            // Map React components (lazy load with map pages)
            if (id.includes('react-leaflet') || id.includes('@react-leaflet/')) {
              return 'maps-react';
            }

            // Google Maps API (lazy load with map pages)
            if (id.includes('@react-google-maps/api')) {
              return 'maps-google';
            }

            // UI icons libraries
            if (id.includes('@phosphor-icons/react') || id.includes('lucide-react')) {
              return 'icons';
            }

            // Export/Report generation (jspdf + html2canvas - lazy load)
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'export';
            }

            // Excel export (lazy load)
            if (id.includes('xlsx')) {
              return 'excel';
            }

            // Map libraries - leaflet core (lazy load)
            if (id.includes('leaflet')) {
              return 'maps-leaflet';
            }

            // Database storage (idb-keyval)
            if (id.includes('idb-keyval')) {
              return 'storage';
            }

            // Styled components
            if (id.includes('styled-components')) {
              return 'ui-libs';
            }
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'recharts',
        'jspdf',
        'jspdf-autotable',
        'xlsx',
        'leaflet',
        'react-leaflet',
        'styled-components',
        'idb-keyval'
      ]
    },
    // Increase warning limit - we're consciously using code splitting
    chunkSizeWarningLimit: 700,
    minify: 'terser',
    sourcemap: false,
  },
  server: {
    hmr: {
      overlay: false
    },
    proxy: {
      // Proxy API requests to backend server in development
      '/api/fueleconomy': {
        target: env.VITE_BACKEND_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  }
  };
});
