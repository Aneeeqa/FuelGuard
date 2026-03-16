/**
 * Safe JSON parser with prototype pollution protection
 *
 * Prevents:
 * - Prototype pollution attacks
 * - Constructor pollution
 * - Large JSON DoS attacks
 * - Malicious data injection
 *
 * Features:
 * - Schema validation support
 * - Size limits
 * - Dangerous pattern detection
 * - Comprehensive error logging
 */

/**
 * Known dangerous property names that can lead to prototype pollution
 */
const DANGEROUS_PROPERTIES = [
  '__proto__',
  'constructor',
  'prototype',
];

/**
 * Patterns that may indicate malicious JSON
 * Note: These patterns are checked in the raw JSON string before parsing
 */
const DANGEROUS_PATTERNS = [
  /"__proto__"/i,
  /"constructor"/i,
  /"prototype"/i,
];

/**
 * Maximum JSON payload size (10MB)
 */
const MAX_JSON_SIZE = 10 * 1024 * 1024;

/**
 * XSS patterns to sanitize from string values
 */
const XSS_SANITIZE_PATTERNS = [
  { pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, replacement: '' },
  { pattern: /<\/script>/gi, replacement: '' },
  { pattern: /<script[^>]*>/gi, replacement: '' },
  { pattern: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, replacement: '' },
  { pattern: /<\/iframe>/gi, replacement: '' },
  { pattern: /<iframe[^>]*>/gi, replacement: '' },
  { pattern: /javascript:/gi, replacement: '' },
  { pattern: /on\w+\s*=/gi, replacement: '' },
];

/**
 * Sanitize string value to remove XSS patterns
 */
const sanitizeXssString = (str) => {
  if (typeof str !== 'string') return str;
  let result = str;
  for (const { pattern, replacement } of XSS_SANITIZE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
};

/**
 * Recursively sanitize all string values in an object/array
 */
const sanitizeXssRecursive = (data, depth = 0) => {
  if (depth > 20) return data;
  if (typeof data === 'string') return sanitizeXssString(data);
  if (Array.isArray(data)) return data.map(item => sanitizeXssRecursive(item, depth + 1));
  if (data && typeof data === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeXssRecursive(value, depth + 1);
    }
    return result;
  }
  return data;
};

/**
 * Check if object has dangerous properties that could lead to prototype pollution
 * @param {Object} obj - Object to check
 * @returns {boolean} Has dangerous properties
 */
const hasDangerousProperties = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const prop of DANGEROUS_PROPERTIES) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      return true;
    }
  }

  return false;
};

/**
 * Recursively check nested objects for dangerous properties
 * @param {any} data - Data to check recursively
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum allowed depth (default: 20)
 * @returns {boolean} Has dangerous properties
 */
const hasDangerousPropertiesRecursive = (data, depth = 0, maxDepth = 20) => {
  if (depth > maxDepth) {
    console.warn('Maximum JSON depth exceeded, potential DoS attempt');
    return true;
  }

  if (!data || typeof data !== 'object') {
    return false;
  }

  if (Array.isArray(data)) {
    return data.some(item => hasDangerousPropertiesRecursive(item, depth + 1, maxDepth));
  }

  // Check for dangerous properties
  if (hasDangerousProperties(data)) {
    return true;
  }

  // Check nested objects
  return Object.values(data).some(
    value => typeof value === 'object' && value !== null &&
      hasDangerousPropertiesRecursive(value, depth + 1, maxDepth)
  );
};

/**
 * Validate JSON structure against schema
 * @param {any} data - Data to validate
 * @param {Object} schema - Schema definition
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
const validateSchema = (data, schema) => {
  const errors = [];

  if (!schema) {
    return { valid: true, errors: [] };
  }

  // Check if data exists
  if (data === null || data === undefined) {
    if (schema.required) {
      errors.push('Required field is missing');
    }
    return { valid: errors.length === 0, errors };
  }

  // Check type
  if (schema.type) {
    const actualType = Array.isArray(data) ? 'array' : typeof data;
    if (actualType !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${actualType}`);
    }
  }

  // Validate object
  if (schema.type === 'object' && typeof data === 'object' && !Array.isArray(data)) {
    // Check dangerous properties
    if (hasDangerousProperties(data)) {
      errors.push('Object contains dangerous properties (prototype pollution attempt)');
    }

    // Check required fields
    if (schema.required && schema.required.length > 0) {
      for (const field of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(data, field)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Check field types
    if (schema.fields) {
      for (const [field, expectedType] of Object.entries(schema.fields)) {
        if (data[field] !== undefined && data[field] !== null) {
          const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
          if (actualType !== expectedType) {
            errors.push(`Field ${field} expected type ${expectedType}, got ${actualType}`);
          }
        }
      }
    }

    // Validate string lengths
    if (schema.maxLengths) {
      for (const [field, maxLen] of Object.entries(schema.maxLengths)) {
        if (typeof data[field] === 'string' && data[field].length > maxLen) {
          errors.push(`Field ${field} exceeds max length ${maxLen}`);
        }
      }
    }

    // Validate number ranges
    if (schema.ranges) {
      for (const [field, range] of Object.entries(schema.ranges)) {
        if (typeof data[field] === 'number') {
          if (data[field] < range.min || data[field] > range.max) {
            errors.push(`Field ${field} out of range [${range.min}, ${range.max}]`);
          }
        }
      }
    }
  }

  // Validate array
  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.maxLength && data.length > schema.maxLength) {
      errors.push(`Array length exceeds maximum ${schema.maxLength}`);
    }

    if (schema.itemSchema && data.length > 0) {
      data.forEach((item, index) => {
        const itemValidation = validateSchema(item, schema.itemSchema);
        if (!itemValidation.valid) {
          errors.push(`Array item ${index}: ${itemValidation.errors.join(', ')}`);
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Security event logger
 * Logs security-related events to console and optionally to a metrics system
 */
const SecurityLogger = {
  /**
   * Log a blocked parsing attempt
   * @param {string} reason - Reason for blocking
   * @param {Object} details - Additional details
   */
  logBlocked: (reason, details = {}) => {
    const event = {
      type: 'JSON_PARSE_BLOCKED',
      reason,
      timestamp: Date.now(),
      ...details,
    };
    console.error('[SECURITY] JSON Parse Blocked:', event);
  },

  /**
   * Log a validation failure
   * @param {string} reason - Reason for validation failure
   * @param {Array<string>} errors - Validation errors
   * @param {Object} details - Additional details
   */
  logValidationFailure: (reason, errors = [], details = {}) => {
    const event = {
      type: 'SCHEMA_VALIDATION_FAILED',
      reason,
      errors,
      timestamp: Date.now(),
      ...details,
    };
    console.warn('[SECURITY] Schema Validation Failed:', event);
  },
};

/**
 * Safe JSON parser with comprehensive security checks
 *
 * @param {string} jsonString - JSON string to parse
 * @param {Object} options - Options for parsing
 * @param {Object} options.schema - Optional schema for validation
 * @param {number} options.maxSize - Maximum size in bytes (default: 10MB)
 * @param {number} options.maxDepth - Maximum nesting depth (default: 20)
 * @param {boolean} options.freeze - Whether to freeze the returned object (default: false)
 * @returns {any|null} Parsed data or null if invalid
 *
 * @example
 * const data = safeJsonParse('{"name":"John"}', { schema: Schemas.user });
 */
export const safeJsonParse = (jsonString, options = {}) => {
  const {
    schema = null,
    maxSize = MAX_JSON_SIZE,
    maxDepth = 20,
    freeze = false,
  } = options;

  try {
    // Input validation
    if (typeof jsonString !== 'string') {
      SecurityLogger.logBlocked('Invalid input type', { actualType: typeof jsonString });
      return null;
    }

    // Empty string check
    if (jsonString.trim() === '') {
      return null;
    }

    // Size check (prevent DoS)
    const size = new Blob([jsonString]).size;
    if (size > maxSize) {
      SecurityLogger.logBlocked('JSON payload too large', {
        size,
        maxSize,
      });
      return null;
    }

    // Check for dangerous patterns before parsing
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        SecurityLogger.logBlocked('Dangerous pattern detected', {
          pattern: pattern.toString(),
        });
        return null;
      }
    }

    // Parse JSON
    const parsed = JSON.parse(jsonString);

    // Check for prototype pollution in parsed object
    if (hasDangerousPropertiesRecursive(parsed, 0, maxDepth)) {
      SecurityLogger.logBlocked('Prototype pollution attempt detected', {
        depth: maxDepth,
      });
      return null;
    }

    // Sanitize XSS patterns from all string values
    const sanitized = sanitizeXssRecursive(parsed);

    // Validate against schema if provided
    if (schema) {
      const validation = validateSchema(sanitized, schema);
      if (!validation.valid) {
        SecurityLogger.logValidationFailure('Schema validation failed', validation.errors, {
          schema: schema.type,
        });
        return null;
      }
    }

    // Optionally freeze the object to prevent modifications
    if (freeze && typeof sanitized === 'object' && sanitized !== null) {
      Object.freeze(sanitized);
    }

    return sanitized;
  } catch (error) {
    SecurityLogger.logBlocked('Parse error', {
      error: error.message,
    });
    return null;
  }
};

/**
 * Create a callable schema validator from a schema definition.
 * The returned function validates data and returns { valid, error, errors }.
 * Schema properties are also copied onto the function for backward compatibility
 * with safeJsonParse({ schema: Schemas.xxx }).
 */
const createSchemaValidator = (schemaDef) => {
  const validator = (data) => {
    const result = validateSchema(data, schemaDef);
    return {
      valid: result.valid,
      error: result.errors.length > 0 ? result.errors.join('; ') : null,
      errors: result.errors,
    };
  };
  // Copy schema properties for backward compat with safeJsonParse
  Object.assign(validator, schemaDef);
  return validator;
};

/**
 * Common schema definitions for Fuel Guard application
 * Each schema is callable: Schemas.fuelLog(data) => { valid, error, errors }
 */
export const Schemas = {
  /**
   * User profile schema
   */
  userProfile: createSchemaValidator({
    type: 'object',
    required: ['name', 'age'],
    fields: {
      name: 'string',
      age: 'number',
      email: 'string',
    },
    maxLengths: {
      name: 200,
      email: 200,
    },
    ranges: {
      age: { min: 0, max: 130 },
    },
  }),

  /**
   * Fuel log entry schema
   */
  fuelLog: createSchemaValidator({
    type: 'object',
    required: ['date', 'odometer', 'liters'],
    fields: {
      date: 'string',
      odometer: 'number',
      liters: 'number',
      price: 'number',
      mileage: 'number',
      location: 'string',
      notes: 'string',
      fullTank: 'boolean',
    },
    maxLengths: {
      date: 100,
      location: 500,
      notes: 2000,
    },
    ranges: {
      odometer: { min: 0, max: 10000000 },
      liters: { min: 0.1, max: 1000 },
      price: { min: 0, max: 100000 },
      mileage: { min: 0, max: 200 },
    },
  }),

  /**
   * Array of fuel logs
   */
  fuelLogs: createSchemaValidator({
    type: 'array',
    maxLength: 10000,
    itemSchema: {
      type: 'object',
      required: ['date', 'odometer', 'liters'],
      fields: {
        date: 'string',
        odometer: 'number',
        liters: 'number',
        price: 'number',
        mileage: 'number',
        location: 'string',
        notes: 'string',
        fullTank: 'boolean',
      },
      maxLengths: {
        date: 100,
        location: 500,
        notes: 2000,
      },
      ranges: {
        odometer: { min: 0, max: 10000000 },
        liters: { min: 0.1, max: 1000 },
        price: { min: 0, max: 100000 },
        mileage: { min: 0, max: 200 },
      },
    },
  }),

  /**
   * Exchange rates schema
   */
  exchangeRates: createSchemaValidator({
    type: 'object',
    required: ['rates', 'timestamp'],
    fields: {
      rates: 'object',
      timestamp: 'number',
      base: 'string',
    },
    ranges: {
      timestamp: { min: 0, max: Date.now() + 86400000 },
    },
  }),

  /**
   * Session/user schema
   */
  session: createSchemaValidator({
    type: 'object',
    required: ['userId', 'username', 'createdAt'],
    fields: {
      userId: 'string',
      username: 'string',
      role: 'string',
      createdAt: 'number',
    },
    maxLengths: {
      userId: 100,
      username: 100,
      role: 50,
    },
  }),

  /**
   * Vehicle profile schema
   */
  vehicleProfile: createSchemaValidator({
    type: 'object',
    required: ['tankCapacity'],
    fields: {
      name: 'string',
      make: 'string',
      model: 'string',
      year: 'number',
      expectedMileage: 'number',
      tankCapacity: 'number',
      vehicleId: 'string',
    },
    maxLengths: {
      name: 200,
      vehicleId: 100,
      make: 100,
      model: 100,
    },
    ranges: {
      expectedMileage: { min: 1, max: 200 },
      tankCapacity: { min: 1, max: 1000 },
      year: { min: 1984, max: new Date().getFullYear() + 1 },
    },
  }),

  /**
   * Community MPG data schema
   */
  communityMpg: createSchemaValidator({
    type: 'object',
    required: ['avgMpg', 'count'],
    fields: {
      avgMpg: 'number',
      count: 'number',
      minMpg: 'number',
      maxMpg: 'number',
    },
    ranges: {
      avgMpg: { min: 1, max: 200 },
      count: { min: 0, max: 1000000 },
      minMpg: { min: 1, max: 200 },
      maxMpg: { min: 1, max: 200 },
    },
  }),

  /**
   * Driver reports array schema
   */
  driverReports: createSchemaValidator({
    type: 'array',
    maxLength: 10000,
    itemSchema: {
      type: 'object',
      fields: {
        id: 'string',
        userId: 'string',
        mpg: 'number',
        miles: 'number',
        gallons: 'number',
        date: 'string',
      },
      ranges: {
        mpg: { min: 1, max: 200 },
        miles: { min: 0, max: 100000 },
        gallons: { min: 0, max: 1000 },
      },
    },
  }),

  /**
   * Settings/preferences schema
   */
  settings: createSchemaValidator({
    type: 'object',
    fields: {
      theme: 'string',
      currency: 'string',
      units: 'string',
      country: 'string',
    },
    maxLengths: {
      theme: 50,
      currency: 10,
      units: 20,
      country: 10,
    },
  }),
};

/**
 * Legacy API for backward compatibility
 * @deprecated Use safeJsonParse with options object instead
 */
export const safeJsonParseLegacy = (jsonString, schema = null) => {
  return safeJsonParse(jsonString, { schema });
};

export default {
  safeJsonParse,
  Schemas,
  SecurityLogger,
};
