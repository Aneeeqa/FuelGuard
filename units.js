/**
 * Vehicle API Service - FuelEconomy.gov Integration
 * 
 * Uses the free EPA FuelEconomy.gov API to fetch vehicle data
 * API Docs: https://www.fueleconomy.gov/feg/ws/index.shtml
 */

// CORS proxy for development (FuelEconomy.gov doesn't support CORS)
const CORS_PROXY = 'https://corsproxy.io/?';
const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

// Cache for API responses to minimize calls
const apiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Make an API request with CORS proxy and caching
 * @param {string} endpoint 
 * @returns {Promise<any>}
 */
const fetchWithProxy = async (endpoint) => {
    const cacheKey = endpoint;
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${CORS_PROXY}${encodeURIComponent(BASE_URL + endpoint)}`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    } catch (error) {
        console.error('Vehicle API error:', error);
        throw error;
    }
};

/**
 * Fetch available model years (1984 - present)
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchYears = async () => {
    try {
        const data = await fetchWithProxy('/vehicle/menu/year');
        return data.menuItem || [];
    } catch {
        // Fallback: generate years from 1984 to current year
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear + 1; year >= 1984; year--) {
            years.push({ text: String(year), value: String(year) });
        }
        return years;
    }
};

/**
 * Fetch makes for a given year
 * @param {string|number} year 
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchMakes = async (year) => {
    if (!year) return [];

    try {
        const data = await fetchWithProxy(`/vehicle/menu/make?year=${year}`);
        return data.menuItem || [];
    } catch (error) {
        console.error('Error fetching makes:', error);
        return [];
    }
};

/**
 * Fetch models for a given year and make
 * @param {string|number} year 
 * @param {string} make 
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchModels = async (year, make) => {
    if (!year || !make) return [];

    try {
        const data = await fetchWithProxy(`/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`);
        return data.menuItem || [];
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
};

/**
 * Fetch vehicle options/variants for a given year, make, and model
 * Returns vehicle IDs that can be used to fetch full details
 * @param {string|number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchOptions = async (year, make, model) => {
    if (!year || !make || !model) return [];

    try {
        const data = await fetchWithProxy(
            `/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
        );
        // Normalize - API may return single object or array
        const items = data.menuItem;
        if (!items) return [];
        return Array.isArray(items) ? items : [items];
    } catch (error) {
        console.error('Error fetching options:', error);
        return [];
    }
};

/**
 * Fetch full vehicle details by vehicle ID
 * @param {string|number} vehicleId 
 * @returns {Promise<Object|null>}
 */
export const fetchVehicleDetails = async (vehicleId) => {
    if (!vehicleId) return null;

    try {
        const data = await fetchWithProxy(`/vehicle/${vehicleId}`);

        // Transform to our app's schema
        return {
            id: data.id,
            year: parseInt(data.year, 10),
            make: data.make,
            model: data.model,
            variant: data.trany || data.VClass || '',

            // MPG data (convert to km/L if needed, but keeping MPG for EPA comparison)
            cityMpg: parseFloat(data.city08) || null,
            highwayMpg: parseFloat(data.highway08) || null,
            combinedMpg: parseFloat(data.comb08) || null,

            // Additional info
            fuelType: data.fuelType || data.fuelType1 || 'Regular Gasoline',
            cylinders: parseInt(data.cylinders, 10) || null,
            displacement: parseFloat(data.displ) || null,
            transmission: data.trany || '',
            driveType: data.drive || '',
            vehicleClass: data.VClass || '',

            // CO2 emissions
            co2: parseFloat(data.co2TailpipeGpm) || null,
        };
    } catch (error) {
        console.error('Error fetching vehicle details:', error);
        return null;
    }
};

/**
 * Convert MPG to km/L
 * @param {number} mpg 
 * @returns {number}
 */
export const mpgToKmPerLiter = (mpg) => {
    if (!mpg || isNaN(mpg)) return null;
    // 1 MPG = 0.425144 km/L
    return Math.round(mpg * 0.425144 * 10) / 10;
};

/**
 * Convert km/L to MPG
 * @param {number} kmPerLiter 
 * @returns {number}
 */
export const kmPerLiterToMpg = (kmPerLiter) => {
    if (!kmPerLiter || isNaN(kmPerLiter)) return null;
    return Math.round(kmPerLiter / 0.425144 * 10) / 10;
};

/**
 * Search for a vehicle by year/make/model and return the first match
 * Convenience function for quick lookups
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<Object|null>}
 */
export const searchVehicle = async (year, make, model) => {
    try {
        const options = await fetchOptions(year, make, model);
        if (options.length === 0) return null;

        // Get details for the first option
        return await fetchVehicleDetails(options[0].value);
    } catch {
        return null;
    }
};

/**
 * Clear the API cache
 */
export const clearCache = () => {
    apiCache.clear();
};

// ============================================
// Pakistani Vehicle Database Functions
// ============================================

// Cache for Pakistani vehicles
let pakistaniVehiclesCache = null;

/**
 * Load Pakistani vehicles from static JSON
 * @returns {Promise<Object>}
 */
export const loadPakistaniVehicles = async () => {
    if (pakistaniVehiclesCache) {
        return pakistaniVehiclesCache;
    }

    try {
        const response = await fetch('/data/vehicles-pk.json');
        if (!response.ok) {
            throw new Error('Failed to load Pakistani vehicles');
        }
        pakistaniVehiclesCache = await response.json();
        return pakistaniVehiclesCache;
    } catch (error) {
        console.error('Error loading Pakistani vehicles:', error);
        return { vehicles: [] };
    }
};

/**
 * Get list of makes for Pakistani vehicles
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchPakistaniMakes = async () => {
    const data = await loadPakistaniVehicles();
    const makes = [...new Set(data.vehicles.map(v => v.make))];
    return makes.map(make => ({ text: make, value: make }));
};

/**
 * Get models for a Pakistani make
 * @param {string} make 
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchPakistaniModels = async (make) => {
    if (!make) return [];

    const data = await loadPakistaniVehicles();
    const models = data.vehicles
        .filter(v => v.make === make)
        .map(v => v.model);

    return [...new Set(models)].map(model => ({ text: model, value: model }));
};

/**
 * Get years for a Pakistani make/model
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchPakistaniYears = async (make, model) => {
    if (!make || !model) return [];

    const data = await loadPakistaniVehicles();
    const vehicle = data.vehicles.find(v => v.make === make && v.model === model);

    if (!vehicle) return [];

    return vehicle.years
        .sort((a, b) => b - a)
        .map(year => ({ text: String(year), value: String(year) }));
};

/**
 * Get variants for a Pakistani vehicle
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<Array<{text: string, value: string, data: Object}>>}
 */
export const fetchPakistaniVariants = async (make, model) => {
    if (!make || !model) return [];

    const data = await loadPakistaniVehicles();
    const vehicle = data.vehicles.find(v => v.make === make && v.model === model);

    if (!vehicle || !vehicle.variants) return [];

    return vehicle.variants.map(variant => ({
        text: variant.name,
        value: variant.name,
        data: variant,
    }));
};

/**
 * Get full details for a Pakistani vehicle variant
 * @param {string} make 
 * @param {string} model 
 * @param {string} variantName 
 * @param {number} year 
 * @returns {Object|null}
 */
export const getPakistaniVehicleDetails = async (make, model, variantName, year) => {
    const data = await loadPakistaniVehicles();
    const vehicle = data.vehicles.find(v => v.make === make && v.model === model);

    if (!vehicle) return null;

    const variant = vehicle.variants.find(v => v.name === variantName);
    if (!variant) return null;

    return {
        id: `pk-${make}-${model}-${variantName}`.toLowerCase().replace(/\s+/g, '-'),
        year: parseInt(year, 10),
        make,
        model,
        variant: variantName,

        // Pakistani vehicles use km/L directly (no conversion needed)
        cityMpg: null,
        highwayMpg: null,
        combinedMpg: null,

        // Direct km/L values
        expectedMileage: variant.expectedMileage,

        fuelType: variant.fuelType,
        tankCapacity: variant.tankCapacity,
        engine: variant.engine,

        // Mark as local data source
        dataSource: 'local-pk',
    };
};

/**
 * Get vehicles by country - dispatcher function
 * @param {string} countryCode 
 * @returns {Object} Functions for the specified country
 */
export const getVehicleAPIForCountry = (countryCode) => {
    if (countryCode === 'PK') {
        return {
            fetchMakes: fetchPakistaniMakes,
            fetchModels: fetchPakistaniModels,
            fetchYears: fetchPakistaniYears,
            fetchVariants: fetchPakistaniVariants,
            getVehicleDetails: getPakistaniVehicleDetails,
            usesYearFirst: false, // Pakistani flow: Make → Model → Year → Variant
        };
    }

    // Default: EPA API (US, UK, etc)
    return {
        fetchMakes,
        fetchModels,
        fetchYears,
        fetchVariants: fetchOptions,
        getVehicleDetails: fetchVehicleDetails,
        usesYearFirst: true, // EPA flow: Year → Make → Model → Variant
    };
};

export default {
    // EPA API functions
    fetchYears,
    fetchMakes,
    fetchModels,
    fetchOptions,
    fetchVehicleDetails,
    searchVehicle,
    mpgToKmPerLiter,
    kmPerLiterToMpg,
    clearCache,

    // Pakistani vehicle functions
    loadPakistaniVehicles,
    fetchPakistaniMakes,
    fetchPakistaniModels,
    fetchPakistaniYears,
    fetchPakistaniVariants,
    getPakistaniVehicleDetails,

    // Country dispatcher
    getVehicleAPIForCountry,
};
