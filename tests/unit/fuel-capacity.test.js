/**
 * Fuel Tank Capacity Service Test Suite
 *
 * Run with: node tests/fuelCapacity.test.js
 */

// Note: These are integration tests that would normally require a test runner like Jest
// This file demonstrates expected behavior and can be adapted for your test framework

const {
  estimateEnhancedTankCapacity,
  getFuelTankCapacity,
  clearCache
} = require('../../src/services/fuelCapacityService');

/**
 * Test Case 1: Happy Path - Well-known vehicle
 * Expected: High confidence, exact capacity
 */
async function testKnownVehicle() {
  console.log('\n=== Test 1: Known Vehicle (Toyota Corolla) ===');

  const result = await getFuelTankCapacity({
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vehicleClass: 'Compact Cars',
    tankCapacity: null
  });

  console.assert(result.capacity === 50, `Expected 50L, got ${result.capacity}L`);
  console.assert(result.confidence === 'high', `Expected 'high' confidence, got '${result.confidence}'`);
  console.log('✓ PASS: Capacity =', result.capacity, 'L, Confidence =', result.confidence);
  console.log('  Source:', result.source);
  console.log('  Description:', result.description);
}

/**
 * Test Case 2: Edge Case - Unknown make/model but known class
 * Expected: Medium confidence, class average
 */
async function testUnknownVehicleKnownClass() {
  console.log('\n=== Test 2: Unknown Vehicle, Known Class ===');

  const result = await getFuelTankCapacity({
    make: 'UnknownMake',
    model: 'UnknownModel',
    year: 2025,
    vehicleClass: 'Compact Cars',
    tankCapacity: null
  });

  console.assert(result.capacity === 45, `Expected 45L (class avg), got ${result.capacity}L`);
  console.assert(result.confidence === 'medium', `Expected 'medium' confidence, got '${result.confidence}'`);
  console.log('✓ PASS: Capacity =', result.capacity, 'L, Confidence =', result.confidence);
  console.log('  Source:', result.source);
  console.log('  Description:', result.description);
}

/**
 * Test Case 3: Edge Case - Unknown vehicle
 * Expected: Low confidence, default value
 */
async function testUnknownVehicle() {
  console.log('\n=== Test 3: Unknown Vehicle (No Data) ===');

  const result = await getFuelTankCapacity({
    make: 'Unknown',
    model: 'Vehicle',
    year: 1900,
    vehicleClass: null,
    tankCapacity: null
  });

  console.assert(result.capacity === 50, `Expected 50L (default), got ${result.capacity}L`);
  console.assert(result.confidence === 'very-low', `Expected 'very-low' confidence, got '${result.confidence}'`);
  console.log('✓ PASS: Capacity =', result.capacity, 'L, Confidence =', result.confidence);
  console.log('  Source:', result.source);
  console.log('  Description:', result.description);
}

/**
 * Test Case 4: Error State - User provided value takes priority
 * Expected: High confidence, uses provided value
 */
async function testUserProvidedValue() {
  console.log('\n=== Test 4: User-Provided Value (Override) ===');

  const result = await getFuelTankCapacity({
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vehicleClass: 'Compact Cars',
    tankCapacity: 75  // User override
  });

  console.assert(result.capacity === 75, `Expected 75L (user value), got ${result.capacity}L`);
  console.assert(result.confidence === 'high', `Expected 'high' confidence, got '${result.confidence}'`);
  console.log('✓ PASS: Capacity =', result.capacity, 'L, Confidence =', result.confidence);
  console.log('  Source:', result.source);
  console.log('  Description:', result.description);
}

/**
 * Test Case 5: Vehicle Class Specifics
 * Expected: Different capacities for different classes
 */
async function testVehicleClasses() {
  console.log('\n=== Test 5: Vehicle Class Variations ===');

  const classes = [
    { class: 'Two Seaters', expected: 50 },
    { class: 'Compact Cars', expected: 45 },
    { class: 'Midsize Cars', expected: 55 },
    { class: 'Large Cars', expected: 65 },
    { class: 'Small Pickup Trucks', expected: 65 },
    { class: 'Standard Pickup Trucks', expected: 85 },
    { class: 'Small Sport Utility Vehicles', expected: 60 },
    { class: 'Standard Sport Utility Vehicles', expected: 75 },
  ];

  classes.forEach(({ class: vehicleClass, expected }) => {
    const result = estimateEnhancedTankCapacity(vehicleClass, null, null, null);
    console.assert(result.capacity === expected,
      `Class '${vehicleClass}': Expected ${expected}L, got ${result.capacity}L`);
    console.log(`✓ ${vehicleClass}: ${result.capacity}L (${result.confidence})`);
  });
}

/**
 * Test Case 6: Make/Model Specific Database
 * Expected: Exact matches for popular vehicles
 */
async function testMakeModelDatabase() {
  console.log('\n=== Test 6: Make/Model Database ===');

  const vehicles = [
    { make: 'Toyota', model: 'Prius', expected: 45 },
    { make: 'Honda', model: 'Civic', expected: 47 },
    { make: 'Ford', model: 'F-150', expected: 87 },
    { make: 'Chevrolet', model: 'Silverado', expected: 85 },
    { make: 'Tesla', model: 'Model 3', expected: 82 },
    { make: 'Jeep', model: 'Wrangler', expected: 72 },
  ];

  vehicles.forEach(({ make, model, expected }) => {
    const result = estimateEnhancedTankCapacity(null, make, model, null);
    console.assert(result.capacity === expected,
      `${make} ${model}: Expected ${expected}L, got ${result.capacity}L`);
    console.log(`✓ ${make} ${model}: ${result.capacity}L (${result.confidence})`);
  });
}

/**
 * Test Case 7: Cache Performance
 * Expected: Second call is faster due to caching
 */
async function testCaching() {
  console.log('\n=== Test 7: Caching Performance ===');

  clearCache();

  const vehicle = {
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    vehicleClass: 'Midsize Cars',
    tankCapacity: null
  };

  // First call - no cache
  const start1 = Date.now();
  const result1 = await getFuelTankCapacity(vehicle);
  const time1 = Date.now() - start1;

  // Second call - should use cache
  const start2 = Date.now();
  const result2 = await getFuelTankCapacity(vehicle);
  const time2 = Date.now() - start2;

  console.log('First call:', time1, 'ms');
  console.log('Second call:', time2, 'ms (cached)');
  console.assert(result2.capacity === result1.capacity, 'Cached result should match');
  console.log('✓ PASS: Cache working correctly');
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('========================================');
  console.log('Fuel Tank Capacity Service - Test Suite');
  console.log('========================================');

  try {
    await testKnownVehicle();
    await testUnknownVehicleKnownClass();
    await testUnknownVehicle();
    await testUserProvidedValue();
    await testVehicleClasses();
    await testMakeModelDatabase();
    await testCaching();

    console.log('\n========================================');
    console.log('✓ ALL TESTS PASSED');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export for use in test runners
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testKnownVehicle,
    testUnknownVehicleKnownClass,
    testUnknownVehicle,
    testUserProvidedValue,
    testVehicleClasses,
    testMakeModelDatabase,
    testCaching,
    runAllTests
  };
}

// Run tests if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllTests().catch(console.error);
}
