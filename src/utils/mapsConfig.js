/**
 * Check if Google Maps API key is configured and valid
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
};

export const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps;
};

export const canUseGoogleMaps = () => {
  return isGoogleMapsConfigured() && isGoogleMapsLoaded();
};

export const getGeocodingServiceName = () => {
  if (canUseGoogleMaps()) {
    return 'Google Maps';
  }
  return 'OpenStreetMap (Nominatim)';
};

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
