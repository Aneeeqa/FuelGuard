const CORS_PROXY = 'https://corsproxy.io/?';
const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

const CACHE_KEY_PREFIX = 'fuelguard_community_mpg_';
const CACHE_TTL = 24 * 60 * 60 * 1000;

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

const setCache = (vehicleId, data) => {
    try {
        const key = CACHE_KEY_PREFIX + vehicleId;
        sessionStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now(),
        }));
    } catch {
    }
};

export const fetchCommunityMpg = async (vehicleId) => {
    if (!vehicleId) return null;

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

        const result = {
            avgMpg: parseFloat(data.avgMpg) || null,
            count: parseInt(data.count, 10) || 0,
            minMpg: parseFloat(data.minMpg) || null,
            maxMpg: parseFloat(data.maxMpg) || null,
        };

        if (result.avgMpg && result.count > 0) {
            setCache(vehicleId, result);
        }

        return result;
    } catch (error) {
        console.error('Error fetching community MPG:', error);
        return null;
    }
};

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

export const convertCommunityToKmL = (communityData) => {
    if (!communityData?.avgMpg) return null;

    const conversionFactor = 0.425144;

    return {
        avgKmL: Math.round(communityData.avgMpg * conversionFactor * 10) / 10,
        count: communityData.count,
        minKmL: communityData.minMpg ? Math.round(communityData.minMpg * conversionFactor * 10) / 10 : null,
        maxKmL: communityData.maxMpg ? Math.round(communityData.maxMpg * conversionFactor * 10) / 10 : null,
    };
};

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
    }
};

export default {
    fetchCommunityMpg,
    fetchDriverReports,
    convertCommunityToKmL,
    clearCommunityCache,
};
