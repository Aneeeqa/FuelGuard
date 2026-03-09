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

export const litersToGallons = (liters) => {
    return liters * LITERS_TO_US_GALLONS;
};

export const gallonsToLiters = (gallons) => {
    return gallons * GALLONS_TO_LITERS;
};

export const formatFuelVolume = (liters, unit = 'L', decimals = 2) => {
    const value = unit === 'gal' ? litersToGallons(liters) : liters;
    return `${value.toFixed(decimals)} ${unit}`;
};

export const formatDistance = (kilometers, unit = 'km', decimals = 0) => {
    const value = unit === 'mi' ? kilometers * KILOMETERS_TO_MILES : kilometers;
    return `${value.toFixed(decimals)} ${unit}`;
};

export const calculateCostPerKm = (totalCost, distance) => {
    if (!totalCost || !distance || distance <= 0) {
        return null;
    }
    return totalCost / distance;
};

export const calculateCostPerMile = (totalCost, distanceKm) => {
    const distanceMiles = distanceKm * 0.621371;
    if (!totalCost || !distanceMiles || distanceMiles <= 0) {
        return null;
    }
    return totalCost / distanceMiles;
};

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

    const symbol = getCurrencySymbol(currencyCode);

    return `${symbol}${costPerUnit.toFixed(3)}/${distanceUnit}`;
};

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

export const enrichLogWithCostAnalysis = (log, distanceUnit = 'km', currencyCode = 'USD') => {
    const enriched = { ...log };

    if (log.price && log.distance) {
        enriched.costPerKm = calculateCostPerKm(log.price, log.distance);
        enriched.costPerMile = calculateCostPerMile(log.price, log.distance);
        enriched.costPerUnitDisplay = formatCostPerUnit(log.price, log.distance, distanceUnit, currencyCode);
    }

    return enriched;
};

export const convertTankCapacity = (capacityLiters, unit) => {
    return unit === 'gal' ? litersToGallons(capacityLiters) : capacityLiters;
};

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

export const convertEfficiency = (efficiency, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return efficiency;
    if (fromUnit === EFFICIENCY_UNITS.KM_L && toUnit === EFFICIENCY_UNITS.MPG) {
        return efficiency * 2.35215;
    }
    if (fromUnit === EFFICIENCY_UNITS.MPG && toUnit === EFFICIENCY_UNITS.KM_L) {
        return efficiency * 0.425144;
    }
    return efficiency;
};

export const getUSCUnits = () => ({
    distance: DISTANCE_UNITS.MILES,
    volume: VOLUME_UNITS.GALLONS,
    efficiency: EFFICIENCY_UNITS.MPG
});

export const getMetricUnits = () => ({
    distance: DISTANCE_UNITS.KILOMETERS,
    volume: VOLUME_UNITS.LITERS,
    efficiency: EFFICIENCY_UNITS.KM_L
});

export const formatEfficiency = (efficiency, unit, decimals = 1) => {
    return `${efficiency.toFixed(decimals)} ${unit}`;
};

export const convertLogFuelVolume = (log, fromUnit, toUnit) => {
    if (fromUnit === toUnit) {
        return log;
    }

    const converted = { ...log };

    if (toUnit === 'gal' && fromUnit === 'L') {
        converted.liters = litersToGallons(log.liters);
    } else if (toUnit === 'L' && fromUnit === 'gal') {
        converted.liters = gallonsToLiters(log.liters);
    }

    if (converted.distance && converted.liters) {
        converted.mileage = converted.distance / converted.liters;
    }

    return converted;
};

export default {
    litersToGallons,
    gallonsToLiters,
    formatFuelVolume,
    formatDistance,
    calculateCostPerKm,
    calculateCostPerMile,
    formatCostPerUnit,
    getCurrencySymbol,
    enrichLogWithCostAnalysis,
    convertTankCapacity,
    convertLogFuelVolume,
};
