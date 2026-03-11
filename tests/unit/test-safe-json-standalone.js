/**
 * Standalone Test Suite for Safe JSON Parser
 * Tests prototype pollution protection and security features
 */

// Replicate safeJson functionality for testing
const DANGEROUS_PROPERTIES = ['__proto__', 'constructor', 'prototype'];
const DANGEROUS_PATTERNS = [/"__proto__"/i, /"constructor"/i, /"prototype"/i];
const MAX_JSON_SIZE = 10 * 1024 * 1024;

// Track logged security events
let securityEvents = [];

const SecurityLogger = {
  logBlocked: (reason, details = {}) => {
    securityEvents.push({
      type: 'BLOCKED',
      reason,
      details,
      timestamp: Date.now(),
    });
    console.log(`[MOCK] Blocked: ${reason}`, details);
  },
  logValidationFailure: (reason, errors = [], details = {}) => {
    securityEvents.push({
      type: 'VALIDATION_FAILURE',
      reason,
      errors,
      details,
      timestamp: Date.now(),
    });
    console.log(`[MOCK] Validation Failed: ${reason}`, errors, details);
  },
};

const hasDangerousProperties = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  for (const prop of DANGEROUS_PROPERTIES) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) return true;
  }
  return false;
};

const hasDangerousPropertiesRecursive = (data, depth = 0, maxDepth = 20) => {
  if (depth > maxDepth) {
    console.warn('Maximum JSON depth exceeded, potential DoS attempt');
    return true;
  }
  if (!data || typeof data !== 'object') return false;
  if (Array.isArray(data)) {
    return data.some(item => hasDangerousPropertiesRecursive(item, depth + 1, maxDepth));
  }
  if (hasDangerousProperties(data)) return true;
  return Object.values(data).some(
    value => typeof value === 'object' && value !== null &&
      hasDangerousPropertiesRecursive(value, depth + 1, maxDepth)
  );
};

const Schemas = {
  fuelLog: {
    type: 'object',
    required: ['date', 'odometer', 'liters'],
    ranges: {
      mileage: { min: 0, max: 200 },
    },
  },
  exchangeRates: {
    type: 'object',
    required: ['rates', 'timestamp'],
  },
  communityMpg: {
    type: 'object',
    required: ['avgMpg', 'count'],
    ranges: {
      avgMpg: { min: 1, max: 200 },
    },
  },
};

const safeJsonParse = (jsonString, options = {}) => {
  const { schema = null, maxSize = MAX_JSON_SIZE, maxDepth = 20 } = options;
  try {
    if (typeof jsonString !== 'string') {
      SecurityLogger.logBlocked('Invalid input type', { actualType: typeof jsonString });
      return null;
    }
    if (jsonString.trim() === '') return null;
    const size = Buffer.byteLength(jsonString, 'utf8');
    if (size > maxSize) {
      SecurityLogger.logBlocked('JSON payload too large', { size, maxSize });
      return null;
    }
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        SecurityLogger.logBlocked('Dangerous pattern detected', { pattern: pattern.toString() });
        return null;
      }
    }
    const parsed = JSON.parse(jsonString);
    if (hasDangerousPropertiesRecursive(parsed, 0, maxDepth)) {
      SecurityLogger.logBlocked('Prototype pollution attempt detected', { depth: maxDepth });
      return null;
    }
    return parsed;
  } catch (error) {
    SecurityLogger.logBlocked('Parse error', { error: error.message });
    return null;
  }
};

const resetSecurityEvents = () => {
  securityEvents = [];
};

// Test Cases
const tests = [
  {
    name: 'Valid JSON Parsing',
    run: () => {
      resetSecurityEvents();
      const validJson = JSON.stringify({ name: 'John', age: 30 });
      const result = safeJsonParse(validJson);
      return result && result.name === 'John' && result.age === 30;
    }
  },
  {
    name: 'Prototype Pollution (__proto__)',
    run: () => {
      resetSecurityEvents();
      // Simulate actual JSON string with __proto__ property
      const maliciousJson = '{ "__proto__": { "isAdmin": true } }';
      const result = safeJsonParse(maliciousJson);
      return result === null && securityEvents.some(e => e.type === 'BLOCKED');
    }
  },
  {
    name: 'Constructor Pollution',
    run: () => {
      resetSecurityEvents();
      const maliciousJson = JSON.stringify({ constructor: { prototype: { isAdmin: true } } });
      const result = safeJsonParse(maliciousJson);
      return result === null && securityEvents.some(e => e.type === 'BLOCKED');
    }
  },
  {
    name: 'Nested Prototype Pollution',
    run: () => {
      resetSecurityEvents();
      // Simulate actual JSON string with nested __proto__ property
      const maliciousJson = '{ "user": { "name": "John", "__proto__": { "admin": true } } }';
      const result = safeJsonParse(maliciousJson);
      return result === null && securityEvents.some(e => e.type === 'BLOCKED');
    }
  },
  {
    name: 'Invalid JSON Syntax',
    run: () => {
      resetSecurityEvents();
      const result = safeJsonParse('{"name":"John",}');
      return result === null;
    }
  },
  {
    name: 'Empty Input (Edge Case)',
    run: () => {
      resetSecurityEvents();
      const r1 = safeJsonParse('');
      const r2 = safeJsonParse(null);
      const r3 = safeJsonParse(undefined);
      const r4 = safeJsonParse(123);
      return r1 === null && r2 === null && r3 === null && r4 === null;
    }
  },
  {
    name: 'Large JSON DoS Attack',
    run: () => {
      resetSecurityEvents();
      const largeArray = new Array(1000000).fill('x').join('');
      const largeJson = JSON.stringify({ largeData: largeArray });
      const result = safeJsonParse(largeJson, { maxSize: 1024 });
      return result === null && securityEvents.some(e => e.reason === 'JSON payload too large');
    }
  },
  {
    name: 'Deeply Nested Object',
    run: () => {
      resetSecurityEvents();
      let nested = { value: 'end' };
      for (let i = 0; i < 25; i++) {
        nested = { level: i, nested };
      }
      const deepJson = JSON.stringify(nested);
      const result = safeJsonParse(deepJson, { maxDepth: 20 });
      return result === null && securityEvents.some(e => e.reason === 'Prototype pollution attempt detected');
    }
  },
  {
    name: 'Complex Valid Data',
    run: () => {
      resetSecurityEvents();
      const validData = JSON.stringify({
        date: '2024-01-15',
        odometer: 50000,
        liters: 45.5,
        price: 4.50,
        mileage: 35.5
      });
      const result = safeJsonParse(validData);
      return result && result.date === '2024-01-15' && result.odometer === 50000;
    }
  },
  {
    name: 'Array Valid Data',
    run: () => {
      resetSecurityEvents();
      const validArray = JSON.stringify([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]);
      const result = safeJsonParse(validArray);
      return result && Array.isArray(result) && result.length === 2;
    }
  }
];

// Run all tests
console.log('\n========================================');
console.log('  SAFE JSON PARSER TEST SUITE');
console.log('========================================\n');

let passed = 0;
let failed = 0;

tests.forEach(({ name, run }) => {
  console.log(`\n--- Test: ${name} ---`);
  try {
    const result = run();
    if (result) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
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

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);

// Export for use in other scripts
export { safeJsonParse, Schemas, SecurityLogger };
