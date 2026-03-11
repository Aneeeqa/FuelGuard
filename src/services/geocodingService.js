/**
 * OpenStreetMap Nominatim Reverse Geocoding Service
 * Free, no API key required fallback for Google Maps
 *
 * Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Limit: 1 request per second
 * - Provide User-Agent header
 */

import { validateLatitude, validateLongitude, sanitizeQuery } from '../utils/validation';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_DELAY = 1000; // 1 second between requests (Nominatim policy)
let lastRequestTime = 0;

/**
 * Rate limiting wrapper for Nominatim requests
 * @param {Function} requestFn - The request function to execute
 * @returns {Promise}
 */
const withRateLimit = async (requestFn) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return requestFn();
};

/**
 * Perform reverse geocoding using OpenStreetMap Nominatim
 * Converts lat/lon coordinates to human-readable address
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{formatted: string, components: Object}|null>}
 */
export const reverseGeocode = async (lat, lon) => {
  // Validate coordinates before API call
  const latValidation = validateLatitude(lat);
  const lonValidation = validateLongitude(lon);

  if (!latValidation.valid) {
    console.error('Invalid latitude for reverse geocoding:', latValidation.error);
    console.warn('Security: Invalid latitude input detected:', { input: lat, error: latValidation.error });
    return null;
  }

  if (!lonValidation.valid) {
    console.error('Invalid longitude for reverse geocoding:', lonValidation.error);
    console.warn('Security: Invalid longitude input detected:', { input: lon, error: lonValidation.error });
    return null;
  }

  try {
    return await withRateLimit(async () => {
      const params = new URLSearchParams({
        format: 'json',
        lat: latValidation.value.toString(),
        lon: lonValidation.value.toString(),
        zoom: '18', // Building level
        addressdetails: '1', // Include address components
        accept_language: 'en', // Force English results
      });

      const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FuelGuard (fuel-tracking-app)', // Required by Nominatim policy
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.error) {
        console.warn('Nominatim returned error:', data?.error);
        return null;
      }

      // Parse the response
      const formatted = data.display_name || 'Unknown Location';

      const components = {
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || data.address?.state_district || '',
        country: data.address?.country || '',
        postcode: data.address?.postcode || '',
        road: data.address?.road || '',
        house_number: data.address?.house_number || '',
      };

      return { formatted, components };
    });
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return null;
  }
};

/**
 * Get simplified location name (city, state, country)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<string>}
 */
export const getLocationName = async (lat, lon) => {
  const result = await reverseGeocode(lat, lon);

  if (!result) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  const parts = [result.components.city, result.components.state].filter(Boolean);
  const locationName = parts.length > 0 ? parts.join(', ') : result.formatted;

  return locationName || result.formatted;
};

/**
 * Geocoding (address to coordinates) - forward geocoding
 *
 * @param {string} query - Address or place name
 * @returns {Promise<Array<{lat: number, lon: number, formatted: string}>|null>}
 */
export const geocode = async (query) => {
  // Validate and sanitize query
  const queryValidation = sanitizeQuery(query);

  if (!queryValidation.valid) {
    console.error('Invalid query for geocoding:', queryValidation.error);
    console.warn('Security: Invalid geocoding query detected:', { input: query, error: queryValidation.error });
    return null;
  }

  try {
    return await withRateLimit(async () => {
      const params = new URLSearchParams({
        format: 'json',
        q: queryValidation.value,
        limit: '5',
        addressdetails: '1',
        accept_language: 'en',
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FuelGuard/1.0 (fuel-tracking-app)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim search error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return null;
      }

      return data.map(result => ({
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        formatted: result.display_name,
        importance: result.importance,
      })).sort((a, b) => b.importance - a.importance);
    });
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
};

/**
 * Batch reverse geocode multiple locations with rate limiting
 * @param {Array<{lat: number, lon: number}>} locations - Array of coordinates
 * @returns {Promise<Array<{location: Object, result: Object|null}>>}
 */
export const batchReverseGeocode = async (locations) => {
  const results = [];

  for (const location of locations) {
    const result = await reverseGeocode(location.lat, location.lon);
    results.push({ location, result });
  }

  return results;
};

export default {
  reverseGeocode,
  getLocationName,
  geocode,
  batchReverseGeocode,
};
