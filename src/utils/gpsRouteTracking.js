/**
 * GPS Route Tracking & Odometer Verification
 *
 * This module provides functions to:
 * - Track GPS routes and calculate actual distances
 * - Compare GPS distances with odometer readings
 * - Detect potential odometer tampering
 *
 * Dependencies:
 * - geolocation.js: For GPS position tracking and Haversine distance calculations
 */

import {
  getCurrentPosition,
  calculateHaversineDistance,
  watchPosition,
  clearWatch
} from './geolocation';

/**
 * Constants
 */
const DEFAULT_ODOMETER_TOLERANCE_PERCENTAGE = 10; // 10% tolerance for GPS vs odometer
const MIN_GPS_POINTS_FOR_VALID_ROUTE = 3; // Minimum GPS points for a valid route
const GPS_DISTANCE_ACCURACY_THRESHOLD = 100; // 100 meters accuracy threshold

/**
 * Calculate total GPS distance from an array of GPS coordinates
 * @param {Array<{lat: number, lng: number, timestamp: number, accuracy: number}>} route - Array of GPS coordinates
 * @returns {number} Total distance in kilometers
 *
 * Time Complexity: O(n) where n is number of GPS points
 * Space Complexity: O(1)
 *
 * @example
 * calculateGPSRouteDistance([
 *   { lat: 37.7749, lng: -122.4194, timestamp: 1234567890000 },
 *   { lat: 37.7759, lng: -122.4204, timestamp: 1234567895000 },
 *   { lat: 37.7769, lng: -122.4214, timestamp: 1234567900000 }
 * ])
 * // Returns: ~0.5 km
 */
export const calculateGPSRouteDistance = (route) => {
  if (!route || !Array.isArray(route) || route.length < 2) {
    return 0;
  }

  let totalDistance = 0;

  let lastValidPoint = null;

  for (let i = 0; i < route.length; i++) {
    const currentPoint = route[i];

    if (currentPoint && currentPoint.lat && currentPoint.lng) {
      if (lastValidPoint) {
        const segmentDistance = calculateHaversineDistance(
          lastValidPoint.lat,
          lastValidPoint.lng,
          currentPoint.lat,
          currentPoint.lng
        );
        totalDistance += segmentDistance;
      }
      lastValidPoint = currentPoint;
    }
  }

  return totalDistance;
};

/**
 * Calculate average GPS accuracy from a route
 * @param {Array<{lat: number, lng: number, accuracy: number}>} route - Array of GPS coordinates
 * @returns {number} Average accuracy in meters, or null if route is empty
 *
 * Time Complexity: O(n) where n is number of GPS points
 * Space Complexity: O(1)
 */
export const calculateGPSAccuracy = (route) => {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return null;
  }

  const pointsWithAccuracy = route.filter(point => point.accuracy !== undefined && point.accuracy !== null);

  if (pointsWithAccuracy.length === 0) {
    return null;
  }

  const totalAccuracy = pointsWithAccuracy.reduce((sum, point) => sum + point.accuracy, 0);
  return totalAccuracy / pointsWithAccuracy.length;
};

/**
 * Compare GPS distance with odometer distance
 * @param {number} gpsDistance - Distance calculated from GPS (km)
 * @param {number} odometerDistance - Distance from odometer (km)
 * @param {number} tolerancePercentage - Tolerance threshold (default: 10%)
 * @returns {Object} Comparison result
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * compareGPSvsOdometer(200, 180)
 * // Returns: {
 * //   gpsDistance: 200,
 * //   odometerDistance: 180,
 * //   difference: 20,
 * //   differencePercentage: 11.11,
 * //   isWithinTolerance: false,
 * //   discrepancy: 'gps-higher'
 * // }
 */
export const compareGPSvsOdometer = (gpsDistance, odometerDistance, tolerancePercentage = DEFAULT_ODOMETER_TOLERANCE_PERCENTAGE) => {
  if (gpsDistance === null || gpsDistance === undefined || odometerDistance === null || odometerDistance === undefined) {
    return {
      isValid: false,
      reason: 'missing-data',
      message: 'GPS or odometer distance is missing'
    };
  }

  if (gpsDistance < 0 || odometerDistance < 0) {
    return {
      isValid: false,
      reason: 'negative-distance',
      message: 'Distance values cannot be negative'
    };
  }

  const difference = gpsDistance - odometerDistance;
  
  let differencePercentage;
  let baseDiscrepancy;
  
  if (Math.abs(difference) < 0.1) {
    differencePercentage = 0;
    baseDiscrepancy = 'none';
  } else if (difference < 0) {
    differencePercentage = gpsDistance > 0 ? (Math.abs(difference) / gpsDistance) * 100 : Infinity;
    baseDiscrepancy = 'gps-higher';
  } else {
    differencePercentage = odometerDistance > 0 ? (Math.abs(difference) / odometerDistance) * 100 : Infinity;
    baseDiscrepancy = 'odometer-higher';
  }

  const isWithinTolerance = differencePercentage <= tolerancePercentage && differencePercentage !== Infinity;
  
  let discrepancy;
  if (baseDiscrepancy === 'none' || (baseDiscrepancy === 'gps-higher' && isWithinTolerance)) {
    discrepancy = 'none';
  } else {
    discrepancy = baseDiscrepancy;
  }

  return {
    isValid: true,
    gpsDistance: parseFloat(gpsDistance.toFixed(2)),
    odometerDistance: parseFloat(odometerDistance.toFixed(2)),
    difference: parseFloat(difference.toFixed(2)),
    differencePercentage: parseFloat(differencePercentage.toFixed(2)),
    isWithinTolerance,
    tolerancePercentage,
    discrepancy
  };
};

/**
 * Detect odometer tampering based on GPS vs odometer comparison
 * @param {number} gpsDistance - Distance calculated from GPS (km)
 * @param {number} odometerDistance - Distance from odometer (km)
 * @param {number} tolerancePercentage - Tolerance threshold (default: 10%)
 * @returns {Object} Tampering detection result
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 *
 * @example
 * detectOdometerTampering(180, 200, 10)
 * // Returns: {
 * //   isTampered: true,
 * //   severity: 'high',
 * //   confidence: 'high',
 * //   reason: 'Odometer shows 11.11% more distance than GPS',
 * //   gpsDistance: 180,
 * //   odometerDistance: 200,
 * //   difference: -20,
 * //   differencePercentage: 11.11
 * // }
 */
export const detectOdometerTampering = (gpsDistance, odometerDistance, tolerancePercentage = DEFAULT_ODOMETER_TOLERANCE_PERCENTAGE) => {
  const comparison = compareGPSvsOdometer(gpsDistance, odometerDistance, tolerancePercentage);

  if (!comparison.isValid) {
    return {
      isTampered: false,
      severity: 'none',
      confidence: 'none',
      reason: comparison.reason,
      comparison
    };
  }

  const {
    gpsDistance: gpsDist,
    odometerDistance: odometerDist,
    difference,
    differencePercentage,
    discrepancy
  } = comparison;

  if (discrepancy === 'none' || comparison.isWithinTolerance) {
    if (discrepancy === 'odometer-higher') {
      return {
        isTampered: false,
        severity: 'warning',
        confidence: 'medium',
        reason: 'Odometer shows slightly more distance than GPS (possible minor GPS signal issues)',
        comparison
      };
    }
    return {
      isTampered: false,
      severity: 'none',
      confidence: 'high',
      reason: 'GPS and odometer distances are within acceptable tolerance',
      comparison
    };
  }

  // Determine severity and confidence
  let severity = 'low';
  let confidence = 'medium';

  if (discrepancy === 'gps-higher') {
    // GPS shows MORE distance - odometer may have been rolled back (tampering)

    if (differencePercentage > 30) {
      severity = 'critical';
      confidence = 'high';
    } else if (differencePercentage > 15) {
      severity = 'high';
      confidence = 'high';
    } else {
      severity = 'medium';
      confidence = 'medium';
    }
  } else if (discrepancy === 'odometer-higher') {
    // Odometer shows MORE distance - GPS signal issues or vehicle transported

    if (differencePercentage > 30) {
      severity = 'warning'; // Warning, not tampering
      confidence = 'medium';
    } else {
      severity = 'low';
      confidence = 'low';
    }
  }

  const tamperingResult = {
    isTampered: discrepancy === 'gps-higher' && !comparison.isWithinTolerance,
    severity,
    confidence,
    reason: discrepancy === 'gps-higher'
      ? `Odometer shows ${differencePercentage.toFixed(1)}% less distance than GPS (possible odometer rollback)`
      : `Odometer shows ${differencePercentage.toFixed(1)}% more distance than GPS (possible GPS signal issues or vehicle transport)`,
    gpsDistance: gpsDist,
    odometerDistance: odometerDist,
    difference,
    differencePercentage,
    comparison
  };

  return tamperingResult;
};

/**
 * Validate GPS route quality
 * @param {Array<{lat: number, lng: number, timestamp: number, accuracy: number}>} route - Array of GPS coordinates
 * @returns {Object} Route quality assessment
 *
 * Time Complexity: O(n) where n is number of GPS points
 * Space Complexity: O(1)
 *
 * @example
 * validateGPSRouteQuality(gpsRoute)
 * // Returns: {
 * //   isValid: true,
 * //   quality: 'good',
 * //   pointCount: 150,
 * //   totalDistance: 25.5,
 * //   averageAccuracy: 12.3,
 * //   duration: 1800,
 * //   message: 'Route quality is good for odometer verification'
 * // }
 */
export const validateGPSRouteQuality = (route) => {
  if (!route || !Array.isArray(route) || route.length === 0) {
    return {
      isValid: false,
      quality: 'none',
      reason: 'no-gps-data',
      message: 'No GPS route data available'
    };
  }

  const pointCount = route.length;

  // Check minimum number of points
  if (pointCount < MIN_GPS_POINTS_FOR_VALID_ROUTE) {
    return {
      isValid: false,
      quality: 'insufficient',
      pointCount,
      reason: 'insufficient-points',
      message: `GPS route has only ${pointCount} point(s). Minimum ${MIN_GPS_POINTS_FOR_VALID_ROUTE} required.`
    };
  }

  // Calculate route metrics
  const totalDistance = calculateGPSRouteDistance(route);
  const averageAccuracy = calculateGPSAccuracy(route);

  // Check duration
  const firstTimestamp = route[0].timestamp;
  const lastTimestamp = route[route.length - 1].timestamp;
  const duration = lastTimestamp - firstTimestamp; // Duration in milliseconds

  // Determine quality
  let quality = 'poor';
  let message;

  if (averageAccuracy === null) {
    quality = 'unknown';
    message = 'GPS accuracy data not available';
  } else if (averageAccuracy > 200) {
    quality = 'poor';
    message = `GPS accuracy is poor (avg ${averageAccuracy.toFixed(0)}m). Odometer verification may not be reliable.`;
  } else if (averageAccuracy > 100) {
    quality = 'fair';
    message = `GPS accuracy is fair (avg ${averageAccuracy.toFixed(0)}m). Odometer verification is moderately reliable.`;
  } else if (averageAccuracy > 50) {
    quality = 'good';
    message = `GPS accuracy is good (avg ${averageAccuracy.toFixed(0)}m). Odometer verification is reliable.`;
  } else {
    quality = 'excellent';
    message = `GPS accuracy is excellent (avg ${averageAccuracy.toFixed(0)}m). Odometer verification is highly reliable.`;
  }

  return {
    isValid: true,
    quality,
    pointCount,
    totalDistance: parseFloat(totalDistance.toFixed(2)),
    averageAccuracy: averageAccuracy !== null ? parseFloat(averageAccuracy.toFixed(1)) : null,
    duration, // Duration in milliseconds
    durationMinutes: parseFloat((duration / (1000 * 60)).toFixed(1)),
    message
  };
};

/**
 * Start GPS route tracking
 * @param {Function} onPositionUpdate - Callback for position updates
 * @param {Function} onError - Callback for errors
 * @returns {number} Watch ID to stop tracking
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const startGPSTracking = (onPositionUpdate, onError) => {
  return watchPosition(
    (position) => {
      onPositionUpdate({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        timestamp: position.timestamp
      });
    },
    (error) => {
      onError(error);
    }
  );
};

/**
 * Stop GPS route tracking
 * @param {number} watchId - The watch ID returned by startGPSTracking
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const stopGPSTracking = (watchId) => {
  clearWatch(watchId);
};

/**
 * Get current GPS position for distance tracking
 * @param {boolean} highAccuracy - Use high accuracy mode (default: false)
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: number}>}
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const getCurrentGPSPosition = async (highAccuracy = false) => {
  try {
    const position = await getCurrentPosition({
      highAccuracy,
      timeout: 8000,
      maxAge: 60000
    });

    return {
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      timestamp: position.timestamp
    };
  } catch (error) {
    console.error('Failed to get GPS position:', error);
    throw error;
  }
};

/**
 * Calculate distance from last known GPS position
 * @param {Object} lastPosition - Last known GPS position {lat, lng, accuracy, timestamp}
 * @param {boolean} highAccuracy - Use high accuracy mode (default: false)
 * @returns {Promise<{distance: number, currentPosition: Object, timeDiff: number}>}
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const calculateDistanceFromLastGPS = async (lastPosition, highAccuracy = false) => {
  if (!lastPosition || !lastPosition.lat || !lastPosition.lng) {
    return null;
  }

  try {
    const currentPosition = await getCurrentGPSPosition(highAccuracy);
    const distance = calculateHaversineDistance(
      lastPosition.lat,
      lastPosition.lng,
      currentPosition.lat,
      currentPosition.lng
    );

    const timeDiff = currentPosition.timestamp - lastPosition.timestamp;

    return {
      distance: parseFloat(distance.toFixed(2)), // km
      currentPosition,
      timeDiff, // milliseconds
      timeDiffMinutes: parseFloat((timeDiff / (1000 * 60)).toFixed(1))
    };
  } catch (error) {
    console.error('Failed to calculate distance from last GPS:', error);
    return null;
  }
};

/**
 * Format GPS distance comparison for display
 * @param {Object} comparison - Result from compareGPSvsOdometer
 * @param {string} distanceUnit - Distance unit ('km' or 'mi')
 * @returns {Object} Formatted comparison data
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const formatGPSComparison = (comparison, distanceUnit = 'km') => {
  if (!comparison || !comparison.isValid) {
    return {
      isValid: false,
      message: 'Invalid comparison data'
    };
  }

  const {
    gpsDistance,
    odometerDistance,
    difference,
    differencePercentage,
    isWithinTolerance,
    discrepancy
  } = comparison;

  return {
    ...comparison,
    formatted: {
      gpsDistance: `${gpsDistance.toFixed(2)} ${distanceUnit}`,
      odometerDistance: `${odometerDistance.toFixed(2)} ${distanceUnit}`,
      difference: `${difference > 0 ? '+' : ''}${difference.toFixed(2)} ${distanceUnit}`,
      differencePercentage: `${difference > 0 ? '+' : ''}${differencePercentage.toFixed(1)}%`,
      isWithinTolerance: isWithinTolerance ? '✓ Within tolerance' : '⚠ Outside tolerance',
      discrepancy: discrepancy === 'none'
        ? 'No discrepancy'
        : discrepancy === 'gps-higher'
          ? 'GPS higher than odometer (possible odometer rollback)'
          : 'Odometer higher than GPS (GPS signal issue or vehicle transported)'
    }
  };
};

export default {
  calculateGPSRouteDistance,
  calculateGPSAccuracy,
  compareGPSvsOdometer,
  detectOdometerTampering,
  validateGPSRouteQuality,
  startGPSTracking,
  stopGPSTracking,
  getCurrentGPSPosition,
  calculateDistanceFromLastGPS,
  formatGPSComparison
};
