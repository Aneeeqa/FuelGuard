/**
 * Input Validation Middleware
 *
 * Validates and sanitizes all incoming API requests to prevent
 * injection attacks and ensure data integrity.
 */

/**
 * Valid vehicle years (1984 - current year + 1)
 */
const generateValidYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 1984; year <= currentYear + 1; year++) {
    years.push(year.toString());
  }
  return years;
};

const VALID_YEARS = generateValidYears();

/**
 * SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|EXECUTE|ALTER|CREATE|TRUNCATE)/i,
  /['"<>;]/,
  /(--|\/\*|\*\/)/,
  /(\|\||&&|;)/,
  /(\bOR\b|\bAND\b).*=/i,
];

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<\?php/i,
];

/**
 * Path traversal patterns to detect
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,
  /%2e%2e/i,
  /\.\.\\/,
];

/**
 * Validate year parameter
 * @param {string} year - Year to validate
 * @returns {boolean}
 */
const isValidYear = (year) => {
  if (!year || typeof year !== 'string') return false;
  return VALID_YEARS.includes(year);
};

/**
 * Validate make parameter
 * @param {string} make - Vehicle make to validate
 * @returns {boolean}
 */
const isValidMake = (make) => {
  if (!make || typeof make !== 'string') return false;
  // Allow letters, spaces, hyphens, apostrophes
  return /^[a-zA-Z\s\-'\.]+$/.test(make) && make.length <= 50;
};

/**
 * Validate model parameter
 * @param {string} model - Vehicle model to validate
 * @returns {boolean}
 */
const isValidModel = (model) => {
  if (!model || typeof model !== 'string') return false;
  // Allow letters, numbers, spaces, hyphens, apostrophes, periods
  return /^[a-zA-Z0-9\s\-'\.]+$/.test(model) && model.length <= 100;
};

/**
 * Validate vehicle ID parameter
 * @param {string} vehicleId - Vehicle ID to validate
 * @returns {boolean}
 */
const isValidVehicleId = (vehicleId) => {
  if (!vehicleId || typeof vehicleId !== 'string') return false;
  // Vehicle IDs are typically numeric, but can contain dots
  return /^[0-9\.]+$/.test(vehicleId) && vehicleId.length <= 20;
};

/**
 * Check for SQL injection patterns
 * @param {string} input - Input to check
 * @returns {boolean}
 */
const hasSqlInjection = (input) => {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check for XSS patterns
 * @param {string} input - Input to check
 * @returns {boolean}
 */
const hasXss = (input) => {
  if (!input || typeof input !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check for path traversal patterns
 * @param {string} input - Input to check
 * @returns {boolean}
 */
const hasPathTraversal = (input) => {
  if (!input || typeof input !== 'string') return false;
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== 'string') return '';
  // Remove null bytes and trim
  return input.replace(/\0/g, '').trim();
};

/**
 * Comprehensive parameter validation
 * @param {Object} params - Query or route parameters
 * @returns {Object} Validation result
 */
export const validateFuelParams = (params) => {
  const errors = [];
  const sanitized = {};

  // Validate year
  if (params.year) {
    const sanitizedYear = sanitizeString(params.year);
    if (!isValidYear(sanitizedYear)) {
      errors.push('Invalid year parameter');
    } else if (hasSqlInjection(sanitizedYear) || hasXss(sanitizedYear)) {
      errors.push('Malicious input detected in year parameter');
    } else {
      sanitized.year = sanitizedYear;
    }
  }

  // Validate make
  if (params.make) {
    const sanitizedMake = sanitizeString(params.make);
    if (!isValidMake(sanitizedMake)) {
      errors.push('Invalid make parameter');
    } else if (hasSqlInjection(sanitizedMake) || hasXss(sanitizedMake)) {
      errors.push('Malicious input detected in make parameter');
    } else {
      sanitized.make = sanitizedMake;
    }
  }

  // Validate model
  if (params.model) {
    const sanitizedModel = sanitizeString(params.model);
    if (!isValidModel(sanitizedModel)) {
      errors.push('Invalid model parameter');
    } else if (hasSqlInjection(sanitizedModel) || hasXss(sanitizedModel)) {
      errors.push('Malicious input detected in model parameter');
    } else {
      sanitized.model = sanitizedModel;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    error: errors.length > 0 ? errors.join('; ') : null,
    sanitized,
  };
};

/**
 * Validate endpoint path
 * @param {string} path - Request path to validate
 * @returns {Object} Validation result
 */
export const validateEndpoint = (path) => {
  if (!path || typeof path !== 'string') {
    return {
      valid: false,
      error: 'Invalid endpoint path',
    };
  }

  // Check for path traversal
  if (hasPathTraversal(path)) {
    return {
      valid: false,
      error: 'Path traversal detected',
    };
  }

  // Check for malicious patterns
  if (hasSqlInjection(path) || hasXss(path)) {
    return {
      valid: false,
      error: 'Malicious input detected in endpoint',
    };
  }

  // Validate allowed endpoints
  const allowedPrefixes = [
    'vehicle/menu',
    'vehicle',
  ];

  const isValidPrefix = allowedPrefixes.some(prefix => path.startsWith(prefix));

  if (!isValidPrefix) {
    return {
      valid: false,
      error: 'Invalid endpoint path',
    };
  }

  return {
    valid: true,
    sanitizedPath: sanitizeString(path),
  };
};

/**
 * Express middleware for request validation
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export const validationMiddleware = (req, res, next) => {
  // Validate query parameters
  if (Object.keys(req.query).length > 0) {
    const validation = validateFuelParams(req.query);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error,
        status: 'invalid_request',
      });
    }
    // Replace with sanitized values
    Object.assign(req.query, validation.sanitized);
  }

  // Validate endpoint path
  const endpoint = req.path.replace('/api/fueleconomy/', '');
  const endpointValidation = validateEndpoint(endpoint);

  if (!endpointValidation.valid) {
    return res.status(400).json({
      error: endpointValidation.error,
      status: 'invalid_request',
    });
  }

  req.sanitizedEndpoint = endpointValidation.sanitizedPath;
  next();
};

export default {
  validateFuelParams,
  validateEndpoint,
  validationMiddleware,
  isValidYear,
  isValidMake,
  isValidModel,
  isValidVehicleId,
};
