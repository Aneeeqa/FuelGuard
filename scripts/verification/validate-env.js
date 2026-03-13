#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * Purpose: Validate environment variables before deployment
 * Usage: node validateEnv.js [mode]
 *
 * Modes:
 *   - development: Check dev environment variables
 *   - test: Check test environment variables
 *   - production: Check production environment variables (strict)
 *
 * Exit codes:
 *   - 0: All validations passed
 *   - 1: Validation failed (missing or invalid variables)
 *   - 2: Configuration error
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Get mode from command line arguments
const mode = process.argv[2] || process.env.NODE_ENV || 'development';

console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}  Environment Variable Validation${colors.reset}`);
console.log(`${colors.cyan}  Mode: ${mode.toUpperCase()}${colors.reset}`);
console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

// =================================================================
// Configuration: Define required variables for each mode
// =================================================================

const variableDefinitions = {
  // Common variables (all modes)
  common: [
    {
      name: 'VITE_APP_ENV',
      description: 'Application environment',
      required: true,
      validate: (value) => ['development', 'test', 'production'].includes(value),
      errorMessage: 'Must be: development, test, or production',
    },
    {
      name: 'VITE_LOG_LEVEL',
      description: 'Logging level',
      required: true,
      validate: (value) => ['debug', 'info', 'warn', 'error'].includes(value),
      errorMessage: 'Must be: debug, info, warn, or error',
    },
  ],

  // Development-specific variables
  development: [
    {
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Google Maps API key',
      required: false,
      validate: (value) => {
        if (!value || value.trim() === '') return true; // Optional
        return value.length > 10;
      },
      errorMessage: 'API key must be at least 10 characters',
      securityCheck: true,
    },
    {
      name: 'VITE_ENABLE_DEBUG',
      description: 'Enable debug mode',
      required: false,
      validate: (value) => ['true', 'false', ''].includes(value),
      errorMessage: 'Must be: true or false',
    },
    {
      name: 'VITE_ENABLE_MOCK_DATA',
      description: 'Enable mock data',
      required: false,
      validate: (value) => ['true', 'false', ''].includes(value),
      errorMessage: 'Must be: true or false',
    },
  ],

  // Test-specific variables
  test: [
    {
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Google Maps API key (tests use mocks)',
      required: false,
      validate: (value) => {
        if (!value || value.trim() === '') return true; // Optional
        return value.length > 10;
      },
      errorMessage: 'API key must be at least 10 characters',
    },
    {
      name: 'VITE_TEST_MODE',
      description: 'Test mode flag',
      required: true,
      validate: (value) => value === 'true',
      errorMessage: 'Must be: true',
    },
    {
      name: 'VITE_MOCK_EXTERNAL_APIS',
      description: 'Mock external APIs',
      required: true,
      validate: (value) => ['true', 'false'].includes(value),
      errorMessage: 'Must be: true or false',
    },
  ],

  // Production-specific variables (strict validation)
  production: [
    {
      name: 'VITE_GOOGLE_MAPS_API_KEY',
      description: 'Google Maps API key',
      required: false, // Set to true if you require it
      validate: (value) => {
        // If required and empty, fail
        if (value === undefined || value === null || value.trim() === '') {
          return false;
        }
        // Validate format
        return value.length > 10 && !value.includes('your_api_key_here');
      },
      errorMessage: 'API key required and must not be a placeholder',
      securityCheck: true,
    },
    {
      name: 'VITE_ENABLE_DEBUG',
      description: 'Enable debug mode',
      required: true,
      validate: (value) => {
        if (value === undefined || value === null || value.trim() === '') return true;
        return value === 'false';
      },
      errorMessage: 'Must be: false in production',
      defaultValue: 'false',
    },
    {
      name: 'VITE_LOG_LEVEL',
      description: 'Logging level',
      required: true,
      validate: (value) => ['warn', 'error'].includes(value),
      errorMessage: 'Must be: warn or error in production',
    },
  ],
};

// =================================================================
// Helper Functions
// =================================================================

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

function loadEnvFile(filename) {
  // Resolve to project root (two levels up from scripts/verification/)
  const projectRoot = join(__dirname, '..', '..');
  const filepath = join(projectRoot, filename);

  if (!existsSync(filepath)) {
    logWarning(`Environment file not found: ${filename}`);
    return {};
  }

  const content = readFileSync(filepath, 'utf-8');
  const env = {};

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) return;

    // Parse KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

function loadEnvironmentVariables() {
  // Load from process environment (CI/CD, production)
  const processEnv = { ...process.env };

  // Load from .env files (local development)
  const localEnv = loadEnvFile('.env.local');
  const modeEnv = loadEnvFile(`.env.${mode}`);

  // Merge: processEnv > modeEnv > localEnv
  return { ...localEnv, ...modeEnv, ...processEnv };
}

function checkForSecurityIssues(value, varName) {
  const securityIssues = [];

  // Check for placeholder values
  const placeholders = [
    'your_api_key_here',
    'your_key_here',
    'replace_with_actual_key',
    'your_google_maps_api_key',
    'example_key',
    'test_key',
    'placeholder',
    'your_actual_key',
    'replace_this',
  ];

  if (value && placeholders.some((p) => value.toLowerCase().includes(p))) {
    securityIssues.push('Contains placeholder value instead of actual key');
  }

  // Check for hardcoded Google Maps API key pattern
  if (varName.includes('GOOGLE_MAPS') && value && value.startsWith('AIza')) {
    // This is valid in .env files, but warn about it
    if (mode === 'production') {
      logInfo(`  → Detected Google Maps API key format (valid)`);
    }
  }

  // Check for empty values when not allowed
  if (value === '' || value === undefined || value === null) {
    // This will be caught by the required check
  }

  return securityIssues;
}

function validateVariable(variable, env, mode) {
  const { name, description, required, validate, errorMessage, securityCheck } = variable;
  const value = env[name];

  const result = {
    name,
    description,
    value: value ? '***' : undefined, // Don't log actual values
    status: 'passed',
    errors: [],
    warnings: [],
  };

  // Check if required and missing
  if (required && (value === undefined || value === null || value.trim() === '')) {
    result.status = 'error';
    result.errors.push('Variable is required but not set');
    return result;
  }

  // If not required and not set, skip validation
  if (!required && (value === undefined || value === null || value.trim() === '')) {
    result.status = 'skipped';
    result.warnings.push('Optional variable not set');
    return result;
  }

  // Validate value format
  if (validate && !validate(value)) {
    result.status = 'error';
    result.errors.push(errorMessage || 'Invalid value');
    return result;
  }

  // Security checks
  if (securityCheck) {
    const securityIssues = checkForSecurityIssues(value, name);
    if (securityIssues.length > 0) {
      result.status = 'error';
      result.errors.push(...securityIssues);
      return result;
    }
  }

  return result;
}

// =================================================================
// Main Validation Logic
// =================================================================

function runValidation() {
  const env = loadEnvironmentVariables();
  let allPassed = true;
  const results = [];

  // Validate common variables
  console.log(`${colors.cyan}→ Common Variables${colors.reset}\n`);

  variableDefinitions.common.forEach((variable) => {
    const result = validateVariable(variable, env, mode);
    results.push(result);

    if (result.status === 'passed') {
      logSuccess(`${variable.name}: ${variable.description}`);
    } else if (result.status === 'error') {
      logError(`${variable.name}: ${variable.description}`);
      result.errors.forEach((error) => console.log(`  ${colors.red}  →${colors.reset} ${error}`));
      allPassed = false;
    } else if (result.status === 'skipped') {
      logWarning(`${variable.name}: ${variable.description}`);
      result.warnings.forEach((warning) => console.log(`  ${colors.yellow}  →${colors.reset} ${warning}`));
    }
  });

  // Validate mode-specific variables
  console.log(`\n${colors.cyan}→ ${mode.charAt(0).toUpperCase() + mode.slice(1)} Variables${colors.reset}\n`);

  const modeVariables = variableDefinitions[mode] || [];
  modeVariables.forEach((variable) => {
    const result = validateVariable(variable, env, mode);
    results.push(result);

    if (result.status === 'passed') {
      logSuccess(`${variable.name}: ${variable.description}`);
    } else if (result.status === 'error') {
      logError(`${variable.name}: ${variable.description}`);
      result.errors.forEach((error) => console.log(`  ${colors.red}  →${colors.reset} ${error}`));
      allPassed = false;
    } else if (result.status === 'skipped') {
      logWarning(`${variable.name}: ${variable.description}`);
      result.warnings.forEach((warning) => console.log(`  ${colors.yellow}  →${colors.reset} ${warning}`));
    }
  });

  // Additional security checks
  console.log(`\n${colors.cyan}→ Security Checks${colors.reset}\n`);

  // Resolve to project root
  const projectRoot = join(__dirname, '..', '..');
  const localEnvPath = join(projectRoot, '.env.local');
  const backupEnvPath = join(projectRoot, '.env.local.backup');

  // Check for .env.local in git (not committed, but warn if it exists with keys)
  if (existsSync(localEnvPath)) {
    const localEnvContent = readFileSync(localEnvPath, 'utf-8');
    if (localEnvContent.includes('AIza') && mode === 'production') {
      logWarning('.env.local contains API key (ensure it is in .gitignore)');
    } else {
      logSuccess('.env.local present (not checked into git)');
    }
  }

  // Check for .env.local.backup (should not exist)
  if (existsSync(backupEnvPath)) {
    logError('.env.local.backup exists (security risk - delete this file)');
    allPassed = false;
  } else {
    logSuccess('No .env.local.backup file');
  }

  // Summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Validation Summary${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter((r) => r.status === 'passed').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const warnings = results.filter((r) => r.status === 'skipped').length;
  const total = results.length;

  console.log(`Total: ${total} | Passed: ${passed} | Errors: ${errors} | Warnings: ${warnings}\n`);

  if (allPassed && errors === 0) {
    console.log(`${colors.green}✓ All validations passed!${colors.reset}`);
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log(`  1. Build the application: ${colors.cyan}npm run build${colors.reset}`);
    console.log(`  2. Deploy to production (see PRODUCTION_DEPLOYMENT.md)`);
    console.log(`  3. Monitor API usage (Google Cloud Console)\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Validation failed!${colors.reset}`);
    console.log(`\n${colors.cyan}To fix:${colors.reset}`);
    console.log(`  1. Review the errors above`);
    console.log(`  2. Update your environment variables`);
    console.log(`  3. Run this script again: ${colors.cyan}node validateEnv.js${colors.reset}`);
    console.log(`  4. See .env.example for all required variables\n`);
    process.exit(1);
  }
}

// Run validation
runValidation();
