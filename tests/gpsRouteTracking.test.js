/**
 * Tests for GPS Route Tracking & Odometer Verification (Task 10)
 *
 * Test coverage:
 * - GPS route distance calculations
 * - GPS vs odometer comparison
 * - Odometer tampering detection
 * - GPS route quality validation
 * - GPS accuracy calculations
 */

import {
  calculateGPSRouteDistance,
  calculateGPSAccuracy,
  compareGPSvsOdometer,
  detectOdometerTampering,
  validateGPSRouteQuality
} from '../src/utils/gpsRouteTracking';

describe('GPS Route Tracking & Odometer Verification', () => {

  describe('calculateGPSRouteDistance', () => {
    test('should calculate distance for valid route', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, timestamp: 1234567890000 },
        { lat: 37.7759, lng: -122.4204, timestamp: 1234567895000 },
        { lat: 37.7769, lng: -122.4214, timestamp: 1234567900000 }
      ];

      const distance = calculateGPSRouteDistance(route);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be less than 1 km for this route
    });

    test('should return 0 for empty route', () => {
      const distance = calculateGPSRouteDistance([]);
      expect(distance).toBe(0);
    });

    test('should return 0 for null route', () => {
      const distance = calculateGPSRouteDistance(null);
      expect(distance).toBe(0);
    });

    test('should handle single point route', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, timestamp: 1234567890000 }
      ];

      const distance = calculateGPSRouteDistance(route);
      expect(distance).toBe(0);
    });

    test('should handle route with missing coordinates', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, timestamp: 1234567890000 },
        { timestamp: 1234567895000 }, // Missing coordinates
        { lat: 37.7769, lng: -122.4214, timestamp: 1234567900000 }
      ];

      const distance = calculateGPSRouteDistance(route);
      expect(distance).toBeGreaterThan(0);
    });

    test('Time Complexity: O(n) where n is number of GPS points', () => {
      const route = Array.from({ length: 100 }, (_, i) => ({
        lat: 37.7749 + (i * 0.001),
        lng: -122.4194 + (i * 0.001),
        timestamp: 1234567890000 + (i * 1000)
      }));

      const startTime = performance.now();
      const distance = calculateGPSRouteDistance(route);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(10); // Should complete in < 10ms
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('calculateGPSAccuracy', () => {
    test('should calculate average accuracy', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, accuracy: 10 },
        { lat: 37.7759, lng: -122.4204, accuracy: 15 },
        { lat: 37.7769, lng: -122.4214, accuracy: 20 }
      ];

      const accuracy = calculateGPSAccuracy(route);

      expect(accuracy).toBeCloseTo(15, 0);
    });

    test('should handle route with some points missing accuracy', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, accuracy: 10 },
        { lat: 37.7759, lng: -122.4204 }, // No accuracy
        { lat: 37.7769, lng: -122.4214, accuracy: 20 }
      ];

      const accuracy = calculateGPSAccuracy(route);

      expect(accuracy).toBeCloseTo(15, 0);
    });

    test('should return null for empty route', () => {
      const accuracy = calculateGPSAccuracy([]);
      expect(accuracy).toBeNull();
    });

    test('should return null for route without accuracy data', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194 },
        { lat: 37.7759, lng: -122.4204 },
        { lat: 37.7769, lng: -122.4214 }
      ];

      const accuracy = calculateGPSAccuracy(route);
      expect(accuracy).toBeNull();
    });
  });

  describe('compareGPSvsOdometer', () => {
    test('should compare GPS and odometer within tolerance', () => {
      const result = compareGPSvsOdometer(200, 205, 5); // 2.5% difference

      expect(result.isValid).toBe(true);
      expect(result.isWithinTolerance).toBe(true);
      expect(result.discrepancy).toBe('none');
      expect(result.differencePercentage).toBeCloseTo(2.5, 1);
    });

    test('should detect GPS higher than odometer (possible tampering)', () => {
      const result = compareGPSvsOdometer(180, 200, 10); // 11.11% difference

      expect(result.isValid).toBe(true);
      expect(result.isWithinTolerance).toBe(false);
      expect(result.discrepancy).toBe('gps-higher');
      expect(result.difference).toBe(-20);
      expect(result.differencePercentage).toBeCloseTo(11.11, 1);
    });

    test('should detect odometer higher than GPS (GPS issue)', () => {
      const result = compareGPSvsOdometer(220, 200, 10); // 10% difference

      expect(result.isValid).toBe(true);
      expect(result.isWithinTolerance).toBe(true); // Exactly at tolerance
      expect(result.discrepancy).toBe('odometer-higher');
      expect(result.difference).toBe(20);
      expect(result.differencePercentage).toBeCloseTo(10, 1);
    });

    test('should handle missing data', () => {
      const result1 = compareGPSvsOdometer(null, 200);
      expect(result1.isValid).toBe(false);
      expect(result1.reason).toBe('missing-data');

      const result2 = compareGPSvsOdometer(200, null);
      expect(result2.isValid).toBe(false);
      expect(result2.reason).toBe('missing-data');
    });

    test('should handle negative distances', () => {
      const result = compareGPSvsOdometer(-200, 200);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('negative-distance');
    });

    test('should handle zero odometer distance', () => {
      const result = compareGPSvsOdometer(100, 0);

      expect(result.isValid).toBe(true);
      expect(result.gpsDistance).toBe(100);
      expect(result.odometerDistance).toBe(0);
      expect(result.isWithinTolerance).toBe(false);
    });

    test('Time Complexity: O(1)', () => {
      const startTime = performance.now();

      for (let i = 0; i < 1000; i++) {
        compareGPSvsOdometer(200, 210, 10);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;

      expect(avgTime).toBeLessThan(0.1); // Should be < 0.1ms per operation
    });
  });

  describe('detectOdometerTampering', () => {
    test('should not detect tampering when within tolerance', () => {
      const result = detectOdometerTampering(200, 205, 5);

      expect(result.isTampered).toBe(false);
      expect(result.severity).toBe('none');
      expect(result.confidence).toBe('high');
      expect(result.comparison.isWithinTolerance).toBe(true);
    });

    test('should detect critical tampering', () => {
      const result = detectOdometerTampering(180, 250, 10); // 38.9% difference

      expect(result.isTampered).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.confidence).toBe('high');
      expect(result.differencePercentage).toBeCloseTo(38.9, 1);
    });

    test('should detect high tampering', () => {
      const result = detectOdometerTampering(180, 210, 10); // 16.7% difference

      expect(result.isTampered).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.confidence).toBe('high');
      expect(result.differencePercentage).toBeCloseTo(16.7, 1);
    });

    test('should detect medium tampering', () => {
      const result = detectOdometerTampering(180, 200, 10); // 11.1% difference

      expect(result.isTampered).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.confidence).toBe('medium');
      expect(result.differencePercentage).toBeCloseTo(11.1, 1);
    });

    test('should handle odometer higher than GPS (not tampering)', () => {
      const result = detectOdometerTampering(220, 200, 10); // Odometer lower

      expect(result.isTampered).toBe(false);
      expect(result.severity).toBe('warning'); // Warning, not tampering
      expect(result.confidence).toBe('medium');
      expect(result.comparison.discrepancy).toBe('odometer-higher');
    });

    test('should handle missing data', () => {
      const result = detectOdometerTampering(null, 200);

      expect(result.isTampered).toBe(false);
      expect(result.severity).toBe('none');
      expect(result.confidence).toBe('none');
      expect(result.reason).toBe('missing-data');
    });
  });

  describe('validateGPSRouteQuality', () => {
    test('should validate excellent GPS route', () => {
      const route = Array.from({ length: 50 }, (_, i) => ({
        lat: 37.7749 + (i * 0.0001),
        lng: -122.4194 + (i * 0.0001),
        accuracy: 15, // Excellent accuracy
        timestamp: 1234567890000 + (i * 1000)
      }));

      const result = validateGPSRouteQuality(route);

      expect(result.isValid).toBe(true);
      expect(result.quality).toBe('excellent');
      expect(result.pointCount).toBe(50);
      expect(result.averageAccuracy).toBeCloseTo(15, 0);
      expect(result.totalDistance).toBeGreaterThan(0);
    });

    test('should validate good GPS route', () => {
      const route = Array.from({ length: 50 }, (_, i) => ({
        lat: 37.7749 + (i * 0.0001),
        lng: -122.4194 + (i * 0.0001),
        accuracy: 75, // Good accuracy
        timestamp: 1234567890000 + (i * 1000)
      }));

      const result = validateGPSRouteQuality(route);

      expect(result.isValid).toBe(true);
      expect(result.quality).toBe('good');
      expect(result.pointCount).toBe(50);
      expect(result.averageAccuracy).toBeCloseTo(75, 0);
    });

    test('should reject insufficient GPS points', () => {
      const route = [
        { lat: 37.7749, lng: -122.4194, accuracy: 15, timestamp: 1234567890000 }
      ];

      const result = validateGPSRouteQuality(route);

      expect(result.isValid).toBe(false);
      expect(result.quality).toBe('insufficient');
      expect(result.reason).toBe('insufficient-points');
      expect(result.message).toContain('Minimum 3 required');
    });

    test('should reject empty route', () => {
      const result = validateGPSRouteQuality([]);

      expect(result.isValid).toBe(false);
      expect(result.quality).toBe('none');
      expect(result.reason).toBe('no-gps-data');
    });

    test('should handle route without accuracy data', () => {
      const route = Array.from({ length: 20 }, (_, i) => ({
        lat: 37.7749 + (i * 0.0001),
        lng: -122.4194 + (i * 0.0001),
        timestamp: 1234567890000 + (i * 1000)
      }));

      const result = validateGPSRouteQuality(route);

      expect(result.isValid).toBe(true);
      expect(result.quality).toBe('unknown');
      expect(result.averageAccuracy).toBeNull();
      expect(result.pointCount).toBe(20);
    });
  });

  describe('Integration: Complete GPS Workflow', () => {
    test('should calculate complete tank-to-tank with GPS verification', () => {
      // Simulate a route from Point A to Point B
      const gpsRoute = [
        { lat: 37.7749, lng: -122.4194, accuracy: 10, timestamp: 1234567890000 },
        { lat: 37.7759, lng: -122.4204, accuracy: 12, timestamp: 1234567896000 },
        { lat: 37.7769, lng: -122.4214, accuracy: 11, timestamp: 1234567902000 },
        { lat: 37.7779, lng: -122.4224, accuracy: 15, timestamp: 1234567908000 },
        { lat: 37.7789, lng: -122.4234, accuracy: 13, timestamp: 1234567914000 }
      ];

      // Calculate GPS distance
      const gpsDistance = calculateGPSRouteDistance(gpsRoute);

      expect(gpsDistance).toBeGreaterThan(0);

      // Compare with odometer (simulating odometer rollback)
      const odometerDistance = 1.5; // Odometer shows 1.5 km instead of actual ~0.6 km

      const comparison = compareGPSvsOdometer(gpsDistance, odometerDistance, 10);

      expect(comparison.isValid).toBe(true);
      expect(comparison.discrepancy).toBe('gps-higher');

      // Detect tampering
      const tamperingDetection = detectOdometerTampering(gpsDistance, odometerDistance, 10);

      expect(tamperingDetection.isTampered).toBe(true);
      expect(tamperingDetection.severity).toBe('critical');
      expect(tamperingDetection.differencePercentage).toBeGreaterThan(10);
    });

    test('should verify legitimate odometer with GPS', () => {
      // Legitimate route - GPS and odometer match
      const gpsRoute = [
        { lat: 37.7749, lng: -122.4194, accuracy: 8, timestamp: 1234567890000 },
        { lat: 37.7849, lng: -122.4294, accuracy: 9, timestamp: 1234568090000 }
      ];

      const gpsDistance = calculateGPSRouteDistance(gpsRoute);

      // Odometer matches GPS within tolerance
      const odometerDistance = gpsDistance * 1.05; // 5% higher (within tolerance)

      const comparison = compareGPSvsOdometer(gpsDistance, odometerDistance, 10);

      expect(comparison.isValid).toBe(true);
      expect(comparison.isWithinTolerance).toBe(true);

      const tamperingDetection = detectOdometerTampering(gpsDistance, odometerDistance, 10);

      expect(tamperingDetection.isTampered).toBe(false);
      expect(tamperingDetection.severity).toBe('none');
    });
  });
});
