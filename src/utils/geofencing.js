/**
 * Geofencing utilities for detecting vehicle movement outside expected zones
 */

/**
 * Earth's radius in kilometers
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

/**
 * Check if a location is within a geofence radius
 * @param {Object} location - {lat, lng}
 * @param {Object} geofence - {lat, lng, radius}
 * @returns {boolean}
 */
export const isWithinGeofence = (location, geofence) => {
  if (!location || !geofence) return false;

  const distance = calculateHaversineDistance(
    location.lat,
    location.lng,
    geofence.lat,
    geofence.lng
  );

  // Use strict comparison (no tolerance) for boundaries
  return distance < geofence.radius;
};

/**
 * Check if location is within any of the provided geofences
 * @param {Object} location - {lat, lng}
 * @param {Array} geofences - Array of {lat, lng, radius, name}
 * @returns {Object|null} Returns the matching geofence or null
 */
export const findGeofenceForLocation = (location, geofences) => {
  if (!location || !geofences || geofences.length === 0) return null;

  for (const geofence of geofences) {
    if (isWithinGeofence(location, geofence)) {
      return geofence;
    }
  }

  return null;
};

/**
 * Check if a vehicle has moved outside expected geofences
 * @param {Object} currentLocation - {lat, lng}
 * @param {Array} allowedGeofences - Array of {lat, lng, radius, name}
 * @returns {Object} { isOutside: boolean, currentFence: Object|null }
 */
export const checkGeofenceViolation = (currentLocation, allowedGeofences) => {
  if (!currentLocation || !allowedGeofences || allowedGeofences.length === 0) {
    return { isOutside: false, currentFence: null };
  }

  const currentFence = findGeofenceForLocation(currentLocation, allowedGeofences);
  const isOutside = currentFence === null;

  return { isOutside, currentFence };
};

/**
 * Create a geofence object
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radius - Radius in kilometers
 * @param {string} name - Geofence name
 * @returns {Object} Geofence object
 */
export const createGeofence = (lat, lng, radius = 1, name = 'Unnamed Zone') => {
  return {
    lat,
    lng,
    radius, // in kilometers
    name,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Default geofence presets for common locations
 */
export const DEFAULT_GEOFENCES = {
  // Home geofence (typical 500m radius)
  home: (lat, lng) => createGeofence(lat, lng, 0.5, 'Home'),

  // Work geofence (typical 500m radius)
  work: (lat, lng) => createGeofence(lat, lng, 0.5, 'Work'),

  // Fuel station geofence (typical 100m radius)
  fuelStation: (lat, lng, name = 'Fuel Station') =>
    createGeofence(lat, lng, 0.1, name),

  // City-wide geofence (typical 20km radius for large cities)
  city: (lat, lng, name = 'City') => createGeofence(lat, lng, 20, name),
};

/**
 * Detect fuel station pattern (frequent stops at same location)
 * @param {Array} logs - Array of fuel log entries with locations
 * @returns {Array} Detected fuel station locations
 */
export const detectFuelStations = (logs) => {
  if (!logs || logs.length === 0) return [];

  const locationsWithCounts = new Map();

  logs.forEach((log) => {
    const location = log.endLocation;
    if (!location) return;

    // Round to 4 decimal places (~11m precision) to group nearby locations
    const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}`;

    if (locationsWithCounts.has(key)) {
      const existing = locationsWithCounts.get(key);
      locationsWithCounts.set(key, {
        ...existing,
        count: existing.count + 1,
        lastVisited: log.date,
      });
    } else {
      locationsWithCounts.set(key, {
        lat: location.lat,
        lng: location.lng,
        count: 1,
        name: 'Fuel Station',
        firstVisited: log.date,
        lastVisited: log.date,
      });
    }
  });

  // Return locations with multiple visits (likely fuel stations)
  return Array.from(locationsWithCounts.values())
    .filter((loc) => loc.count >= 2)
    .sort((a, b) => b.count - a.count)
    .map((loc, index) => ({
      ...loc,
      name: loc.count >= 3 ? `Fuel Station ${index + 1}` : `Fuel Stop`,
    }));
};

/**
 * Track geofence history for analytics
 * @param {Array} locationHistory - Array of {lat, lng, timestamp}
 * @param {Array} geofences - Array of {lat, lng, radius, name}
 * @returns {Object} Analytics data
 */
export const analyzeGeofenceHistory = (locationHistory, geofences) => {
  if (!locationHistory || !geofences) {
    return { totalPoints: 0, withinFence: 0, outsideFence: 0, timeDistribution: {} };
  }

  let withinFence = 0;
  let outsideFence = 0;
  const timeDistribution = {};

  locationHistory.forEach((point) => {
    const fence = findGeofenceForLocation(point, geofences);
    
    if (fence) {
      withinFence++;
      
      // Count by fence name
      if (!timeDistribution[fence.name]) {
        timeDistribution[fence.name] = 0;
      }
      timeDistribution[fence.name]++;
    } else {
      outsideFence++;
    }
  });

  return {
    totalPoints: locationHistory.length,
    withinFence,
    outsideFence,
    timeDistribution,
    percentageWithin: locationHistory.length > 0
      ? ((withinFence / locationHistory.length) * 100).toFixed(1)
      : 0,
  };
};

/**
 * Get geofence violation alert message
 * @param {Object} location - Current location
 * @param {Array} allowedGeofences - Allowed geofences
 * @returns {string|null} Alert message or null
 */
export const getGeofenceAlert = (location, allowedGeofences) => {
  const { isOutside } = checkGeofenceViolation(location, allowedGeofences);

  if (isOutside) {
    return 'Vehicle has moved outside expected zones. This may indicate unauthorized usage.';
  }

  return null;
};

/**
 * Validate geofence coordinates
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lng - Longitude (-180 to 180)
 * @returns {boolean}
 */
export const isValidGeofence = (lat, lng) => {
  return (
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

export default {
  calculateHaversineDistance,
  isWithinGeofence,
  findGeofenceForLocation,
  checkGeofenceViolation,
  createGeofence,
  DEFAULT_GEOFENCES,
  detectFuelStations,
  analyzeGeofenceHistory,
  getGeofenceAlert,
  isValidGeofence,
};
