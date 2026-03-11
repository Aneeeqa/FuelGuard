/**
 * Validation Utilities - Input Validation and Sanitization
 *
 * Provides centralized validation and sanitization functions for all API inputs
 * Protects against injection attacks, API abuse, and invalid data
 *
 * @module utils/validation
 */

// =============================================
// Configuration Constants
// =============================================

/**
 * Valid vehicle year range
 * Vehicles before 1984 are rarely in active service and have limited data
 * Next year is allowed for pre-production vehicles
 */
export const MIN_VEHICLE_YEAR = 1984;
export const MAX_VEHICLE_YEAR = new Date().getFullYear() + 1;

/**
 * Maximum precision for coordinates (7 decimal places ≈ 11cm accuracy)
 * Higher precision is unnecessary for geocoding and can be used for tracking
 */
export const MAX_COORD_PRECISION = 7;

/**
 * Maximum length for query strings
 * Prevents DoS attacks and API abuse
 */
export const MAX_QUERY_LENGTH = 500;

// =============================================
// Vehicle Validation Functions
// =============================================

/**
 * Validate and sanitize vehicle year
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param {any} year - Year to validate
 * @returns {{valid: boolean, error: string|undefined, value: number|undefined}}
 */
export const validateYear = (year) => {
  // Type check
  if (year === null || year === undefined) {
    return { valid: false, error: 'Year is required' };
  }

  const yearNum = parseInt(year, 10);

  // Check if conversion resulted in NaN
  if (isNaN(yearNum)) {
    return { valid: false, error: 'Year must be a valid number' };
  }

  // Range check (1984 to current year + 1)
  if (yearNum < MIN_VEHICLE_YEAR || yearNum > MAX_VEHICLE_YEAR) {
    return {
      valid: false,
      error: `Year must be between ${MIN_VEHICLE_YEAR} and ${MAX_VEHICLE_YEAR}`,
    };
  }

  return { valid: true, value: yearNum };
};

/**
 * Validate and sanitize vehicle make
 *
 * Time Complexity: O(n) where n is the length of the string
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} make - Make to validate
 * @returns {{valid: boolean, error: string|undefined, value: string|undefined}}
 */
export const validateMake = (make) => {
  // Type and presence check
  if (!make || typeof make !== 'string') {
    return { valid: false, error: 'Make is required' };
  }

  // Sanitize: remove special characters except letters, spaces, and hyphens
  const sanitized = make.trim().replace(/[^a-zA-Z\s-]/g, '');

  // Length check (3-50 characters)
  if (sanitized.length < 3 || sanitized.length > 50) {
    return {
      valid: false,
      error: 'Make must be 3-50 characters (letters, spaces, and hyphens only)',
    };
  }

  // Check if sanitization removed all characters
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Make must contain valid characters',
    };
  }

  return { valid: true, value: sanitized };
};

/**
 * Validate and sanitize vehicle model
 *
 * Time Complexity: O(n) where n is the length of the string
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} model - Model to validate
 * @returns {{valid: boolean, error: string|undefined, value: string|undefined}}
 */
export const validateModel = (model) => {
  // Type and presence check
  if (!model || typeof model !== 'string') {
    return { valid: false, error: 'Model is required' };
  }

  // Sanitize: remove special characters except alphanumeric, spaces, and hyphens
  const sanitized = model.trim().replace(/[^a-zA-Z0-9\s-]/g, '');

  // Length check (2-40 characters)
  if (sanitized.length < 2 || sanitized.length > 40) {
    return {
      valid: false,
      error: 'Model must be 2-40 characters (letters, numbers, spaces, and hyphens only)',
    };
  }

  // Check if sanitization removed all characters
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Model must contain valid characters',
    };
  }

  return { valid: true, value: sanitized };
};

/**
 * Validate and sanitize VIN (Vehicle Identification Number)
 *
 * VIN format: 17 alphanumeric characters, no I, O, Q (confusing with 1, 0)
 *
 * Time Complexity: O(n) where n is the length of the string (always 17)
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} vin - VIN to validate
 * @returns {{valid: boolean, error: string|undefined, value: string|undefined}}
 */
export const validateVin = (vin) => {
  // Type and presence check
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN is required' };
  }

  const sanitized = vin.trim().toUpperCase();

  // Length check (must be exactly 17 characters)
  if (sanitized.length !== 17) {
    return {
      valid: false,
      error: 'VIN must be exactly 17 characters',
    };
  }

  // Character check (alphanumeric only, excluding I, O, Q)
  // Valid VIN characters: 0-9, A-H, J-N, P, R-Z
  const validChars = /^[0-9A-HJ-NPR-Z]+$/;

  if (!validChars.test(sanitized)) {
    return {
      valid: false,
      error: 'VIN contains invalid characters (I, O, Q are not allowed)',
    };
  }

  return { valid: true, value: sanitized };
};

// =============================================
// Geospatial Validation Functions
// =============================================

/**
 * Validate latitude
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param {any} lat - Latitude to validate
 * @returns {{valid: boolean, error: string|undefined, value: number|undefined}}
 */
export const validateLatitude = (lat) => {
  // Type and presence check
  if (lat === null || lat === undefined) {
    return { valid: false, error: 'Latitude is required' };
  }

  const latNum = parseFloat(lat);

  // Check if conversion resulted in NaN
  if (isNaN(latNum)) {
    return { valid: false, error: 'Latitude must be a valid number' };
  }

  // Range check (-90 to 90 degrees)
  if (latNum < -90 || latNum > 90) {
    return {
      valid: false,
      error: 'Latitude must be between -90 and 90',
    };
  }

  // Check precision (max 7 decimal places)
  const decimalPart = lat.toString().split('.')[1];
  const precision = decimalPart ? decimalPart.length : 0;

  if (precision > MAX_COORD_PRECISION) {
    return {
      valid: false,
      error: `Latitude precision limited to ${MAX_COORD_PRECISION} decimal places`,
    };
  }

  return { valid: true, value: parseFloat(latNum.toFixed(MAX_COORD_PRECISION)) };
};

/**
 * Validate longitude
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param {any} lon - Longitude to validate
 * @returns {{valid: boolean, error: string|undefined, value: number|undefined}}
 */
export const validateLongitude = (lon) => {
  // Type and presence check
  if (lon === null || lon === undefined) {
    return { valid: false, error: 'Longitude is required' };
  }

  const lonNum = parseFloat(lon);

  // Check if conversion resulted in NaN
  if (isNaN(lonNum)) {
    return { valid: false, error: 'Longitude must be a valid number' };
  }

  // Range check (-180 to 180 degrees)
  if (lonNum < -180 || lonNum > 180) {
    return {
      valid: false,
      error: 'Longitude must be between -180 and 180',
    };
  }

  // Check precision (max 7 decimal places)
  const decimalPart = lon.toString().split('.')[1];
  const precision = decimalPart ? decimalPart.length : 0;

  if (precision > MAX_COORD_PRECISION) {
    return {
      valid: false,
      error: `Longitude precision limited to ${MAX_COORD_PRECISION} decimal places`,
    };
  }

  return { valid: true, value: parseFloat(lonNum.toFixed(MAX_COORD_PRECISION)) };
};

// =============================================
// Query String Validation Functions
// =============================================

/**
 * Sanitize query string to prevent injection attacks
 *
 * Removes HTML/XML tags, special characters that can be used for injection,
 * and control characters.
 *
 * Time Complexity: O(n) where n is the length of the string
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} query - Query to sanitize
 * @returns {{valid: boolean, error: string|undefined, value: string|undefined}}
 */
export const sanitizeQuery = (query) => {
  // Type and presence check
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query is required' };
  }

  const trimmed = query.trim();

  // Length check (1-500 characters)
  if (trimmed.length === 0 || trimmed.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query must be 1-${MAX_QUERY_LENGTH} characters`,
    };
  }

  // Sanitize: Remove HTML/XML tags and dangerous characters
  const sanitized = trimmed
    // Remove HTML/XML tag delimiters
    .replace(/[<>]/g, '')
    // Remove ampersands (could be used for HTML entities)
    .replace(/&/g, '')
    // Remove quotes (prevent SQL injection through query parameters)
    .replace(/['"]/g, '')
    // Remove control characters (ASCII 0-31)
    .replace(/[\x00-\x1F]/g, '')
    // Remove extended control characters (ASCII 127-159)
    .replace(/[\x7F-\x9F]/g, '');

  // Check if sanitization removed all characters
  if (sanitized.length === 0) {
    return {
      valid: false,
      error: 'Query must contain valid characters',
    };
  }

  return { valid: true, value: sanitized };
};

// =============================================
// Generic Validation Functions
// =============================================

/**
 * Generic input sanitization function
 *
 * Removes control characters and applies custom character removal patterns.
 *
 * Time Complexity: O(n) where n is the length of the string
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} input - Input to sanitize
 * @param {Array<{pattern: RegExp, replacement: string}>} customSanitizers - Custom sanitization rules
 * @returns {string} Sanitized input (empty string if invalid)
 */
export const sanitizeInput = (input, customSanitizers = []) => {
  // Type check
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Apply custom sanitization rules
  for (const sanitizer of customSanitizers) {
    sanitized = sanitized.replace(sanitizer.pattern, sanitizer.replacement);
  }

  return sanitized;
};

/**
 * Validate and sanitize vehicle ID
 *
 * Vehicle IDs are numeric strings used to fetch details from the EPA API.
 *
 * Time Complexity: O(n) where n is the length of the string
 * Space Complexity: O(n) for the sanitized string
 *
 * @param {any} vehicleId - Vehicle ID to validate
 * @returns {{valid: boolean, error: string|undefined, value: string|undefined}}
 */
export const validateVehicleId = (vehicleId) => {
  // Type and presence check
  if (!vehicleId) {
    return { valid: false, error: 'Vehicle ID is required' };
  }

  // Convert to string
  const idStr = String(vehicleId).trim();

  // Length check
  if (idStr.length === 0 || idStr.length > 20) {
    return {
      valid: false,
      error: 'Vehicle ID must be 1-20 characters',
    };
  }

  // Character check (digits only)
  const validChars = /^\d+$/;

  if (!validChars.test(idStr)) {
    return {
      valid: false,
      error: 'Vehicle ID must contain only digits',
    };
  }

  return { valid: true, value: idStr };
};

/**
 * Validate coordinate pair (latitude and longitude)
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @param {any} lat - Latitude
 * @param {any} lon - Longitude
 * @returns {{valid: boolean, error: string|undefined, lat: number|undefined, lon: number|undefined}}
 */
export const validateCoordinates = (lat, lon) => {
  const latValidation = validateLatitude(lat);
  const lonValidation = validateLongitude(lon);

  if (!latValidation.valid) {
    return {
      valid: false,
      error: latValidation.error,
      lat: undefined,
      lon: undefined,
    };
  }

  if (!lonValidation.valid) {
    return {
      valid: false,
      error: lonValidation.error,
      lat: undefined,
      lon: undefined,
    };
  }

  return {
    valid: true,
    lat: latValidation.value,
    lon: lonValidation.value,
  };
};

// =============================================
// Export Default Object
// =============================================

export default {
  // Constants
  MIN_VEHICLE_YEAR,
  MAX_VEHICLE_YEAR,
  MAX_COORD_PRECISION,
  MAX_QUERY_LENGTH,

  // Vehicle validation
  validateYear,
  validateMake,
  validateModel,
  validateVin,
  validateVehicleId,

  // Geospatial validation
  validateLatitude,
  validateLongitude,
  validateCoordinates,

  // Query validation
  sanitizeQuery,

  // Generic validation
  sanitizeInput,
};
