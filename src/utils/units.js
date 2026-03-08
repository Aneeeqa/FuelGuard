/**
 * Unit conversion utilities for fuel volume and cost calculations
 */

const LITERS_TO_US_GALLONS = 0.264172;
const LITERS_TO_IMPERIAL_GALLONS = 0.219969;
const GALLONS_TO_LITERS = 3.78541;
const KILOMETERS_TO_MILES = 0.621371;
const MILES_TO_KILOMETERS = 1.60934;

export const UNIT_SYSTEMS = {
  USCS: 'USC',
  METRIC: 'Metric'
};

export const DISTANCE_UNITS = {
  MILES: 'mi',
  KILOMETERS: 'km'
};

export const VOLUME_UNITS = {
  GALLONS: 'gal',
  LITERS: 'L'
};

export const EFFICIENCY_UNITS = {
  MPG: 'mpg',
  KM_L: 'km/L'
};

/**
 * Convert liters to US gallons
 * @param {number} liters 
 * @returns {number}
 */
export const litersToGallons = (liters) => {
    return liters * LITERS_TO_US_GALLONS;
};

/**
 * Convert US gallons to liters
 * @param {number} gallons 
 * @returns {number}
 */
export const gallonsToLiters = (gallons) => {
    return gallons * GALLONS_TO_LITERS;
};

/**
 * Format fuel volume with unit
 * @param {number} liters - Amount in liters (base unit)
 * @param {string} unit - 'L' or 'gal'
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string}
 */
export const formatFuelVolume = (liters, unit = 'L', decimals = 2) => {
    const value = unit === 'gal' ? litersToGallons(liters) : liters;
    return `${value.toFixed(decimals)} ${unit}`;
};

/**
 * Calculate cost per kilometer
 * @param {number} totalCost - Total fuel cost
 * @param {number} distance - Distance traveled (km)
 * @returns {number|null}
 */
export const calculateCostPerKm = (totalCost, distance) => {
    if (!totalCost || !distance || distance <= 0) {
        return null;
    }
    return totalCost / distance;
};

/**
 * Calculate cost per mile
 * @param {number} totalCost - Total fuel cost
 * @param {number} distanceKm - Distance traveled (km)
 * @returns {number|null}
 */
export const calculateCostPerMile = (totalCost, distanceKm) => {
    const distanceMiles = distanceKm * 0.621371; // Convert km to miles
    if (!totalCost || !distanceMiles || distanceMiles <= 0) {
        return null;
    }
    return totalCost / distanceMiles;
};

/**
 * Calculate cost per distance unit based on user preference
 * @param {number} totalCost - Total fuel cost
 * @param {number} distanceKm - Distance traveled (km)
 * @param {string} distanceUnit - 'km' or 'mi'
 * @param {string} currencyCode - Currency code for symbol
 * @returns {string|null} Formatted string like "$0.15/km"
 */
export const formatCostPerUnit = (totalCost, distanceKm, distanceUnit = 'km', currencyCode = 'USD') => {
    let costPerUnit;

    if (distanceUnit === 'mi') {
        costPerUnit = calculateCostPerMile(totalCost, distanceKm);
    } else {
        costPerUnit = calculateCostPerKm(totalCost, distanceKm);
    }

    if (costPerUnit === null) {
        return null;
    }

    // Get currency symbol
    const symbol = getCurrencySymbol(currencyCode);

    return `${symbol}${costPerUnit.toFixed(3)}/${distanceUnit}`;
};

/**
 * Get currency symbol from code
 * @param {string} currencyCode - e.g., 'USD', 'INR', 'EUR'
 * @returns {string}
 */
export const getCurrencySymbol = (currencyCode = 'USD') => {
    const symbols = {
        'USD': '$',
        'INR': '₹',
        'EUR': '€',
        'GBP': '£',
        'PKR': '₨',
        'CAD': 'C$',
        'AUD': 'A$',
        'JPY': '¥',
        'CNY': '¥',
    };
    return symbols[currencyCode] || '$';
};

/**
 * Enrich log entry with cost per unit calculations
 * @param {Object} log - Log entry with liters, price, distance
 * @param {string} distanceUnit - 'km' or 'mi'
 * @param {string} currencyCode - Currency code
 * @returns {Object} Enhanced log with costPerUnit fields
 */
export const enrichLogWithCostAnalysis = (log, distanceUnit = 'km', currencyCode = 'USD') => {
    const enriched = { ...log };

    // Calculate cost per distance unit
    if (log.price && log.distance) {
        enriched.costPerKm = calculateCostPerKm(log.price, log.distance);
        enriched.costPerMile = calculateCostPerMile(log.price, log.distance);
        enriched.costPerUnitDisplay = formatCostPerUnit(log.price, log.distance, distanceUnit, currencyCode);
    }

    return enriched;
};

/**
 * Convert tank capacity based on unit
 * @param {number} capacityLiters - Capacity in liters
 * @param {string} unit - 'L' or 'gal'
 * @returns {number}
 */
export const convertTankCapacity = (capacityLiters, unit) => {
    return unit === 'gal' ? litersToGallons(capacityLiters) : capacityLiters;
};

/**
 * Convert distance between km and miles
 * @param {number} distance - Distance value
 * @param {string} fromUnit - 'km' or 'mi'
 * @param {string} toUnit - 'km' or 'mi'
 * @returns {number} Converted distance
 */
export const convertDistance = (distance, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return distance;
    if (fromUnit === DISTANCE_UNITS.KILOMETERS && toUnit === DISTANCE_UNITS.MILES) {
        return distance * KILOMETERS_TO_MILES;
    }
    if (fromUnit === DISTANCE_UNITS.MILES && toUnit === DISTANCE_UNITS.KILOMETERS) {
        return distance * MILES_TO_KILOMETERS;
    }
    return distance;
};

/**
 * Convert efficiency between km/L and mpg
 * @param {number} efficiency - Efficiency value
 * @param {string} fromUnit - 'km/L' or 'mpg'
 * @param {string} toUnit - 'km/L' or 'mpg'
 * @returns {number} Converted efficiency
 */
export const convertEfficiency = (efficiency, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return efficiency;
    if (fromUnit === EFFICIENCY_UNITS.KM_L && toUnit === EFFICIENCY_UNITS.MPG) {
        // km/L to mpg: (km * milesPerKm) * (litersPerGallon / efficiency)
        const miles = efficiency * KILOMETERS_TO_MILES;
        const gallons = 1; // 1 gallon base
        return miles / (1 / efficiency * GALLONS_TO_LITERS); // mpg = miles / (1/efficiency in L) * gal
    }
    if (fromUnit === EFFICIENCY_UNITS.MPG && toUnit === EFFICIENCY_UNITS.KM_L) {
        // mpg to km/L: (miles / kilometersPerMile) / (miles / efficiency in gallons)
        const km = 1 / MILES_TO_KILOMETERS;
        return (1 / efficiency * GALLONS_TO_LITERS) / km; // km/L = (1/mpg * gal) / 1/km
    }
    return efficiency;
};

/**
 * Get default units for USC system
 * @returns {Object} { distance: 'mi', volume: 'gal', efficiency: 'mpg' }
 */
export const getUSCUnits = () => ({
    distance: DISTANCE_UNITS.MILES,
    volume: VOLUME_UNITS.GALLONS,
    efficiency: EFFICIENCY_UNITS.MPG
});

/**
 * Get default units for Metric system
 * @returns {Object} { distance: 'km', volume: 'L', efficiency: 'km/L' }
 */
export const getMetricUnits = () => ({
    distance: DISTANCE_UNITS.KILOMETERS,
    volume: VOLUME_UNITS.LITERS,
    efficiency: EFFICIENCY_UNITS.KM_L
});

/**
 * Format efficiency value with unit
 * @param {number} efficiency - Efficiency value
 * @param {string} unit - 'km/L' or 'mpg'
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted string
 */
export const formatEfficiency = (efficiency, unit, decimals = 1) => {
    return `${efficiency.toFixed(decimals)} ${unit}`;
};

/**
 * Update log entry's fuel volume for new unit
 * @param {Object} log - Log entry
 * @param {string} fromUnit - 'L' or 'gal'
 * @param {string} toUnit - 'L' or 'gal'
 * @returns {Object} Log with converted fuel amount
 */
export const convertLogFuelVolume = (log, fromUnit, toUnit) => {
    if (fromUnit === toUnit) {
        return log;
    }

    const converted = { ...log };

    // Convert from stored unit (liters) to display unit
    if (toUnit === 'gal' && fromUnit === 'L') {
        converted.liters = litersToGallons(log.liters);
    } else if (toUnit === 'L' && fromUnit === 'gal') {
        converted.liters = gallonsToLiters(log.liters);
    }

    // Recalculate mileage based on new unit
    if (converted.distance && converted.liters) {
        converted.mileage = converted.distance / converted.liters;
    }

    return converted;
};

export default {
    litersToGallons,
    gallonsToLiters,
    formatFuelVolume,
    calculateCostPerKm,
    calculateCostPerMile,
    formatCostPerUnit,
    getCurrencySymbol,
    enrichLogWithCostAnalysis,
    convertTankCapacity,
    convertLogFuelVolume,
};
