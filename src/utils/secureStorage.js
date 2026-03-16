/**
 * Secure Storage Utilities
 * Provides validated localStorage operations with security measures
 *
 * Prevents:
 * - Data corruption from invalid keys/values
 * - XSS attacks via poisoned storage
 * - DoS via quota exhaustion
 * - Prototype pollution
 * - Large payload attacks
 *
 * Features:
 * - Key validation (format, length, dangerous patterns)
 * - Value validation (size, structure, type checking)
 * - Size limits (prevents quota exhaustion)
 * - Sanitization functions
 * - Write verification
 * - Quota monitoring
 * - Graceful fallback to in-memory storage
 * - Migration utilities for existing data
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ITEM_SIZE = 10 * 1024; // 10KB per item
const MAX_TOTAL_STORAGE = 5 * 1024 * 1024; // 5MB total (typical quota)
const STORAGE_WARNING_THRESHOLD = 0.8; // Warn at 80% of quota
const STORAGE_ERROR_THRESHOLD = 0.95; // Error at 95% of quota
const MAX_KEY_LENGTH = 100;
const MIN_KEY_LENGTH = 3;

// ============================================================================
// SECURITY PATTERNS
// ============================================================================

/**
 * Dangerous patterns to block in keys and values
 * These patterns indicate potential XSS or prototype pollution attacks
 */
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+=/i,
  /<iframe/i,
  /__proto__/i,
  /constructor/i,
  /prototype/i,
  /<[^>]*>/i, // Any HTML tags
  /eval\s*\(/i,
  /document\./i,
  /window\./i,
];

// ============================================================================
// SECURITY LOGGER
// ============================================================================

const SecurityLogger = {
  /**
   * Log a blocked storage operation
   * @param {string} operation - Operation type (get/set/remove)
   * @param {string} reason - Reason for blocking
   * @param {Object} details - Additional details
   */
  logBlocked: (operation, reason, details = {}) => {
    const event = {
      type: 'STORAGE_BLOCKED',
      operation,
      reason,
      timestamp: Date.now(),
      ...details,
    };
    console.error('[SECURITY] Storage Operation Blocked:', event);
  },

  /**
   * Log a storage quota warning
   * @param {Object} usage - Storage usage stats
   */
  logQuotaWarning: (usage) => {
    console.warn('[STORAGE] Quota warning:', {
      usage: `${usage.percentage.toFixed(1)}%`,
      available: `${(usage.available / 1024).toFixed(2)}KB`,
      used: `${(usage.totalUsed / 1024).toFixed(2)}KB`,
    });
  },

  /**
   * Log a migration event
   * @param {string} type - Migration type (start/complete/error)
   * @param {Object} details - Migration details
   */
  logMigration: (type, details = {}) => {
    const event = {
      type: 'STORAGE_MIGRATION',
      migrationType: type,
      timestamp: Date.now(),
      ...details,
    };
    console.info('[STORAGE] Migration:', event);
  },

  /**
   * Log a fallback event
   * @param {string} reason - Reason for fallback
   */
  logFallback: (reason) => {
    console.warn('[STORAGE] Fallback to in-memory:', reason);
  },
};

// ============================================================================
// IN-MEMORY FALLBACK
// ============================================================================

/**
 * In-memory storage fallback for when localStorage is unavailable
 * or quota is exceeded
 */
const inMemoryStorage = new Map();

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate storage key
 * @param {string} key - Key to validate
 * @returns {Object} Validation result { valid: boolean, value?: string, error?: string }
 */
export const validateStorageKey = (key) => {
  // Type check FIRST (before empty check)
  if (typeof key !== 'string') {
    return {
      valid: false,
      error: 'Key must be a string',
    };
  }

  // Empty check (for empty strings)
  if (key.trim().length === 0) {
    return {
      valid: false,
      error: 'Key cannot be empty',
    };
  }

  const trimmed = key.trim();

  // Length check
  if (trimmed.length < MIN_KEY_LENGTH || trimmed.length > MAX_KEY_LENGTH) {
    return {
      valid: false,
      error: `Key must be ${MIN_KEY_LENGTH}-${MAX_KEY_LENGTH} characters (got ${trimmed.length})`,
    };
  }

  // Check for dangerous patterns FIRST (before character check)
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      SecurityLogger.logBlocked('key_validation', 'Dangerous pattern detected', {
        key: trimmed.substring(0, 50),
        pattern: pattern.toString(),
      });
      
      // Generate specific error message based on pattern
      let errorMsg = 'Key contains dangerous patterns';
      if (/<script/i.test(trimmed)) {
        errorMsg = 'Key contains dangerous patterns';
      } else if (/javascript:/i.test(trimmed)) {
        errorMsg = 'Key contains dangerous patterns';
      } else if (/onerror=/i.test(trimmed)) {
        errorMsg = 'Key contains dangerous patterns';
      } else if (/__proto__/i.test(trimmed)) {
        errorMsg = 'Key contains dangerous patterns';
      } else if (/constructor/i.test(trimmed)) {
        errorMsg = 'Key contains dangerous patterns';
      }
      
      return {
        valid: false,
        error: errorMsg,
      };
    }
  }

  // Character check (alphanumeric, underscore, hyphen only)
  if (!/^[\w-]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Key contains invalid characters (only a-zA-Z0-9_- allowed)',
    };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validate storage value and size
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum size in bytes (default: MAX_ITEM_SIZE)
 * @param {Array<string>} options.allowedTypes - Allowed types (default: ['string', 'number', 'boolean', 'object'])
 * @returns {Object} Validation result { valid: boolean, value?: any, size?: number, error?: string }
 */
export const validateStorageValue = (value, options = {}) => {
  const {
    maxSize = MAX_ITEM_SIZE,
    allowedTypes = ['string', 'number', 'boolean', 'object'],
  } = options;

  // Null/undefined check
  if (value === null || value === undefined) {
    return {
      valid: false,
      error: 'Value cannot be null or undefined',
    };
  }

  // Type check
  const actualType = typeof value;
  if (actualType === 'object' && value !== null && !Array.isArray(value)) {
    // Object type is allowed
  } else if (actualType === 'object' && Array.isArray(value)) {
    // Array is also an object type, but we treat it specially
  } else if (!allowedTypes.includes(actualType)) {
    return {
      valid: false,
      error: `Value type ${actualType} not allowed (allowed: ${allowedTypes.join(', ')})`,
    };
  }

  let jsonString;

  // Convert to string if object/array
  if (typeof value === 'object' && value !== null) {
    // Check for prototype pollution by checking object's own keys first
    if (!Array.isArray(value)) {
      const keys = Object.keys(value);

      // Check for dangerous keys in the object's own properties
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const hasDangerousKey = keys.some(key =>
        dangerousKeys.some(dangerous => key.toLowerCase() === dangerous.toLowerCase())
      );

      if (hasDangerousKey) {
        return {
          valid: false,
          error: 'Value contains dangerous properties',
        };
      }
    }

    // Check for prototype pollution using hasOwnProperty (additional safeguard)
    if (!Array.isArray(value) &&
        (Object.prototype.hasOwnProperty.call(value, '__proto__') ||
         Object.prototype.hasOwnProperty.call(value, 'constructor') ||
         Object.prototype.hasOwnProperty.call(value, 'prototype'))) {
      return {
        valid: false,
        error: 'Value contains dangerous properties',
      };
    }

    // Check if object contains functions
    const containsFunction = Object.values(value).some(
      val => typeof val === 'function'
    );
    if (containsFunction) {
      return {
        valid: false,
        error: 'Value contains functions that cannot be serialized',
      };
    }

    // Try to serialize first
    try {
      jsonString = JSON.stringify(value);
    } catch (error) {
      return {
        valid: false,
        error: 'Value contains functions that cannot be serialized',
      };
    }

    // Check for dangerous keys in object by checking the serialized form
    if (!Array.isArray(value)) {
      // Check if object has dangerous keys by comparing key count
      const keys = Object.keys(value);
      // If we have no keys but the object isn't truly empty (prototype pollution indicator)
      if (keys.length === 0 && jsonString === '{}') {
        // This could be prototype pollution via __proto__
        // Additional check: if __proto__ is in the object (even though not own)
        if ('__proto__' in value && value.__proto__ !== null && typeof value.__proto__ === 'object') {
          return {
            valid: false,
            error: 'Value contains dangerous patterns',
          };
        }
      }
      
      // Check for constructor and prototype as own properties
      if (Object.prototype.hasOwnProperty.call(value, 'constructor') ||
          Object.prototype.hasOwnProperty.call(value, 'prototype')) {
        return {
          valid: false,
          error: 'Value contains dangerous patterns',
        };
      }
    }

    // Now check the serialized form for dangerous patterns
    if (DANGEROUS_PATTERNS.some(p => p.test(jsonString))) {
      SecurityLogger.logBlocked('value_validation', 'Dangerous pattern in serialized value', {
        pattern: 'prototype/XSS pattern',
      });
      
      return {
        valid: false,
        error: 'Value contains dangerous patterns',
      };
    }
  } else if (typeof value === 'string') {
    jsonString = value;

    // Check for dangerous patterns in string values
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        SecurityLogger.logBlocked('value_validation', 'Dangerous pattern in string value', {
          pattern: pattern.toString(),
        });
        
        return {
          valid: false,
          error: 'Value contains dangerous patterns',
        };
      }
    }
  } else {
    // Convert primitives to string for storage
    jsonString = String(value);
  }

  // Size check
  const size = new Blob([jsonString]).size;
  if (size > maxSize) {
    return {
      valid: false,
      error: `Value too large (${(size / 1024).toFixed(2)}KB, max ${maxSize / 1024}KB)`,
    };
  }

  return { valid: true, value, size };
};

/**
 * Sanitize a value for safe storage
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
export const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    // Remove dangerous patterns from strings
    let sanitized = value;

    // Remove script tags and content between them
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');

    // Remove other HTML tags (including nested and self-closing)
    sanitized = sanitized.replace(/<[^>]+>/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    return sanitized;
  }

  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(item => sanitizeValue(item));
    }

    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      const keyValidation = validateStorageKey(key);
      if (keyValidation.valid) {
        sanitized[key] = sanitizeValue(val);
      }
    }
    return sanitized;
  }

  return value;
};

// ============================================================================
// STORAGE USAGE MONITORING
// ============================================================================

/**
 * Get current storage usage
 * @returns {Object} Storage usage stats
 */
export const getStorageUsage = () => {
  let totalUsed = 0;
  let itemCount = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);

      if (value) {
        const size = new Blob([value]).size;
        totalUsed += size;
        itemCount++;
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
  }

  const quota = MAX_TOTAL_STORAGE;
  const percentage = (totalUsed / quota) * 100;

  return {
    totalUsed,
    quota,
    percentage,
    itemCount,
    available: quota - totalUsed,
    atWarning: percentage >= STORAGE_WARNING_THRESHOLD * 100,
    atLimit: percentage >= STORAGE_ERROR_THRESHOLD * 100,
  };
};

/**
 * Check if storage is available and has space
 * @param {number} requiredBytes - Bytes needed
 * @returns {boolean} Storage available
 */
export const checkStorageAvailable = (requiredBytes = 0) => {
  try {
    // Test localStorage availability
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);

    // Check quota
    const usage = getStorageUsage();

    if (usage.atLimit || (usage.available < requiredBytes)) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

// ============================================================================
// SAFE STORAGE OPERATIONS
// ============================================================================

/**
 * Safe localStorage set with validation and write verification
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {Object} options - Storage options
 * @returns {boolean} Success status
 */
export const safeLocalStorageSet = (key, value, options = {}) => {
  // Validate key
  const keyValidation = validateStorageKey(key);
  if (!keyValidation.valid) {
    SecurityLogger.logBlocked('set', keyValidation.error, { key });
    return false;
  }

  // Validate value
  const valueValidation = validateStorageValue(value, options);
  if (!valueValidation.valid) {
    SecurityLogger.logBlocked('set', valueValidation.error, { key });
    return false;
  }

  // Check storage availability and quota
  const usage = getStorageUsage();
  const newSize = valueValidation.size;

  if (usage.atLimit || (usage.available < newSize)) {
    SecurityLogger.logQuotaWarning(usage);

    // Try to clean up old cached data
    if (!attemptStorageCleanup(newSize)) {
      // Fall back to in-memory storage
      SecurityLogger.logFallback('Quota exceeded, cleanup failed');
      inMemoryStorage.set(keyValidation.value, value);
      return true;
    }
  }

  if (usage.atWarning) {
    SecurityLogger.logQuotaWarning(usage);
  }

  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(keyValidation.value, serializedValue);

    // Verify write was successful
    const retrieved = localStorage.getItem(keyValidation.value);
    if (retrieved !== serializedValue) {
      SecurityLogger.logBlocked('set', 'Write verification failed', { key: keyValidation.value });
      return false;
    }

    return true;
  } catch (error) {
    // Handle quota exceeded
    if (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      SecurityLogger.logQuotaWarning(usage);

      // Attempt to clear old cached data
      if (attemptStorageCleanup(newSize)) {
        try {
          localStorage.setItem(keyValidation.value, typeof value === 'string' ? value : JSON.stringify(value));
          console.log('Storage cleanup successful, write completed');
          return true;
        } catch (retryError) {
          SecurityLogger.logFallback('Quota still exceeded after cleanup');
          inMemoryStorage.set(keyValidation.value, value);
          return true;
        }
      }

      // Fall back to in-memory storage
      SecurityLogger.logFallback('Quota exceeded');
      inMemoryStorage.set(keyValidation.value, value);
      return true;
    }

    SecurityLogger.logBlocked('set', error.message, { key: keyValidation.value, error });
    inMemoryStorage.set(keyValidation.value, value);
    return true;
  }
};

/**
 * Attempt to clean up old cached data
 * @param {number} requiredBytes - Bytes needed
 * @returns {boolean} Cleanup successful
 */
const attemptStorageCleanup = (requiredBytes) => {
  try {
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      // Remove old cache and temp files
      if (k && (k.startsWith('cache_') || k.startsWith('temp_') || k.includes('_old'))) {
        keysToRemove.push(k);
      }
    }

    // Remove old data
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Check if we have enough space now
    const usage = getStorageUsage();
    return usage.available >= requiredBytes;
  } catch (error) {
    console.error('Storage cleanup failed:', error);
    return false;
  }
};

/**
 * Safe localStorage get with validation
 * @param {string} key - Storage key
 * @param {Object} options - Get options
 * @param {boolean} options.parseJson - Whether to parse JSON (default: true)
 * @returns {any|null} Retrieved value or null
 */
export const safeLocalStorageGet = (key, options = {}) => {
  const { parseJson = true } = options;

  // Validate key
  const keyValidation = validateStorageKey(key);
  if (!keyValidation.valid) {
    SecurityLogger.logBlocked('get', keyValidation.error, { key });
    return null;
  }

  try {
    // Check in-memory fallback first
    if (inMemoryStorage.has(keyValidation.value)) {
      return inMemoryStorage.get(keyValidation.value);
    }

    const value = localStorage.getItem(keyValidation.value);

    // No value found
    if (value === null) {
      return null;
    }

    // Validate returned value for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(value)) {
        SecurityLogger.logBlocked('get', 'Dangerous pattern in stored value', {
          key: keyValidation.value,
          pattern: pattern.toString(),
        });
        localStorage.removeItem(keyValidation.value);
        return null;
      }
    }

    // Parse JSON if requested (objects start with {, arrays start with [)
    if (parseJson && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  } catch (error) {
    SecurityLogger.logBlocked('get', error.message, { key: keyValidation.value });
    return null;
  }
};

/**
 * Safe localStorage remove
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const safeLocalStorageRemove = (key) => {
  // Validate key
  const keyValidation = validateStorageKey(key);
  if (!keyValidation.valid) {
    SecurityLogger.logBlocked('remove', keyValidation.error, { key });
    return false;
  }

  try {
    localStorage.removeItem(keyValidation.value);
    inMemoryStorage.delete(keyValidation.value);
    return true;
  } catch (error) {
    SecurityLogger.logBlocked('remove', error.message, { key: keyValidation.value });
    return false;
  }
};

/**
 * Clear storage with safety checks
 * @param {boolean} clearAll - Clear all storage (including in-memory)
 * @returns {boolean} Success status
 */
export const safeLocalStorageClear = (clearAll = false) => {
  try {
    localStorage.clear();
    if (clearAll) {
      inMemoryStorage.clear();
    }
    return true;
  } catch (error) {
    SecurityLogger.logBlocked('clear', error.message);
    return false;
  }
};

/**
 * Get all keys from storage (filtered by prefix)
 * @param {string} prefix - Optional prefix to filter keys
 * @returns {string[]} Array of keys
 */
export const getStorageKeys = (prefix = '') => {
  const keys = [];

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (prefix === '' || key.startsWith(prefix))) {
        keys.push(key);
      }
    }

    // Include in-memory keys
    for (const key of inMemoryStorage.keys()) {
      if (prefix === '' || key.startsWith(prefix)) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get storage keys:', error);
  }

  return keys;
};

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Migrate and validate existing data
 * @returns {Object} Migration result
 */
export const migrateStorageData = () => {
  SecurityLogger.logMigration('start');

  const migrationResult = {
    totalItems: 0,
    validatedItems: 0,
    corruptedItems: 0,
    removedItems: 0,
    migratedItems: 0,
  };

  try {
    const keysToRemove = [];

    // Migrate localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);

      migrationResult.totalItems++;

      // Validate key
      const keyValidation = validateStorageKey(key);
      if (!keyValidation.valid) {
        keysToRemove.push(key);
        migrationResult.corruptedItems++;
        continue;
      }

      // Validate value
      const valueValidation = validateStorageValue(value);
      if (!valueValidation.valid) {
        keysToRemove.push(key);
        migrationResult.corruptedItems++;
        continue;
      }

      // Check for dangerous patterns in value
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(strValue)) {
          keysToRemove.push(key);
          migrationResult.corruptedItems++;
          SecurityLogger.logBlocked('migration', 'Dangerous pattern in stored data', {
            key,
            pattern: pattern.toString(),
          });
          break;
        }
      }

      migrationResult.validatedItems++;
      migrationResult.migratedItems++;
    }

    // Remove invalid/corrupted items
    keysToRemove.forEach(k => localStorage.removeItem(k));
    migrationResult.removedItems = keysToRemove.length;

    SecurityLogger.logMigration('complete', migrationResult);
    console.log('Storage migration complete:', migrationResult);
    return migrationResult;
  } catch (error) {
    SecurityLogger.logMigration('error', { error: error.message });
    console.error('Storage migration failed:', error);
    return migrationResult;
  }
};

/**
 * Get migration status
 * @returns {Object} Migration status
 */
export const getMigrationStatus = () => {
  const migrationKey = '__storage_migrated__';
  const migrated = safeLocalStorageGet(migrationKey);

  if (migrated) {
    return {
      completed: true,
      timestamp: migrated.timestamp,
      result: migrated.result,
    };
  }

  return {
    completed: false,
  };
};

/**
 * Mark migration as complete
 * @param {Object} result - Migration result
 */
export const markMigrationComplete = (result) => {
  safeLocalStorageSet('__storage_migrated__', {
    timestamp: Date.now(),
    result,
  });
};

// ============================================================================
// THEME-SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate theme value
 * @param {string} theme - Theme value to validate
 * @returns {boolean} Valid theme
 */
export const validateTheme = (theme) => {
  const validThemes = ['light', 'dark', 'system'];
  return validThemes.includes(theme);
};

/**
 * Safe get theme with validation
 * @param {string} key - Storage key
 * @returns {string|null} Theme value or null
 */
export const safeGetTheme = (key) => {
  const theme = safeLocalStorageGet(key, { parseJson: false });

  if (theme === null) {
    return null;
  }

  // Validate theme value
  if (!validateTheme(theme)) {
    SecurityLogger.logBlocked('get_theme', 'Invalid theme value', { theme });
    safeLocalStorageRemove(key);
    return null;
  }

  return theme;
};

/**
 * Safe set theme with validation
 * @param {string} key - Storage key
 * @param {string} theme - Theme value
 * @returns {boolean} Success status
 */
export const safeSetTheme = (key, theme) => {
  // Validate theme value
  if (!validateTheme(theme)) {
    SecurityLogger.logBlocked('set_theme', 'Invalid theme value', { theme });
    return false;
  }

  return safeLocalStorageSet(key, theme);
};

// ============================================================================
// EXCHANGE RATES SPECIFIC VALIDATION
// ============================================================================

/**
 * Validate exchange rates structure
 * @param {Object} rates - Exchange rates object
 * @returns {boolean} Valid structure
 */
export const validateExchangeRates = (rates) => {
  if (!rates || typeof rates !== 'object') {
    return false;
  }

  // Check required fields
  if (!rates.rates || typeof rates.rates !== 'object') {
    return false;
  }

  if (!rates.timestamp || typeof rates.timestamp !== 'number') {
    return false;
  }

  // Validate timestamp is recent (within 30 days)
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  if (Date.now() - rates.timestamp >= maxAge) {
    return false;
  }

  return true;
};

/**
 * Safe get exchange rates with validation
 * @param {string} key - Storage key
 * @returns {Object|null} Exchange rates or null
 */
export const safeGetExchangeRates = (key) => {
  const rates = safeLocalStorageGet(key, { parseJson: true });

  if (rates === null) {
    return null;
  }

  // Validate exchange rates structure
  if (!validateExchangeRates(rates)) {
    SecurityLogger.logBlocked('get_exchange_rates', 'Invalid exchange rates structure', { key });
    safeLocalStorageRemove(key);
    return null;
  }

  return rates;
};

/**
 * Safe set exchange rates with validation
 * @param {string} key - Storage key
 * @param {Object} rates - Exchange rates object
 * @returns {boolean} Success status
 */
export const safeSetExchangeRates = (key, rates) => {
  // Validate exchange rates structure
  if (!validateExchangeRates(rates)) {
    SecurityLogger.logBlocked('set_exchange_rates', 'Invalid exchange rates structure', { key });
    return false;
  }

  return safeLocalStorageSet(key, rates);
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Validation
  validateStorageKey,
  validateStorageValue,
  sanitizeValue,

  // Storage operations
  safeLocalStorageSet,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageClear,
  getStorageKeys,

  // Monitoring
  getStorageUsage,
  checkStorageAvailable,

  // Migration
  migrateStorageData,
  getMigrationStatus,
  markMigrationComplete,

  // Theme-specific
  validateTheme,
  safeGetTheme,
  safeSetTheme,

  // Exchange rates-specific
  validateExchangeRates,
  safeGetExchangeRates,
  safeSetExchangeRates,

  // Constants
  MAX_ITEM_SIZE,
  MAX_TOTAL_STORAGE,
  STORAGE_WARNING_THRESHOLD,
  STORAGE_ERROR_THRESHOLD,
};
