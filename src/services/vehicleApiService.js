/**
 * Vehicle API Service - FuelEconomy.gov Integration
 *
 * Uses the free EPA FuelEconomy.gov API to fetch vehicle data
 * API Docs: https://www.fueleconomy.gov/feg/ws/index.shtml
 */

import { getFuelTankCapacity, estimateEnhancedTankCapacity } from './fuelCapacityService';
import {
  validateYear,
  validateMake,
  validateModel,
  validateVehicleId,
} from '../utils/validation';

// Re-export for backward compatibility
export const estimateFuelTankCapacity = estimateEnhancedTankCapacity;

// API Configuration
// In production: use backend proxy server
// In development: can use direct API or proxy depending on VITE_API_BASE_URL
const USE_PROXY = import.meta.env.VITE_USE_PROXY === 'true';
const PROXY_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/fueleconomy';
const EPA_BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

// Determine which base URL to use
const BASE_URL = USE_PROXY ? PROXY_BASE_URL : EPA_BASE_URL;

// Cache for API responses to minimize calls
const apiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Make an API request with caching
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
        // Construct URL based on proxy mode
        let url;
        if (USE_PROXY) {
            // Using backend proxy: prepend proxy base URL
            url = `${BASE_URL}/${endpoint}`;
        } else {
            // Direct API call (development mode with Vite proxy)
            url = `${BASE_URL}/${endpoint}`;
        }

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
    // Validate year before API call
    const yearValidation = validateYear(year);

    if (!yearValidation.valid) {
        console.error('Invalid year parameter:', yearValidation.error);
        // Security log: potential API abuse attempt
        console.warn('Security: Invalid year input detected:', { input: year, error: yearValidation.error });
        return [];
    }

    try {
        const data = await fetchWithProxy(`/vehicle/menu/make?year=${yearValidation.value}`);
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
    // Validate inputs
    const yearValidation = validateYear(year);
    const makeValidation = validateMake(make);

    if (!yearValidation.valid) {
        console.error('Invalid year parameter:', yearValidation.error);
        console.warn('Security: Invalid year input detected:', { input: year, error: yearValidation.error });
        return [];
    }

    if (!makeValidation.valid) {
        console.error('Invalid make parameter:', makeValidation.error);
        console.warn('Security: Invalid make input detected:', { input: make, error: makeValidation.error });
        return [];
    }

    try {
        const data = await fetchWithProxy(
            `/vehicle/menu/model?year=${yearValidation.value}&make=${encodeURIComponent(makeValidation.value)}`
        );
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
    // Validate all inputs
    const yearValidation = validateYear(year);
    const makeValidation = validateMake(make);
    const modelValidation = validateModel(model);

    if (!yearValidation.valid) {
        console.error('Invalid year parameter:', yearValidation.error);
        console.warn('Security: Invalid year input detected:', { input: year, error: yearValidation.error });
        return [];
    }

    if (!makeValidation.valid) {
        console.error('Invalid make parameter:', makeValidation.error);
        console.warn('Security: Invalid make input detected:', { input: make, error: makeValidation.error });
        return [];
    }

    if (!modelValidation.valid) {
        console.error('Invalid model parameter:', modelValidation.error);
        console.warn('Security: Invalid model input detected:', { input: model, error: modelValidation.error });
        return [];
    }

    try {
        const data = await fetchWithProxy(
            `/vehicle/menu/options?year=${yearValidation.value}&make=${encodeURIComponent(makeValidation.value)}&model=${encodeURIComponent(modelValidation.value)}`
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
    // Validate vehicle ID
    const idValidation = validateVehicleId(vehicleId);

    if (!idValidation.valid) {
        console.error('Invalid vehicle ID parameter:', idValidation.error);
        console.warn('Security: Invalid vehicle ID input detected:', { input: vehicleId, error: idValidation.error });
        return null;
    }

    try {
        const data = await fetchWithProxy(`/vehicle/${idValidation.value}`);

        // Create vehicle object with EPA data
        const vehicle = {
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

        // Fetch enhanced fuel tank capacity with metadata
        const capacityResult = await getFuelTankCapacity(vehicle);

        if (capacityResult && capacityResult.capacity) {
            vehicle.tankCapacity = capacityResult.capacity;
            vehicle.tankCapacitySource = capacityResult.source;
            vehicle.tankCapacityConfidence = capacityResult.confidence;
            vehicle.tankCapacityDescription = capacityResult.description;
        }

        return vehicle;
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
    // Validate make
    const makeValidation = validateMake(make);

    if (!makeValidation.valid) {
        console.error('Invalid make parameter:', makeValidation.error);
        console.warn('Security: Invalid make input detected:', { input: make, error: makeValidation.error });
        return [];
    }

    const data = await loadPakistaniVehicles();
    const models = data.vehicles
        .filter(v => v.make === makeValidation.value)
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

    const details = {
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

    // Add capacity source metadata
    if (variant.tankCapacity) {
        details.tankCapacitySource = 'local-database';
        details.tankCapacityConfidence = 'high';
        details.tankCapacityDescription = 'From local Pakistani vehicle database';
    }

    return details;
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

    // Export enhanced fuel capacity functions for backward compatibility
    estimateFuelTankCapacity: estimateEnhancedTankCapacity,
    getFuelTankCapacity,
    estimateEnhancedTankCapacity,
};
