const WARNING_THRESHOLD_PERCENTAGE = 20;
const CRITICAL_THRESHOLD_PERCENTAGE = 10;

export const calculateFuelLevel = (fuelAmount, tankCapacity) => {
  if (!fuelAmount || !tankCapacity || tankCapacity <= 0) {
    return {
      percentage: 0,
      level: 'unknown',
      remainingLiters: 0,
      remainingPercentage: 0,
    };
  }

  const percentage = (fuelAmount / tankCapacity) * 100;

  let level;
  if (percentage >= 70) {
    level = 'high';
  } else if (percentage >= 40) {
    level = 'medium';
  } else if (percentage >= 20) {
    level = 'low';
  } else {
    level = 'critical';
  }

  return {
    percentage,
    level,
    remainingLiters: fuelAmount,
    remainingPercentage: percentage,
  };
};

export const checkFuelLevelAlert = (fuelAmount, tankCapacity) => {
  const fuelLevel = calculateFuelLevel(fuelAmount, tankCapacity);

  if (fuelLevel.percentage <= CRITICAL_THRESHOLD_PERCENTAGE) {
    return {
      triggered: true,
      severity: 'critical',
      threshold: CRITICAL_THRESHOLD_PERCENTAGE,
      currentLevel: fuelLevel.percentage,
      message: `Critical: Fuel level at ${fuelLevel.percentage.toFixed(1)}% (less than ${CRITICAL_THRESHOLD_PERCENTAGE}%)`,
      remainingLiters: fuelLevel.remainingLiters,
      remainingPercentage: fuelLevel.percentage,
    };
  }

  if (fuelLevel.percentage <= WARNING_THRESHOLD_PERCENTAGE) {
    return {
      triggered: true,
      severity: 'warning',
      threshold: WARNING_THRESHOLD_PERCENTAGE,
      currentLevel: fuelLevel.percentage,
      message: `Warning: Fuel level at ${fuelLevel.percentage.toFixed(1)}% (less than ${WARNING_THRESHOLD_PERCENTAGE}%)`,
      remainingLiters: fuelLevel.remainingLiters,
      remainingPercentage: fuelLevel.percentage,
    };
  }

  return {
    triggered: false,
    severity: 'none',
    threshold: null,
    currentLevel: fuelLevel.percentage,
    message: '',
    remainingLiters: fuelLevel.remainingLiters,
    remainingPercentage: fuelLevel.percentage,
  };
};

export const estimateRemainingDistance = (fuelAmount, averageMileage) => {
  if (!fuelAmount || !averageMileage || averageMileage <= 0) {
    return {
      distance: 0,
      message: 'Unable to estimate',
    };
  }

  const distance = fuelAmount * averageMileage;

  return {
    distance,
    message: `Estimated ${distance.toFixed(0)} km remaining`,
  };
};

export const getFuelLevelDisplay = (fuelLevel) => {
  const { percentage, level } = fuelLevel;

  const displays = {
    high: {
      emoji: '🟢',
      label: 'High',
      color: 'var(--accent-success)',
      bgColor: 'color-mix(in srgb, var(--accent-success) 15%, transparent)',
    },
    medium: {
      emoji: '🟡',
      label: 'Medium',
      color: 'var(--accent-blue)',
      bgColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',
    },
    low: {
      emoji: '🟠',
      label: 'Low',
      color: 'var(--accent-fuel)',
      bgColor: 'color-mix(in srgb, var(--accent-fuel) 15%, transparent)',
    },
    critical: {
      emoji: '🔴',
      label: 'Critical',
      color: 'var(--accent-alert)',
      bgColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
    },
    unknown: {
      emoji: '⚪',
      label: 'Unknown',
      color: 'var(--text-muted)',
      bgColor: 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
    },
  };

  return displays[level] || displays.unknown;
};

export const getFuelStatus = (fuelAmount, tankCapacity, averageMileage) => {
  const fuelLevel = calculateFuelLevel(fuelAmount, tankCapacity);
  const fuelAlert = checkFuelLevelAlert(fuelAmount, tankCapacity);
  const distanceEstimate = estimateRemainingDistance(fuelAmount, averageMileage);
  const displayInfo = getFuelLevelDisplay(fuelLevel);

  return {
    fuelLevel,
    fuelAlert,
    distanceEstimate,
    displayInfo,
    needsRefill: fuelAlert.triggered && fuelAlert.severity === 'critical',
  };
};

export default {
  calculateFuelLevel,
  checkFuelLevelAlert,
  estimateRemainingDistance,
  getFuelLevelDisplay,
  getFuelStatus,
};
