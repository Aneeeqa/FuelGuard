/**
 * Vehicle API Service - Local EPA Data Integration
 *
 * Uses locally bundled EPA FuelEconomy.gov data (vehicles-epa.json) instead of
 * the remote API, ensuring the app works offline and without API dependency.
 * Source data: EPA FuelEconomy.gov vehicles.csv (publicly available dataset)
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

// ============================================
// Local EPA Data Loader
// ============================================

let epaDataCache = null;
let epaDataLoadPromise = null;
/** Lazy reverse-lookup: vehicleId (string) -> "year|make|model" key */
let epaIdKeyMap = null;

/**
 * Load the local EPA vehicle database (vehicles-epa.json).
 * The file is fetched once and cached for the session.
 * @returns {Promise<Object>}
 */
const loadEpaData = () => {
    if (epaDataCache) return Promise.resolve(epaDataCache);
    if (epaDataLoadPromise) return epaDataLoadPromise;

    epaDataLoadPromise = fetch('/data/vehicles-epa.json')
        .then(res => {
            if (!res.ok) throw new Error(`Failed to load EPA data: ${res.status}`);
            return res.json();
        })
        .then(data => {
            epaDataCache = data;
            epaDataLoadPromise = null;
            return data;
        })
        .catch(err => {
            epaDataLoadPromise = null;
            console.error('[VehicleAPI] Could not load vehicles-epa.json:', err);
            return { years: [], makesByYear: {}, modelsByYearMake: {}, variantsByYearMakeModel: {}, vehicleDetails: {} };
        });

    return epaDataLoadPromise;
};

/**
 * Build (once) a map from vehicle ID (string) to the "year|make|model" key.
 * Used for fast year/make/model resolution in fetchVehicleDetails.
 */
const getIdKeyMap = async () => {
    if (epaIdKeyMap) return epaIdKeyMap;
    const data = await loadEpaData();
    epaIdKeyMap = {};
    for (const [key, variants] of Object.entries(data.variantsByYearMakeModel || {})) {
        for (const v of variants) {
            epaIdKeyMap[String(v.value)] = key;
        }
    }
    return epaIdKeyMap;
};

/**
 * Fetch available model years from local EPA data
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchYears = async () => {
    const data = await loadEpaData();
    return (data.years || []).map(y => ({ text: String(y), value: String(y) }));
};

/**
 * Fetch makes for a given year from local EPA data
 * @param {string|number} year
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchMakes = async (year) => {
    const yearValidation = validateYear(year);
    if (!yearValidation.valid) {
        console.warn('[VehicleAPI] Invalid year input:', yearValidation.error);
        return [];
    }

    const data = await loadEpaData();
    const makes = data.makesByYear?.[String(yearValidation.value)] || [];
    return makes.map(m => ({ text: m, value: m }));
};

/**
 * Fetch models for a given year and make from local EPA data
 * @param {string|number} year
 * @param {string} make
 * @returns {Promise<Array<{text: string, value: string}>>}
 */
export const fetchModels = async (year, make) => {
    const yearValidation = validateYear(year);
    const makeValidation = validateMake(make);

    if (!yearValidation.valid) {
        console.warn('[VehicleAPI] Invalid year input:', yearValidation.error);
        return [];
    }
    if (!makeValidation.valid) {
        console.warn('[VehicleAPI] Invalid make input:', makeValidation.error);
        return [];
    }

    const data = await loadEpaData();
    const key = `${yearValidation.value}|${makeValidation.value}`;
    const models = data.modelsByYearMake?.[key] || [];
    return models.map(m => ({ text: m, value: m }));
};

/**
 * Fetch vehicle variants for a given year, make, and model from local EPA data.
 * Returns [{text, value}] where value is the EPA vehicle ID (integer).
 * @param {string|number} year
 * @param {string} make
 * @param {string} model
 * @returns {Promise<Array<{text: string, value: number}>>}
 */
export const fetchOptions = async (year, make, model) => {
    const yearValidation = validateYear(year);
    const makeValidation = validateMake(make);
    const modelValidation = validateModel(model);

    if (!yearValidation.valid) {
        console.warn('[VehicleAPI] Invalid year input:', yearValidation.error);
        return [];
    }
    if (!makeValidation.valid) {
        console.warn('[VehicleAPI] Invalid make input:', makeValidation.error);
        return [];
    }
    if (!modelValidation.valid) {
        console.warn('[VehicleAPI] Invalid model input:', modelValidation.error);
        return [];
    }

    const data = await loadEpaData();
    const key = `${yearValidation.value}|${makeValidation.value}|${modelValidation.value}`;
    return data.variantsByYearMakeModel?.[key] || [];
};

/**
 * Fetch full vehicle details by EPA vehicle ID from local data.
 * @param {string|number} vehicleId
 * @returns {Promise<Object|null>}
 */
export const fetchVehicleDetails = async (vehicleId) => {
    const idValidation = validateVehicleId(vehicleId);
    if (!idValidation.valid) {
        console.warn('[VehicleAPI] Invalid vehicle ID:', idValidation.error);
        return null;
    }

    const data = await loadEpaData();
    const raw = data.vehicleDetails?.[String(idValidation.value)];
    if (!raw) {
        console.warn('[VehicleAPI] Vehicle not found in local data:', idValidation.value);
        return null;
    }

    const vehicle = {
        id: idValidation.value,
        cityMpg: raw.c || null,
        highwayMpg: raw.h || null,
        combinedMpg: raw.m || null,
        fuelType: raw.f || 'Regular Gasoline',
        cylinders: raw.y || null,
        displacement: raw.d || null,
        transmission: raw.t || '',
        driveType: raw.dr || '',
        vehicleClass: raw.vc || '',
        co2: raw.co2 || null,
        dataSource: 'local-epa',
    };

    // Resolve year/make/model from the reverse-lookup map (O(1))
    const idKeyMap = await getIdKeyMap();
    const keyEntry = idKeyMap[String(idValidation.value)];
    if (keyEntry) {
        const [yearStr, make, model] = keyEntry.split('|');
        vehicle.year = parseInt(yearStr, 10);
        vehicle.make = make;
        vehicle.model = model;
        // Find variant text from the variants array
        const variants = data.variantsByYearMakeModel?.[keyEntry] || [];
        const match = variants.find(v => String(v.value) === String(idValidation.value));
        vehicle.variant = match?.text || '';
    }

    // Estimate tank capacity from vehicle class / make / model
    const capacityResult = await getFuelTankCapacity(vehicle);
    if (capacityResult?.capacity) {
        vehicle.tankCapacity = capacityResult.capacity;
        vehicle.tankCapacitySource = capacityResult.source;
        vehicle.tankCapacityConfidence = capacityResult.confidence;
        vehicle.tankCapacityDescription = capacityResult.description;
    }

    return vehicle;
};

/**
 * Convert MPG to km/L
 * @param {number} mpg 
 * @returns {number}
 */
export const mpgToKmPerLiter = (mpg) => {
    if (!mpg || isNaN(mpg)) return null;
    // 1 MPG = 0.425144 km/L
    return parseFloat((mpg * 0.425144).toFixed(2));
};

/**
 * Convert km/L to MPG
 * @param {number} kmPerLiter 
 * @returns {number}
 */
export const kmPerLiterToMpg = (kmPerLiter) => {
    if (!kmPerLiter || isNaN(kmPerLiter)) return null;
    // 1 km/L = 2.35215 MPG
    return parseFloat((kmPerLiter * 2.35215).toFixed(2));
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
 * Clear the local EPA data cache (forces reload on next request)
 */
export const clearCache = () => {
    epaDataCache = null;
    epaDataLoadPromise = null;
    epaIdKeyMap = null;
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
