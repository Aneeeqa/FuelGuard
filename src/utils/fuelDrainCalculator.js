/**
 * Fuel Drain Rate Calculator
 *
 * Detects abnormal fuel consumption using two strategies:
 *
 * 1. Gauge-based (when fuelLevelBeforeFill is recorded):
 *    Compare expected remaining fuel (after last fill + driving) against
 *    the actual gauge reading before next fill to find parked drain.
 *
 * 2. Mileage-based (always available):
 *    Compare actual L/100km (or km/L) against the vehicle's expected mileage.
 *    Excess fuel consumed beyond expectation signals a drain or inefficiency.
 */

const DRAIN_THRESHOLD_LITERS_PER_DAY = 2; // Alert if parked drain > 2L/day
const EXCESS_CONSUMPTION_THRESHOLD = 1.30; // Flag if actual > 130% of expected
const HOURS_PER_DAY = 24;

// -----------------------------------------------------------------------
// Helper: safely parse a date from a Firestore Timestamp or ISO string
// -----------------------------------------------------------------------
const parseDate = (d) => {
  if (!d) return null;
  if (d?.toDate) return d.toDate();
  const ts = new Date(d);
  return isNaN(ts.getTime()) ? null : ts;
};

// -----------------------------------------------------------------------
// Strategy 1: Gauge-based parked drain detection
// -----------------------------------------------------------------------

/**
 * Calculate parked fuel drain between two entries using gauge readings.
 * Requires both entries to have fuelLevelBeforeFill (0-100 %).
 *
 * @param {Object} currentLog  - newer fill-up entry
 * @param {Object} previousLog - older fill-up entry
 * @param {number} capacity    - tank capacity in litres
 * @returns {Object|null} drain result, or null if gauge data is unavailable
 */
const calculateGaugeDrain = (currentLog, previousLog, capacity) => {
  const prevGauge = previousLog.fuelLevelBeforeFill;
  const currGauge = currentLog.fuelLevelBeforeFill;

  if (prevGauge == null || currGauge == null) return null;

  const currentDate = parseDate(currentLog.date);
  const previousDate = parseDate(previousLog.date);
  if (!currentDate || !previousDate) return null;

  const hoursBetween = (currentDate - previousDate) / (1000 * 60 * 60);
  const daysBetween = hoursBetween / HOURS_PER_DAY;
  if (hoursBetween < 1) return null;

  // Fuel in tank immediately after previous fill
  const litersAddedPrev = previousLog.liters || 0;
  const fuelBeforePrevFill = (prevGauge / 100) * capacity;
  const fuelAfterPrevFill = Math.min(capacity, fuelBeforePrevFill + litersAddedPrev);

  // Fuel in tank just before current fill
  const fuelBeforeCurrFill = (currGauge / 100) * capacity;

  // Total fuel consumed between fills
  const totalConsumed = fuelAfterPrevFill - fuelBeforeCurrFill;
  if (totalConsumed <= 0) {
    // Fuel appeared (possible data error or units issue)
    return { litersPerHour: 0, litersPerDay: 0, daysBetween, hoursBetween, estimatedDrain: 0, isAbnormal: false, driven: true, method: 'gauge', color: '#22c55e' };
  }

  // Expected driving consumption based on odometer change
  const odometerDiff = Math.max(0, (currentLog.odometer || 0) - (previousLog.odometer || 0));
  const driven = odometerDiff > 5;
  const expectedMileage = currentLog.expectedMileage || previousLog.expectedMileage || 15; // km/L
  const expectedConsumption = driven ? odometerDiff / expectedMileage : 0;

  // Parked drain = total consumed minus normal driving consumption
  const parkedDrain = Math.max(0, totalConsumed - expectedConsumption);
  const litersPerDay = daysBetween > 0 ? parkedDrain / daysBetween : 0;
  const litersPerHour = litersPerDay / HOURS_PER_DAY;
  const isAbnormal = litersPerDay > DRAIN_THRESHOLD_LITERS_PER_DAY;

  return {
    litersPerHour: parseFloat(litersPerHour.toFixed(4)),
    litersPerDay: parseFloat(litersPerDay.toFixed(3)),
    daysBetweenEntries: parseFloat(daysBetween.toFixed(2)),
    hoursBetweenEntries: parseFloat(hoursBetween.toFixed(2)),
    estimatedDrain: parseFloat(parkedDrain.toFixed(2)),
    isAbnormal,
    driven,
    method: 'gauge',
    color: isAbnormal ? '#ef4444' : '#22c55e',
  };
};

// -----------------------------------------------------------------------
// Strategy 2: Mileage-based excess consumption detection
// -----------------------------------------------------------------------

/**
 * Calculate excess fuel consumption for a single log entry vs expected mileage.
 * Works even when gauge readings are not available.
 *
 * @param {Object} currentLog  - log entry with mileage, liters, distance
 * @param {Object} previousLog - previous log entry (for date diff)
 * @param {number} expectedMileage - vehicle's expected km/L
 * @param {number} capacity    - tank capacity in litres
 * @returns {Object} drain result
 */
const calculateMileageDrain = (currentLog, previousLog, expectedMileage, capacity) => {
  const currentDate = parseDate(currentLog.date);
  const previousDate = parseDate(previousLog.date);
  if (!currentDate || !previousDate) {
    return { litersPerHour: 0, litersPerDay: 0, daysBetweenEntries: 0, hoursBetweenEntries: 0, estimatedDrain: 0, isAbnormal: false, driven: false, method: 'mileage', color: '#22c55e' };
  }

  const hoursBetween = (currentDate - previousDate) / (1000 * 60 * 60);
  const daysBetween = hoursBetween / HOURS_PER_DAY;

  const odometerDiff = Math.max(0, (currentLog.odometer || 0) - (previousLog.odometer || 0));
  const driven = odometerDiff > 10;
  const litersAdded = currentLog.liters || 0;

  if (!driven || litersAdded <= 0 || odometerDiff <= 0) {
    return {
      litersPerHour: 0,
      litersPerDay: 0,
      daysBetweenEntries: parseFloat(daysBetween.toFixed(2)),
      hoursBetweenEntries: parseFloat(hoursBetween.toFixed(2)),
      estimatedDrain: 0,
      isAbnormal: false,
      driven,
      method: 'mileage',
      color: '#22c55e',
    };
  }

  const effectiveMileage = odometerDiff / litersAdded; // km/L this interval
  const expectedFuel = odometerDiff / expectedMileage;

  // Excess fuel consumed beyond what the vehicle should have used
  const excessFuel = Math.max(0, litersAdded - expectedFuel);
  const isAbnormal = litersAdded > expectedFuel * EXCESS_CONSUMPTION_THRESHOLD;

  const litersPerDay = daysBetween > 0 ? excessFuel / daysBetween : 0;
  const litersPerHour = litersPerDay / HOURS_PER_DAY;

  return {
    litersPerHour: parseFloat(litersPerHour.toFixed(4)),
    litersPerDay: parseFloat(litersPerDay.toFixed(3)),
    daysBetweenEntries: parseFloat(daysBetween.toFixed(2)),
    hoursBetweenEntries: parseFloat(hoursBetween.toFixed(2)),
    estimatedDrain: parseFloat(excessFuel.toFixed(2)),
    effectiveMileage: parseFloat(effectiveMileage.toFixed(2)),
    isAbnormal,
    driven: true,
    method: 'mileage',
    color: isAbnormal ? '#f97316' : '#22c55e', // Orange for mileage-based (not red – parked drain)
  };
};

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

/**
 * Calculate fuel drain rate between two log entries.
 * Automatically selects gauge-based or mileage-based strategy.
 *
 * @param {Object} currentLog
 * @param {Object} previousLog
 * @param {number} capacity       - tank capacity in litres
 * @param {number} expectedMileage - vehicle's expected km/L (default 15)
 */
export const calculateFuelDrainRate = (currentLog, previousLog, capacity = 50, expectedMileage = 15) => {
  if (!currentLog || !previousLog) {
    return { litersPerHour: 0, litersPerDay: 0, daysBetweenEntries: 0, hoursBetweenEntries: 0, estimatedDrain: 0, isAbnormal: false, driven: false, color: '#22c55e' };
  }

  // Try gauge-based first (more accurate for parked-drain detection)
  const gaugeResult = calculateGaugeDrain(currentLog, previousLog, capacity);
  if (gaugeResult) return gaugeResult;

  // Fall back to mileage-based excess consumption
  return calculateMileageDrain(currentLog, previousLog, expectedMileage, capacity);
};

/**
 * Analyse all log entries for fuel drain and excess consumption.
 *
 * @param {Array}  logs           - array of fuel log entries (any order)
 * @param {number} capacity       - tank capacity in litres
 * @param {number} expectedMileage - vehicle's expected km/L
 */
export const analyzeFuelDrain = (logs, capacity = 50, expectedMileage = 15) => {
  if (!logs || logs.length < 2) {
    return { totalDrains: 0, abnormalDrains: 0, totalLostFuel: 0, drainEntries: [], hasAlert: false, latestDrain: null };
  }

  const sortedLogs = [...logs].sort((a, b) => {
    const da = parseDate(a.date);
    const db = parseDate(b.date);
    return (da || 0) - (db || 0);
  });

  const drainEntries = [];
  let totalLostFuel = 0;
  let abnormalDrains = 0;

  for (let i = 1; i < sortedLogs.length; i++) {
    const previousLog = sortedLogs[i - 1];
    const currentLog = sortedLogs[i];

    // Pass expectedMileage so mileage-based fallback has it
    const effMileage = currentLog.mileage > 0
      ? Math.max(expectedMileage, currentLog.mileage * 0.5) // don't penalise normal short trips
      : expectedMileage;

    const drainAnalysis = calculateFuelDrainRate(currentLog, previousLog, capacity, effMileage);

    drainEntries.push({
      entryIndex: i,
      previousDate: previousLog.date,
      currentDate: currentLog.date,
      ...drainAnalysis,
    });

    if (drainAnalysis.estimatedDrain > 0) {
      totalLostFuel += drainAnalysis.estimatedDrain;
    }
    if (drainAnalysis.isAbnormal) {
      abnormalDrains++;
    }
  }

  // Find the most recent abnormal drain for the alert; otherwise use latest
  const latestAbnormal = [...drainEntries].reverse().find(e => e.isAbnormal);
  const latestDrain = latestAbnormal || drainEntries[drainEntries.length - 1] || null;

  return {
    totalDrains: drainEntries.length,
    abnormalDrains,
    totalLostFuel: parseFloat(totalLostFuel.toFixed(2)),
    drainEntries,
    hasAlert: abnormalDrains > 0,
    latestDrain,
  };
};

export const generateDrainAlertMessage = (drainAnalysis) => {
  if (!drainAnalysis || !drainAnalysis.isAbnormal) return '';

  const { litersPerDay, daysBetweenEntries, method } = drainAnalysis;
  const period = `over ${daysBetweenEntries?.toFixed(1) || '?'} days`;

  if (method === 'gauge') {
    return `Abnormal parked drain: ${litersPerDay.toFixed(1)}L/day ${period}. Possible fuel leakage or theft.`;
  }
  return `Excess fuel consumption: ${litersPerDay.toFixed(1)}L/day above expected ${period}. Check tyre pressure, air filter, or driving conditions.`;
};

export const formatDrainRate = (drainAnalysis) => {
  if (!drainAnalysis) return 'N/A';

  const { litersPerDay, litersPerHour } = drainAnalysis;

  if (!litersPerDay || litersPerDay === 0) return 'Normal';

  return `${litersPerDay.toFixed(1)}L/day (${litersPerHour.toFixed(2)}L/hr)`;
};

export default {
  calculateFuelDrainRate,
  analyzeFuelDrain,
  generateDrainAlertMessage,
  formatDrainRate,
};
