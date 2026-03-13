/**
 * NHTSA API Service - Vehicle Specifications
 *
 * Uses the free NHTSA (National Highway Traffic Safety Administration) API
 * to fetch detailed vehicle specifications including fuel tank capacity
 * API Docs: https://vpic.nhtsa.dot.gov/api/
 *
 * This API is completely free and requires no API key
 */

import { validateVin, validateYear, validateMake, validateModel } from '../utils/validation';

// NHTSA API base URL (no CORS proxy needed - supports CORS)
const BASE_URL = 'https://vpic.nhtsa.dot.gov/api';

// Cache for API responses
const nhtsaCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch vehicle specifications by VIN
 * @param {string} vin - Vehicle Identification Number
 * @returns {Promise<Object|null>}
 */
export const fetchVehicleByVIN = async (vin) => {
    // Validate VIN before API call
    const vinValidation = validateVin(vin);

    if (!vinValidation.valid) {
        console.error('Invalid VIN parameter:', vinValidation.error);
        console.warn('Security: Invalid VIN input detected:', { input: vin, error: vinValidation.error });
        return null;
    }

    const cacheKey = `vin-${vinValidation.value}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${BASE_URL}/vehicles/DecodeVin/${vinValidation.value}?format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NHTSA API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Results) {
            // Transform the flat Results array into a more usable object
            const specifications = {};
            data.Results.forEach((item) => {
                if (item.Value && item.Value !== 'null') {
                    specifications[item.Variable] = item.Value;
                }
            });

            // Extract fuel tank capacity if available
            const fuelCapacity = parseFloat(specifications['Fuel Tank Capacity (Gal)']) || null;
            const fuelCapacityLiters = fuelCapacity ? fuelCapacity * 3.78541 : null; // Convert gallons to liters

            const result = {
                vin: vinValidation.value,
                fuelCapacityGallons: fuelCapacity,
                fuelCapacityLiters,
                specifications,
            };

            nhtsaCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        }

        return null;
    } catch (error) {
        console.error('NHTSA API error:', error);
        return null;
    }
};

/**
 * Search for vehicles by make, model, and year and return a list with VINs
 * @param {string} make
 * @param {string} model
 * @param {number} year
 * @returns {Promise<Array<{make, model, year, vin, trim}>>}
 */
export const searchVehiclesByMakeModelYear = async (make, model, year) => {
    // Validate inputs
    const makeValidation = validateMake(make);
    const modelValidation = validateModel(model);
    const yearValidation = validateYear(year);

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

    if (!yearValidation.valid) {
        console.error('Invalid year parameter:', yearValidation.error);
        console.warn('Security: Invalid year input detected:', { input: year, error: yearValidation.error });
        return [];
    }

    const cacheKey = `search-${makeValidation.value}-${modelValidation.value}-${yearValidation.value}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(makeValidation.value)}/modelyear/${yearValidation.value}?format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NHTSA API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Results) {
            // Filter by model name
            const filteredResults = data.Results
                .filter((item) => {
                    const itemModel = item.Model_Name.toLowerCase();
                    const searchModel = modelValidation.value.toLowerCase();
                    return itemModel.includes(searchModel) || searchModel.includes(itemModel);
                })
                .map((item) => ({
                    make: item.Make_Name,
                    model: item.Model_Name,
                    year: item.Model_Year,
                    trim: item.Trim || '',
                }));

            nhtsaCache.set(cacheKey, { data: filteredResults, timestamp: Date.now() });
            return filteredResults;
        }

        return [];
    } catch (error) {
        console.error('NHTSA search error:', error);
        return [];
    }
};

/**
 * Get vehicle equipment options that might include fuel capacity
 * @param {string} make
 * @param {string} model
 * @param {number} year
 * @returns {Promise<Object|null>}
 */
export const getVehicleEquipment = async (make, model, year) => {
    // Validate inputs
    const makeValidation = validateMake(make);
    const modelValidation = validateModel(model);
    const yearValidation = validateYear(year);

    if (!makeValidation.valid || !modelValidation.valid || !yearValidation.valid) {
        console.error('Invalid parameters for getVehicleEquipment:', {
            make: makeValidation.error,
            model: modelValidation.error,
            year: yearValidation.error,
        });
        console.warn('Security: Invalid vehicle equipment input detected', {
            input: { make, model, year },
            errors: {
                make: makeValidation.error,
                model: modelValidation.error,
                year: yearValidation.error,
            },
        });
        return null;
    }

    const cacheKey = `equipment-${makeValidation.value}-${modelValidation.value}-${yearValidation.value}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        // Get manufacturer's suggested retail price and equipment data
        const url = `${BASE_URL}/vehicles/GetEquipmentPlantCodes/make/${encodeURIComponent(makeValidation.value)}/model/${encodeURIComponent(modelValidation.value)}/modelyear/${yearValidation.value}?format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NHTSA API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.Results || [];

        nhtsaCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
    } catch (error) {
        console.error('NHTSA equipment error:', error);
        return null;
    }
};

/**
 * Estimate fuel tank capacity based on vehicle class and make/model
 * Uses statistical averages as a fallback when exact data is not available
 * @param {string} vehicleClass - Vehicle class from EPA (e.g., 'Compact Cars', 'SUV')
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @returns {number|null} - Estimated tank capacity in liters
 */
export const estimateFuelTankCapacity = (vehicleClass, make, model) => {
    // Average fuel tank capacities by vehicle class (in liters)
    const classCapacities = {
        'Two Seaters': 50,
        'Minicompact Cars': 35,
        'Subcompact Cars': 40,
        'Compact Cars': 45,
        'Midsize Cars': 55,
        'Large Cars': 65,
        'Small Station Wagons': 50,
        'Midsize Station Wagons': 60,
        'Large Station Wagons': 65,
        'Small Pickup Trucks': 65,
        'Standard Pickup Trucks': 85,
        'Small Sport Utility Vehicles': 60,
        'Standard Sport Utility Vehicles': 75,
        'Minivan - Passenger': 70,
        'Special Purpose Vehicles': 75,
        'Special Purpose Vehicle': 75,
    };

    // Make/model specific adjustments (these are common tank sizes)
    const makeModelAdjustments = {
        'toyota-prius': 45,
        'toyota-corolla': 50,
        'toyota-camry': 55,
        'honda-civic': 47,
        'honda-accord': 56,
        'ford-f-150': 87,
        'chevrolet-silverado': 85,
        'nissan-altima': 56,
        'hyundai-elantra': 50,
        'kia-sorento': 67,
        'bmw-3-series': 55,
        'mercedes-benz-c-class': 66,
    };

    const key = `${make.toLowerCase()}-${model.toLowerCase()}`;

    // First check make/model specific
    if (makeModelAdjustments[key]) {
        return makeModelAdjustments[key];
    }

    // Then check vehicle class
    if (vehicleClass && classCapacities[vehicleClass]) {
        return classCapacities[vehicleClass];
    }

    // Default fallback
    return 50;
};

/**
 * Try to fetch fuel tank capacity from multiple sources
 * Priority: 1. NHTSA by VIN, 2. EPA vehicle details, 3. Estimate based on class
 * @param {Object} vehicleData - Vehicle data from EPA selection
 * @returns {Promise<number|null>} - Fuel tank capacity in liters
 */
export const fetchFuelTankCapacity = async (vehicleData) => {
    // If tank capacity is already provided, use it
    if (vehicleData.tankCapacity) {
        return vehicleData.tankCapacity;
    }

    // Try to estimate based on vehicle class
    const estimated = estimateFuelTankCapacity(
        vehicleData.vehicleClass,
        vehicleData.make,
        vehicleData.model
    );

    return estimated || 50; // Default to 50 liters
};

/**
 * Clear the NHTSA API cache
 */
export const clearCache = () => {
    nhtsaCache.clear();
};

export default {
    fetchVehicleByVIN,
    searchVehiclesByMakeModelYear,
    getVehicleEquipment,
    estimateFuelTankCapacity,
    fetchFuelTankCapacity,
    clearCache,
};
