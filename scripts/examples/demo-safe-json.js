/**
 * Safe JSON Parser - Security Demonstration
 *
 * This script demonstrates how the safe JSON parser protects against:
 * 1. Prototype pollution attacks
 * 2. Constructor pollution attacks
 * 3. Large JSON DoS attacks
 * 4. Invalid/malformed JSON
 */

// Load the safe JSON parser
import { safeJsonParse, Schemas, SecurityLogger } from '../../src/utils/safeJson.js';

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║     SAFE JSON PARSER - SECURITY DEMONSTRATION                  ║');
console.log('║     Task 5: Prototype Pollution Protection                       ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

let blockedAttacks = 0;

// Track security events
SecurityLogger.logBlocked = (reason, details = {}) => {
  blockedAttacks++;
  console.error(`🚫 [BLOCKED] ${reason}`);
  console.error(`   Details:`, JSON.stringify(details, null, 2));
  console.log('');
};

SecurityLogger.logValidationFailure = (reason, errors = [], details = {}) => {
  console.warn(`⚠️  [VALIDATION FAILED] ${reason}`);
  console.warn(`   Errors:`, errors.join(', '));
  console.warn(`   Details:`, JSON.stringify(details, null, 2));
  console.log('');
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

const result4 = safeJsonParse(attack4, { maxSize: 1024 * 1024 }); // 1MB limit for demo
console.log('Result:', result4);
console.log('Status:', result4 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('ATTACK 5: Deeply Nested Object (Stack Overflow)');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Attacker creates deeply nested structure to cause stack overflow.\n');

let nested = { value: 'end' };
for (let i = 0; i < 25; i++) {
  nested = { level: i, nested };
}
const attack5 = JSON.stringify(nested);
console.log('Nesting depth: 25 levels');
console.log('');

const result5 = safeJsonParse(attack5, { maxDepth: 20 });
console.log('Result:', result5);
console.log('Status:', result5 ? '❌ VULNERABLE - Attack succeeded!' : '✅ PROTECTED - Attack blocked!');

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

const result6 = safeJsonParse(validLogJson, { schema: Schemas.fuelLog });
console.log('Result:', result6);
console.log('Status:', result6 ? '✅ SUCCESS - Valid data parsed!' : '❌ ERROR - Valid data rejected!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('VALID USE CASE: Exchange Rates');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Legitimate exchange rate data.\n');

const validRates = {
  rates: { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.12 },
  timestamp: Date.now(),
  base: 'USD',
};
const validRatesJson = JSON.stringify(validRates);
console.log('Valid JSON:');
console.log(validRatesJson);
console.log('');

const result7 = safeJsonParse(validRatesJson, { schema: Schemas.exchangeRates });
console.log('Result:', result7);
console.log('Status:', result7 ? '✅ SUCCESS - Valid data parsed!' : '❌ ERROR - Valid data rejected!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('VALID USE CASE: Community MPG Data');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Description: Legitimate community MPG data.\n');

const validMpg = {
  avgMpg: 28.5,
  count: 150,
  minMpg: 18,
  maxMpg: 42,
};
const validMpgJson = JSON.stringify(validMpg);
console.log('Valid JSON:');
console.log(validMpgJson);
console.log('');

const result8 = safeJsonParse(validMpgJson, { schema: Schemas.communityMpg });
console.log('Result:', result8);
console.log('Status:', result8 ? '✅ SUCCESS - Valid data parsed!' : '❌ ERROR - Valid data rejected!');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('SECURITY SUMMARY');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`Total Attacks Blocked: ${blockedAttacks}/5`);
console.log(`Protection Rate: ${((blockedAttacks / 5) * 100).toFixed(0)}%`);
console.log('');

if (blockedAttacks === 5) {
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
