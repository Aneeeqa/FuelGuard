/**
 * Verification script for Task 1: tankToTankCalculations.js
 *
 * This script tests all implemented functions to ensure they work correctly
 * according to the implementation plan specifications.
 */

import {
  estimateFuelLevelFromGauge,
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption,
  calculateTankToTankStatistics,
  getTankToTankTheftSeverity,
  formatTankToTankData,
  calculateTheftCost,
  validateTankCapacity,
  getEfficiencyColor,
  getFuelLevelColor
} from '../../src/utils/tankToTankCalculations.js';

console.log('='.repeat(70));
console.log('TASK 1 VERIFICATION: tankToTankCalculations.js');
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

console.log('\n📊 Testing estimateFuelLevelFromGauge()');
console.log('-'.repeat(70));

test('Estimate Full gauge (100%)', () => {
  const result = estimateFuelLevelFromGauge('Full', 100);
  assertEqual(result.percentage, 100, 'Percentage should be 100');
  assertEqual(result.fuelLevel, 100, 'Fuel level should be 100L');
  assertEqual(result.estimated, true, 'Should be estimated');
  assertEqual(result.source, 'gauge-reading', 'Source should be gauge-reading');
});

test('Estimate 3/4 gauge (75%)', () => {
  const result = estimateFuelLevelFromGauge('3/4', 50);
  assertEqual(result.percentage, 75, 'Percentage should be 75');
  assertEqual(result.fuelLevel, 37.5, 'Fuel level should be 37.5L');
});

test('Estimate 1/4 gauge (25%)', () => {
  const result = estimateFuelLevelFromGauge('1/4', 100);
  assertEqual(result.percentage, 25, 'Percentage should be 25');
  assertEqual(result.fuelLevel, 25, 'Fuel level should be 25L');
});

test('Estimate Empty gauge (5% reserve)', () => {
  const result = estimateFuelLevelFromGauge('Empty', 100);
  assertEqual(result.percentage, 5, 'Percentage should be 5 (reserve)');
  assertEqual(result.fuelLevel, 5, 'Fuel level should be 5L');
});

console.log('\n🚗 Testing isFullTankFill()');
console.log('-'.repeat(70));

test('User indicated full tank', () => {
  const result = isFullTankFill(
    { isFullTank: true, liters: 36, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, 'Should be full tank');
  assertEqual(result.reason, 'user-indicated', 'Reason should be user-indicated');
  assertEqual(result.confidence, 'high', 'Confidence should be high');
});

test('Fill amount near capacity (90%+)', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 48, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, 'Should be full tank');
  assertEqual(result.reason, 'fill-amount', 'Reason should be fill-amount');
});

test('Substantial fill (80%+)', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 40, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, 'Should be full tank');
  assertEqual(result.reason, 'substantial-fill', 'Reason should be substantial-fill');
  assertEqual(result.confidence, 'medium', 'Confidence should be medium');
});

test('Partial fill (<80%)', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 10, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, false, 'Should NOT be full tank');
  assertEqual(result.reason, 'partial-fill', 'Reason should be partial-fill');
});

console.log('\n🔍 Testing findPreviousFullFill()');
console.log('-'.repeat(70));

const testLogs = [
  { id: 'log-4', date: '2024-03-24T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 15200 },
  { id: 'log-3', date: '2024-03-20T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: false, odometer: 15000 },
  { id: 'log-2', date: '2024-03-15T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 14800 },
  { id: 'log-1', date: '2024-03-10T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 14500 },
];

test('Find previous full tank (should skip partial)', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2024-03-24T10:00:00Z');
  assertEqual(result.id, 'log-2', 'Should find log-2 (not log-3 which is partial)');
  assertEqual(result.isFullTank, true, 'Result should be a full tank');
});

test('Find previous full tank from earliest', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2024-03-15T10:00:00Z');
  assertEqual(result.id, 'log-1', 'Should find log-1');
});

test('No previous full tank exists', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2024-03-10T10:00:00Z');
  assertEqual(result, null, 'Should return null when no previous full tank');
});

console.log('\n🧮 Testing calculateTankToTankConsumption()');
console.log('-'.repeat(70));

const previousFullFill = {
  id: 'log-1',
  date: '2024-03-20T10:00:00Z',
  odometer: 15000,
  liters: 100,
  tankCapacity: 100,
  isFullTank: true
};

const vehicleProfile = {
  tankCapacity: 100,
  expectedMileage: 15,
  theftThreshold: 25
};

test('Calculate normal consumption (no theft)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2024-03-24T10:00:00Z',
    odometer: 15200, // 200 km driven
    liters: 13.33,   // Expected consumption (200 / 15)
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.distance, 200, 'Distance should be 200 km');
  assertApproxEqual(result.actualFuelConsumed, 13.33, 0.01, 'Actual fuel consumed');
  assertApproxEqual(result.expectedFuelConsumed, 13.33, 0.01, 'Expected fuel consumed');
  assertApproxEqual(result.theftAmount, 0, 0.01, 'Theft amount should be 0');
  assertEqual(result.isTheftSuspected, false, 'Should not suspect theft');
});

test('Calculate theft scenario (from implementation plan)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2024-03-24T10:00:00Z',
    odometer: 15200, // 200 km driven
    liters: 36,     // Actual fill (theft scenario)
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.distance, 200, 'Distance should be 200 km');
  assertEqual(result.actualFuelConsumed, 36, 'Actual fuel consumed should be 36L');
  assertApproxEqual(result.expectedFuelConsumed, 13.33, 0.01, 'Expected fuel consumed');
  assertApproxEqual(result.theftAmount, 22.67, 0.01, 'Theft amount should be ~22.67L');
  assertApproxEqual(result.theftPercentage, 63, 1, 'Theft percentage should be ~63%');
  assertEqual(result.isTheftSuspected, true, 'Should suspect theft');
  assertEqual(result.remainingFuelBeforeFill, 64, 'Remaining fuel before fill should be 64L');
  assertApproxEqual(result.actualMileage, 5.56, 0.01, 'Actual mileage should be ~5.56 km/L');
});

test('Handle first fill (no previous full tank)', () => {
  const result = calculateTankToTankConsumption(
    { id: 'log-1', odometer: 15000 },
    null,
    vehicleProfile
  );

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'no-previous-full-fill', 'Reason should be no-previous-full-fill');
});

test('Handle invalid odometer (decreased)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2024-03-24T10:00:00Z',
    odometer: 14900, // Decreased!
    liters: 36,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-distance', 'Reason should be invalid-distance');
});

test('Handle invalid vehicle profile', () => {
  const currentLog = {
    id: 'log-2',
    date: '2024-03-24T10:00:00Z',
    odometer: 15200,
    liters: 36,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, {});

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-vehicle-profile', 'Reason should be invalid-vehicle-profile');
});

console.log('\n📈 Testing calculateTankToTankStatistics()');
console.log('-'.repeat(70));

test('Calculate statistics from multiple trips', () => {
  const trips = [
    {
      isValid: true,
      distance: 200,
      actualFuelConsumed: 13.33,
      theftAmount: 0,
      isTheftSuspected: false
    },
    {
      isValid: true,
      distance: 150,
      actualFuelConsumed: 10,
      theftAmount: 2,
      isTheftSuspected: true
    },
    {
      isValid: false,
      reason: 'invalid'
    }
  ];

  const stats = calculateTankToTankStatistics(trips);

  assertEqual(stats.count, 2, 'Should count only valid trips');
  assertEqual(stats.avgDistance, 175, 'Average distance should be 175 km');
  assertApproxEqual(stats.avgFuelConsumed, 11.67, 0.01, 'Average fuel consumed');
  assertEqual(stats.totalTheftAmount, 2, 'Total theft amount should be 2L');
  assertEqual(stats.theftIncidents, 1, 'Theft incidents should be 1');
  assertApproxEqual(stats.theftPercentage, 8.6, 0.1, 'Theft percentage should be ~8.6%');
});

test('Handle empty trips array', () => {
  const stats = calculateTankToTankStatistics([]);

  assertEqual(stats.count, 0, 'Count should be 0');
  assertEqual(stats.avgActualMileage, 0, 'Average mileage should be 0');
  assertEqual(stats.totalTheftAmount, 0, 'Total theft should be 0');
});

test('Handle all invalid trips', () => {
  const trips = [
    { isValid: false, reason: 'invalid' },
    { isValid: false, reason: 'invalid' }
  ];

  const stats = calculateTankToTankStatistics(trips);

  assertEqual(stats.count, 0, 'Should count 0 valid trips');
});

console.log('\n🚨 Testing getTankToTankTheftSeverity()');
console.log('-'.repeat(70));

test('Critical severity (30%+)', () => {
  assertEqual(getTankToTankTheftSeverity(35), 'critical', '35% should be critical');
  assertEqual(getTankToTankTheftSeverity(30), 'critical', '30% should be critical');
});

test('Warning severity (15-29%)', () => {
  assertEqual(getTankToTankTheftSeverity(20), 'warning', '20% should be warning');
  assertEqual(getTankToTankTheftSeverity(15), 'warning', '15% should be warning');
});

test('Normal severity (<15%)', () => {
  assertEqual(getTankToTankTheftSeverity(10), 'normal', '10% should be normal');
  assertEqual(getTankToTankTheftSeverity(0), 'normal', '0% should be normal');
});

console.log('\n✨ Testing formatTankToTankData()');
console.log('-'.repeat(70));

test('Format with default units', () => {
  const tankToTankData = {
    distance: 200,
    actualFuelConsumed: 36,
    expectedFuelConsumed: 13.33,
    theftAmount: 22.67,
    actualMileage: 5.56,
    expectedMileage: 15,
    remainingFuelBeforeFill: 64,
    fillPercentage: 36,
    mileageEfficiency: 37,
    theftPercentage: 63
  };

  const result = formatTankToTankData(tankToTankData);

  assertEqual(result.formatted.distance, '200 km', 'Distance format');
  assertEqual(result.formatted.actualFuelConsumed, '36.0 L', 'Actual fuel format');
  assertEqual(result.formatted.expectedConsumption, '13.3 L', 'Expected fuel format');
  assertEqual(result.formatted.theftAmount, '22.7 L', 'Theft amount format');
  assertEqual(result.formatted.actualMileage, '5.56 km/L', 'Actual mileage format');
});

test('Format with custom units', () => {
  const tankToTankData = {
    distance: 200,
    actualFuelConsumed: 36,
    expectedFuelConsumed: 13.33,
    theftAmount: 0,
    actualMileage: 15,
    expectedMileage: 15,
    remainingFuelBeforeFill: 64,
    fillPercentage: 36,
    mileageEfficiency: 100,
    theftPercentage: 0
  };

  const result = formatTankToTankData(tankToTankData, {
    distanceUnit: 'mi',
    fuelVolumeUnit: 'gal'
  });

  assertEqual(result.formatted.theftAmount, 'None', 'No theft should show "None"');
});

console.log('\n💰 Testing calculateTheftCost()');
console.log('-'.repeat(70));

test('Calculate theft cost', () => {
  const cost = calculateTheftCost(22.67, 3.33);
  assertApproxEqual(cost, 75.4911, 0.0001, 'Theft cost calculation');
});

test('Handle zero theft', () => {
  const cost = calculateTheftCost(0, 3.33);
  assertEqual(cost, 0, 'Zero theft should have zero cost');
});

console.log('\n✅ Testing validateTankCapacity()');
console.log('-'.repeat(70));

test('Valid tank capacity', () => {
  const result = validateTankCapacity(100, 36, true);
  assertEqual(result.valid, true, 'Should be valid');
});

test('Invalid capacity (zero)', () => {
  const result = validateTankCapacity(0, 36, true);
  assertEqual(result.valid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-capacity', 'Reason should be invalid-capacity');
});

test('Capacity too small (fill > 110% of capacity)', () => {
  const result = validateTankCapacity(50, 60, true);
  assertEqual(result.valid, false, 'Should be invalid');
  assertEqual(result.reason, 'capacity-too-small', 'Reason should be capacity-too-small');
});

test('Partial fill marked as full', () => {
  const result = validateTankCapacity(100, 30, true);
  assertEqual(result.valid, true, 'Should be valid (warning only)');
  assertEqual(result.reason, 'partial-fill-marked-full', 'Should warn about partial fill');
});

console.log('\n🎨 Testing getEfficiencyColor()');
console.log('-'.repeat(70));

test('Efficiency color - Green (90%+)', () => {
  assertEqual(getEfficiencyColor(95), '#22c55e', '95% should be green');
  assertEqual(getEfficiencyColor(90), '#22c55e', '90% should be green');
});

test('Efficiency color - Orange (75-89%)', () => {
  assertEqual(getEfficiencyColor(80), '#f59e0b', '80% should be orange');
});

test('Efficiency color - Red (50-74%)', () => {
  assertEqual(getEfficiencyColor(60), '#ef4444', '60% should be red');
});

test('Efficiency color - Dark red (<50%)', () => {
  assertEqual(getEfficiencyColor(30), '#991b1b', '30% should be dark red');
});

console.log('\n⛽ Testing getFuelLevelColor()');
console.log('-'.repeat(70));

test('Fuel level color - Green (70%+)', () => {
  assertEqual(getFuelLevelColor(75), '#22c55e', '75% should be green');
});

test('Fuel level color - Orange (40-69%)', () => {
  assertEqual(getFuelLevelColor(50), '#f59e0b', '50% should be orange');
});

test('Fuel level color - Red (20-39%)', () => {
  assertEqual(getFuelLevelColor(25), '#ef4444', '25% should be red');
});

test('Fuel level color - Dark red (<20%)', () => {
  assertEqual(getFuelLevelColor(10), '#991b1b', '10% should be dark red');
});

console.log('\n' + '='.repeat(70));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(70));
console.log(`✓ Tests Passed: ${testsPassed}`);
console.log(`✗ Tests Failed: ${testsFailed}`);
console.log(`Total Tests:  ${testsPassed + testsFailed}`);
console.log('='.repeat(70));

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED - Task 1 is correctly implemented!');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED - Please review implementation');
  process.exit(1);
}
