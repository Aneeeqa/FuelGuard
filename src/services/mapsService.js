/**
 * Maps Service - Distance Calculation & Routing
 *
 * Supports both Google Maps (requires API key) and OpenStreetMap/OSRM (free, no API key)
 * Falls back to free alternatives when Google Maps API key is not configured
 */

// Cache for route calculations
const routeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Check if Google Maps API key is configured
 * @returns {boolean}
 */
export const isGoogleMapsConfigured = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
};

/**
 * Calculate driving distance using Google Maps Directions API
 * (Requires API key)
 *
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<{distance: number, duration: number}|null>} distance in km, duration in minutes
 */
const calculateGoogleMapsDistance = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    // Check cache
    const cacheKey = `google-${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
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
 * Calculate driving distance using OSRM (Open Source Routing Machine)
 * (Free, no API key required)
 *
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<{distance: number, duration: number}|null>} distance in km, duration in minutes
 */
const calculateOSRMDistance = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    // Check cache
    const cacheKey = `osrm-${origin.lat},${origin.lng}-${destination.lat},${destination.lng}`;
    const cached = routeCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('OSRM API request failed');
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes?.[0]) {
            return null;
        }

        const route = data.routes[0];
        const result = {
            distance: route.distance / 1000, // Convert meters to km
            duration: Math.round(route.duration / 60), // Convert seconds to minutes
        };

        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('OSRM API error:', error);
        return null;
    }
};

/**
 * Calculate driving distance between two points
 * Tries Google Maps first (if API key is configured), falls back to OSRM (free)
 *
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<{distance: number, duration: number, provider: string}|null>} distance in km, duration in minutes, provider name
 */
export const calculateDrivingDistance = async (origin, destination) => {
    // Validate inputs
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    // Try Google Maps first if API key is configured
    if (isGoogleMapsConfigured()) {
        try {
            const result = await calculateGoogleMapsDistance(origin, destination);
            if (result) {
                return { ...result, provider: 'Google Maps' };
            }
        } catch (error) {
            console.warn('Google Maps failed, falling back to OSRM:', error.message);
        }
    }

    // Fallback to OSRM (free, no API key)
    const osrmResult = await calculateOSRMDistance(origin, destination);
    if (osrmResult) {
        return { ...osrmResult, provider: 'OpenStreetMap (OSRM)' };
    }

    return null;
};

/**
 * Get a static map image URL for a route (Google Maps only)
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
 * Get OSRM route geometry for plotting on maps
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Array<{lat: number, lng: number}>|null>}
 */
export const getRouteGeometry = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('OSRM route geometry request failed');
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
            return null;
        }

        // OSRM returns coordinates as [lng, lat], need to convert to [lat, lng]
        return data.routes[0].geometry.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0],
        }));
    } catch (error) {
        console.error('OSRM route geometry error:', error);
        return null;
    }
};

/**
 * Initialize Google Maps JavaScript API
 * Call this if you need interactive maps with Google Maps
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
    getRouteGeometry,
    loadGoogleMapsScript,
    clearRouteCache,
};
