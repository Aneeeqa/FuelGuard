/**
 * Community MPG Service - FuelEconomy.gov My MPG Data
 * 
 * Fetches real-world MPG data reported by users from FuelEconomy.gov
 */

const CORS_PROXY = 'https://corsproxy.io/?';
const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

// Session storage key for caching
const CACHE_KEY_PREFIX = 'fuelguard_community_mpg_';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached data from session storage
 * @param {string} vehicleId 
 * @returns {Object|null}
 */
const getCached = (vehicleId) => {
    try {
        const key = CACHE_KEY_PREFIX + vehicleId;
        const cached = sessionStorage.getItem(key);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch {
        return null;
    }
};

/**
 * Save data to session storage cache
 * @param {string} vehicleId 
 * @param {Object} data 
 */
const setCache = (vehicleId, data) => {
    try {
        const key = CACHE_KEY_PREFIX + vehicleId;
        sessionStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    } catch {
        // Ignore storage errors
    }
};

/**
 * Fetch community MPG data for a specific vehicle
 * Returns average MPG reported by real users
 * 
 * @param {string|number} vehicleId - FuelEconomy.gov vehicle ID
 * @returns {Promise<{avgMpg: number, count: number, minMpg: number, maxMpg: number}|null>}
 */
export const fetchCommunityMpg = async (vehicleId) => {
    if (!vehicleId) return null;

    // Check cache first
    const cached = getCached(vehicleId);
    if (cached) return cached;

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(BASE_URL + '/ympg/shared/ympgVehicle/' + vehicleId)}`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch community MPG');
        }

        const data = await response.json();

        // Parse the response
        const result = {
            avgMpg: parseFloat(data.avgMpg) || null,
            count: parseInt(data.count, 10) || 0,
            minMpg: parseFloat(data.minMpg) || null,
            maxMpg: parseFloat(data.maxMpg) || null,
        };

        // Only cache if we have valid data
        if (result.avgMpg && result.count > 0) {
            setCache(vehicleId, result);
        }

        return result;
    } catch (error) {
        console.error('Error fetching community MPG:', error);
        return null;
    }
};

/**
 * Fetch individual user MPG reports for a vehicle
 * @param {string|number} vehicleId 
 * @returns {Promise<Array>}
 */
export const fetchDriverReports = async (vehicleId) => {
    if (!vehicleId) return [];

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(BASE_URL + '/ympg/shared/ympgDriverVehicle/' + vehicleId)}`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) return [];

        const data = await response.json();
        const items = data.ympgDriverVehicle;

        if (!items) return [];
        return Array.isArray(items) ? items : [items];
    } catch {
        return [];
    }
};

/**
 * Convert community MPG to km/L
 * @param {Object} communityData 
 * @returns {Object|null}
 */
export const convertCommunityToKmL = (communityData) => {
    if (!communityData?.avgMpg) return null;

    const conversionFactor = 0.425144; // MPG to km/L

    return {
        avgKmL: Math.round(communityData.avgMpg * conversionFactor * 10) / 10,
        count: communityData.count,
        minKmL: communityData.minMpg ? Math.round(communityData.minMpg * conversionFactor * 10) / 10 : null,
        maxKmL: communityData.maxMpg ? Math.round(communityData.maxMpg * conversionFactor * 10) / 10 : null,
    };
};

/**
 * Clear all community MPG cache
 */
export const clearCommunityCache = () => {
    try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key?.startsWith(CACHE_KEY_PREFIX)) {
                keys.push(key);
            }
        }
        keys.forEach(key => sessionStorage.removeItem(key));
    } catch {
        // Ignore errors
    }
};

export default {
    fetchCommunityMpg,
    fetchDriverReports,
    convertCommunityToKmL,
    clearCommunityCache,
};
