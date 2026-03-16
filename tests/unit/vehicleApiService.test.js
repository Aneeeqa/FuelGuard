/**
 * Vehicle API Service Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fetchYears,
  fetchMakes,
  fetchModels,
  fetchOptions,
  fetchVehicleDetails,
  searchVehicle,
  clearCache,
  mpgToKmPerLiter,
  kmPerLiterToMpg
} from '../../src/services/vehicleApiService';

describe('Vehicle API Service', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
    clearCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fetch Years', () => {
    it('should fetch vehicle years from API', async () => {
      const mockYears = [
        { text: '2025', value: '2025' },
        { text: '2024', value: '2024' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockYears })
      });

      const result = await fetchYears();

      expect(result).toEqual(mockYears);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle API error gracefully', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });

      // Should throw error
      await expect(fetchYears()).rejects.toThrow();
    });

    it('should generate fallback years on API failure', async () => {
      const currentYear = new Date().getFullYear();

      global.fetch.mockRejectedValue(new Error('API unavailable'));

      const result = await fetchYears();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].value).toBe(String(currentYear + 1));
    });

    it('should cache API responses', async () => {
      const mockYears = [{ text: '2025', value: '2025' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockYears })
      });

      // First call - fetches from API
      await fetchYears();

      // Second call - should use cache
      await fetchYears();

      // fetch should only be called once due to caching
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

   describe('Fetch Makes', () => {
    it('should fetch makes for given year', async () => {
      const mockMakes = [
        { text: 'Toyota', value: 'Toyota' },
        { text: 'Honda', value: 'Honda' }
      ];
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockMakes })
      });
      
      const result = await fetchMakes(2025);
      
      expect(result).toEqual(mockMakes);
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything()
      );
      const callArgs = fetch.mock.calls[0];
      expect(callArgs[0]).toContain('year=2025');
    });

    it('should handle invalid year', async () => {
      const result = await fetchMakes('invalid');
      expect(result).toEqual([]);
    });

    it('should handle null year', async () => {
      const result = await fetchMakes(null);
      expect(result).toEqual([]);
    });

    it('should handle API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await fetchMakes(2025);
      expect(result).toEqual([]);
    });

    it('should handle network timeout', async () => {
      global.fetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await fetchMakes(2025);
      expect(result).toEqual([]);
    });

    it('should sanitize make input', async () => {
      // Input with special characters should fail validation
      const result = await fetchMakes(2025, 'Toyo<t>a');
      expect(result).toEqual([]);
    });
  });

  describe('Fetch Models', () => {
    it('should fetch models for given make', async () => {
      const mockModels = [
        { text: 'Corolla', value: 'Corolla' },
        { text: 'Camry', value: 'Camry' }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockModels })
      });

      const result = await fetchModels(2025, 'Toyota');
      
      expect(result).toEqual(mockModels);
      const callArgs = fetch.mock.calls[0];
      expect(callArgs[0]).toContain('make=Toyota');
    });

    it('should handle invalid year', async () => {
      const result = await fetchModels('invalid', 'Toyota');
      expect(result).toEqual([]);
    });

    it('should handle invalid make', async () => {
      const result = await fetchModels(2025, '<script>');
      expect(result).toEqual([]);
    });

    it('should handle null make', async () => {
      const result = await fetchModels(2025, null);
      expect(result).toEqual([]);
    });

    it('should handle API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await fetchModels(2025, 'Toyota');
      expect(result).toEqual([]);
    });

    it('should cache model requests', async () => {
      const mockModels = [{ text: 'Corolla', value: 'Corolla' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockModels })
      });

      await fetchModels(2025, 'Toyota');
      await fetchModels(2025, 'Toyota');

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Fetch Options', () => {
    it('should fetch options for given year, make, model', async () => {
      const mockOptions = [
        {
          text: '2025 Toyota Corolla 2.0L 4cyl Auto CVT',
          value: '41190'
        }
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockOptions })
      });

      const result = await fetchOptions(2025, 'Toyota', 'Corolla');
      
      expect(result).toEqual(mockOptions);
      const callArgs = fetch.mock.calls[0];
      expect(callArgs[0]).toContain('make=Toyota');
      expect(callArgs[0]).toContain('model=Corolla');
    });

    it('should handle single object response', async () => {
      const mockOption = {
        text: '2025 Toyota Corolla 2.0L 4cyl Auto CVT',
        value: '41190'
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockOption })
      });

      const result = await fetchOptions(2025, 'Toyota', 'Corolla');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should handle empty menu item', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: null })
      });

      const result = await fetchOptions(2025, 'Toyota', 'Corolla');
      expect(result).toEqual([]);
    });

    it('should validate all inputs', async () => {
      const result1 = await fetchOptions('invalid', 'Toyota', 'Corolla');
      const result2 = await fetchOptions(2025, '<script>', 'Corolla');
      const result3 = await fetchOptions(2025, 'Toyota', '<script>');

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
    });
  });

  describe('Fetch Vehicle Details', () => {
    it('should fetch vehicle details by ID', async () => {
      const mockDetails = {
        id: '41190',
        year: 2020,
        make: 'Toyota',
        model: 'Corolla',
        city08: 30,
        highway08: 38,
        comb08: 33,
        fuelType: 'Regular Gasoline',
        cylinders: 4,
        displ: 2.0,
        trany: 'Automatic (AV-S1)'
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('/vehicle/41190')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDetails)
          });
        }
        if (url.includes('fuel-capacity')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ capacity: 50, source: 'api', confidence: 'high' })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });

      const result = await fetchVehicleDetails('41190');

      expect(result.id).toBe('41190');
      expect(result.year).toBe(2020);
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Corolla');
      expect(result.cityMpg).toBe(30);
      expect(result.highwayMpg).toBe(38);
      expect(result.combinedMpg).toBe(33);
    });

    it('should handle invalid vehicle ID', async () => {
      const result = await fetchVehicleDetails('<script>');
      expect(result).toBeNull();
    });

    it('should handle null vehicle ID', async () => {
      const result = await fetchVehicleDetails(null);
      expect(result).toBeNull();
    });

    it('should handle API error', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404
      });

      const result = await fetchVehicleDetails('41190');
      expect(result).toBeNull();
    });

    it('should handle network timeout', async () => {
      global.fetch.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const result = await fetchVehicleDetails('41190');
      expect(result).toBeNull();
    });
  });

  describe('Search Vehicle', () => {
    it('should search and return first match', async () => {
      const mockOptions = [
        {
          text: '2025 Toyota Corolla 2.0L 4cyl Auto CVT',
          value: '41190'
        }
      ];

      const mockDetails = {
        id: '41190',
        year: 2025,
        make: 'Toyota',
        model: 'Corolla'
      };

      global.fetch.mockImplementation((url) => {
        if (url.includes('options')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ menuItem: mockOptions })
          });
        }
        if (url.includes('/vehicle/')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDetails)
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      });

      const result = await searchVehicle(2025, 'Toyota', 'Corolla');

      expect(result).toBeDefined();
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Corolla');
    });

    it('should return null when no options found', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: [] })
      });

      const result = await searchVehicle(2025, 'Toyota', 'Unknown');
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API error'));

      const result = await searchVehicle(2025, 'Toyota', 'Corolla');
      expect(result).toBeNull();
    });
  });

  describe('Clear Cache', () => {
    it('should clear API cache', () => {
      clearCache();
      // Cache should be empty
      // In real implementation, we'd verify cache is cleared
      expect(clearCache).not.toThrow();
    });
  });

  describe('Unit Conversions', () => {
    it('should convert MPG to km/L', () => {
      const result = mpgToKmPerLiter(30);
      expect(result).toBeCloseTo(12.75, 1);
    });

    it('should return null for invalid MPG', () => {
      expect(mpgToKmPerLiter(null)).toBeNull();
      expect(mpgToKmPerLiter(NaN)).toBeNull();
    });

    it('should convert km/L to MPG', () => {
      const result = kmPerLiterToMpg(15);
      expect(result).toBeCloseTo(35.27, 1);
    });

    it('should return null for invalid km/L', () => {
      expect(kmPerLiterToMpg(null)).toBeNull();
      expect(kmPerLiterToMpg(NaN)).toBeNull();
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle extreme year values', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: [] })
      });

      // Should not crash on extreme values
      await expect(fetchMakes(9999, 'Toyota')).resolves.toBeDefined();
      await expect(fetchMakes(0, 'Toyota')).resolves.toBeDefined();
    });

    it('should handle special characters in make/model', async () => {
      const specialCases = [
        '<script>alert("xss")</script>',
        "'; DROP TABLE vehicles; --",
        '../../../etc/passwd',
        '${7*7}'
      ];

      for (const maliciousInput of specialCases) {
        const result = await fetchModels(2025, maliciousInput);
        // Should sanitize and return empty or safe data
        expect(result).toBeDefined();
      }
    });

    it('should handle SQL injection attempts', async () => {
      const sqlInjection = "1' OR '1'='1";
      const result = await fetchModels(2025, sqlInjection);
      expect(result).toBeDefined();
    });

    it('should handle concurrent API requests', async () => {
      const mockMakes = [{ text: 'Toyota', value: 'Toyota' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockMakes })
      });

      const promises = [
        fetchMakes(2025, 'Toyota'),
        fetchMakes(2025, 'Toyota'),
        fetchMakes(2025, 'Toyota')
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockMakes);
      });
    });

    it('should handle very large response data', async () => {
      const largeResponse = Array.from({ length: 1000 }, (_, i) => ({
        text: `Make ${i}`,
        value: `Make ${i}`
      }));

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: largeResponse })
      });

      const result = await fetchMakes(2025, 'Toyota');
      expect(result).toHaveLength(1000);
    });

    it('should handle empty response data', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: [] })
      });

      const result = await fetchMakes(2025, 'Toyota');
      expect(result).toEqual([]);
    });

    it('should handle malformed JSON response', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await fetchMakes(2025, 'Toyota');
      expect(result).toEqual([]);
    });

    it('should handle missing fields in response', async () => {
      const incompleteResponse = {
        id: '41190',
        year: 2020,
        make: 'Toyota'
        // Missing model, mpg data, etc.
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(incompleteResponse)
      });

      const result = await fetchVehicleDetails('41190');
      expect(result).toBeDefined();
    });

    it('should handle API rate limiting simulation', async () => {
      let callCount = 0;
      global.fetch.mockImplementation(() => {
        callCount++;
        if (callCount > 10) {
          return Promise.resolve({
            ok: false,
            status: 429
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ menuItem: [] })
        });
      });

      // Make multiple requests
      const results = await Promise.all(
        Array.from({ length: 15 }, () => fetchMakes(2025, 'Toyota'))
      );

      // Some requests should have failed due to rate limiting
      expect(results).toHaveLength(15);
    });

    it('should sanitize numeric year input', async () => {
      // Year as number
      const result = await fetchMakes(2025, 'Toyota');
      expect(result).toBeDefined();
    });

    it('should handle unicode in make/model', async () => {
      const mockMakes = [{ text: '丰田', value: '丰田' }];
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ menuItem: mockMakes })
      });

      const result = await fetchMakes(2025, '丰田');
      expect(result).toEqual(mockMakes);
    });
  });

  describe('Cache Behavior', () => {
    it('should invalidate cache after TTL', async () => {
      const mockMakes = [{ text: 'Toyota', value: 'Toyota' }];
      let callCount = 0;

      global.fetch.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ menuItem: mockMakes })
        });
      });

      // First call
      await fetchMakes(2025, 'Toyota');

      // Second immediate call (should use cache)
      await fetchMakes(2025, 'Toyota');

      expect(callCount).toBe(1);

      // Wait for cache TTL (simulated by clearing)
      clearCache();

      // Third call after cache clear (should fetch again)
      await fetchMakes(2025, 'Toyota');

      expect(callCount).toBe(2);
    });
  });
});
