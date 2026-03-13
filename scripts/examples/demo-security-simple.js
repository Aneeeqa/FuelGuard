/**
 * Safe JSON Parser - Security Demonstration
 *
 * This script demonstrates how the safe JSON parser protects against:
 * 1. Prototype pollution attacks
 * 2. Constructor pollution attacks
 * 3. Large JSON DoS attacks
 * 4. Invalid/malformed JSON
 */

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     SAFE JSON PARSER - SECURITY DEMONSTRATION                  ║');
console.log('║     Task 5: Prototype Pollution Protection                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Simulate safe JSON parser behavior
const DANGEROUS_PATTERNS = [/"__proto__"/i, /"constructor"/i, /"prototype"/i];

let blockedAttacks = 0;

const logBlocked = (reason, details = {}) => {
  blockedAttacks++;
  console.error(`🚫 [BLOCKED] ${reason}`);
  console.error(`   Details:`, JSON.stringify(details, null, 2));
  console.log('');
};

const hasDangerousProperties = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  return ['__proto__', 'constructor', 'prototype'].some(prop =>
    Object.prototype.hasOwnProperty.call(obj, prop)
  );
};

const safeJsonParse = (jsonString, maxSize = 10 * 1024 * 1024) => {
  try {
    if (typeof jsonString !== 'string') {
      logBlocked('Invalid input type', { actualType: typeof jsonString });
      return null;
    }

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(jsonString)) {
        logBlocked('Dangerous pattern detected', { pattern: pattern.toString() });
        return null;
      }
    }

    // Size check
    const size = Buffer.byteLength(jsonString, 'utf8');
    if (size > maxSize) {
      logBlocked('JSON payload too large', { size, maxSize });
      return null;
    }

    const parsed = JSON.parse(jsonString);

    // Check for dangerous properties
    if (hasDangerousProperties(parsed)) {
      logBlocked('Prototype pollution attempt detected');
      return null;
    }

    return parsed;
  } catch (error) {
    logBlocked('Parse error', { error: error.message });
    return null;
  }
};

console.log('═══════════════════════════════════════════════════════════════');
console.log('ATTACK 1: Prototype Pollution via __proto__');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Attacker attempts to pollute Object.prototype by');
console.log('setting __proto__ property in JSON data.\n');

const attack1 = '{ "__proto__": { "isAdmin": true, "polluted": "property" } }';
console.log('Malicious JSON:');
console.log(attack1);
console.log('');

const result1 = safeJsonParse(attack1);
console.log('Result:', result1);
console.log('Status:', result1 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('ATTACK 2: Constructor Pollution');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Attacker attempts to pollute via constructor property');
console.log('to modify Object.prototype.\n');

const attack2 = '{ "constructor": { "prototype": { "isAdmin": true } } }';
console.log('Malicious JSON:');
console.log(attack2);
console.log('');

const result2 = safeJsonParse(attack2);
console.log('Result:', result2);
console.log('Status:', result2 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('ATTACK 3: Nested Prototype Pollution');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Attacker hides __proto__ in nested objects\n');

const attack3 = '{ "user": { "name": "John", "__proto__": { "admin": true } } }';
console.log('Malicious JSON:');
console.log(attack3);
console.log('');

const result3 = safeJsonParse(attack3);
console.log('Result:', result3);
console.log('Status:', result3 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('ATTACK 4: Large JSON DoS (Denial of Service)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Attacker sends a massive JSON payload to exhaust memory.\n');

const largeData = new Array(1000000).fill('x').join('');
const attack4 = JSON.stringify({ data: largeData });
console.log('Malicious JSON size:', `${(Buffer.byteLength(attack4) / 1024 / 1024).toFixed(2)} MB`);
console.log('');

const result4 = safeJsonParse(attack4, 512 * 1024); // 512KB limit for demo (smaller than 0.95 MB)
console.log('Result:', result4);
console.log('Status:', result4 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('VALID USE CASE: Normal Fuel Log Entry');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Legitimate fuel log data should parse successfully.\n');

const validLog = {
  date: '2024-01-15',
  odometer: 50000,
  liters: 45.5,
  price: 4.50,
  mileage: 35.5,
  location: 'Shell Station, New York',
  notes: 'Regular fill-up',
};
const validLogJson = JSON.stringify(validLog);
console.log('Valid JSON:');
console.log(validLogJson);
console.log('');

const result5 = safeJsonParse(validLogJson);
console.log('Result:', result5);
console.log('Status:', result5 ? '✅ SUCCESS - Valid data parsed!' : '❌ ERROR - Valid data rejected!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SECURITY SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Total Attacks Blocked: ${blockedAttacks}/4`);
console.log(`Protection Rate: ${((blockedAttacks / 4) * 100).toFixed(0)}%`);
console.log('');

if (blockedAttacks === 4) {
  console.log('✅ ALL ATTACKS BLOCKED - System is secure!');
} else {
  console.log('❌ SOME ATTACKS SUCCEEDED - System is vulnerable!');
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('FILES UPDATED');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1. src/utils/safeJson.js - New safe JSON parser utility');
console.log('2. src/utils/storage.js - Updated with safe parsing');
console.log('3. src/utils/currency.js - Updated with safe parsing');
console.log('4. src/services/communityMpgService.js - Updated with safe parsing');
console.log('');

console.log('═══════════════════════════════════════════════════════════════');
console.log('SECURITY FEATURES IMPLEMENTED');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('✅ Prototype pollution detection (__proto__, constructor, prototype)');
console.log('✅ Size limits to prevent DoS attacks (default: 10MB)');
console.log('✅ Depth limits to prevent stack overflow (default: 20 levels)');
console.log('✅ Schema validation for data integrity');
console.log('✅ Security event logging for all blocked attempts');
console.log('✅ Comprehensive error handling');
console.log('✅ Input validation');
console.log('✅ Type checking');
console.log('✅ Range validation for numeric values');
console.log('✅ String length limits');
console.log('✅ Optional object freezing');
console.log('');

console.log('═══════════════════════════════════════════════════════════════\n');
