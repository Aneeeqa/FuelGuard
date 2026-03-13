/**
 * Test script for NHTSA API integration
 * This script tests the fuel tank capacity estimation functionality
 */

// Import the NHTSA API service
// For testing in Node.js, we'd need to use fetch polyfill or run in browser

// Mock test data
const testCases = [
  {
    name: 'Toyota Prius (Hybrid)',
    vehicleClass: 'Midsize Cars',
    make: 'Toyota',
    model: 'Prius',
    expectedCapacity: 45, // Known value
  },
  {
    name: 'Toyota Camry (Sedan)',
    vehicleClass: 'Midsize Cars',
    make: 'Toyota',
    model: 'Camry',
    expectedCapacity: 55, // Known value
  },
  {
    name: 'Ford F-150 (Truck)',
    vehicleClass: 'Standard Pickup Trucks',
    make: 'Ford',
    model: 'F-150',
    expectedCapacity: 87, // Known value
  },
  {
    name: 'Honda Civic (Compact)',
    vehicleClass: 'Compact Cars',
    make: 'Honda',
    model: 'Civic',
    expectedCapacity: 47, // Known value
  },
  {
    name: 'Unknown Vehicle (Class Fallback)',
    vehicleClass: 'Compact Cars',
    make: 'Unknown',
    model: 'Model',
    expectedCapacity: 45, // Class average
  },
  {
    name: 'SUV (Class Fallback)',
    vehicleClass: 'Standard Sport Utility Vehicles',
    make: 'Unknown',
    model: 'SUV',
    expectedCapacity: 75, // Class average
  },
];

/**
 * Simulate the estimateFuelTankCapacity function
 * (Copied from nhtsaApiService.js for standalone testing)
 */
const estimateFuelTankCapacity = (vehicleClass, make, model) => {
  // Average fuel tank capacities by vehicle class (in liters)
  const classCapacities = {
    'Two Seaters': 50,
    'Minicompact Cars': 35,
    'Subcompact Cars': 40,
    'Compact Cars': 45,
    'Midsize Cars': 55,
    'Large Cars': 65,
    'Small Station Wagons': 50,
    'Midsize Station Wagons': 60,
    'Large Station Wagons': 65,
    'Small Pickup Trucks': 65,
    'Standard Pickup Trucks': 85,
    'Small Sport Utility Vehicles': 60,
    'Standard Sport Utility Vehicles': 75,
    'Minivan - Passenger': 70,
    'Special Purpose Vehicles': 75,
    'Special Purpose Vehicle': 75,
  };

  // Make/model specific adjustments (these are common tank sizes)
  const makeModelAdjustments = {
    'toyota-prius': 45,
    'toyota-corolla': 50,
    'toyota-camry': 55,
    'honda-civic': 47,
    'honda-accord': 56,
    'ford-f-150': 87,
    'chevrolet-silverado': 85,
    'nissan-altima': 56,
    'hyundai-elantra': 50,
    'kia-sorento': 67,
    'bmw-3-series': 55,
    'mercedes-benz-c-class': 66,
  };

  const key = `${make.toLowerCase()}-${model.toLowerCase()}`;

  // First check make/model specific
  if (makeModelAdjustments[key]) {
    return makeModelAdjustments[key];
  }

  // Then check vehicle class
  if (vehicleClass && classCapacities[vehicleClass]) {
    return classCapacities[vehicleClass];
  }

  // Default fallback
  return 50;
};

/**
 * Run test cases
 */
function runTests() {
  console.log('🧪 Running NHTSA API Fuel Tank Capacity Tests\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    const result = estimateFuelTankCapacity(
      testCase.vehicleClass,
      testCase.make,
      testCase.model
    );

    const isPassed = result === testCase.expectedCapacity;
    const status = isPassed ? '✅ PASS' : '❌ FAIL';

    if (isPassed) {
      passed++;
    } else {
      failed++;
    }

    console.log(`\nTest ${index + 1}: ${testCase.name}`);
    console.log(`  Vehicle Class: ${testCase.vehicleClass}`);
    console.log(`  Make/Model: ${testCase.make} ${testCase.model}`);
    console.log(`  Expected: ${testCase.expectedCapacity}L`);
    console.log(`  Got: ${result}L`);
    console.log(`  Status: ${status}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results:`);
  console.log(`   Total: ${testCases.length}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
  console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The fuel tank capacity estimation is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the logic.');
  }

  return { passed, failed, total: testCases.length };
}

// Run the tests
if (typeof window === 'undefined') {
  // Node.js environment
  runTests();
} else {
  // Browser environment - run on page load
  window.runNHTSATests = runTests;
  console.log('💡 To run tests in browser console, type: runNHTSATests()');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    estimateFuelTankCapacity,
    testCases,
    runTests,
  };
}

/**
 * Usage Examples
 */

// Example 1: Estimate tank capacity for a specific vehicle
console.log('\n📝 Usage Examples:');
console.log('-'.repeat(60));
const example1 = estimateFuelTankCapacity('Compact Cars', 'Toyota', 'Corolla');
console.log(`Toyota Corolla tank capacity: ${example1}L`);

// Example 2: Estimate for SUV
const example2 = estimateFuelTankCapacity('Standard Sport Utility Vehicles', 'Ford', 'Explorer');
console.log(`Ford Explorer tank capacity: ${example2}L`);

// Example 3: Estimate for unknown vehicle (class fallback)
const example3 = estimateFuelTankCapacity('Midsize Cars', 'Unknown', 'Car');
console.log(`Unknown midsize car tank capacity: ${example3}L`);

// Example 4: Default fallback
const example4 = estimateFuelTankCapacity(null, 'Unknown', 'Unknown');
console.log(`Default fallback tank capacity: ${example4}L`);
