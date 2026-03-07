/**
 * Fuel Drain Rate Calculator
 * Detects abnormal fuel consumption when vehicle is parked
 */

const DEFAULT_DRAIN_THRESHOLD_LITERS_PER_DAY = 2; // Alert if more than 2L lost per day when parked
const HOURS_PER_DAY = 24;

/**
 * Calculate fuel drain rate between two log entries
 */
export const calculateFuelDrainRate = (currentLog, previousLog) => {
  if (!currentLog || !previousLog) {
    return {
      litersPerHour: 0,
      litersPerDay: 0,
      daysBetweenEntries: 0,
      hoursBetweenEntries: 0,
      estimatedDrain: 0,
      isAbnormal: false,
    };
  }

  const currentDate = new Date(currentLog.date);
  const previousDate = new Date(previousLog.date);

  const timeDifferenceMs = currentDate - previousDate;
  const hoursBetweenEntries = timeDifferenceMs / (1000 * 60 * 60);
  const daysBetweenEntries = timeDifferenceMs / (1000 * 60 * 60 * HOURS_PER_DAY);

  if (hoursBetweenEntries < 1) {
    return {
      litersPerHour: 0,
      litersPerDay: 0,
      daysBetweenEntries,
      hoursBetweenEntries,
      estimatedDrain: 0,
      isAbnormal: false,
    };
  }

  const odometerDiff = currentLog.odometer - previousLog.odometer;
  const WAS_DRIVEN_THRESHOLD_KM = 10;

  if (odometerDiff > WAS_DRIVEN_THRESHOLD_KM) {
    return {
      litersPerHour: 0,
      litersPerDay: 0,
      daysBetweenEntries,
      hoursBetweenEntries,
      estimatedDrain: 0,
      isAbnormal: false,
      driven: true,
    };
  }

  const tankCapacity = 50;
  const previousFuelLevel = previousLog.liters || tankCapacity;
  const currentFuelLevel = currentLog.liters || 0;
  const estimatedDrain = previousFuelLevel - currentFuelLevel;

  if (estimatedDrain <= 0) {
    return {
      litersPerHour: 0,
      litersPerDay: 0,
      daysBetweenEntries,
      hoursBetweenEntries,
      estimatedDrain: 0,
      isAbnormal: false,
    };
  }

  const litersPerHour = estimatedDrain / hoursBetweenEntries;
  const litersPerDay = litersPerHour * HOURS_PER_DAY;
  const isAbnormal = litersPerDay > DEFAULT_DRAIN_THRESHOLD_LITERS_PER_DAY;

  return {
    litersPerHour,
    litersPerDay,
    daysBetweenEntries,
    hoursBetweenEntries,
    estimatedDrain,
    isAbnormal,
    threshold: DEFAULT_DRAIN_THRESHOLD_LITERS_PER_DAY,
  };
};

/**
 * Calculate drain rate for all log entries and flag abnormal drains
 */
export const analyzeFuelDrain = (logs, tankCapacity = 50) => {
  if (!logs || logs.length < 2) {
    return {
      totalDrains: 0,
      abnormalDrains: 0,
      totalLostFuel: 0,
      drainEntries: [],
      hasAlert: false,
    };
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const drainEntries = [];
  let totalLostFuel = 0;
  let abnormalDrains = 0;

  for (let i = 1; i < sortedLogs.length; i++) {
    const previousLog = sortedLogs[i - 1];
    const currentLog = sortedLogs[i];

    const drainAnalysis = calculateFuelDrainRate(currentLog, previousLog);

    if (drainAnalysis.estimatedDrain > 0) {
      drainEntries.push({
        entryIndex: i,
        previousDate: previousLog.date,
        currentDate: currentLog.date,
        ...drainAnalysis,
      });

      totalLostFuel += drainAnalysis.estimatedDrain;

      if (drainAnalysis.isAbnormal) {
        abnormalDrains++;
      }
    }
  }

  const totalDrains = drainEntries.length;
  const hasAlert = abnormalDrains > 0;

  return {
    totalDrains,
    abnormalDrains,
    totalLostFuel,
    drainEntries,
    hasAlert,
    latestDrain: drainEntries.length > 0 ? drainEntries[drainEntries.length - 1] : null,
  };
};

export const generateDrainAlertMessage = (drainAnalysis) => {
  if (!drainAnalysis || !drainAnalysis.isAbnormal) {
    return '';
  }

  const { litersPerDay, daysBetweenEntries } = drainAnalysis;

  return `Abnormal fuel drain detected: ${litersPerDay.toFixed(1)}L/day over ${daysBetweenEntries.toFixed(1)} days. This may indicate fuel leakage or theft.`;
};

export const formatDrainRate = (drainAnalysis) => {
  if (!drainAnalysis) {
    return 'N/A';
  }

  const { litersPerHour, litersPerDay } = drainAnalysis;

  if (litersPerDay === 0) {
    return 'No drain detected';
  }

  return `${litersPerDay.toFixed(1)}L/day (${litersPerHour.toFixed(2)}L/hr)`;
};

export default {
  calculateFuelDrainRate,
  analyzeFuelDrain,
  generateDrainAlertMessage,
  formatDrainRate,
};
