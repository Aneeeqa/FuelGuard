#!/usr/bin/env node

/**
 * TASK 7 Verification Script
 * Demonstrates secure localStorage protection against common attacks
 */

// Mock localStorage for testing
const mockLocalStorage = new Map();
global.localStorage = {
  getItem: (key) => mockLocalStorage.get(key) || null,
  setItem: (key, value) => mockLocalStorage.set(key, value),
  removeItem: (key) => mockLocalStorage.delete(key),
  clear: () => mockLocalStorage.clear(),
  length: () => mockLocalStorage.size,
  key: (index) => {
    const keys = Array.from(mockLocalStorage.keys());
    return keys[index] || null;
  },
};

// Import secure storage utilities
const {
  validateStorageKey,
  validateStorageValue,
  safeLocalStorageSet,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  safeLocalStorageClear,
  getStorageUsage,
  migrateStorageData,
} = require('./src/utils/secureStorage.js');

console.log('\n========================================');
console.log('TASK 7: SECURE STORAGE VERIFICATION');
console.log('========================================\n');

let totalTests = 0;
let passedTests = 0;

// Test helper
function test(description, fn) {
  totalTests++;
  try {
    const result = fn();
    if (result) {
      console.log(`✅ PASS: ${description}`);
      passedTests++;
    } else {
      console.log(`❌ FAIL: ${description}`);
    }
  } catch (error) {
    console.log(`❌ ERROR: ${description}`);
    console.log(`   ${error.message}`);
  }
}

// ============================================================================
// SECTION 1: KEY VALIDATION
// ============================================================================
console.log('🔐 SECTION 1: Key Validation\n');

test('Valid key (alphanumeric)', () => {
  const result = validateStorageKey('user_data');
  return result.valid === true;
});

test('Valid key (with hyphen)', () => {
  const result = validateStorageKey('user-data');
  return result.valid === true;
});

test('Valid key (with underscore)', () => {
  const result = validateStorageKey('user_data_123');
  return result.valid === true;
});

test('Valid key (min length: 3 chars)', () => {
  const result = validateStorageKey('abc');
  return result.valid === true;
});

test('Valid key (max length: 100 chars)', () => {
  const key = 'a'.repeat(100);
  const result = validateStorageKey(key);
  return result.valid === true;
});

test('Invalid key (too short: 2 chars)', () => {
  const result = validateStorageKey('ab');
  return result.valid === false && result.error.includes('3-100');
});

test('Invalid key (too long: 101 chars)', () => {
  const key = 'a'.repeat(101);
  const result = validateStorageKey(key);
  return result.valid === false && result.error.includes('3-100');
});

test('Invalid key (special characters)', () => {
  const result = validateStorageKey('user@data');
  return result.valid === false && result.error.includes('invalid characters');
});

test('Invalid key (null)', () => {
  const result = validateStorageKey(null);
  return result.valid === false;
});

test('Invalid key (undefined)', () => {
  const result = validateStorageKey(undefined);
  return result.valid === false;
});

// ============================================================================
// SECTION 2: XSS PREVENTION
// ============================================================================
console.log('\n🛡️ SECTION 2: XSS Prevention\n');

test('Block script tag in key', () => {
  const result = validateStorageKey('<script>alert("XSS")</script>');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block javascript: protocol in key', () => {
  const result = validateStorageKey('javascript:alert("XSS")');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block event handler in key', () => {
  const result = validateStorageKey('img onerror="alert(1)"');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block script tag in value', () => {
  const result = validateStorageValue('<script>alert("XSS")</script>');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block iframe in value', () => {
  const result = validateStorageValue('<iframe src="evil.com"></iframe>');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block javascript: protocol in value', () => {
  const result = validateStorageValue('javascript:alert("XSS")');
  return result.valid === false && result.error.includes('dangerous');
});

// ============================================================================
// SECTION 3: PROTOTYPE POLLUTION PREVENTION
// ============================================================================
console.log('\n🔒 SECTION 3: Prototype Pollution Prevention\n');

test('Block __proto__ in key', () => {
  const result = validateStorageKey('__proto__');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block constructor in key', () => {
  const result = validateStorageKey('constructor');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block prototype in key', () => {
  const result = validateStorageKey('prototype');
  return result.valid === false && result.error.includes('dangerous');
});

test('Block __proto__ in value object', () => {
  const result = validateStorageValue({ '__proto__': 'malicious' });
  // Should be blocked due to dangerous pattern
  return result.valid === false;
});

test('Block constructor in value object', () => {
  const result = validateStorageValue({ 'constructor': 'malicious' });
  return result.valid === false && result.error.includes('dangerous');
});

// ============================================================================
// SECTION 4: SIZE LIMIT PREVENTION (DoS)
// ============================================================================
console.log('\n📏 SECTION 4: DoS Prevention (Size Limits)\n');

test('Allow value within size limit (10KB)', () => {
  const value = 'x'.repeat(10 * 1024);
  const result = validateStorageValue(value);
  return result.valid === true;
});

test('Block value exceeding size limit (10KB + 1 byte)', () => {
  const value = 'x'.repeat(10 * 1024 + 1);
  const result = validateStorageValue(value);
  return result.valid === false && result.error.includes('too large');
});

test('Block null value', () => {
  const result = validateStorageValue(null);
  return result.valid === false && result.error.includes('null');
});

test('Block undefined value', () => {
  const result = validateStorageValue(undefined);
  return result.valid === false && result.error.includes('undefined');
});

test('Block unserializable object', () => {
  const obj = { fn: function () { return 1; } };
  const result = validateStorageValue(obj);
  // Functions are not serializable to JSON
  return result.valid === false;
});

// ============================================================================
// SECTION 5: SAFE STORAGE OPERATIONS
// ============================================================================
console.log('\n🔒 SECTION 5: Safe Storage Operations\n');

test('Store and retrieve valid data', () => {
  safeLocalStorageClear();
  const success = safeLocalStorageSet('test_key', 'test_value');
  const retrieved = safeLocalStorageGet('test_key');
  return success === true && retrieved === 'test_value';
});

test('Store and retrieve object', () => {
  safeLocalStorageClear();
  const obj = { name: 'John', age: 30 };
  const success = safeLocalStorageSet('test_obj', obj);
  const retrieved = safeLocalStorageGet('test_obj');
  return success === true && JSON.stringify(retrieved) === JSON.stringify(obj);
});

test('Reject invalid key on set', () => {
  safeLocalStorageClear();
  const success = safeLocalStorageSet('', 'value');
  return success === false;
});

test('Reject malicious value on set', () => {
  safeLocalStorageClear();
  const success = safeLocalStorageSet('test_key', '<script>alert("XSS")</script>');
  return success === false;
});

test('Remove data successfully', () => {
  safeLocalStorageClear();
  safeLocalStorageSet('test_key', 'value');
  const removeSuccess = safeLocalStorageRemove('test_key');
  const retrieved = safeLocalStorageGet('test_key');
  return removeSuccess === true && retrieved === null;
});

test('Get storage usage', () => {
  safeLocalStorageClear();
  safeLocalStorageSet('test1', 'x'.repeat(100));
  safeLocalStorageSet('test2', 'x'.repeat(200));

  const usage = getStorageUsage();
  return usage.totalUsed > 0 && usage.itemCount === 2;
});

// ============================================================================
// SECTION 6: MIGRATION
// ============================================================================
console.log('\n🔄 SECTION 6: Data Migration\n');

test('Migrate clean storage', () => {
  safeLocalStorageClear();
  safeLocalStorageSet('valid_key1', 'value1');
  safeLocalStorageSet('valid_key2', { name: 'John' });

  const result = migrateStorageData();
  return result.validatedItems > 0 && result.corruptedItems === 0;
});

test('Detect and remove corrupted data', () => {
  safeLocalStorageClear();
  // Manually add corrupted data
  mockLocalStorage.set('bad_key', '<script>alert("XSS")</script>');
  mockLocalStorage.set('good_key', 'good_value');

  const result = migrateStorageData();
  const badKeyExists = safeLocalStorageGet('bad_key') !== null;
  const goodKeyExists = safeLocalStorageGet('good_key') === 'good_value';

  return result.corruptedItems > 0 && !badKeyExists && goodKeyExists;
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n========================================');
console.log('VERIFICATION SUMMARY');
console.log('========================================');
console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n✅ ALL TESTS PASSED - Secure storage is working correctly!');
} else {
  console.log('\n❌ SOME TESTS FAILED - Please review the results above.');
  process.exit(1);
}

console.log('\n========================================\n');
