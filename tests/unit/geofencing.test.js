/**
 * Geofencing Tests
 */
import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistance,
  isWithinGeofence,
  findGeofenceForLocation,
  checkGeofenceViolation,
  createGeofence,
  DEFAULT_GEOFENCES,
  detectFuelStations,
  analyzeGeofenceHistory,
  getGeofenceAlert,
  isValidGeofence
} from '../../src/utils/geofencing';

describe('Haversine Distance', () => {
  it('should calculate distance between two points', () => {
    const distance = calculateHaversineDistance(
      37.7749, -122.4194,
      34.0522, -118.2437
    );
    expect(distance).toBeCloseTo(559, 0);
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculateHaversineDistance(37.7749, -122.4194, 37.7749, -122.4194);
    expect(distance).toBe(0);
  });
});

describe('Geofence Creation', () => {
  it('should create a geofence', () => {
    const geofence = createGeofence(37.7749, -122.4194, 1, 'Test Zone');

    expect(geofence.lat).toBe(37.7749);
    expect(geofence.lng).toBe(-122.4194);
    expect(geofence.radius).toBe(1);
    expect(geofence.name).toBe('Test Zone');
    expect(geofence.createdAt).toBeDefined();
  });

  it('should use default radius if not provided', () => {
    const geofence = createGeofence(37.7749, -122.4194);

    expect(geofence.radius).toBe(1);
  });

  it('should use default name if not provided', () => {
    const geofence = createGeofence(37.7749, -122.4194);

    expect(geofence.name).toBe('Unnamed Zone');
  });
});

describe('DEFAULT_GEOFENCES Presets', () => {
  it('should create home geofence with 0.5km radius', () => {
    const home = DEFAULT_GEOFENCES.home(37.7749, -122.4194);
    expect(home.radius).toBe(0.5);
    expect(home.name).toBe('Home');
  });

  it('should create work geofence with 0.5km radius', () => {
    const work = DEFAULT_GEOFENCES.work(37.7749, -122.4194);
    expect(work.radius).toBe(0.5);
    expect(work.name).toBe('Work');
  });

  it('should create fuel station geofence with 0.1km radius', () => {
    const fuelStation = DEFAULT_GEOFENCES.fuelStation(37.7749, -122.4194, 'Shell');
    expect(fuelStation.radius).toBe(0.1);
    expect(fuelStation.name).toBe('Shell');
  });

  it('should use default name for fuel station', () => {
    const fuelStation = DEFAULT_GEOFENCES.fuelStation(37.7749, -122.4194);
    expect(fuelStation.name).toBe('Fuel Station');
  });

  it('should create city geofence with 20km radius', () => {
    const city = DEFAULT_GEOFENCES.city(37.7749, -122.4194);
    expect(city.radius).toBe(20);
    expect(city.name).toBe('City');
  });
});

describe('Within Geofence Check', () => {
  it('should detect point inside geofence', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 1 };
    const point = { lat: 37.7750, lng: -122.4195 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBe(true);
  });

  it('should detect point outside geofence', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 0.1 };
    const point = { lat: 37.7800, lng: -122.4200 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBe(false);
  });

  it('should detect point on geofence boundary', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 1 };
    const point = { lat: 37.7749, lng: -122.4094 }; // ~1km east

    const result = isWithinGeofence(point, geofence);
    expect(result).toBe(true);
  });

  it('should return false for null location', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 1 };
    const result = isWithinGeofence(null, geofence);
    expect(result).toBe(false);
  });

  it('should return false for null geofence', () => {
    const point = { lat: 37.7749, lng: -122.4194 };
    const result = isWithinGeofence(point, null);
    expect(result).toBe(false);
  });
});

describe('Find Geofence For Location', () => {
  it('should find matching geofence', () => {
    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Zone A' },
      { lat: 34.0522, lng: -118.2437, radius: 1, name: 'Zone B' }
    ];

    const point = { lat: 37.7750, lng: -122.4195 };
    const result = findGeofenceForLocation(point, geofences);

    expect(result).toBeDefined();
    expect(result.name).toBe('Zone A');
  });

  it('should return null when no matching geofence', () => {
    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 0.1, name: 'Zone A' }
    ];

    const point = { lat: 37.7800, lng: -122.4200 };
    const result = findGeofenceForLocation(point, geofences);

    expect(result).toBeNull();
  });

  it('should return null for empty geofences array', () => {
    const point = { lat: 37.7749, lng: -122.4194 };
    const result = findGeofenceForLocation(point, []);
    expect(result).toBeNull();
  });

  it('should return null for null geofences', () => {
    const point = { lat: 37.7749, lng: -122.4194 };
    const result = findGeofenceForLocation(point, null);
    expect(result).toBeNull();
  });

  it('should find first matching geofence when multiple overlap', () => {
    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Zone A' },
      { lat: 37.7749, lng: -122.4194, radius: 0.5, name: 'Zone B' }
    ];

    const point = { lat: 37.7750, lng: -122.4195 };
    const result = findGeofenceForLocation(point, geofences);

    expect(result.name).toBe('Zone A');
  });
});

describe('Check Geofence Violation', () => {
  it('should detect violation when location outside geofences', () => {
    const allowedGeofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const currentLocation = { lat: 37.7900, lng: -122.4300 };
    const result = checkGeofenceViolation(currentLocation, allowedGeofences);

    expect(result.isOutside).toBe(true);
    expect(result.currentFence).toBeNull();
  });

  it('should not detect violation when location inside geofence', () => {
    const allowedGeofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const currentLocation = { lat: 37.7750, lng: -122.4195 };
    const result = checkGeofenceViolation(currentLocation, allowedGeofences);

    expect(result.isOutside).toBe(false);
    expect(result.currentFence).toBeDefined();
    expect(result.currentFence.name).toBe('Home');
  });

  it('should return no violation for null location', () => {
    const allowedGeofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const result = checkGeofenceViolation(null, allowedGeofences);
    expect(result.isOutside).toBe(false);
  });

  it('should return no violation for empty geofences', () => {
    const currentLocation = { lat: 37.7750, lng: -122.4195 };
    const result = checkGeofenceViolation(currentLocation, []);
    expect(result.isOutside).toBe(false);
  });
});

describe('Geofence Alert', () => {
  it('should return alert message when violation detected', () => {
    const location = { lat: 38.0, lng: -123.0 };
    const allowedGeofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const alert = getGeofenceAlert(location, allowedGeofences);
    expect(alert).toContain('outside expected zones');
  });

  it('should return null when no violation', () => {
    const location = { lat: 37.7750, lng: -122.4195 };
    const allowedGeofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const alert = getGeofenceAlert(location, allowedGeofences);
    expect(alert).toBeNull();
  });
});

describe('Validate Geofence', () => {
  it('should validate correct coordinates', () => {
    const result = isValidGeofence(37.7749, -122.4194);
    expect(result).toBe(true);
  });

  it('should reject latitude > 90', () => {
    const result = isValidGeofence(91, -122.4194);
    expect(result).toBe(false);
  });

  it('should reject latitude < -90', () => {
    const result = isValidGeofence(-91, -122.4194);
    expect(result).toBe(false);
  });

  it('should reject longitude > 180', () => {
    const result = isValidGeofence(37.7749, 181);
    expect(result).toBe(false);
  });

  it('should reject longitude < -180', () => {
    const result = isValidGeofence(37.7749, -181);
    expect(result).toBe(false);
  });

  it('should reject null latitude', () => {
    const result = isValidGeofence(null, -122.4194);
    expect(result).toBe(false);
  });

  it('should reject undefined longitude', () => {
    const result = isValidGeofence(37.7749, undefined);
    expect(result).toBe(false);
  });

  it('should accept boundary values', () => {
    expect(isValidGeofence(90, 180)).toBe(true);
    expect(isValidGeofence(-90, -180)).toBe(true);
  });
});

describe('Detect Fuel Stations', () => {
  it('should detect fuel stations from logs', () => {
    const logs = [
      {
        id: 1,
        date: '2025-01-10',
        endLocation: { lat: 37.7749, lng: -122.4194 }
      },
      {
        id: 2,
        date: '2025-01-15',
        endLocation: { lat: 37.7749, lng: -122.4194 }
      },
      {
        id: 3,
        date: '2025-01-20',
        endLocation: { lat: 34.0522, lng: -118.2437 }
      },
      {
        id: 4,
        date: '2025-01-25',
        endLocation: { lat: 34.0522, lng: -118.2437 }
      }
    ];

    const result = detectFuelStations(logs);
    expect(result).toHaveLength(2);
    expect(result[0].count).toBeGreaterThanOrEqual(2);
  });

  it('should return empty array for null logs', () => {
    const result = detectFuelStations(null);
    expect(result).toEqual([]);
  });

  it('should return empty array for empty logs', () => {
    const result = detectFuelStations([]);
    expect(result).toEqual([]);
  });

  it('should ignore logs without endLocation', () => {
    const logs = [
      { id: 1, date: '2025-01-10' },
      { id: 2, date: '2025-01-15', endLocation: { lat: 37.7749, lng: -122.4194 } },
      { id: 3, date: '2025-01-20', endLocation: { lat: 37.7749, lng: -122.4194 } }
    ];

    const result = detectFuelStations(logs);
    expect(result).toHaveLength(1);
  });

  it('should sort fuel stations by visit count', () => {
    const logs = [
      { id: 1, date: '2025-01-10', endLocation: { lat: 37.7749, lng: -122.4194 } },
      { id: 2, date: '2025-01-15', endLocation: { lat: 37.7749, lng: -122.4194 } },
      { id: 3, date: '2025-01-20', endLocation: { lat: 37.7749, lng: -122.4194 } },
      { id: 4, date: '2025-01-25', endLocation: { lat: 34.0522, lng: -118.2437 } },
      { id: 5, date: '2025-01-30', endLocation: { lat: 34.0522, lng: -118.2437 } }
    ];

    const result = detectFuelStations(logs);
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
  });

  it('should name stations based on visit count', () => {
    const logs = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      date: `2025-01-${10 + i * 5}`,
      endLocation: { lat: 37.7749, lng: -122.4194 }
    }));

    const result = detectFuelStations(logs);
    expect(result[0].name).toContain('Fuel Station');
  });
});

describe('Analyze Geofence History', () => {
  it('should analyze location history', () => {
    const locationHistory = [
      { lat: 37.7750, lng: -122.4195 },
      { lat: 37.7750, lng: -122.4195 },
      { lat: 37.7800, lng: -122.4200 }
    ];

    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const result = analyzeGeofenceHistory(locationHistory, geofences);

    expect(result.totalPoints).toBe(3);
    // With radius 1km, all 3 points are within the fence
    // Point 1 & 2: ~0.058km from center
    // Point 3: ~0.567km from center
    expect(result.withinFence).toBe(3);
    expect(result.outsideFence).toBe(0);
  });

  it('should calculate percentage within fence', () => {
    const locationHistory = [
      { lat: 37.7750, lng: -122.4195 },
      { lat: 37.7750, lng: -122.4195 },
      { lat: 37.7750, lng: -122.4195 }
    ];

    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const result = analyzeGeofenceHistory(locationHistory, geofences);

    expect(result.percentageWithin).toBe('100.0');
  });

  it('should track time distribution by fence name', () => {
    const locationHistory = [
      { lat: 37.7750, lng: -122.4195 },
      { lat: 37.7750, lng: -122.4195 }
    ];

    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const result = analyzeGeofenceHistory(locationHistory, geofences);

    expect(result.timeDistribution['Home']).toBe(2);
  });

  it('should handle null location history', () => {
    const geofences = [
      { lat: 37.7749, lng: -122.4194, radius: 1, name: 'Home' }
    ];

    const result = analyzeGeofenceHistory(null, geofences);

    expect(result.totalPoints).toBe(0);
  });

  it('should handle null geofences', () => {
    const locationHistory = [
      { lat: 37.7750, lng: -122.4195 }
    ];

    const result = analyzeGeofenceHistory(locationHistory, null);

    expect(result.totalPoints).toBe(0);
  });
});

describe('Edge Cases and Security', () => {
  it('should handle very large geofence radius', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 10000 };
    const point = { lat: 37.7750, lng: -122.4195 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBe(true);
  });

  it('should handle very small geofence radius', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 0.001 };
    const point = { lat: 37.7750, lng: -122.4195 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBe(false);
  });

  it('should handle NaN coordinates in geofence check', () => {
    const geofence = { lat: 37.7749, lng: -122.4194, radius: 1 };
    const point = { lat: NaN, lng: -122.4194 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBeDefined();
  });

  it('should handle geofence at poles', () => {
    const geofence = { lat: 90, lng: 0, radius: 100 };
    const point = { lat: 89, lng: 0 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBeDefined();
  });

  it('should handle geofence at antimeridian', () => {
    const geofence = { lat: 0, lng: 180, radius: 100 };
    const point = { lat: 0, lng: 179 };

    const result = isWithinGeofence(point, geofence);
    expect(result).toBeDefined();
  });
});
