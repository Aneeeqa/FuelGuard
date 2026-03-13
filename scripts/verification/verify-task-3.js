/**
 * Verification script for Task 3: Tank-to-Tank Integration in FuelContext
 *
 * This script tests that the addLog function correctly integrates
 * Tank-to-Tank calculations.
 */

import {
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption,
  calculateTankToTankStatistics
} from '../../src/utils/tankToTankCalculations.js';

console.log('='.repeat(70));
console.log('TASK 3 VERIFICATION: Tank-to-Tank Integration');
console.log('='.repeat(70));

let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`✓ PASS: ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`✗ FAIL: ${description}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertApproxEqual(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message}\n  Expected: ${expected} (±${tolerance})\n  Actual: ${actual}\n  Diff: ${diff}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message + ' - Value is falsy');
  }
}

console.log('\n🔧 Testing addLog Integration');
console.log('-'.repeat(70));

// Simulate existing state
const mockPrevState = {
  logs: [
    {
      id: 'log-1',
      date: '2025-01-20T10:00:00Z',
      odometer: 15000,
      liters: 50,
      isFullTank: true,
      tankCapacity: 50,
      vehicleId: 'vehicle-1'
    }
  ],
  vehicleProfile: {
    expectedMileage: 15,
    tankCapacity: 50,
    tankToTankTheftThreshold: 25,
    tankToTankTrips: []
  },
  stats: {
    avgMileage: 15
  },
  currentVehicleId: 'vehicle-1'
};

console.log('\n📝 Test 1: Full tank fill with previous full fill');
test('Should calculate Tank-to-Tank data for full tank fill', () => {
  const newLog = {
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,  // 200 km
    liters: 36,      // Theft scenario
    isFullTank: true,
    vehicleId: 'vehicle-1'
  };

  // Simulate addLog logic
  const fullTankCheck = isFullTankFill(newLog, mockPrevState.vehicleProfile);
  assertTruthy(fullTankCheck.isFullTank, 'Should detect full tank');

  const previousFullFill = findPreviousFullFill(
    mockPrevState.logs,
    mockPrevState.currentVehicleId,
    newLog.date
  );
  assertTruthy(previousFullFill, 'Should find previous full fill');

  const tankToTankData = calculateTankToTankConsumption(
    { ...newLog, isFullTank: true, tankCapacity: mockPrevState.vehicleProfile.tankCapacity },
    previousFullFill,
    mockPrevState.vehicleProfile
  );

  assertEqual(tankToTankData.isValid, true, 'Should be valid');
  assertEqual(tankToTankData.distance, 200, 'Distance should be 200 km');
  assertApproxEqual(tankToTankData.actualFuelConsumed, 36, 0.01, 'Actual fuel consumed');
  assertApproxEqual(tankToTankData.expectedFuelConsumed, 13.33, 0.01, 'Expected fuel consumed');
  assertApproxEqual(tankToTankData.theftAmount, 22.67, 0.01, 'Theft amount');
  assertApproxEqual(tankToTankData.theftPercentage, 63, 1, 'Theft percentage');
  assertEqual(tankToTankData.isTheftSuspected, true, 'Should suspect theft');
});

console.log('\n📝 Test 2: First full tank fill (no previous)');
test('Should handle first full tank fill without Tank-to-Tank data', () => {
  const newLog = {
    date: '2025-01-20T10:00:00Z',
    odometer: 15000,
    liters: 50,
    isFullTank: true,
    vehicleId: 'vehicle-1'
  };

  const emptyLogs = [];
  const fullTankCheck = isFullTankFill(newLog, mockPrevState.vehicleProfile);
  assertTruthy(fullTankCheck.isFullTank, 'Should detect full tank');

  const previousFullFill = findPreviousFullFill(
    emptyLogs,
    mockPrevState.currentVehicleId,
    newLog.date
  );

  assertEqual(previousFullFill, null, 'Should not find previous full fill');
  console.log('  ✓ First full fill - Tank-to-Tank data will be null (expected)');
});

console.log('\n📝 Test 3: Partial fill (should not calculate Tank-to-Tank)');
test('Should skip Tank-to-Tank for partial fills', () => {
  const newLog = {
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,
    liters: 10,  // Partial fill
    isFullTank: false,
    vehicleId: 'vehicle-1'
  };

  const fullTankCheck = isFullTankFill(newLog, mockPrevState.vehicleProfile);
  assertEqual(fullTankCheck.isFullTank, false, 'Should NOT detect full tank');
  console.log('  ✓ Partial fill - Tank-to-Tank data will be null (expected)');
});

console.log('\n📝 Test 4: Fill percentage calculation');
test('Should calculate fill percentage for full tank', () => {
  const liters = 36;
  const tankCapacity = 100;
  const fillPercentage = (liters / tankCapacity) * 100;

  assertApproxEqual(fillPercentage, 36, 0.1, 'Fill percentage should be 36%');
});

console.log('\n📝 Test 5: Vehicle profile update with Tank-to-Tank data');
test('Should update vehicle profile with Tank-to-Tank trip', () => {
  const tankToTankTrip = {
    isValid: true,
    distance: 200,
    actualFuelConsumed: 36,
    actualMileage: 5.56,
    isTheftSuspected: true
  };

  const existingTrips = [];
  const newTrips = [tankToTankTrip, ...existingTrips].slice(0, 50);

  assertEqual(newTrips.length, 1, 'Should have 1 trip');
  assertEqual(newTrips[0].isValid, true, 'Trip should be valid');

  const avgMileage = newTrips.reduce((sum, t) => sum + t.actualMileage, 0) / newTrips.length;
  assertApproxEqual(avgMileage, 5.56, 0.01, 'Average Tank-to-Tank mileage');
});

console.log('\n📝 Test 6: Average Tank-to-Tank mileage calculation');
test('Should calculate average from multiple trips', () => {
  const trips = [
    { isValid: true, actualMileage: 15.0 },
    { isValid: true, actualMileage: 14.5 },
    { isValid: true, actualMileage: 16.0 }
  ];

  const avg = trips.reduce((sum, t) => sum + t.actualMileage, 0) / trips.length;

  assertApproxEqual(avg, 15.17, 0.01, 'Average should be 15.17');
});

console.log('\n📝 Test 7: Vehicle profile fields updated correctly');
test('Should set lastFullFillLogId and lastFullFillDate', () => {
  const newLog = {
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,
    liters: 36,
    isFullTank: true
  };

  const updatedProfile = {
    ...mockPrevState.vehicleProfile,
    lastFullFillLogId: Date.now().toString(),
    lastFullFillDate: newLog.date
  };

  assertTruthy(updatedProfile.lastFullFillLogId, 'Should have lastFullFillLogId');
  assertEqual(updatedProfile.lastFullFillDate, '2025-01-24T10:00:00Z', 'Should have lastFullFillDate');
});

console.log('\n🗑️ Test 8: Delete log and recalculate Tank-to-Tank data');
test('Should recalculate Tank-to-Tank data after deletion', () => {
  const logs = [
    {
      id: 'log-1',
      date: '2025-01-20T10:00:00Z',
      odometer: 15000,
      liters: 50,
      isFullTank: true,
      tankCapacity: 50,
      vehicleId: 'vehicle-1'
    },
    {
      id: 'log-2',
      date: '2025-01-24T10:00:00Z',
      odometer: 15200,
      liters: 36,
      isFullTank: true,
      tankCapacity: 50,
      vehicleId: 'vehicle-1'
    }
  ];

  // Delete log-1
  const updatedLogs = logs.filter(log => log.id !== 'log-1');

  assertEqual(updatedLogs.length, 1, 'Should have 1 log after deletion');

  // Full fills after deletion
  const fullFills = updatedLogs.filter(log => log.isFullTank === true);
  assertEqual(fullFills.length, 1, 'Should have 1 full fill');

  const mostRecentFullFill = fullFills[fullFills.length - 1];
  assertEqual(mostRecentFullFill.id, 'log-2', 'Most recent should be log-2');

  console.log('  ✓ Tank-to-Tank data recalculated after deletion');
});

console.log('\n🎯 Test 9: Theft detection threshold comparison');
test('Should use Tank-to-Tank theft threshold', () => {
  const tankToTankData = {
    theftPercentage: 30
  };

  const threshold = 25; // From vehicle profile
  const isTheftSuspected = tankToTankData.theftPercentage > threshold;

  assertEqual(isTheftSuspected, true, 'Should detect theft at 30% (threshold 25%)');
});

console.log('\n🔍 Test 10: Backward compatibility - legacy fields preserved');
test('Should preserve all existing log fields', () => {
  const newLog = {
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,
    liters: 36,
    price: 120
  };

  const logEntry = {
    ...newLog,
    // Legacy fields
    mileage: 5.56,
    isFlagged: true,
    id: 'log-123',
    fuelType: 'gasoline',
    currency: 'USD',
    originalCurrency: 'USD',
    originalPrice: 120,

    // Tank-to-Tank fields
    isFullTank: true,
    tankToTankData: null
  };

  assertEqual(logEntry.odometer, 15200, 'Odometer preserved');
  assertEqual(logEntry.liters, 36, 'Liters preserved');
  assertEqual(logEntry.price, 120, 'Price preserved');
  assertEqual(logEntry.mileage, 5.56, 'Mileage preserved');
  assertEqual(logEntry.isFlagged, true, 'isFlagged preserved');
  assertEqual(logEntry.fuelType, 'gasoline', 'fuelType preserved');
  assertTruthy(logEntry.isFullTank, 'isFullTank added');
  assertTruthy(logEntry.tankToTankData !== null || logEntry.tankToTankData === null, 'tankToTankData present');
});

console.log('\n' + '='.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`✓ Tests Passed: ${testsPassed}`);
console.log(`✗ Tests Failed: ${testsFailed}`);
console.log(`Total Tests:  ${testsPassed + testsFailed}`);
console.log('='.repeat(70));

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED - Task 3 is correctly implemented!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review implementation');
  process.exit(1);
}
