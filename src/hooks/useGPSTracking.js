/**
 * useGPSTracking Hook
 *
 * React hook for GPS route tracking and odometer verification
 * Provides easy access to GPS functionality in components
 */

import { useContext, useCallback, useState, useRef, useEffect } from 'react';
import { FuelContext } from '../context/FuelContext';
import {
  calculateGPSRouteDistance,
  getCurrentGPSPosition,
  compareGPSvsOdometer,
  detectOdometerTampering,
  validateGPSRouteQuality
} from '../utils/gpsRouteTracking';

/**
 * Hook for GPS route tracking
 * @returns {Object} GPS tracking functions and state
 */
export const useGPSTracking = () => {
  const { data, startGPSRouteTracking, stopGPSRouteTracking, getCurrentPositionGPS, calculateDistanceFromGPS } = useContext(FuelContext);

  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState(null);
  const [gpsDistance, setGpsDistance] = useState(0);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    try {
      setError(null);
      const id = startGPSRouteTracking();
      setWatchId(id);
      setIsTracking(true);
    } catch (err) {
      setError(err.message || 'Failed to start GPS tracking');
      console.error('Failed to start GPS tracking:', err);
    }
  }, [startGPSRouteTracking]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    if (watchId) {
      stopGPSRouteTracking(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  }, [watchId, stopGPSRouteTracking]);

  // Get current GPS position
  const getCurrentPosition = useCallback(async (highAccuracy = false) => {
    try {
      setError(null);
      return await getCurrentPositionGPS(highAccuracy);
    } catch (err) {
      setError(err.message || 'Failed to get GPS position');
      console.error('Failed to get GPS position:', err);
      throw err;
    }
  }, [getCurrentPositionGPS]);

  // Calculate distance from last GPS position
  const getDistanceFromLastPosition = useCallback(async (highAccuracy = false) => {
    try {
      setError(null);
      const result = await calculateDistanceFromGPS(highAccuracy);
      if (result && result.distance !== undefined) {
        setGpsDistance(result.distance);
      }
      return result;
    } catch (err) {
      setError(err.message || 'Failed to calculate distance from GPS');
      console.error('Failed to calculate distance from GPS:', err);
      return null;
    }
  }, [calculateDistanceFromGPS]);

  // Calculate GPS distance from a route
  const calculateRouteDistance = useCallback((route) => {
    if (!route || !Array.isArray(route)) {
      return 0;
    }
    const distance = calculateGPSRouteDistance(route);
    setGpsDistance(distance);
    return distance;
  }, []);

  // Compare GPS vs odometer distance
  const compareDistances = useCallback((gpsDist, odometerDist, tolerance) => {
    return compareGPSvsOdometer(gpsDist, odometerDist, tolerance);
  }, []);

  // Detect odometer tampering
  const detectTampering = useCallback((gpsDist, odometerDist, tolerance) => {
    return detectOdometerTampering(gpsDist, odometerDist, tolerance);
  }, []);

  // Validate GPS route quality
  const validateRoute = useCallback((route) => {
    return validateGPSRouteQuality(route);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId && isTracking) {
        stopGPSRouteTracking(watchId);
      }
    };
  }, [watchId, isTracking, stopGPSRouteTracking]);

  // Get active GPS route
  const activeRoute = data.vehicleProfile?.gpsRoutes?.find(r => r.isTracking);

  // Get total distance from active route
  const activeRouteDistance = activeRoute ? calculateGPSRouteDistance(activeRoute.points || []) : 0;

  return {
    // State
    isTracking,
    error,
    gpsDistance,
    activeRoute,
    activeRouteDistance,
    gpsRoutes: data.vehicleProfile?.gpsRoutes || [],
    lastKnownLocation: data.vehicleProfile?.lastKnownLocation || data.lastLocation,

    // Actions
    startTracking,
    stopTracking,
    getCurrentPosition,
    getDistanceFromLastPosition,
    calculateRouteDistance,
    compareDistances,
    detectTampering,
    validateRoute,

    // Vehicle settings
    enableGpsTracking: data.vehicleProfile?.enableGpsTracking || false,
    odometerTolerancePercentage: data.vehicleProfile?.odometerTolerancePercentage || 10,
    enableOdometerVerification: data.vehicleProfile?.enableOdometerVerification || false,
  };
};

/**
 * Hook for GPS odometer verification
 * @returns {Object} Odometer verification functions and state
 */
export const useGPSOdometerVerification = () => {
  const { data } = useContext(FuelContext);

  const verifyOdometer = useCallback((gpsDistance, odometerDistance, tolerance = 10) => {
    const comparison = compareGPSvsOdometer(gpsDistance, odometerDistance, tolerance);

    if (!comparison.isValid) {
      return {
        verified: false,
        reason: comparison.reason,
        message: comparison.message
      };
    }

    const tamperingDetection = detectOdometerTampering(gpsDistance, odometerDistance, tolerance);

    return {
      verified: comparison.isWithinTolerance,
      comparison,
      tamperingDetection,
      message: comparison.isWithinTolerance
        ? 'Odometer is within acceptable GPS tolerance'
        : tamperingDetection.isTampered
          ? 'Possible odometer tampering detected'
          : 'Odometer is outside GPS tolerance (possible GPS issues)'
    };
  }, []);

  const getOdometerVerificationStatus = useCallback((tankToTankData) => {
    if (!tankToTankData) {
      return null;
    }

    const { odometerTampering, gpsDistance, distance: odometerDistance } = tankToTankData;

    if (!odometerTampering || !odometerTampering.hasGPSData) {
      return {
        hasGPSData: false,
        message: 'No GPS data available for verification'
      };
    }

    if (odometerTampering.isWithinTolerance) {
      return {
        hasGPSData: true,
        verified: true,
        status: 'ok',
        message: odometerTampering.message,
        difference: odometerTampering.difference,
        differencePercentage: odometerTampering.differencePercentage
      };
    }

    if (odometerTampering.possibleTampering) {
      return {
        hasGPSData: true,
        verified: false,
        status: 'tampering-detected',
        message: 'Possible odometer tampering detected',
        difference: odometerTampering.difference,
        differencePercentage: odometerTampering.differencePercentage,
        severity: 'critical'
      };
    }

    return {
      hasGPSData: true,
      verified: false,
      status: 'outside-tolerance',
      message: 'Odometer is outside GPS tolerance',
      difference: odometerTampering.difference,
      differencePercentage: odometerTampering.differencePercentage,
      severity: 'warning'
    };
  }, []);

  return {
    verifyOdometer,
    getOdometerVerificationStatus,
    settings: {
      tolerance: data.vehicleProfile?.odometerTolerancePercentage || 10,
      enabled: data.vehicleProfile?.enableOdometerVerification || false
    }
  };
};

export default useGPSTracking;
