/**
 * Test Suite for Safe JSON Parser
 * Tests prototype pollution protection and security features
 */

import { safeJsonParse, Schemas, SecurityLogger } from '../../src/utils/safeJson';

// Track logged security events
let securityEvents = [];

// Mock SecurityLogger to capture events
SecurityLogger.logBlocked = (reason, details = {}) => {
  securityEvents.push({
    type: 'BLOCKED',
    reason,
    details,
    timestamp: Date.now(),
  });
  console.log(`[MOCK] Blocked: ${reason}`, details);
};

SecurityLogger.logValidationFailure = (reason, errors = [], details = {}) => {
  securityEvents.push({
    type: 'VALIDATION_FAILURE',
    reason,
    errors,
    details,
    timestamp: Date.now(),
  });
  console.log(`[MOCK] Validation Failed: ${reason}`, errors, details);
};

/**
 * Helper function to reset security events
 */
const resetSecurityEvents = () => {
  securityEvents = [];
};

/**
 * Test 1: Valid JSON parsing (Happy Path)
 */
const testValidJson = () => {
  console.log('\n=== Test 1: Valid JSON Parsing ===');
  resetSecurityEvents();

  const validJson = JSON.stringify({
    name: 'John Doe',
    age: 30,
    city: 'New York',
  });

  const result = safeJsonParse(validJson);

  if (result && result.name === 'John Doe' && result.age === 30) {
    console.log('✅ PASS: Valid JSON parsed successfully');
    console.log('   Result:', result);
    return true;
  } else {
    console.log('❌ FAIL: Valid JSON parsing failed');
    return false;
  }
};

/**
 * Test 2: Prototype pollution attack via __proto__
 */
const testProtoPollution = () => {
  console.log('\n=== Test 2: Prototype Pollution (__proto__) ===');
  resetSecurityEvents();

  const maliciousJson = JSON.stringify({
    __proto__: {
      isAdmin: true,
      polluted: 'property',
    },
  });

  const result = safeJsonParse(maliciousJson);

  if (result === null) {
    const blocked = securityEvents.some(e => e.type === 'BLOCKED');
    if (blocked) {
      console.log('✅ PASS: Prototype pollution attack blocked');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Prototype pollution attack not blocked');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 3: Constructor pollution attack
 */
const testConstructorPollution = () => {
  console.log('\n=== Test 3: Constructor Pollution Attack ===');
  resetSecurityEvents();

  const maliciousJson = JSON.stringify({
    constructor: {
      prototype: {
        isAdmin: true,
      },
    },
  });

  const result = safeJsonParse(maliciousJson);

  if (result === null) {
    const blocked = securityEvents.some(e => e.type === 'BLOCKED');
    if (blocked) {
      console.log('✅ PASS: Constructor pollution attack blocked');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Constructor pollution attack not blocked');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 4: Prototype pollution in nested object
 */
const testNestedProtoPollution = () => {
  console.log('\n=== Test 4: Nested Prototype Pollution ===');
  resetSecurityEvents();

  const maliciousJson = JSON.stringify({
    user: {
      name: 'John',
      __proto__: {
        admin: true,
      },
    },
    data: [1, 2, 3],
  });

  const result = safeJsonParse(maliciousJson);

  if (result === null) {
    const blocked = securityEvents.some(e => e.type === 'BLOCKED');
    if (blocked) {
      console.log('✅ PASS: Nested prototype pollution attack blocked');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Nested prototype pollution attack not blocked');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 5: Invalid JSON syntax (Error State)
 */
const testInvalidJson = () => {
  console.log('\n=== Test 5: Invalid JSON Syntax ===');
  resetSecurityEvents();

  const invalidJson = '{"name":"John",}'; // Trailing comma

  const result = safeJsonParse(invalidJson);

  if (result === null) {
    console.log('✅ PASS: Invalid JSON handled gracefully');
    console.log('   Security events:', securityEvents);
    return true;
  }

  console.log('❌ FAIL: Invalid JSON should return null');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 6: Empty input (Edge Case)
 */
const testEmptyInput = () => {
  console.log('\n=== Test 6: Empty Input (Edge Case) ===');
  resetSecurityEvents();

  const result1 = safeJsonParse('');
  const result2 = safeJsonParse(null);
  const result3 = safeJsonParse(undefined);
  const result4 = safeJsonParse(123); // Wrong type

  if (result1 === null && result2 === null && result3 === null && result4 === null) {
    console.log('✅ PASS: Empty/invalid inputs handled correctly');
    return true;
  }

  console.log('❌ FAIL: Empty/invalid inputs not handled correctly');
  return false;
};

/**
 * Test 7: Schema validation - Missing required field
 */
const testSchemaValidationMissingField = () => {
  console.log('\n=== Test 7: Schema Validation - Missing Required Field ===');
  resetSecurityEvents();

  const invalidData = JSON.stringify({
    date: '2024-01-15',
    liters: 45.5,
    // Missing 'odometer' which is required
  });

  const result = safeJsonParse(invalidData, { schema: Schemas.fuelLog });

  if (result === null) {
    const validationFailed = securityEvents.some(e =>
      e.type === 'VALIDATION_FAILURE' && e.reason === 'Schema validation failed'
    );
    if (validationFailed) {
      console.log('✅ PASS: Schema validation caught missing field');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Schema validation did not catch missing field');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 8: Schema validation - Type mismatch
 */
const testSchemaValidationTypeMismatch = () => {
  console.log('\n=== Test 8: Schema Validation - Type Mismatch ===');
  resetSecurityEvents();

  const invalidData = JSON.stringify({
    date: '2024-01-15',
    odometer: '50000', // Should be number, not string
    liters: 45.5,
  });

  const result = safeJsonParse(invalidData, { schema: Schemas.fuelLog });

  if (result === null) {
    const validationFailed = securityEvents.some(e =>
      e.type === 'VALIDATION_FAILURE' && e.reason === 'Schema validation failed'
    );
    if (validationFailed) {
      console.log('✅ PASS: Schema validation caught type mismatch');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Schema validation did not catch type mismatch');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 9: Schema validation - Number out of range
 */
const testSchemaValidationRange = () => {
  console.log('\n=== Test 9: Schema Validation - Number Out of Range ===');
  resetSecurityEvents();

  const invalidData = JSON.stringify({
    date: '2024-01-15',
    odometer: 50000,
    liters: 45.5,
    mileage: 500, // Max allowed is 200
  });

  const result = safeJsonParse(invalidData, { schema: Schemas.fuelLog });

  if (result === null) {
    const validationFailed = securityEvents.some(e =>
      e.type === 'VALIDATION_FAILURE' && e.reason === 'Schema validation failed'
    );
    if (validationFailed) {
      console.log('✅ PASS: Schema validation caught out-of-range value');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Schema validation did not catch out-of-range value');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 10: Valid schema validation
 */
const testValidSchemaValidation = () => {
  console.log('\n=== Test 10: Valid Schema Validation ===');
  resetSecurityEvents();

  const validData = JSON.stringify({
    date: '2024-01-15',
    odometer: 50000,
    liters: 45.5,
    price: 4.50,
    mileage: 35.5,
  });

  const result = safeJsonParse(validData, { schema: Schemas.fuelLog });

  if (result && result.date === '2024-01-15' && result.odometer === 50000) {
    console.log('✅ PASS: Valid data passed schema validation');
    console.log('   Result:', result);
    return true;
  }

  console.log('❌ FAIL: Valid data failed schema validation');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 11: Large JSON DoS attack
 */
const testLargeJsonDos = () => {
  console.log('\n=== Test 11: Large JSON DoS Attack ===');
  resetSecurityEvents();

  // Create a large JSON string (> 10MB)
  const largeArray = new Array(1000000).fill('x').join('');
  const largeJson = JSON.stringify({
    largeData: largeArray,
  });

  const result = safeJsonParse(largeJson, { maxSize: 1024 }); // Set small limit for testing

  if (result === null) {
    const blocked = securityEvents.some(e =>
      e.type === 'BLOCKED' && e.reason === 'JSON payload too large'
    );
    if (blocked) {
      console.log('✅ PASS: Large JSON DoS attack blocked');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Large JSON DoS attack not blocked');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 12: Deeply nested object (DoS prevention)
 */
const testDeeplyNestedObject = () => {
  console.log('\n=== Test 12: Deeply Nested Object ===');
  resetSecurityEvents();

  // Create a deeply nested object
  let nested = { value: 'end' };
  for (let i = 0; i < 25; i++) {
    nested = { level: i, nested };
  }

  const deepJson = JSON.stringify(nested);
  const result = safeJsonParse(deepJson, { maxDepth: 20 });

  if (result === null) {
    const blocked = securityEvents.some(e =>
      e.type === 'BLOCKED' && e.reason === 'Prototype pollution attempt detected'
    );
    if (blocked) {
      console.log('✅ PASS: Deeply nested object blocked');
      console.log('   Security events:', securityEvents);
      return true;
    }
  }

  console.log('❌ FAIL: Deeply nested object not blocked');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 13: Exchange rates schema
 */
const testExchangeRatesSchema = () => {
  console.log('\n=== Test 13: Exchange Rates Schema ===');
  resetSecurityEvents();

  const validRates = JSON.stringify({
    rates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.12,
    },
    timestamp: Date.now(),
    base: 'USD',
  });

  const result = safeJsonParse(validRates, { schema: Schemas.exchangeRates });

  if (result && result.rates && result.timestamp) {
    console.log('✅ PASS: Exchange rates schema validation passed');
    console.log('   Result:', result);
    return true;
  }

  console.log('❌ FAIL: Exchange rates schema validation failed');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 14: Community MPG schema
 */
const testCommunityMpgSchema = () => {
  console.log('\n=== Test 14: Community MPG Schema ===');
  resetSecurityEvents();

  const validMpg = JSON.stringify({
    avgMpg: 28.5,
    count: 150,
    minMpg: 18,
    maxMpg: 42,
  });

  const result = safeJsonParse(validMpg, { schema: Schemas.communityMpg });

  if (result && result.avgMpg === 28.5 && result.count === 150) {
    console.log('✅ PASS: Community MPG schema validation passed');
    console.log('   Result:', result);
    return true;
  }

  console.log('❌ FAIL: Community MPG schema validation failed');
  console.log('   Result:', result);
  return false;
};

/**
 * Test 15: Freeze option
 */
const testFreezeOption = () => {
  console.log('\n=== Test 15: Freeze Option ===');
  resetSecurityEvents();

  const data = JSON.stringify({ name: 'Test', value: 123 });
  const result = safeJsonParse(data, { freeze: true });

  if (result && typeof result === 'object') {
    // Try to modify the frozen object
    try {
      result.newProperty = 'should fail';
      if (result.newProperty === 'should fail') {
        console.log('❌ FAIL: Object was not frozen');
        return false;
      }
    } catch (e) {
      // This is expected in strict mode
    }

    // Check if it's actually frozen
    if (Object.isFrozen(result)) {
      console.log('✅ PASS: Object successfully frozen');
      console.log('   Object.isFrozen(result):', Object.isFrozen(result));
      return true;
    }
  }

  console.log('❌ FAIL: Freeze option did not work');
  console.log('   Result:', result);
  return false;
};

/**
 * Run all tests
 */
const runAllTests = () => {
  console.log('\n========================================');
  console.log('  SAFE JSON PARSER TEST SUITE');
  console.log('========================================');

  const tests = [
    { name: 'Valid JSON Parsing', fn: testValidJson },
    { name: 'Prototype Pollution (__proto__)', fn: testProtoPollution },
    { name: 'Constructor Pollution', fn: testConstructorPollution },
    { name: 'Nested Prototype Pollution', fn: testNestedProtoPollution },
    { name: 'Invalid JSON Syntax', fn: testInvalidJson },
    { name: 'Empty Input (Edge Case)', fn: testEmptyInput },
    { name: 'Schema Validation - Missing Field', fn: testSchemaValidationMissingField },
    { name: 'Schema Validation - Type Mismatch', fn: testSchemaValidationTypeMismatch },
    { name: 'Schema Validation - Range', fn: testSchemaValidationRange },
    { name: 'Valid Schema Validation', fn: testValidSchemaValidation },
    { name: 'Large JSON DoS Attack', fn: testLargeJsonDos },
    { name: 'Deeply Nested Object', fn: testDeeplyNestedObject },
    { name: 'Exchange Rates Schema', fn: testExchangeRatesSchema },
    { name: 'Community MPG Schema', fn: testCommunityMpgSchema },
    { name: 'Freeze Option', fn: testFreezeOption },
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(({ name, fn }) => {
    try {
      if (fn()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`\n❌ ERROR in test "${name}":`, error);
      failed++;
    }
  });

  console.log('\n========================================');
  console.log('  TEST RESULTS');
  console.log('========================================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  return { passed, failed, total: tests.length };
};

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runAllTests();
}

export { runAllTests };
