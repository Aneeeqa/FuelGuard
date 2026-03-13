/**
 * Validation Utilities Test Suite
 *
 * Tests all validation and sanitization functions
 * Covers happy paths, edge cases, and error states
 *
 * Test Categories:
 * - Happy Path: Valid inputs that should pass
 * - Edge Case: Boundary conditions and unusual valid inputs
 * - Error State: Invalid inputs that should be rejected
 */

import {
  validateYear,
  validateMake,
  validateModel,
  validateVin,
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  sanitizeQuery,
  validateVehicleId,
  MIN_VEHICLE_YEAR,
  MAX_VEHICLE_YEAR,
} from '../../src/utils/validation.js';

// =============================================
// Test Helpers
// =============================================

let passedTests = 0;
let failedTests = 0;

/**
 * Assert that a condition is true
 * @param {boolean} condition - Condition to check
 * @param {string} message - Test description
 */
const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
  }
};

/**
 * Assert that two values are equal
 * @param {any} actual - Actual value
 * @param {any} expected - Expected value
 * @param {string} message - Test description
 */
const assertEqual = (actual, expected, message) => {
  if (actual === expected) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    failedTests++;
  }
};

/**
 * Run a test function
 * @param {string} testName - Name of the test
 * @param {Function} testFn - Test function to execute
 */
const runTest = (testName, testFn) => {
  console.log(`\n🧪 ${testName}`);
  try {
    testFn();
  } catch (error) {
    console.error(`❌ FAIL: ${testName}`);
    console.error(`   Error: ${error.message}`);
    failedTests++;
  }
};

// =============================================
// Vehicle Year Validation Tests
// =============================================

runTest('validateYear - Happy Path', () => {
  const validYears = [
    MIN_VEHICLE_YEAR, // Minimum year
    2020, // Mid-range year
    MAX_VEHICLE_YEAR, // Maximum year
    '2025', // String representation
  ];

  validYears.forEach((year) => {
    const result = validateYear(year);
    assert(result.valid, `Year ${year} should be valid`);
    assertEqual(result.value, parseInt(year, 10), `Year ${year} value should be parsed correctly`);
  });
});

runTest('validateYear - Edge Cases', () => {
  const edgeYears = [
    MIN_VEHICLE_YEAR - 1, // Just below minimum
    MAX_VEHICLE_YEAR + 1, // Just above maximum
    '0', // Zero
    '-5', // Negative
    'abc', // Non-numeric string
    null, // Null
    undefined, // Undefined
    '', // Empty string
  ];

  edgeYears.forEach((year) => {
    const result = validateYear(year);
    assert(!result.valid, `Year ${year} should be invalid`);
    assert(!!result.error, `Year ${year} should have an error message`);
  });

  // Decimal years are parsed correctly (truncated)
  const decimalResult = validateYear('2025.5');
  assert(decimalResult.valid, 'Decimal year 2025.5 should be parsed to 2025');
  assertEqual(decimalResult.value, 2025, 'Decimal should be truncated');

  // Years with whitespace are trimmed and parsed
  const whitespaceResult = validateYear(' 2025 ');
  assert(whitespaceResult.valid, 'Year with whitespace should be valid after trim');
  assertEqual(whitespaceResult.value, 2025, 'Whitespace should be trimmed');
});

runTest('validateYear - Error State', () => {
  const result = validateYear('invalid');
  assert(!result.valid, 'Invalid year should fail');
  assertEqual(result.error, 'Year must be a valid number', 'Error message should be correct');

  const result2 = validateYear(1983);
  assert(!result2.valid, 'Year below minimum should fail');
  assert(result2.error.includes(MIN_VEHICLE_YEAR), 'Error should mention minimum year');
});

// =============================================
// Vehicle Make Validation Tests
// =============================================

runTest('validateMake - Happy Path', () => {
  const validMakes = [
    'Toyota',
    'Ford',
    'BMW',
    'Mercedes-Benz', // With hyphen
    'Aston Martin', // Two words
    'Tesla', // Single word
    'ALFA ROMEO', // Uppercase
    'audi', // Lowercase
  ];

  validMakes.forEach((make) => {
    const result = validateMake(make);
    assert(result.valid, `Make "${make}" should be valid`);
    assert(result.value.length >= 3, `Make "${make}" should meet minimum length`);
  });
});

runTest('validateMake - Edge Cases', () => {
  const edgeMakes = [
    'ab', // Too short
    'a'.repeat(51), // Too long
    'T<>y', // Special characters (sanitized to Ty, too short)
    '', // Empty
    '  ', // Whitespace only
    'AB', // Exactly at boundary (should fail)
    'A'.repeat(50), // At maximum boundary (should pass)
    null,
    undefined,
  ];

  edgeMakes.forEach((make) => {
    const result = validateMake(make);
    // Note: 'A'.repeat(50) should pass, others should fail
    if (make && make.length === 50 && /^[a-zA-Z\s-]+$/.test(make)) {
      assert(result.valid, `Make "${make}" should be valid at max length`);
    } else {
      assert(!result.valid, `Make "${make}" should be invalid`);
    }
  });

  // Special characters are removed; if result is >= 3 chars, it's valid
  const sanitizedResult = validateMake('F@rd'); // Becomes "Frd"
  assert(sanitizedResult.valid, 'Make "F@rd" should be sanitized to "Frd" and be valid');
  assertEqual(sanitizedResult.value, 'Frd', 'Special characters should be removed');
});

runTest('validateMake - Error State', () => {
  const result = validateMake('T<>y');
  assert(!result.valid, 'Make with special characters should fail');
  assert(result.error.includes('letters'), 'Error should mention valid characters');
});

// =============================================
// Vehicle Model Validation Tests
// =============================================

runTest('validateModel - Happy Path', () => {
  const validModels = [
    'Camry',
    'F-150',
    'Model S',
    'CR-V',
    'Golf',
    'Q7',
    'X5',
    '500', // Numbers only
    '911', // Numbers only
    'S 63 AMG', // With numbers and spaces
  ];

  validModels.forEach((model) => {
    const result = validateModel(model);
    assert(result.valid, `Model "${model}" should be valid`);
    assert(result.value.length >= 2, `Model "${model}" should meet minimum length`);
  });
});

runTest('validateModel - Edge Cases', () => {
  const edgeModels = [
    'C', // Too short
    'a'.repeat(41), // Too long
    '', // Empty
    '  ', // Whitespace only
    'AB', // At minimum boundary (should pass)
    'A'.repeat(40), // At maximum boundary (should pass)
    null,
    undefined,
  ];

  edgeModels.forEach((model) => {
    const result = validateModel(model);
    // Check if it's at valid boundaries
    // Only consider valid if it meets both length AND character requirements AFTER sanitization
    const isAtValidBoundary = model && (model.length === 2 || model.length === 40) && /^[a-zA-Z0-9\s-]+$/.test(model) && model.trim().length >= 2;
    if (isAtValidBoundary) {
      assert(result.valid, `Model "${model}" should be valid at boundary`);
    } else {
      assert(!result.valid, `Model "${model}" should be invalid`);
    }
  });

  // Special characters are removed; if result is >= 2 chars, it's valid
  const sanitizedResult1 = validateModel('C@mry'); // Becomes "Cmry"
  assert(sanitizedResult1.valid, 'Model "C@mry" should be sanitized to "Cmry" and be valid');
  assertEqual(sanitizedResult1.value, 'Cmry', 'Special characters should be removed');

  const sanitizedResult2 = validateModel('X5<>'); // Becomes "X5"
  assert(sanitizedResult2.valid, 'Model "X5<>" should be sanitized to "X5" and be valid');
  assertEqual(sanitizedResult2.value, 'X5', 'Special characters should be removed');
});

runTest('validateModel - Error State', () => {
  const result = validateModel('C'); // Too short
  assert(!result.valid, 'Model too short should fail');
  assert(result.error.includes('2-40'), 'Error should mention length range');

  const result2 = validateModel(''); // Empty
  assert(!result2.valid, 'Empty model should fail');
  assertEqual(result2.error, 'Model is required', 'Error should mention required');
});

// =============================================
// VIN Validation Tests
// =============================================

runTest('validateVin - Happy Path', () => {
  const validVins = [
    '1HGCM82633A123456', // Honda
    '1F1F15Z5M0G123456', // Ford
    'JTDKN3DU5A0000001', // Toyota
    'WBAVG1C56EB123456', // BMW
    '1HGCM82633A123456'.toLowerCase(), // Should be uppercase
  ];

  validVins.forEach((vin) => {
    const result = validateVin(vin);
    assert(result.valid, `VIN "${vin}" should be valid`);
    assertEqual(result.value.length, 17, `VIN should be 17 characters`);
    assertEqual(result.value, result.value.toUpperCase(), `VIN should be uppercase`);
  });
});

runTest('validateVin - Edge Cases', () => {
  const edgeVins = [
    '1234567890123456', // 16 characters
    '12345678901234567', // 17 digits (valid)
    'ABCDEFGHIJKLMNOQ', // Contains Q (invalid)
    '1HGCM82633A1234O', // Contains O (invalid)
    '1HGCM82633A1234I', // Contains I (invalid)
    'ABC', // Too short
    '12345678901234567123', // Too long
    '', // Empty
    '  ', // Whitespace
    null,
    undefined,
  ];

  edgeVins.forEach((vin) => {
    const result = validateVin(vin);
    // Only 17 character alphanumeric without I,O,Q should pass
    if (vin && vin.length === 17 && /^[0-9A-HJ-NPR-Z]+$/.test(vin)) {
      assert(result.valid, `VIN "${vin}" should be valid`);
    } else {
      assert(!result.valid, `VIN "${vin}" should be invalid`);
    }
  });
});

runTest('validateVin - Error State', () => {
  const result = validateVin('1234567890123456');
  assert(!result.valid, 'VIN with 16 characters should fail');
  assertEqual(result.error, 'VIN must be exactly 17 characters', 'Error should mention length');
});

// =============================================
// Coordinate Validation Tests
// =============================================

runTest('validateLatitude - Happy Path', () => {
  const validLats = [
    0, // Equator
    45, // Mid-range
    90, // North Pole
    -90, // South Pole
    45.123, // With decimals
    '37.7749', // String representation
  ];

  validLats.forEach((lat) => {
    const result = validateLatitude(lat);
    assert(result.valid, `Latitude ${lat} should be valid`);
    assert(result.value >= -90 && result.value <= 90, `Latitude ${result.value} should be in range`);
  });
});

runTest('validateLatitude - Edge Cases', () => {
  const edgeLats = [
    90.00000001, // Slightly above maximum
    -90.00000001, // Slightly below minimum
    91, // Above maximum
    -91, // Below minimum
    'text', // Non-numeric
    null,
    undefined,
    37.77491234567, // More than 7 decimals (should fail)
  ];

  edgeLats.forEach((lat) => {
    const result = validateLatitude(lat);
    assert(!result.valid, `Latitude ${lat} should be invalid`);
  });
});

runTest('validateLatitude - Precision Limit', () => {
  const result1 = validateLatitude(37.7749123); // 7 decimals
  assert(result1.valid, '7 decimal places should be valid');

  const result2 = validateLatitude(37.77491234); // 8 decimals
  assert(!result2.valid, '8 decimal places should be invalid');
});

runTest('validateLongitude - Happy Path', () => {
  const validLons = [
    0, // Prime Meridian
    180, // International Date Line
    -180, // International Date Line
    -73.567, // With decimals
    '122.4194', // String representation
  ];

  validLons.forEach((lon) => {
    const result = validateLongitude(lon);
    assert(result.valid, `Longitude ${lon} should be valid`);
    assert(result.value >= -180 && result.value <= 180, `Longitude ${result.value} should be in range`);
  });
});

runTest('validateLongitude - Edge Cases', () => {
  const edgeLons = [
    180.00000001, // Slightly above maximum
    -180.00000001, // Slightly below minimum
    181, // Above maximum
    -181, // Below minimum
    'text', // Non-numeric
    null,
    undefined,
  ];

  edgeLons.forEach((lon) => {
    const result = validateLongitude(lon);
    assert(!result.valid, `Longitude ${lon} should be invalid`);
  });
});

runTest('validateCoordinates - Happy Path', () => {
  const result = validateCoordinates(37.7749, -122.4194);
  assert(result.valid, 'Valid coordinates should pass');
  assertEqual(result.lat, 37.7749, 'Latitude should match');
  assertEqual(result.lon, -122.4194, 'Longitude should match');
});

runTest('validateCoordinates - Error State', () => {
  const result1 = validateCoordinates(91, -122.4194);
  assert(!result1.valid, 'Invalid latitude should fail');
  assert(result1.error.includes('Latitude'), 'Error should mention latitude');

  const result2 = validateCoordinates(37.7749, 181);
  assert(!result2.valid, 'Invalid longitude should fail');
  assert(result2.error.includes('Longitude'), 'Error should mention longitude');
});

// =============================================
// Query Sanitization Tests
// =============================================

runTest('sanitizeQuery - Happy Path', () => {
  const validQueries = [
    '1600 Amphitheatre Parkway',
    'Eiffel Tower',
    '123 Main St',
    'New York, NY',
    'Tokyo, Japan',
  ];

  validQueries.forEach((query) => {
    const result = sanitizeQuery(query);
    assert(result.valid, `Query "${query}" should be valid`);
    assert(result.value.length > 0, `Query should not be empty after sanitization`);
  });
});

runTest('sanitizeQuery - Sanitization', () => {
  const injectionAttempts = [
    '<script>alert("XSS")</script>', // XSS attempt
    "'; DROP TABLE users;--", // SQL injection attempt
    '<img src=x onerror=alert(1)>', // Image-based XSS
    'javascript:alert(1)', // JavaScript protocol
    '123<>&456', // HTML special chars
  ];

  injectionAttempts.forEach((query) => {
    const result = sanitizeQuery(query);
    assert(result.valid, `Sanitized query should be valid`);
    assert(!result.value.includes('<'), 'Should remove <');
    assert(!result.value.includes('>'), 'Should remove >');
    assert(!result.value.includes('&'), 'Should remove &');
    assert(!result.value.includes("'"), 'Should remove single quotes');
    assert(!result.value.includes('"'), 'Should remove double quotes');
  });
});

runTest('sanitizeQuery - Edge Cases', () => {
  const edgeQueries = [
    '', // Empty
    '  ', // Whitespace only
    'a'.repeat(501), // Too long
    null,
    undefined,
  ];

  edgeQueries.forEach((query) => {
    const result = sanitizeQuery(query);
    assert(!result.valid, `Query "${query}" should be invalid`);
  });
});

runTest('sanitizeQuery - Length Boundary', () => {
  const validQuery = 'a'.repeat(500); // At max length
  const result1 = sanitizeQuery(validQuery);
  assert(result1.valid, 'Query at max length should be valid');
  assertEqual(result1.value.length, 500, 'Length should be preserved');

  const invalidQuery = 'a'.repeat(501); // One over max
  const result2 = sanitizeQuery(invalidQuery);
  assert(!result2.valid, 'Query over max length should fail');
});

// =============================================
// Vehicle ID Validation Tests
// =============================================

runTest('validateVehicleId - Happy Path', () => {
  const validIds = [
    '123',
    '1',
    '12345678901234567890', // 20 characters (max)
    12345, // Number (converted to string)
  ];

  validIds.forEach((id) => {
    const result = validateVehicleId(id);
    assert(result.valid, `Vehicle ID "${id}" should be valid`);
    assert(/^\d+$/.test(result.value), 'Vehicle ID should contain only digits');
  });
});

runTest('validateVehicleId - Edge Cases', () => {
  const edgeIds = [
    '', // Empty
    '  ', // Whitespace
    'abc', // Non-numeric
    '123a', // Mixed alphanumeric
    '1'.repeat(21), // Too long
    null,
    undefined,
  ];

  edgeIds.forEach((id) => {
    const result = validateVehicleId(id);
    assert(!result.valid, `Vehicle ID "${id}" should be invalid`);
  });
});

// =============================================
// Summary
// =============================================

console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Total: ${passedTests + failedTests}`);
console.log('='.repeat(60));

if (failedTests === 0) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.error('⚠️  Some tests failed.');
  process.exit(1);
}
