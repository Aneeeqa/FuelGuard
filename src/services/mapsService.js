const routeCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export const isGoogleMapsConfigured = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
};

const calculateGoogleMapsDistance = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

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
            distance: leg.distance.value / 1000,
            duration: Math.round(leg.duration.value / 60),
        };

        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('Google Maps API error:', error);
        return null;
    }
};

const calculateOSRMDistance = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

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
            distance: route.distance / 1000,
            duration: Math.round(route.duration / 60),
        };

        routeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('OSRM API error:', error);
        return null;
    }
};

export const calculateDrivingDistance = async (origin, destination) => {
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
        return null;
    }

    if (isGoogleMapsConfigured()) {
        try {
            const result = await calculateGoogleMapsDistance(origin, destination);
            if (result) {
                return { ...result, provider: 'Google Maps' };
            }
      } catch (error) {
      return null;
    }
    }

    const osrmResult = await calculateOSRMDistance(origin, destination);
    if (osrmResult) {
        return { ...osrmResult, provider: 'OpenStreetMap (OSRM)' };
    }

    return null;
};

export const getRouteMapUrl = (origin, destination, width = 400, height = 200) => {
    if (!isGoogleMapsConfigured()) return null;
    if (!origin?.lat || !destination?.lat) return null;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const path = `color:0x3B82F6|weight:3|${origin.lat},${origin.lng}|${destination.lat},${destination.lng}`;

    return `https://maps.googleapis.com/maps/api/staticmap?size=${width}x${height}&path=${encodeURIComponent(path)}&markers=color:green|${origin.lat},${origin.lng}&markers=color:red|${destination.lat},${destination.lng}&key=${apiKey}`;
};

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

        return data.routes[0].geometry.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0],
        }));
    } catch (error) {
        console.error('OSRM route geometry error:', error);
        return null;
    }
};

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
