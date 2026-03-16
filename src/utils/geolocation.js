/**
 * Geolocation utilities for GPS-based distance tracking
 */

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number}
 */
const toRadians = (degrees) => degrees * (Math.PI / 180);

/**
 * Calculate the Haversine distance between two GPS coordinates
 * Returns straight-line distance in kilometers
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
};

/**
 * Check if geolocation is supported in the browser
 * @returns {boolean}
 */
export const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
};

/**
 * Check current geolocation permission status
 * @returns {Promise<'granted'|'denied'|'prompt'|'unsupported'>}
 */
export const checkLocationPermission = async () => {
    if (!isGeolocationSupported()) {
        return 'unsupported';
    }

    try {
        if ('permissions' in navigator) {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        }
        // Fallback: assume prompt if permissions API not available
        return 'prompt';
    } catch {
        return 'prompt';
    }
};


// Cached position to avoid repeated GPS wakeups
let lastKnownPosition = null;

// Track pending GPS requests to prevent race conditions
let pendingPositionPromise = null;

/**
 * Reset cached position and pending promises (for testing)
 * @internal
 */
export const __resetGeolocationState__ = () => {
    lastKnownPosition = null;
    pendingPositionPromise = null;
};


/**
 * Request location permission with optimized settings for mobile
 * 
 * @returns {Promise<{success: boolean, permission: string, error?: string}>}
 */
export const requestLocationPermission = async () => {
    if (!isGeolocationSupported()) {
        return {
            success: false,
            permission: 'unsupported',
            error: 'Geolocation is not supported by this browser'
        };
    }

    try {
        // Attempt to get position - this triggers permission request
        // Use lower accuracy for permission check to return faster
        await getCurrentPosition({
            timeout: 5000,
            highAccuracy: false,
            maxAge: 300000 // 5 minutes
        });
        return { success: true, permission: 'granted' };
    } catch (error) {
        // Handle errors that might not have a code property
        const errorCode = error.code || 0;
        const errorMessage = error.message || 'Unknown error';
        
        if (errorCode === 1) { // PERMISSION_DENIED
            return { success: false, permission: 'denied', error: errorMessage };
        }
        if (errorCode === 2) { // POSITION_UNAVAILABLE
            return { success: false, permission: 'unknown', error: errorMessage };
        }
        if (errorCode === 3) { // TIMEOUT
            return { success: false, permission: 'unknown', error: errorMessage };
        }
        // Other errors - unknown status
        return { success: false, permission: 'unknown', error: errorMessage };
    }
};

/**
 * Get current GPS position with mobile optimization
 *
 * @param {Object} options - Geolocation options
 * @param {number} options.timeout - Timeout in milliseconds (default: 8000 - faster!)
 * @param {boolean} options.highAccuracy - Use high accuracy mode (default: false - faster!)
 * @param {number} options.maxAge - Maximum age of cached position in ms (default: 60000)
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: number}>}
 */
export const getCurrentPosition = (options = {}) => {
    const {
        timeout = 8000, // Reduced from 15000ms for faster acquisition
        highAccuracy = false, // Default to false for faster GPS lock
        maxAge = 60000,
    } = options;

    return new Promise((resolve, reject) => {
        if (!isGeolocationSupported()) {
            reject(new Error('not supported'));
            return;
        }

        // Return usage of cached position if valid and fresh enough
        if (lastKnownPosition && (Date.now() - lastKnownPosition.timestamp < maxAge)) {
            // Check if accuracy is acceptable for the request
            if (!highAccuracy || (highAccuracy && lastKnownPosition.accuracy < 100)) {
                resolve(lastKnownPosition);
                return;
            }
        }

        // Prevent race conditions: check if there's already a pending request with similar options
        // If so, we'll wait for that one instead of starting a new GPS fetch
        const requestOptions = JSON.stringify({ timeout, highAccuracy, maxAge });
        if (pendingPositionPromise && pendingPositionPromise.options === requestOptions) {
            pendingPositionPromise.promise.then(resolve).catch(reject);
            return;
        }

        // Create new GPS request
        const positionPromise = new Promise((innerResolve, innerReject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                    };
                    lastKnownPosition = pos;
                    innerResolve(pos);
                },
                (error) => {
                    let message;
                    const errorCode = error.code || 0;
                    
                    switch (errorCode) {
                        case 1:  // PERMISSION_DENIED
                            message = 'Please allow location access';
                            break;
                        case 2:  // POSITION_UNAVAILABLE
                            message = 'GPS signal lost';
                            break;
                        case 3:  // TIMEOUT
                            message = 'Acquiring GPS signal timed out';
                            break;
                        default:
                            message = 'Could not get location. Please try manual entry.';
                    }
                    const err = new Error(message);
                    err.code = errorCode;
                    innerReject(err);
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout,
                    maximumAge: maxAge,
                }
            );
        });

        // Track this pending request
        pendingPositionPromise = {
            promise: positionPromise,
            options: requestOptions
        };

        // Clear pending tracking when complete
        // Note: .finally() propagates the rejection to a new chain - suppress it
        // since the rejection is already handled by .then(resolve).catch(reject) below
        positionPromise.finally(() => {
            pendingPositionPromise = null;
        }).catch(() => {});

        positionPromise.then(resolve).catch(reject);
    });
};

/**
 * Get current GPS position with QUICK mode (very fast, lower accuracy)
 * Use this for initial position fix, then get accurate position if needed
 * 
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: number}>}
 */
export const getQuickPosition = () => {
    return getCurrentPosition({
        timeout: 5000, // 5 second timeout
        highAccuracy: false, // Low accuracy for speed
        maxAge: 300000, // Accept 5-minute old positions
    });
};

/**
 * Get current GPS position with HIGH accuracy mode (slower but precise)
 * 
 * @returns {Promise<{lat: number, lng: number, accuracy: number, timestamp: number}>}
 */
export const getAccuratePosition = () => {
    return getCurrentPosition({
        timeout: 12000, // 12 second timeout
        highAccuracy: true, // High accuracy GPS
        maxAge: 0, // Get fresh position only
    });
};

/**
 * Calculate distance between current position and a saved location
 *
 * @param {Object} savedLocation - Previously saved location {lat, lng}
 * @returns {Promise<{distance: number, currentLocation: Object}|null>}
 */
export const calculateDistanceFromSaved = async (savedLocation) => {
    if (!savedLocation || !savedLocation.lat || !savedLocation.lng) {
        return null;
    }

    try {
        // High accuracy for actual distance calculation
        const current = await getCurrentPosition({ highAccuracy: true, timeout: 10000 });
        const distance = calculateHaversineDistance(
            savedLocation.lat,
            savedLocation.lng,
            current.lat,
            current.lng
        );

        return {
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            currentLocation: current,
        };
    } catch (err) {
        console.error("GPS Calc Error:", err);
        return null;
    }
};

/**
 * Start watching GPS position for real-time updates
 *
 * @param {Function} onSuccess - Callback called with new position
 * @param {Function} onError - Callback called on error
 * @returns {number} Watch ID to stop watching
 */
export const watchPosition = (onSuccess, onError) => {
    return navigator.geolocation.watchPosition(
        (position) => {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
            };
            lastKnownPosition = pos;
            onSuccess(pos);
        },
        (error) => {
            let message;
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = 'Please allow location access in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = 'GPS signal lost. Please go outdoors or enable Wi-Fi.';
                    break;
                case error.TIMEOUT:
                    message = 'Acquiring GPS signal timed out. Please try again.';
                    break;
                default:
                    message = 'Could not get location. Please try manual entry.';
            }
            const err = new Error(message);
            err.code = error.code;
            onError(err);
        },
        {
            enableHighAccuracy: false,  // Use all sources (GPS, Wi-Fi, cell) for speed
            timeout: 8000,
            maximumAge: 60000,
        }
    );
};

/**
 * Stop watching GPS position
 *
 * @param {number} watchId - The watch ID returned by watchPosition
 */
export const clearWatch = (watchId) => {
    if (watchId !== null && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
    }
};

/**
 * Format a location object for display
 * @param {Object} location - {lat, lng}
 * @returns {string}
 */
export const formatLocation = (location) => {
    if (!location || !location.lat || !location.lng) {
        return 'Unknown';
    }
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
};

export default {
    calculateHaversineDistance,
    isGeolocationSupported,
    checkLocationPermission,
    requestLocationPermission,
    getCurrentPosition,
    calculateDistanceFromSaved,
    formatLocation,
};

