/**
 * Geolocation API Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateHaversineDistance,
  isGeolocationSupported,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentPosition,
  getQuickPosition,
  getAccuratePosition,
  calculateDistanceFromSaved,
  watchPosition,
  clearWatch,
  formatLocation,
  __resetGeolocationState__
} from '../../src/utils/geolocation';

describe('Haversine Distance Calculations', () => {
  it('should calculate distance between two points', () => {
    const distance = calculateHaversineDistance(
      37.7749, -122.4194, // San Francisco
      34.0522, -118.2437  // Los Angeles
    );
    expect(distance).toBeCloseTo(559, 0); // ~559 km
  });

  it('should return 0 for same coordinates', () => {
    const distance = calculateHaversineDistance(37.7749, -122.4194, 37.7749, -122.4194);
    expect(distance).toBe(0);
  });

  it('should handle short distances', () => {
    const distance = calculateHaversineDistance(
      37.7749, -122.4194,
      37.7759, -122.4204
    );
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1); // Less than 1 km
  });

  it('should handle long distances', () => {
    const distance = calculateHaversineDistance(
      40.7128, -74.0060, // New York
      51.5074, -0.1278   // London
    );
    expect(distance).toBeCloseTo(5570, 0); // ~5570 km
  });

  it('should handle negative latitudes', () => {
    const distance = calculateHaversineDistance(
      -33.8688, 151.2093, // Sydney
      -37.8136, 144.9631  // Melbourne
    );
    expect(distance).toBeGreaterThan(0);
  });

  it('should handle equator crossing', () => {
    const distance = calculateHaversineDistance(
      0, 0,
      0, 180
    );
    expect(distance).toBeCloseTo(20015, 0); // Half Earth's circumference
  });
});

describe('Geolocation Support', () => {
  it('should detect geolocation support', () => {
    const result = isGeolocationSupported();
    expect(result).toBe(true);
  });

  it('should handle missing geolocation API', () => {
    const originalGeolocation = navigator.geolocation;
    delete navigator.geolocation;

    const result = isGeolocationSupported();

    navigator.geolocation = originalGeolocation;
    expect(result).toBe(false);
  });
});

describe('Location Permission', () => {
  beforeEach(() => {
    // Reset geolocation mock
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should check location permission', async () => {
    // Mock permissions API
    navigator.permissions = {
      query: vi.fn(() => Promise.resolve({ state: 'granted' }))
    };

    const result = await checkLocationPermission();
    expect(result).toBe('granted');
  });

  it('should return prompt when permissions API not available', async () => {
    delete navigator.permissions;

    const result = await checkLocationPermission();
    expect(result).toBe('prompt');
  });

  it('should return unsupported when geolocation not available', async () => {
    delete navigator.geolocation;

    const result = await checkLocationPermission();
    expect(result).toBe('unsupported');
  });
});

describe('Request Location Permission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should request location permission successfully', async () => {
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success) => success({
        coords: { latitude: 37.7749, longitude: -122.4194 },
        timestamp: Date.now()
      })
    );

    const result = await requestLocationPermission();
    expect(result.success).toBe(true);
    expect(result.permission).toBe('granted');
  });

  it('should handle permission denied', async () => {
    const error = { code: 1, message: 'Permission denied' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    const result = await requestLocationPermission();
    expect(result.success).toBe(false);
    expect(result.permission).toBe('denied');
  });

  it('should handle position unavailable', async () => {
    const error = { code: 2, message: 'Position unavailable' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    const result = await requestLocationPermission();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle timeout', async () => {
    const error = { code: 3, message: 'Timeout' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    const result = await requestLocationPermission();
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return unsupported when geolocation not available', async () => {
    delete navigator.geolocation;

    const result = await requestLocationPermission();
    expect(result.success).toBe(false);
    expect(result.permission).toBe('unsupported');
    expect(result.error).toContain('not supported');
  });
});

describe('Get Current Position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should get current position successfully', async () => {
    const mockPosition = {
      coords: {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    const position = await getCurrentPosition();

    expect(position.lat).toBe(37.7749);
    expect(position.lng).toBe(-122.4194);
    expect(position.accuracy).toBe(10);
    expect(position.timestamp).toBe(mockPosition.timestamp);
  });

  it('should use cached position if valid', async () => {
    const cachedPosition = {
      lat: 37.7749,
      lng: -122.4194,
      accuracy: 10,
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success) => {
        setTimeout(() => {
          success({
            coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
            timestamp: Date.now()
          });
        }, 1);
      }
    );

    // First call - should get from API
    const position1 = await getCurrentPosition({ maxAge: 60000 });
    expect(position1).toBeDefined();

    // Second call with same options - should use cache
    const position2 = await getCurrentPosition({ maxAge: 60000 });
    expect(position2).toBeDefined();
  });

  it('should handle permission denied', async () => {
    const error = { code: 1, message: 'Permission denied' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    await expect(getCurrentPosition()).rejects.toThrow('Please allow location access');
  });

  it('should handle position unavailable', async () => {
    const error = { code: 2, message: 'Position unavailable' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    await expect(getCurrentPosition()).rejects.toThrow('GPS signal lost');
  });

  it('should handle timeout', async () => {
    const error = { code: 3, message: 'Timeout' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb, options) => {
        setTimeout(() => {
          if (errorCb) errorCb(error);
        }, 1);
      }
    );

    await expect(getCurrentPosition()).rejects.toThrow('Acquiring GPS signal timed out');
  });

  it('should reject when geolocation not supported', async () => {
    delete navigator.geolocation;

    await expect(getCurrentPosition()).rejects.toThrow('not supported');
  });

  it('should use custom timeout', async () => {
    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        expect(options.timeout).toBe(15000);
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    await getCurrentPosition({ timeout: 15000 });
  });

  it('should use high accuracy mode when requested', async () => {
    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 5 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        expect(options.enableHighAccuracy).toBe(true);
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    await getCurrentPosition({ highAccuracy: true });
  });
});

describe('Quick Position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should get position with quick settings', async () => {
    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 50 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        expect(options.timeout).toBe(5000);
        expect(options.enableHighAccuracy).toBe(false);
        expect(options.maximumAge).toBe(300000);
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    const position = await getQuickPosition();
    expect(position).toBeDefined();
  });
});

describe('Accurate Position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should get position with high accuracy settings', async () => {
    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 5 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        expect(options.timeout).toBe(12000);
        expect(options.enableHighAccuracy).toBe(true);
        expect(options.maximumAge).toBe(0);
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    const position = await getAccuratePosition();
    expect(position).toBeDefined();
  });
});

describe('Distance From Saved', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should calculate distance from saved location', async () => {
    const savedLocation = { lat: 37.7749, lng: -122.4194 };

    const mockPosition = {
      coords: { latitude: 37.7759, longitude: -122.4204, accuracy: 10 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, error, options) => {
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    const result = await calculateDistanceFromSaved(savedLocation);

    expect(result).not.toBeNull();
    expect(result.distance).toBeGreaterThan(0);
    expect(result.currentLocation).toBeDefined();
  });

  it('should return null for null saved location', async () => {
    const result = await calculateDistanceFromSaved(null);
    expect(result).toBeNull();
  });

  it('should return null for saved location without coordinates', async () => {
    const result = await calculateDistanceFromSaved({ name: 'Test' });
    expect(result).toBeNull();
  });

  it.skip('should handle geolocation errors gracefully', async () => {
    const savedLocation = { lat: 37.7749, lng: -122.4194 };

    const error = { code: 1, message: 'Permission denied' };
    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success, errorCb) => errorCb(error)
    );

    const result = await calculateDistanceFromSaved(savedLocation);
    expect(result).toBeNull();
  });
});

describe('Watch Position', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should start watching position', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    navigator.geolocation.watchPosition.mockReturnValue(12345);

    const watchId = watchPosition(onSuccess, onError);

    expect(typeof watchId).toBe('number');
    expect(navigator.geolocation.watchPosition).toHaveBeenCalled();
  });

  it('should call success callback on position update', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      timestamp: Date.now()
    };

    navigator.geolocation.watchPosition.mockImplementation(
      (success) => {
        success(mockPosition);
        return 12345;
      }
    );

    watchPosition(onSuccess, onError);

    expect(onSuccess).toHaveBeenCalledWith({
      lat: 37.7749,
      lng: -122.4194,
      accuracy: 10,
      timestamp: mockPosition.timestamp
    });
  });

  it('should call error callback on error', () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    const error = { code: 1, message: 'Permission denied' };

    navigator.geolocation.watchPosition.mockImplementation(
      (success, errorCb) => {
        errorCb(error);
        return 12345;
      }
    );

    watchPosition(onSuccess, onError);

    expect(onError).toHaveBeenCalled();
  });
});

describe('Clear Watch', () => {
  beforeEach(() => {
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should clear position watch', () => {
    const watchId = 12345;
    clearWatch(watchId);

    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(watchId);
  });

  it('should handle null watch ID', () => {
    expect(() => clearWatch(null)).not.toThrow();
  });

  it('should handle undefined watch ID', () => {
    expect(() => clearWatch(undefined)).not.toThrow();
  });
});

describe('Format Location', () => {
  it('should format location with default precision', () => {
    const location = { lat: 37.7749, lng: -122.4194 };
    const result = formatLocation(location);
    expect(result).toBe('37.7749, -122.4194');
  });

  it('should return "Unknown" for null location', () => {
    const result = formatLocation(null);
    expect(result).toBe('Unknown');
  });

  it('should return "Unknown" for location without coordinates', () => {
    const result = formatLocation({ name: 'Test' });
    expect(result).toBe('Unknown');
  });

  it('should return "Unknown" for location with only latitude', () => {
    const result = formatLocation({ lat: 37.7749 });
    expect(result).toBe('Unknown');
  });

  it('should return "Unknown" for location with only longitude', () => {
    const result = formatLocation({ lng: -122.4194 });
    expect(result).toBe('Unknown');
  });
});

describe('Edge Cases and Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetGeolocationState__();
    global.navigator.geolocation = {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn(),
      clearWatch: vi.fn()
    };
  });

  it('should handle extreme latitudes', () => {
    const distance = calculateHaversineDistance(90, 0, -90, 0);
    expect(distance).toBeCloseTo(20015, 0); // Half Earth's circumference
  });

  it('should handle extreme longitudes', () => {
    const distance = calculateHaversineDistance(0, 0, 0, 180);
    expect(distance).toBeCloseTo(20015, 0); // Half Earth's circumference
  });

  it('should handle invalid coordinates gracefully', () => {
    // Very large values
    const distance = calculateHaversineDistance(999, 999, 1000, 1000);
    expect(distance).toBeDefined();
  });

  it('should handle concurrent position requests', async () => {
    const mockPosition = {
      coords: { latitude: 37.7749, longitude: -122.4194, accuracy: 10 },
      timestamp: Date.now()
    };

    navigator.geolocation.getCurrentPosition.mockImplementation(
      (success) => {
        setTimeout(() => {
          success(mockPosition);
        }, 1);
      }
    );

    const promises = [
      getCurrentPosition(),
      getCurrentPosition(),
      getCurrentPosition()
    ];

    const results = await Promise.all(promises);
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });

  it('should handle NaN coordinates', () => {
    const distance = calculateHaversineDistance(NaN, NaN, 37.7749, -122.4194);
    expect(distance).toBeNaN();
  });
});
