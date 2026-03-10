/**
 * Tank-to-Tank Fuel Consumption Calculations
 *
 * This module implements "Tank-to-Tank" methodology for accurate
 * fuel consumption tracking and theft detection.
 *
 * Methodology:
 * - Full tank fill-ups establish baselines (100% known quantity)
 * - Subsequent fill-ups reveal exact fuel consumed
 * - Distance traveled provides expected consumption
 * - Difference indicates potential theft or inefficiency
 *
 * GPS Integration (Task 10):
 * - GPS route distance tracking for accurate distance measurement
 * - GPS vs odometer comparison for odometer tampering detection
 * - Enhanced theft detection with GPS-based verification
 */

/**
 * Constants
 */
const DEFAULT_THEFT_THRESHOLD_PERCENTAGE = 25; // 25% deviation = theft
const DEFAULT_MIN_FILL_PERCENTAGE = 80;       // 80%+ fill considered "full"

/**
 * Calculate fuel level from gauge reading
 * @param {string} gaugeReading - Gauge reading ('Full', '3/4', '1/2', '1/4', 'Empty')
 * @param {number} tankCapacity - Tank capacity in liters
 * @returns {Object} Fuel level data
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * estimateFuelLevelFromGauge('1/4', 100)
 * // Returns: { percentage: 25, fuelLevel: 25, estimated: true, source: 'gauge-reading' }
 */
export const estimateFuelLevelFromGauge = (gaugeReading, tankCapacity) => {
  const gaugePercentages = {
    'Full': 100,
    '3/4': 75,
    '1/2': 50,
    '1/4': 25,
    'Empty': 5 // 5% reserve (tank not actually empty)
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

/**
 * Check if a fill qualifies as "full tank"
 * @param {Object} logEntry - Log entry with fill data
 * @param {Object} vehicleProfile - Vehicle profile
 * @returns {Object} Qualification check result
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * isFullTankFill(
 *   { isFullTank: true, liters: 36, tankCapacity: 50 },
 *   { minimumFillPercentage: 80 }
 * )
 * // Returns: { isFullTank: true, reason: 'user-indicated', confidence: 'high' }
 */
export const isFullTankFill = (logEntry, vehicleProfile) => {
  const {
    isFullTank: userIndicatedFull,
    liters: fillAmount,
    tankCapacity
  } = logEntry;

  const minFillPercentage = vehicleProfile?.minimumFillPercentage || DEFAULT_MIN_FILL_PERCENTAGE;
  const minFillAmount = (tankCapacity * minFillPercentage) / 100;

  // User explicitly marked as full
  if (userIndicatedFull) {
    return {
      isFullTank: true,
      reason: 'user-indicated',
      confidence: 'high'
    };
  }

  // Check if fill amount indicates full tank (within 10% of capacity)
  if (fillAmount >= tankCapacity * 0.9) {
    return {
      isFullTank: true,
      reason: 'fill-amount',
      confidence: 'high'
    };
  }

  // Check if fill amount is significant (80%+)
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

/**
 * Find the most recent full tank fill before a given date
 * @param {Array} logs - All logs sorted by date descending
 * @param {string} vehicleId - Vehicle ID
 * @param {string} currentDate - Current log date
 * @returns {Object|null} Previous full tank log or null
 *
 * Time Complexity: O(n) where n is number of logs
 * Space Complexity: O(1)
 *
 * @example
 * findPreviousFullFill(logs, 'vehicle-1', 'YYYY-MM-DD')
 * // Returns: { id: 'log-1', date: 'YYYY-MM-DD', ... }
 */
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

  // Return most recent full fill (logs are sorted descending by date)
  return vehicleLogs[0];
};

/**
 * Calculate Tank-to-Tank fuel consumption
 * @param {Object} currentLog - Current log entry (fill event)
 * @param {Object} previousFullFillLog - Previous full tank log
 * @param {Object} vehicleProfile - Vehicle profile
 * @returns {Object} Tank-to-Tank analysis result
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * calculateTankToTankConsumption(
 *   { id: 'log-2', odometer: 15200, liters: 36, ... },
 *   { id: 'log-1', odometer: 15000, ... },
 *   { tankCapacity: 100, expectedMileage: 15, theftThreshold: 25 }
 * )
 * // Returns: {
 * //   isValid: true,
 * //   distance: 200,
 * //   actualFuelConsumed: 36,
 * //   expectedFuelConsumed: 13.33,
 * //   theftAmount: 22.67,
 * //   theftPercentage: 63,
 * //   isTheftSuspected: true,
 * //   ...
 * // }
 */
export const calculateTankToTankConsumption = (
  currentLog,
  previousFullFillLog,
  vehicleProfile
) => {
  // Validate inputs
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
      message: 'This is first full tank fill. Cannot calculate consumption yet.'
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

  // Validate vehicle profile fields
  if (!tankCapacity || !expectedMileage) {
    return {
      isValid: false,
      reason: 'invalid-vehicle-profile',
      message: 'Tank capacity or expected mileage is missing from vehicle profile.'
    };
  }

  // Calculate actual fuel consumed (this is fill amount for a full tank)
  const actualFuelConsumed = currentLog.liters;

  if (!actualFuelConsumed || actualFuelConsumed <= 0) {
    return {
      isValid: false,
      reason: 'invalid-fuel-amount',
      message: 'Fuel amount must be greater than zero.'
    };
  }

  // Calculate distance traveled
  const distance = currentLog.odometer - previousFullFillLog.odometer;

  if (distance <= 0) {
    return {
      isValid: false,
      reason: 'invalid-distance',
      message: 'Odometer reading is invalid or decreased. Please verify your data entry.'
    };
  }

  // Calculate expected fuel consumption based on distance
  const expectedFuelConsumed = distance / expectedMileage;

  // Calculate fuel remaining before fill
  const remainingFuelBeforeFill = Math.max(0, tankCapacity - actualFuelConsumed);

  // Calculate actual mileage
  const actualMileage = distance / actualFuelConsumed;

  // Calculate theft
  const fuelDifference = actualFuelConsumed - expectedFuelConsumed;
  const theftAmount = Math.max(0, fuelDifference);
  const theftPercentage = theftAmount > 0
    ? (theftAmount / actualFuelConsumed) * 100
    : 0;

  // Determine if theft is suspected
  const isTheftSuspected = theftPercentage > theftThreshold;

  // Calculate fill percentage
  const fillPercentage = (currentLog.liters / tankCapacity) * 100;

  // Calculate trip duration
  const startDate = new Date(previousFullFillLog.date);
  const endDate = new Date(currentLog.date);
  const duration = endDate - startDate;

  // ========================================
  // GPS Integration (Task 10)
  // ========================================
  // Calculate GPS distance if GPS data is available
  let gpsDistance = null;
  let gpsRouteQuality = null;
  let odometerTampering = null;

  if (currentLog.gpsDistance !== undefined && currentLog.gpsDistance !== null) {
    gpsDistance = currentLog.gpsDistance;

    // Validate GPS route quality if route data is available
    if (currentLog.gpsRoute && currentLog.gpsRoute.length > 0) {
      gpsRouteQuality = {
        hasGPSData: true,
        pointCount: currentLog.gpsRoute.length,
        isCompleteRoute: currentLog.gpsRoute.length >= 10, // At least 10 GPS points
        source: 'gps-tracking'
      };
    }

    // Detect odometer tampering by comparing GPS vs odometer distance
    const gpsTolerance = vehicleProfile?.odometerTolerancePercentage || 10;
    odometerTampering = {
      hasGPSData: true,
      gpsDistance: gpsDistance,
      odometerDistance: distance,
      difference: distance - gpsDistance,
      differencePercentage: gpsDistance > 0 ? ((distance - gpsDistance) / gpsDistance) * 100 : 0,
      isWithinTolerance: gpsDistance > 0 && Math.abs((distance - gpsDistance) / gpsDistance) <= (gpsTolerance / 100),
      tolerancePercentage: gpsTolerance,
      possibleTampering: gpsDistance > 0 && (distance - gpsDistance) / gpsDistance < -(gpsTolerance / 100),
      message: gpsDistance > 0
        ? `Odometer: ${distance.toFixed(2)} km vs GPS: ${gpsDistance.toFixed(2)} km`
        : 'No GPS distance data available'
    };
  } else {
    odometerTampering = {
      hasGPSData: false,
      message: 'GPS data not available for odometer verification'
    };
  }

  // ========================================
  // End GPS Integration
  // ========================================

  return {
    isValid: true,

    // Tank information
    tankCapacity,
    remainingFuelBeforeFill,
    fillPercentage,

    // Consumption data
    actualFuelConsumed,
    expectedFuelConsumed,
    fuelDifference,

    // Theft data
    theftAmount,
    theftPercentage,
    isTheftSuspected,

    // Mileage data
    distance,
    actualMileage,
    expectedMileage,
    mileageEfficiency: (actualMileage / expectedMileage) * 100,

    // ========================================
    // GPS Data (Task 10)
    // ========================================
    gpsDistance,
    gpsRouteQuality,
    odometerTampering,
    // If GPS data is available, use GPS distance for more accurate calculations
    primaryDistanceSource: gpsDistance && gpsDistance > 0 ? 'gps' : 'odometer',
    verifiedDistance: gpsDistance && gpsDistance > 0 ? gpsDistance : distance,
    // ========================================

    // Trip information
    startDate: previousFullFillLog.date,
    endDate: currentLog.date,
    startOdometer: previousFullFillLog.odometer,
    endOdometer: currentLog.odometer,
    duration,
    durationDays: Math.round(duration / (1000 * 60 * 60 * 24)),

    // References
    previousFullFillLogId: previousFullFillLog.id,
    currentLogId: currentLog.id,

    // Metadata
    calculatedAt: new Date().toISOString(),
    theftThreshold
  };
};

/**
 * Calculate average Tank-to-Tank mileage from multiple trips
 * @param {Array} tankToTankTrips - Array of tank-to-tank trip data
 * @returns {Object} Statistics
 *
 * Time Complexity: O(n) where n is number of trips
 * Space Complexity: O(1)
 *
 * @example
 * calculateTankToTankStatistics([
 *   { isValid: true, distance: 200, actualFuelConsumed: 13.33, theftAmount: 0 },
 *   { isValid: true, distance: 150, actualFuelConsumed: 10, theftAmount: 2 }
 * ])
 * // Returns: {
 * //   count: 2,
 * //   avgActualMileage: 14.67,
 * //   avgDistance: 175,
 * //   avgFuelConsumed: 11.67,
 * //   totalTheftAmount: 2,
 * //   theftIncidents: 1,
 * //   theftPercentage: 9.1
 * // }
 */
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

/**
 * Get theft severity level
 * @param {number} theftPercentage - Theft percentage
 * @param {number} warningThreshold - Warning threshold (default: 15%)
 * @param {number} criticalThreshold - Critical threshold (default: 30%)
 * @returns {string} Severity level ('normal', 'warning', 'critical')
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * getTankToTankTheftSeverity(35) // Returns: 'critical'
 * getTankToTankTheftSeverity(20) // Returns: 'warning'
 * getTankToTankTheftSeverity(10) // Returns: 'normal'
 */
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

/**
 * Format Tank-to-Tank data for display
 * @param {Object} tankToTankData - Tank-to-Tank calculation result
 * @param {Object} units - Unit system
 * @returns {Object} Formatted data
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * formatTankToTankData(tankToTankData, { distanceUnit: 'km', fuelVolumeUnit: 'L' })
 * // Returns: {
 * //   ...tankToTankData,
 * //   formatted: {
 * //     distance: '200 km',
 * //     actualFuelConsumed: '36.0 L',
 * //     expectedConsumption: '13.3 L',
 * //     theftAmount: '22.7 L',
 * //     actualMileage: '5.6 km/L',
 * //     remainingFuelBeforeFill: '64.0 L'
 * //   }
 * // }
 */
export const formatTankToTankData = (tankToTankData, units = {}) => {
  const {
    distanceUnit = 'km',
    fuelVolumeUnit = 'L'
  } = units;

  const formatted = {
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
  };

  // ========================================
  // GPS Data Formatting (Task 10)
  // ========================================
  if (tankToTankData.gpsDistance !== null && tankToTankData.gpsDistance !== undefined) {
    formatted.gpsDistance = `${tankToTankData.gpsDistance.toFixed(2)} ${distanceUnit}`;
    formatted.primaryDistanceSource = tankToTankData.primaryDistanceSource === 'gps'
      ? '✓ GPS Verified'
      : 'Odometer (No GPS data)';

    // Format odometer tampering data
    if (tankToTankData.odometerTampering && tankToTankData.odometerTampering.hasGPSData) {
      const { odometerDistance, gpsDistance, difference, differencePercentage, isWithinTolerance, possibleTampering } = tankToTankData.odometerTampering;

      formatted.odometerComparison = {
        odometerDistance: `${odometerDistance.toFixed(2)} ${distanceUnit}`,
        gpsDistance: `${gpsDistance.toFixed(2)} ${distanceUnit}`,
        difference: `${difference > 0 ? '+' : ''}${difference.toFixed(2)} ${distanceUnit}`,
        differencePercentage: `${difference > 0 ? '+' : ''}${differencePercentage.toFixed(1)}%`,
        status: isWithinTolerance
          ? '✓ Within tolerance'
          : possibleTampering
            ? '⚠ Possible odometer tampering'
            : '⚠ Outside tolerance',
        message: `Odometer: ${odometerDistance.toFixed(2)} km vs GPS: ${gpsDistance.toFixed(2)} km (${differencePercentage.toFixed(1)}%)`
      };
    }
  }
  // ========================================

  return {
    ...tankToTankData,
    formatted
  };
};

/**
 * Calculate fuel cost saved/lost due to theft
 * @param {number} theftAmount - Amount of fuel stolen in liters
 * @param {number} pricePerLiter - Price per liter
 * @returns {number} Cost of stolen fuel
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * calculateTheftCost(22.67, 3.33) // Returns: 75.4911
 */
export const calculateTheftCost = (theftAmount, pricePerLiter) => {
  if (!theftAmount || !pricePerLiter || theftAmount <= 0) {
    return 0;
  }
  return theftAmount * pricePerLiter;
};

/**
 * Validate tank capacity and update vehicle profile if needed
 * @param {number} currentTankCapacity - Current tank capacity setting
 * @param {number} fillAmount - Amount of fuel filled
 * @param {boolean} isUserIndicatedFull - User indicated tank is full
 * @returns {Object} Validation result with recommendation
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
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

  // If user indicates full tank but fill amount is significantly more than capacity
  if (isUserIndicatedFull && fillAmount > currentTankCapacity * 1.1) {
    return {
      valid: false,
      reason: 'capacity-too-small',
      message: `You filled ${fillAmount}L but tank capacity is set to ${currentTankCapacity}L. Consider updating tank capacity.`,
      suggestedCapacity: Math.ceil(fillAmount / 10) * 10 // Round up to nearest 10L
    };
  }

  // If user indicates full tank but fill amount is much less than capacity
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

/**
 * Get fuel efficiency color based on percentage of expected mileage
 * @param {number} efficiencyPercentage - Mileage efficiency percentage
 * @returns {string} CSS color code
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const getEfficiencyColor = (efficiencyPercentage) => {
  if (efficiencyPercentage >= 90) return '#22c55e'; // Green
  if (efficiencyPercentage >= 75) return '#f59e0b'; // Orange
  if (efficiencyPercentage >= 50) return '#ef4444'; // Red
  return '#991b1b'; // Dark red
};

/**
 * Get fuel level color based on percentage
 * @param {number} fuelLevelPercentage - Fuel level percentage (0-100)
 * @returns {string} CSS color code
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const getFuelLevelColor = (fuelLevelPercentage) => {
  if (fuelLevelPercentage >= 70) return '#22c55e'; // Green
  if (fuelLevelPercentage >= 40) return '#f59e0b'; // Orange
  if (fuelLevelPercentage >= 20) return '#ef4444'; // Red
  return '#991b1b'; // Dark red (critical)
};

// Export all functions as default for convenience
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
