const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
const REQUEST_DELAY = 1000;
let lastRequestTime = 0;

const withRateLimit = async (requestFn) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest));
  }

  lastRequestTime = Date.now();
  return requestFn();
};

export const reverseGeocode = async (lat, lon) => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return null;
  }

  try {
    return await withRateLimit(async () => {
      const params = new URLSearchParams({
        format: 'json',
        lat: lat.toString(),
        lon: lon.toString(),
        zoom: '18',
        addressdetails: '1',
        accept_language: 'en',
      });

      const response = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FuelGuard/1.0 (fuel-tracking-app)',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.error) {
        return null;
      }

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

export const getLocationName = async (lat, lon) => {
  const result = await reverseGeocode(lat, lon);

  if (!result) {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  const parts = [result.components.city, result.components.state].filter(Boolean);
  const locationName = parts.length > 0 ? parts.join(', ') : result.formatted;

  return locationName || result.formatted;
};

export const geocode = async (query) => {
  if (!query || query.trim().length === 0) {
    return null;
  }

  try {
    return await withRateLimit(async () => {
      const params = new URLSearchParams({
        format: 'json',
        q: query.trim(),
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
