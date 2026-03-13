/**
 * Unit Tests for Tank-to-Tank Calculations Module
 *
 * This test suite validates all functions in tankToTankCalculations.js
 *
 * Test Framework: Node.js native (for simplicity)
 * Run with: node tests/tankToTankCalculations.test.js
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

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`  ✗ ${description}`);
    console.error(`    Error: ${error.message}`);
    testsFailed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n    Expected: ${JSON.stringify(expected)}\n    Actual: ${JSON.stringify(actual)}`);
  }
}

function assertApproxEqual(actual, expected, tolerance, message) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${message}\n    Expected: ${expected} (±${tolerance})\n    Actual: ${actual}\n    Diff: ${diff}`);
  }
}

function assertTruthy(value, message) {
  if (!value) {
    throw new Error(message + ' - Value is falsy');
  }
}

function assertFalsy(value, message) {
  if (value) {
    throw new Error(message + ' - Value is truthy');
  }
}

// ========================================
// TEST SUITE
// ========================================

console.log('='.repeat(70));
console.log('TANK-TO-TANK CALCULATIONS - UNIT TESTS');
console.log('='.repeat(70));

// ========================================
// estimateFuelLevelFromGauge() Tests
// ========================================
console.log('\n📊 estimateFuelLevelFromGauge()');
console.log('-'.repeat(70));

test('Full gauge returns 100%', () => {
  const result = estimateFuelLevelFromGauge('Full', 100);
  assertEqual(result.percentage, 100, 'Percentage should be 100');
  assertEqual(result.fuelLevel, 100, 'Fuel level should be 100L');
  assertEqual(result.estimated, true, 'Should be marked as estimated');
  assertEqual(result.source, 'gauge-reading', 'Source should be gauge-reading');
});

test('3/4 gauge returns 75%', () => {
  const result = estimateFuelLevelFromGauge('3/4', 50);
  assertEqual(result.percentage, 75, 'Percentage should be 75');
  assertEqual(result.fuelLevel, 37.5, 'Fuel level should be 37.5L');
});

test('1/2 gauge returns 50%', () => {
  const result = estimateFuelLevelFromGauge('1/2', 60);
  assertEqual(result.percentage, 50, 'Percentage should be 50');
  assertEqual(result.fuelLevel, 30, 'Fuel level should be 30L');
});

test('1/4 gauge returns 25%', () => {
  const result = estimateFuelLevelFromGauge('1/4', 100);
  assertEqual(result.percentage, 25, 'Percentage should be 25');
  assertEqual(result.fuelLevel, 25, 'Fuel level should be 25L');
});

test('Empty gauge returns 5% reserve', () => {
  const result = estimateFuelLevelFromGauge('Empty', 100);
  assertEqual(result.percentage, 5, 'Percentage should be 5 (reserve)');
  assertEqual(result.fuelLevel, 5, 'Fuel level should be 5L');
});

test('Invalid gauge returns default 50%', () => {
  const result = estimateFuelLevelFromGauge('Invalid', 100);
  assertEqual(result.percentage, 50, 'Invalid gauge defaults to 50%');
  assertEqual(result.fuelLevel, 50, 'Fuel level defaults to 50L');
});

// ========================================
// isFullTankFill() Tests
// ========================================
console.log('\n🚗 isFullTankFill()');
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

test('Fill amount 90%+ of capacity', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 48, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, 'Should be full tank');
  assertEqual(result.reason, 'fill-amount', 'Reason should be fill-amount');
});

test('Fill amount 80%+ (substantial)', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 40, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, 'Should be full tank');
  assertEqual(result.reason, 'substantial-fill', 'Reason should be substantial-fill');
  assertEqual(result.confidence, 'medium', 'Confidence should be medium');
});

test('Fill amount <80% (partial)', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 10, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, false, 'Should NOT be full tank');
  assertEqual(result.reason, 'partial-fill', 'Reason should be partial-fill');
});

test('Edge case: exactly 80% fill', () => {
  const result = isFullTankFill(
    { isFullTank: false, liters: 40, tankCapacity: 50 },
    { minimumFillPercentage: 80 }
  );
  assertEqual(result.isFullTank, true, '80% should qualify as full');
});

// ========================================
// findPreviousFullFill() Tests
// ========================================
console.log('\n🔍 findPreviousFullFill()');
console.log('-'.repeat(70));

const testLogs = [
  { id: 'log-4', date: '2025-01-24T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 15200 },
  { id: 'log-3', date: '2025-01-20T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: false, odometer: 15000 },
  { id: 'log-2', date: '2025-01-15T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 14800 },
  { id: 'log-1', date: '2025-01-10T10:00:00Z', vehicleId: 'vehicle-1', isFullTank: true, odometer: 14500 },
];

test('Find previous full tank (skips partial)', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2025-01-24T10:00:00Z');
  assertEqual(result.id, 'log-2', 'Should find log-2 (not log-3)');
  assertEqual(result.isFullTank, true, 'Result should be a full tank');
});

test('Find previous full tank from earliest', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2025-01-15T10:00:00Z');
  assertEqual(result.id, 'log-1', 'Should find log-1');
});

test('No previous full tank exists', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-1', '2025-01-10T10:00:00Z');
  assertEqual(result, null, 'Should return null');
});

test('Empty logs array', () => {
  const result = findPreviousFullFill([], 'vehicle-1', '2025-01-24T10:00:00Z');
  assertEqual(result, null, 'Should return null');
});

test('Wrong vehicle ID', () => {
  const result = findPreviousFullFill(testLogs, 'vehicle-2', '2025-01-24T10:00:00Z');
  assertEqual(result, null, 'Should return null for different vehicle');
});

// ========================================
// calculateTankToTankConsumption() Tests
// ========================================
console.log('\n🧮 calculateTankToTankConsumption()');
console.log('-'.repeat(70));

const previousFullFill = {
  id: 'log-1',
  date: '2025-01-20T10:00:00Z',
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

test('Normal consumption (no theft)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,
    liters: 13.33,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.distance, 200, 'Distance should be 200 km');
  assertApproxEqual(result.actualFuelConsumed, 13.33, 0.01, 'Actual fuel consumed');
  assertApproxEqual(result.expectedFuelConsumed, 13.33, 0.01, 'Expected fuel consumed');
  assertApproxEqual(result.theftAmount, 0, 0.01, 'Theft amount should be 0');
  assertEqual(result.isTheftSuspected, false, 'Should NOT suspect theft');
  assertApproxEqual(result.actualMileage, 15, 0.01, 'Actual mileage');
});

test('Theft scenario (from implementation plan)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2025-01-24T10:00:00Z',
    odometer: 15200,
    liters: 36,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, true, 'Should be valid');
  assertEqual(result.distance, 200, 'Distance should be 200 km');
  assertEqual(result.actualFuelConsumed, 36, 'Actual fuel consumed should be 36L');
  assertApproxEqual(result.expectedFuelConsumed, 13.33, 0.01, 'Expected fuel consumed');
  assertApproxEqual(result.theftAmount, 22.67, 0.01, 'Theft amount');
  assertApproxEqual(result.theftPercentage, 63, 1, 'Theft percentage');
  assertEqual(result.isTheftSuspected, true, 'Should suspect theft');
  assertEqual(result.remainingFuelBeforeFill, 64, 'Remaining fuel before fill');
  assertApproxEqual(result.actualMileage, 5.56, 0.01, 'Actual mileage');
});

test('First fill (no previous full tank)', () => {
  const result = calculateTankToTankConsumption(
    { id: 'log-1', odometer: 15000 },
    null,
    vehicleProfile
  );

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'no-previous-full-fill', 'Reason should be no-previous-full-fill');
});

test('Invalid odometer (decreased)', () => {
  const currentLog = {
    id: 'log-2',
    date: '2025-01-24T10:00:00Z',
    odometer: 14900,
    liters: 36,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-distance', 'Reason should be invalid-distance');
});

test('Missing vehicle profile', () => {
  const result = calculateTankToTankConsumption(
    { id: 'log-1', odometer: 15200 },
    previousFullFill,
    {}
  );

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-vehicle-profile', 'Reason should be invalid-vehicle-profile');
});

test('Zero fuel amount', () => {
  const currentLog = {
    id: 'log-2',
    odometer: 15200,
    liters: 0,
    tankCapacity: 100,
    isFullTank: true
  };

  const result = calculateTankToTankConsumption(currentLog, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'invalid-fuel-amount', 'Reason should be invalid-fuel-amount');
});

test('Missing current log', () => {
  const result = calculateTankToTankConsumption(null, previousFullFill, vehicleProfile);

  assertEqual(result.isValid, false, 'Should be invalid');
  assertEqual(result.reason, 'no-current-log', 'Reason should be no-current-log');
});

// ========================================
// calculateTankToTankStatistics() Tests
// ========================================
console.log('\n📈 calculateTankToTankStatistics()');
console.log('-'.repeat(70));

test('Calculate statistics from multiple trips', () => {
  const trips = [
    { isValid: true, distance: 200, actualFuelConsumed: 13.33, theftAmount: 0, isTheftSuspected: false },
    { isValid: true, distance: 150, actualFuelConsumed: 10, theftAmount: 2, isTheftSuspected: true },
    { isValid: false, reason: 'invalid' }
  ];

  const stats = calculateTankToTankStatistics(trips);

  assertEqual(stats.count, 2, 'Should count only valid trips');
  assertEqual(stats.avgDistance, 175, 'Average distance should be 175 km');
  assertApproxEqual(stats.avgFuelConsumed, 11.67, 0.01, 'Average fuel consumed');
  assertEqual(stats.totalTheftAmount, 2, 'Total theft amount');
  assertEqual(stats.theftIncidents, 1, 'Theft incidents');
  assertApproxEqual(stats.theftPercentage, 8.6, 0.1, 'Theft percentage');
});

test('Empty trips array', () => {
  const stats = calculateTankToTankStatistics([]);

  assertEqual(stats.count, 0, 'Count should be 0');
  assertEqual(stats.avgActualMileage, 0, 'Average mileage should be 0');
  assertEqual(stats.totalTheftAmount, 0, 'Total theft should be 0');
});

test('All invalid trips', () => {
  const trips = [
    { isValid: false, reason: 'invalid' },
    { isValid: false, reason: 'invalid' }
  ];

  const stats = calculateTankToTankStatistics(trips);

  assertEqual(stats.count, 0, 'Should count 0 valid trips');
});

test('Calculate average actual mileage', () => {
  const trips = [
    { isValid: true, actualFuelConsumed: 10, distance: 150, theftAmount: 0 },
    { isValid: true, actualFuelConsumed: 20, distance: 300, theftAmount: 5 }
  ];

  const stats = calculateTankToTankStatistics(trips);

  assertApproxEqual(stats.avgActualMileage, 15, 0.01, 'Average mileage should be 15');
});

// ========================================
// getTankToTankTheftSeverity() Tests
// ========================================
console.log('\n🚨 getTankToTankTheftSeverity()');
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

test('Custom thresholds', () => {
  // With custom thresholds: warning=20%, critical=40%
  // Theft percentage 25%:
  // - 25 < 40? Yes, so NOT critical
  // - 25 >= 20? Yes, so warning
  assertEqual(getTankToTankTheftSeverity(25, 20, 40), 'warning', '25% with 20/40 thresholds should be warning');
  // Theft percentage 35%:
  // - 35 >= 40? No, so NOT critical
  // - 35 >= 20? Yes, so warning
  assertEqual(getTankToTankTheftSeverity(35, 20, 40), 'warning', '35% with 20/40 thresholds should be warning');
  // Theft percentage 40%:
  // - 40 >= 40? Yes, so critical
  assertEqual(getTankToTankTheftSeverity(40, 20, 40), 'critical', '40% with 20/40 thresholds should be critical');
  // Default thresholds test
  // With default thresholds: warning=15%, critical=30%
  // Theft percentage 25%:
  // - 25 >= 30? No, so NOT critical
  // - 25 >= 15? Yes, so warning
  assertEqual(getTankToTankTheftSeverity(25, 15, 30), 'warning', '25% with 15/30 default thresholds should be warning');
  // Theft percentage 35%:
  // - 35 >= 30? Yes, so critical
  assertEqual(getTankToTankTheftSeverity(35, 15, 30), 'critical', '35% with 15/30 default thresholds should be critical');
});

// ========================================
// formatTankToTankData() Tests
// ========================================
console.log('\n✨ formatTankToTankData()');
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
  assertEqual(result.formatted.expectedMileage, '15.00 km/L', 'Expected mileage format');
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

  assertEqual(result.formatted.distance, '200 mi', 'Distance with mi unit');
  assertEqual(result.formatted.actualFuelConsumed, '36.0 gal', 'Fuel with gal unit');
  assertEqual(result.formatted.theftAmount, 'None', 'No theft shows None');
});

test('Format preserves original data', () => {
  const originalData = {
    isValid: true,
    distance: 100,
    actualFuelConsumed: 10,
    expectedFuelConsumed: 9,
    theftAmount: 1,
    actualMileage: 10,
    expectedMileage: 12,
    remainingFuelBeforeFill: 40,
    fillPercentage: 20,
    mileageEfficiency: 83.33,
    theftPercentage: 10
  };

  const result = formatTankToTankData(originalData);

  assertEqual(result.isValid, originalData.isValid, 'Original data preserved');
  assertEqual(result.distance, originalData.distance, 'Original distance preserved');
  assertTruthy(result.formatted, 'Formatted data created');
});

// ========================================
// calculateTheftCost() Tests
// ========================================
console.log('\n💰 calculateTheftCost()');
console.log('-'.repeat(70));

test('Calculate theft cost', () => {
  const cost = calculateTheftCost(22.67, 3.33);
  assertApproxEqual(cost, 75.4911, 0.0001, 'Theft cost');
});

test('Zero theft amount', () => {
  const cost = calculateTheftCost(0, 3.33);
  assertEqual(cost, 0, 'Zero theft should have zero cost');
});

test('Missing inputs', () => {
  const cost1 = calculateTheftCost(null, 3.33);
  const cost2 = calculateTheftCost(10, null);
  assertEqual(cost1, 0, 'Null theft amount should return 0');
  assertEqual(cost2, 0, 'Null price should return 0');
});

// ========================================
// validateTankCapacity() Tests
// ========================================
console.log('\n✅ validateTankCapacity()');
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

test('No fill amount', () => {
  const result = validateTankCapacity(100, 0, true);
  assertEqual(result.valid, true, 'Should be valid when no fill amount');
  assertEqual(result.message, 'No fill amount to validate.', 'Should indicate no fill amount');
});

// ========================================
// getEfficiencyColor() Tests
// ========================================
console.log('\n🎨 getEfficiencyColor()');
console.log('-'.repeat(70));

test('Green efficiency (90%+)', () => {
  assertEqual(getEfficiencyColor(95), '#22c55e', '95% should be green');
  assertEqual(getEfficiencyColor(90), '#22c55e', '90% should be green');
});

test('Orange efficiency (75-89%)', () => {
  assertEqual(getEfficiencyColor(80), '#f59e0b', '80% should be orange');
  assertEqual(getEfficiencyColor(85), '#f59e0b', '85% should be orange');
});

test('Red efficiency (50-74%)', () => {
  assertEqual(getEfficiencyColor(60), '#ef4444', '60% should be red');
  assertEqual(getEfficiencyColor(70), '#ef4444', '70% should be red');
});

test('Dark red efficiency (<50%)', () => {
  assertEqual(getEfficiencyColor(30), '#991b1b', '30% should be dark red');
  assertEqual(getEfficiencyColor(45), '#991b1b', '45% should be dark red');
});

// ========================================
// getFuelLevelColor() Tests
// ========================================
console.log('\n⛽ getFuelLevelColor()');
console.log('-'.repeat(70));

test('Green fuel level (70%+)', () => {
  assertEqual(getFuelLevelColor(75), '#22c55e', '75% should be green');
  assertEqual(getFuelLevelColor(100), '#22c55e', '100% should be green');
});

test('Orange fuel level (40-69%)', () => {
  assertEqual(getFuelLevelColor(50), '#f59e0b', '50% should be orange');
  assertEqual(getFuelLevelColor(65), '#f59e0b', '65% should be orange');
});

test('Red fuel level (20-39%)', () => {
  assertEqual(getFuelLevelColor(25), '#ef4444', '25% should be red');
  assertEqual(getFuelLevelColor(35), '#ef4444', '35% should be red');
});

test('Dark red fuel level (<20%)', () => {
  assertEqual(getFuelLevelColor(10), '#991b1b', '10% should be dark red');
  assertEqual(getFuelLevelColor(15), '#991b1b', '15% should be dark red');
});

// ========================================
// SUMMARY
// ========================================

console.log('\n' + '='.repeat(70));
console.log('TEST SUMMARY');
console.log('='.repeat(70));
console.log(`Total Tests: ${testsPassed + testsFailed}`);
console.log(`Passed: ${testsPassed} ✓`);
console.log(`Failed: ${testsFailed} ✗`);
console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (testsFailed === 0) {
  console.log('\n✅ ALL TESTS PASSED!\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED\n');
  process.exit(1);
}
