/**
 * Utility to check Google Maps API availability
 */

/**
 * Check if Google Maps API key is configured and valid
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
};

/**
 * Check if Google Maps script has loaded successfully
 * @returns {boolean}
 */
export const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

/**
 * Check if we can use Google Maps (API key configured + script loaded)
 * @returns {boolean}
 */
export const canUseGoogleMaps = () => {
  return isGoogleMapsConfigured() && isGoogleMapsLoaded();
};

/**
 * Get the name of the geocoding service being used
 * @returns {string}
 */
export const getGeocodingServiceName = () => {
  if (canUseGoogleMaps()) {
    return 'Google Maps';
  }
  return 'OpenStreetMap (Nominatim)';
};

/**
 * Get user-friendly message about geocoding service
 * @returns {string}
 */
export const getGeocodingServiceMessage = () => {
  if (isGoogleMapsConfigured()) {
    return 'Using Google Maps for location data';
  }
  return 'Using OpenStreetMap for location data (no API key required)';
};

export default {
  isGoogleMapsConfigured,
  isGoogleMapsLoaded,
  canUseGoogleMaps,
  getGeocodingServiceName,
  getGeocodingServiceMessage,
};
