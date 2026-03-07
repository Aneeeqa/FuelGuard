/**
 * Google Maps Service - Distance Calculation
 * 
 * Uses Google Maps Directions API for accurate road-based distance
 * Requires VITE_GOOGLE_MAPS_API_KEY in environment
 */

// Cache for route calculations
const routeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Check if Google Maps API key is configured
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
    return !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
};

/**
 * Calculate driving distance between two points using Google Directions API
 * 
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<{distance: number, duration: number}|null>} distance in km, duration in minutes
 */
export const calculateDrivingDistance = async (origin, destination) => {
    if (!isGoogleMapsConfigured()) {
        console.warn('Google Maps API key not configured');
        return null;
    }

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    // Check cache
    const cacheKey = `${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
        url.searchParams.set('destination', `${destination.lat},${destination.lng}`);
        url.searchParams.set('mode', 'driving');
        url.searchParams.set('key', apiKey);

        // Note: Direct API calls from browser will fail due to CORS
        // In production, use a backend proxy or Google Maps JavaScript API
        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error('Directions API request failed');
        }

        const data = await response.json();

        if (data.status !== 'OK' || !data.routes?.[0]?.legs?.[0]) {
            return null;
        }

        const leg = data.routes[0].legs[0];
        const result = {
            distance: leg.distance.value / 1000, // Convert meters to km
            duration: Math.round(leg.duration.value / 60), // Convert seconds to minutes
        };

        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('Google Maps API error:', error);
        return null;
    }
};

/**
 * Get a static map image URL for a route
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string|null}
 */
export const getRouteMapUrl = (origin, destination, width = 400, height = 200) => {
    if (!isGoogleMapsConfigured()) return null;
    if (!origin?.lat || !destination?.lat) return null;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const path = `color:0x3B82F6|weight:3|${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;

    return `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&path=${encodeURIComponent(path)}&markers=color:green|${origin.lat},${origin.lng}&markers=color:red|${destination.lat},${destination.lng}&key=${apiKey}`;
};

/**
 * Initialize Google Maps JavaScript API
 * Call this if you need interactive maps
 * @returns {Promise<void>}
 */
export const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) {
            resolve();
            return;
        }

        if (!isGoogleMapsConfigured()) {
            reject(new Error('Google Maps API key not configured'));
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
    });
};

/**
 * Clear the route cache
 */
export const clearRouteCache = () => {
    routeCache.clear();
};

export default {
    isGoogleMapsConfigured,
    calculateDrivingDistance,
    getRouteMapUrl,
    loadGoogleMapsScript,
    clearRouteCache,
};
