const DEFAULT_THEFT_THRESHOLD_PERCENTAGE = 25;
const DEFAULT_MIN_FILL_PERCENTAGE = 80;

export const estimateFuelLevelFromGauge = (gaugeReading, tankCapacity) => {
  const gaugePercentages = {
    'Full': 100,
    '3/4': 75,
    '1/2': 50,
    '1/4': 25,
    'Empty': 5
  };

  const percentage = gaugePercentages[gaugeReading] || 50;
  const fuelLevel = (tankCapacity * percentage) / 100;

  return {
    percentage,
    fuelLevel,
    estimated: true,
    source: 'gauge-reading'
  };
};

export const isFullTankFill = (logEntry, vehicleProfile) => {
  const {
    isFullTank: userIndicatedFull,
    liters: fillAmount,
    tankCapacity
  } = logEntry;

  const minFillPercentage = vehicleProfile?.minimumFillPercentage || DEFAULT_MIN_FILL_PERCENTAGE;
  const minFillAmount = (tankCapacity * minFillPercentage) / 100;

  if (userIndicatedFull) {
    return {
      isFullTank: true,
      reason: 'user-indicated',
      confidence: 'high'
    };
  }

  if (fillAmount >= tankCapacity * 0.9) {
    return {
      isFullTank: true,
      reason: 'fill-amount',
      confidence: 'high'
    };
  }

  if (fillAmount >= minFillAmount) {
    return {
      isFullTank: true,
      reason: 'substantial-fill',
      confidence: 'medium'
    };
  }

  return {
    isFullTank: false,
    reason: 'partial-fill',
    confidence: 'high'
  };
};

export const findPreviousFullFill = (logs, vehicleId, currentDate) => {
  if (!logs || logs.length === 0) {
    return null;
  }

  const currentLogDate = new Date(currentDate);

  const vehicleLogs = logs.filter(log =>
    (log.vehicleId === vehicleId || (!log.vehicleId && logs.length === 1)) &&
    (log.isFullTank === true) &&
    (new Date(log.date) < currentLogDate)
  );

  if (vehicleLogs.length === 0) {
    return null;
  }

  return vehicleLogs[0];
};

export const calculateTankToTankConsumption = (
  currentLog,
  previousFullFillLog,
  vehicleProfile
) => {
  if (!currentLog) {
    return {
      isValid: false,
      reason: 'no-current-log',
      message: 'Current log entry is missing.'
    };
  }

  if (!previousFullFillLog) {
    return {
      isValid: false,
      reason: 'no-previous-full-fill',
      message: 'This is the first full tank fill. Cannot calculate consumption yet.'
    };
  }

  if (!vehicleProfile) {
    return {
      isValid: false,
      reason: 'no-vehicle-profile',
      message: 'Vehicle profile is missing.'
    };
  }

  const {
    tankCapacity,
    expectedMileage,
    theftThreshold = DEFAULT_THEFT_THRESHOLD_PERCENTAGE
  } = vehicleProfile;

  if (!tankCapacity || !expectedMileage) {
    return {
      isValid: false,
      reason: 'invalid-vehicle-profile',
      message: 'Tank capacity or expected mileage is missing from vehicle profile.'
    };
  }

  const actualFuelConsumed = currentLog.liters;

  if (!actualFuelConsumed || actualFuelConsumed <= 0) {
    return {
      isValid: false,
      reason: 'invalid-fuel-amount',
      message: 'Fuel amount must be greater than zero.'
    };
  }

  const distance = currentLog.odometer - previousFullFillLog.odometer;

  if (distance <= 0) {
    return {
      isValid: false,
      reason: 'invalid-distance',
      message: 'Odometer reading is invalid or decreased. Please verify your data entry.'
    };
  }

  const expectedFuelConsumed = distance / expectedMileage;
  const remainingFuelBeforeFill = Math.max(0, tankCapacity - actualFuelConsumed);
  const actualMileage = distance / actualFuelConsumed;

  const fuelDifference = actualFuelConsumed - expectedFuelConsumed;
  const theftAmount = Math.max(0, fuelDifference);
  const theftPercentage = theftAmount > 0
    ? (theftAmount / actualFuelConsumed) * 100
    : 0;

  const isTheftSuspected = theftPercentage > theftThreshold;
  const fillPercentage = (currentLog.liters / tankCapacity) * 100;

  const startDate = new Date(previousFullFillLog.date);
  const endDate = new Date(currentLog.date);
  const duration = endDate - startDate;

  return {
    isValid: true,
    tankCapacity,
    remainingFuelBeforeFill,
    fillPercentage,
    actualFuelConsumed,
    expectedFuelConsumed,
    fuelDifference,
    theftAmount,
    theftPercentage,
    isTheftSuspected,
    distance,
    actualMileage,
    expectedMileage,
    mileageEfficiency: (actualMileage / expectedMileage) * 100,
    startDate: previousFullFillLog.date,
    endDate: currentLog.date,
    startOdometer: previousFullFillLog.odometer,
    endOdometer: currentLog.odometer,
    duration,
    durationDays: Math.round(duration / (1000 * 60 * 60 * 24)),
    previousFullFillLogId: previousFullFillLog.id,
    currentLogId: currentLog.id,
    calculatedAt: new Date().toISOString(),
    theftThreshold
  };
};

export const calculateTankToTankStatistics = (tankToTankTrips) => {
  if (!tankToTankTrips || tankToTankTrips.length === 0) {
    return {
      count: 0,
      avgActualMileage: 0,
      avgDistance: 0,
      avgFuelConsumed: 0,
      totalTheftAmount: 0,
      theftIncidents: 0,
      theftPercentage: 0
    };
  }

  const validTrips = tankToTankTrips.filter(t => t.isValid);

  if (validTrips.length === 0) {
    return {
      count: 0,
      avgActualMileage: 0,
      avgDistance: 0,
      avgFuelConsumed: 0,
      totalTheftAmount: 0,
      theftIncidents: 0,
      theftPercentage: 0
    };
  }

  const totalDistance = validTrips.reduce((sum, t) => sum + t.distance, 0);
  const totalFuelConsumed = validTrips.reduce((sum, t) => sum + t.actualFuelConsumed, 0);
  const totalTheftAmount = validTrips.reduce((sum, t) => sum + t.theftAmount, 0);
  const theftIncidents = validTrips.filter(t => t.isTheftSuspected).length;

  const avgActualMileage = totalFuelConsumed > 0
    ? totalDistance / totalFuelConsumed
    : 0;

  const avgDistance = validTrips.length > 0
    ? totalDistance / validTrips.length
    : 0;

  const avgFuelConsumed = validTrips.length > 0
    ? totalFuelConsumed / validTrips.length
    : 0;

  const theftPercentage = totalFuelConsumed > 0
    ? (totalTheftAmount / totalFuelConsumed) * 100
    : 0;

  return {
    count: validTrips.length,
    avgActualMileage: Math.round(avgActualMileage * 100) / 100,
    avgDistance: Math.round(avgDistance),
    avgFuelConsumed: Math.round(avgFuelConsumed * 100) / 100,
    totalTheftAmount: Math.round(totalTheftAmount * 100) / 100,
    theftIncidents,
    theftPercentage: Math.round(theftPercentage * 10) / 10
  };
};

export const getTankToTankTheftSeverity = (
  theftPercentage,
  warningThreshold = 15,
  criticalThreshold = 30
) => {
  if (theftPercentage >= criticalThreshold) {
    return 'critical';
  }
  if (theftPercentage >= warningThreshold) {
    return 'warning';
  }
  return 'normal';
};

export const formatTankToTankData = (tankToTankData, units = {}) => {
  const {
    distanceUnit = 'km',
    fuelVolumeUnit = 'L'
  } = units;

  return {
    ...tankToTankData,
    formatted: {
      distance: `${Math.round(tankToTankData.distance)} ${distanceUnit}`,
      actualFuelConsumed: `${tankToTankData.actualFuelConsumed.toFixed(1)} ${fuelVolumeUnit}`,
      expectedConsumption: `${tankToTankData.expectedFuelConsumed.toFixed(1)} ${fuelVolumeUnit}`,
      theftAmount: tankToTankData.theftAmount > 0
        ? `${tankToTankData.theftAmount.toFixed(1)} ${fuelVolumeUnit}`
        : 'None',
      actualMileage: `${tankToTankData.actualMileage.toFixed(2)} ${distanceUnit}/${fuelVolumeUnit}`,
      expectedMileage: `${tankToTankData.expectedMileage.toFixed(2)} ${distanceUnit}/${fuelVolumeUnit}`,
      remainingFuelBeforeFill: `${tankToTankData.remainingFuelBeforeFill.toFixed(1)} ${fuelVolumeUnit}`,
      fillPercentage: `${tankToTankData.fillPercentage.toFixed(0)}%`,
      mileageEfficiency: `${tankToTankData.mileageEfficiency.toFixed(0)}%`,
      theftPercentage: `${tankToTankData.theftPercentage.toFixed(0)}%`
    }
  };
};

export const calculateTheftCost = (theftAmount, pricePerLiter) => {
  if (!theftAmount || !pricePerLiter || theftAmount <= 0) {
    return 0;
  }
  return theftAmount * pricePerLiter;
};

export const validateTankCapacity = (currentTankCapacity, fillAmount, isUserIndicatedFull) => {
  if (!currentTankCapacity || currentTankCapacity <= 0) {
    return {
      valid: false,
      reason: 'invalid-capacity',
      message: 'Tank capacity must be greater than zero.',
      suggestedCapacity: fillAmount || 50
    };
  }

  if (!fillAmount || fillAmount <= 0) {
    return {
      valid: true,
      message: 'No fill amount to validate.'
    };
  }

  if (isUserIndicatedFull && fillAmount > currentTankCapacity * 1.1) {
    return {
      valid: false,
      reason: 'capacity-too-small',
      message: `You filled ${fillAmount}L but tank capacity is set to ${currentTankCapacity}L. Consider updating tank capacity.`,
      suggestedCapacity: Math.ceil(fillAmount / 10) * 10
    };
  }

  if (isUserIndicatedFull && fillAmount < currentTankCapacity * 0.7) {
    return {
      valid: true,
      reason: 'partial-fill-marked-full',
      message: `You indicated full tank but only filled ${fillAmount}L out of ${currentTankCapacity}L capacity.`,
      suggestion: 'This may have been a partial fill. Consider unchecking "Filled to full".'
    };
  }

  return {
    valid: true,
    message: 'Tank capacity appears valid.'
  };
};

export const getEfficiencyColor = (efficiencyPercentage) => {
  if (efficiencyPercentage >= 90) return '#22c55e';
  if (efficiencyPercentage >= 75) return '#f59e0b';
  if (efficiencyPercentage >= 50) return '#ef4444';
  return '#991b1b';
};

export const getFuelLevelColor = (fuelLevelPercentage) => {
  if (fuelLevelPercentage >= 70) return '#22c55e';
  if (fuelLevelPercentage >= 40) return '#f59e0b';
  if (fuelLevelPercentage >= 20) return '#ef4444';
  return '#991b1b';
};

export default {
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
};
