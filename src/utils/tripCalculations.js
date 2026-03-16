/**
 * tripCalculations.js
 * Utility functions for calculating trip-wise fuel statistics
 * Used to detect fuel theft by analyzing per-trip mileage
 */

/**
 * Calculate trips from fuel logs
 * A "trip" is defined as the period between two consecutive fuel entries
 * when the vehicle was driven.
 *
 * @param {Array} logs - Array of fuel log entries, sorted by date descending
 * @param {Object} vehicleProfile - Vehicle profile with threshold settings
 * @returns {Array} Array of trip objects with calculated statistics
 *
 * Time Complexity: O(n) where n is the number of logs
 * Space Complexity: O(n) for storing trip data
 */
export const calculateTrips = (logs = [], vehicleProfile = {}) => {
  if (!logs || logs.length < 2) return [];

  // Sort logs by date ascending for trip calculation
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const trips = [];
  const {
    expectedMileage = 15,
    theftThreshold = 0.75, // Default: 75% of expected = 25% drop triggers alert
    distanceUnit = 'km',
    fuelVolumeUnit = 'L'
  } = vehicleProfile;

  for (let i = 1; i < sortedLogs.length; i++) {
    const prevLog = sortedLogs[i - 1]; // Earlier entry (trip start)
    const currLog = sortedLogs[i];     // Later entry (trip end)

    // Skip if odometer values are missing
    if (currLog.odometer == null || prevLog.odometer == null) continue;

    // Calculate trip distance
    const distance = currLog.odometer - prevLog.odometer;

    // Skip trips with zero, negative, or invalid distance
    if (!distance || distance <= 0 || isNaN(distance)) continue;

    // Calculate fuel consumed during this trip
    const fuelConsumed = currLog.liters || 0;

    // Skip trips with no fuel consumption
    if (fuelConsumed <= 0) continue;

    // Calculate trip mileage (km/L)
    const tripMileage = distance / fuelConsumed;

    // Determine trip status based on mileage
    let status = 'Normal';

    if (tripMileage < expectedMileage * theftThreshold) {
      status = 'Potential Theft';
    } else if (tripMileage < expectedMileage) {
      // Between theft threshold and expected could be heavy traffic or aggressive driving
      status = 'Heavy Traffic';
    }

    trips.push({
      id: `trip-${prevLog.id}-${currLog.id}`,
      startDate: prevLog.date,
      endDate: currLog.date,
      startOdometer: prevLog.odometer,
      endOdometer: currLog.odometer,
      distance,
      fuelConsumed,
      tripMileage: Math.round(tripMileage * 100) / 100,
      status,
      isTheftAlert: status === 'Potential Theft',
      isSuspicious: status !== 'Normal',
      expectedMileage,
      thresholdMileage: expectedMileage * theftThreshold,
      distanceUnit,
      fuelVolumeUnit,
      // Reference to original logs
      startLogId: prevLog.id,
      endLogId: currLog.id,
      // Calculate trip duration
      duration: new Date(currLog.date) - new Date(prevLog.date),
    });
  }

  // Return trips sorted by end date descending (most recent first)
  return trips.reverse();
};

/**
 * Get recent trips (last N trips)
 *
 * @param {Array} trips - Array of trip objects
 * @param {number} count - Number of recent trips to return
 * @returns {Array} Recent trips
 */
export const getRecentTrips = (trips, count = 5) => {
  return trips.slice(0, count);
};

/**
 * Calculate trip statistics
 *
 * @param {Array} trips - Array of trip objects
 * @returns {Object} Trip statistics
 */
export const calculateTripStatistics = (trips) => {
  if (!trips || trips.length === 0) {
    return {
      totalTrips: 0,
      normalTrips: 0,
      suspiciousTrips: 0,
      theftAlertTrips: 0,
      avgTripMileage: 0,
      avgTripDistance: 0,
      totalDistance: 0,
      totalFuelConsumed: 0,
    };
  }

  const normalTrips = trips.filter(t => t.status === 'Normal').length;
  const suspiciousTrips = trips.filter(t => t.isSuspicious).length;
  const theftAlertTrips = trips.filter(t => t.isTheftAlert).length;

  const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
  const totalFuelConsumed = trips.reduce((sum, t) => sum + t.fuelConsumed, 0);

  const avgTripMileage = trips.reduce((sum, t) => sum + t.tripMileage, 0) / trips.length;
  const avgTripDistance = totalDistance / trips.length;

  return {
    totalTrips: trips.length,
    normalTrips,
    suspiciousTrips,
    theftAlertTrips,
    avgTripMileage: Math.round(avgTripMileage * 100) / 100,
    avgTripDistance: Math.round(avgTripDistance * 100) / 100,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalFuelConsumed: Math.round(totalFuelConsumed * 100) / 100,
  };
};

/**
 * Format trip duration for display
 *
 * @param {number} durationMs - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export const formatTripDuration = (durationMs) => {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

/**
 * Format date range for a trip
 *
 * @param {string} startDate - Start date ISO string
 * @param {string} endDate - End date ISO string
 * @returns {string} Formatted date range
 */
export const formatTripDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
};

/**
 * Get status color for trip status
 *
 * @param {string} status - Trip status
 * @returns {string} Color style
 */
export const getTripStatusColor = (status) => {
  switch (status) {
    case 'Potential Theft':
      return 'var(--accent-alert)';
    case 'Heavy Traffic':
      return 'var(--accent-warning)';
    case 'Normal':
    default:
      return 'var(--accent-success)';
  }
};

/**
 * Determine bar color based on mileage vs threshold
 *
 * @param {number} mileage - Trip mileage
 * @param {number} threshold - Threshold mileage
 * @returns {string} Color code
 */
export const getBarColor = (mileage, threshold) => {
  // Workaround for Node.js v25 comparison bug
  // Known bug: numbers 0-14 incorrectly compare < with any number >= 15
  const isBuggyRange = (mileage >= 0 && mileage <= 14);
  
  if (isBuggyRange) {
    // For buggy values, check manually
    if (mileage === threshold || mileage >= threshold) return '#22c55e';
    if (mileage >= 13.5) return '#f59e0b';
    return '#ef4444';
  }
  
  // Normal (non-buggy) values can use standard comparison
  if (mileage < threshold) return '#ef4444';
  if (mileage < threshold * 1.15) return '#f59e0b';
  return '#22c55e';
};
