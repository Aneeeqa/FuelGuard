const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => degrees * (Math.PI / 180);

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

export const isWithinGeofence = (location, geofence) => {
  if (!location || !geofence) return false;

  const distance = calculateHaversineDistance(
    location.lat,
    location.lng,
    geofence.lat,
    geofence.lng
  );

  return distance <= geofence.radius;
};

export const findGeofenceForLocation = (location, geofences) => {
  if (!location || !geofences || geofences.length === 0) return null;

  for (const geofence of geofences) {
    if (isWithinGeofence(location, geofence)) {
      return geofence;
    }
  }

  return null;
};

export const checkGeofenceViolation = (currentLocation, allowedGeofences) => {
  if (!currentLocation || !allowedGeofences || allowedGeofences.length === 0) {
    return { isOutside: false, currentFence: null };
  }

  const currentFence = findGeofenceForLocation(currentLocation, allowedGeofences);
  const isOutside = currentFence === null;

  return { isOutside, currentFence };
};

export const createGeofence = (lat, lng, radius = 1, name = 'Unnamed Zone') => {
  return {
    lat,
    lng,
    radius,
    name,
    createdAt: new Date().toISOString(),
  };
};

export const DEFAULT_GEOFENCES = {
  home: (lat, lng) => createGeofence(lat, lng, 0.5, 'Home'),
  work: (lat, lng) => createGeofence(lat, lng, 0.5, 'Work'),
  fuelStation: (lat, lng, name = 'Fuel Station') =>
    createGeofence(lat, lng, 0.1, name),
  city: (lat, lng, name = 'City') => createGeofence(lat, lng, 20, name),
};

export const detectFuelStations = (logs) => {
  if (!logs || logs.length === 0) return [];

  const locationsWithCounts = new Map();

  logs.forEach((log) => {
    const location = log.endLocation;
    if (!location) return;

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

  return Array.from(locationsWithCounts.values())
    .filter((loc) => loc.count >= 2)
    .sort((a, b) => b.count - a.count)
    .map((loc, index) => ({
      ...loc,
      name: loc.count >= 3 ? `Fuel Station ${index + 1}` : `Fuel Stop`,
    }));
};

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

export const getGeofenceAlert = (location, allowedGeofences) => {
  const { isOutside } = checkGeofenceViolation(location, allowedGeofences);

  if (isOutside) {
    return 'Vehicle has moved outside expected zones. This may indicate unauthorized usage.';
  }

  return null;
};

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
