const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => degrees * (Math.PI / 180);

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

export const isGeolocationSupported = () => {
    return 'geolocation' in navigator;
};

export const checkLocationPermission = async () => {
    if (!isGeolocationSupported()) {
        return 'unsupported';
    }

    try {
        if ('permissions' in navigator) {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        }
        return 'prompt';
    } catch {
        return 'prompt';
    }
};


let lastKnownPosition = null;

let pendingPositionPromise = null;


export const requestLocationPermission = async () => {
    if (!isGeolocationSupported()) {
        return {
            success: false,
            permission: 'unsupported',
            error: 'Geolocation is not supported by this browser'
        };
    }

    try {
        await getCurrentPosition({
            timeout: 5000,
            highAccuracy: false,
            maxAge: 300000
        });
        return { success: true, permission: 'granted' };
    } catch (error) {
        if (error.code === 1) {
            return { success: false, permission: 'denied', error: 'Location permission denied' };
        }
        if (error.code === 2) {
            return { success: false, permission: 'unknown', error: error.message };
        }
        if (error.code === 3) {
            return { success: false, permission: 'unknown', error: error.message };
        }
        return { success: false, permission: 'unknown', error: error.message };
    }
};

export const getCurrentPosition = (options = {}) => {
    const {
        timeout = 8000,
        highAccuracy = false,
        maxAge = 60000,
    } = options;

    return new Promise((resolve, reject) => {
        if (!isGeolocationSupported()) {
            reject(new Error('Geolocation is not supported'));
            return;
        }

        if (lastKnownPosition && (Date.now() - lastKnownPosition.timestamp < maxAge)) {
            if (!highAccuracy || (highAccuracy && lastKnownPosition.accuracy < 100)) {
                resolve(lastKnownPosition);
                return;
            }
        }

        const requestOptions = JSON.stringify({ timeout, highAccuracy, maxAge });
        if (pendingPositionPromise && pendingPositionPromise.options === requestOptions) {
            pendingPositionPromise.promise.then(resolve).catch(reject);
            return;
        }

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
                        case 1:
                            message = 'Please allow location access in your browser settings.';
                            break;
                        case 2:
                            message = 'GPS signal lost. Please go outdoors or enable Wi-Fi.';
                            break;
                        case 3:
                            message = 'Acquiring GPS signal timed out. Please try again.';
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

        pendingPositionPromise = {
            promise: positionPromise,
            options: requestOptions
        };

        positionPromise.finally(() => {
            pendingPositionPromise = null;
        });

        positionPromise.then(resolve).catch(reject);
    });
};

export const getQuickPosition = () => {
    return getCurrentPosition({
        timeout: 5000,
        highAccuracy: false,
        maxAge: 300000,
    });
};

export const getAccuratePosition = () => {
    return getCurrentPosition({
        timeout: 12000,
        highAccuracy: true,
        maxAge: 0,
    });
};

export const calculateDistanceFromSaved = async (savedLocation) => {
    if (!savedLocation || !savedLocation.lat || !savedLocation.lng) {
        return null;
    }

    try {
        const current = await getCurrentPosition({ highAccuracy: true, timeout: 10000 });
        const distance = calculateHaversineDistance(
            savedLocation.lat,
            savedLocation.lng,
            current.lat,
            current.lng
        );

        return {
            distance: Math.round(distance * 10) / 10,
            currentLocation: current,
        };
    } catch (err) {
        console.error("GPS Calc Error:", err);
        return null;
    }
};

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
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
        }
    );
};

export const clearWatch = (watchId) => {
    if (watchId !== null && watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
    }
};

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
