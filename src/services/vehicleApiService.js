import { getFuelTankCapacity, estimateEnhancedTankCapacity } from './fuelCapacityService';

export const estimateFuelTankCapacity = estimateEnhancedTankCapacity;

const CORS_PROXY = 'https://corsproxy.io/?';
const BASE_URL = 'https://www.fueleconomy.gov/ws/rest';

const apiCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

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

export const fetchYears = async () => {
    try {
        const data = await fetchWithProxy('/vehicle/menu/year');
        return data.menuItem || [];
    } catch {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = currentYear + 1; year >= 1984; year--) {
            years.push({ text: String(year), value: String(year) });
        }
        return years;
    }
};

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

export const fetchOptions = async (year, make, model) => {
    if (!year || !make || !model) return [];

    try {
        const data = await fetchWithProxy(
            `/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
        );
        const items = data.menuItem;
        if (!items) return [];
        return Array.isArray(items) ? items : [items];
    } catch (error) {
        console.error('Error fetching options:', error);
        return [];
    }
};

export const fetchVehicleDetails = async (vehicleId) => {
    if (!vehicleId) return null;

    try {
        const data = await fetchWithProxy(`/vehicle/${vehicleId}`);

        const vehicle = {
            id: data.id,
            year: parseInt(data.year, 10),
            make: data.make,
            model: data.model,
            variant: data.trany || data.VClass || '',

            cityMpg: parseFloat(data.city08) || null,
            highwayMpg: parseFloat(data.highway08) || null,
            combinedMpg: parseFloat(data.comb08) || null,

            fuelType: data.fuelType || data.fuelType1 || 'Regular Gasoline',
            cylinders: parseInt(data.cylinders, 10) || null,
            displacement: parseFloat(data.displ) || null,
            transmission: data.trany || '',
            driveType: data.drive || '',
            vehicleClass: data.VClass || '',

            co2: parseFloat(data.co2TailpipeGpm) || null,
        };

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

export const mpgToKmPerLiter = (mpg) => {
    if (!mpg || isNaN(mpg)) return null;
    return Math.round(mpg * 0.425144 * 10) / 10;
};

export const kmPerLiterToMpg = (kmPerLiter) => {
    if (!kmPerLiter || isNaN(kmPerLiter)) return null;
    return Math.round(kmPerLiter / 0.425144 * 10) / 10;
};

export const searchVehicle = async (year, make, model) => {
    try {
        const options = await fetchOptions(year, make, model);
        if (options.length === 0) return null;

        return await fetchVehicleDetails(options[0].value);
    } catch {
        return null;
    }
};

export const clearCache = () => {
    apiCache.clear();
};

let pakistaniVehiclesCache = null;

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

export const fetchPakistaniMakes = async () => {
    const data = await loadPakistaniVehicles();
    const makes = [...new Set(data.vehicles.map(v => v.make))];
    return makes.map(make => ({ text: make, value: make }));
};

export const fetchPakistaniModels = async (make) => {
    if (!make) return [];

    const data = await loadPakistaniVehicles();
    const models = data.vehicles
        .filter(v => v.make === make)
        .map(v => v.model);

    return [...new Set(models)].map(model => ({ text: model, value: model }));
};

export const fetchPakistaniYears = async (make, model) => {
    if (!make || !model) return [];

    const data = await loadPakistaniVehicles();
    const vehicle = data.vehicles.find(v => v.make === make && v.model === model);

    if (!vehicle) return [];

    return vehicle.years
        .sort((a, b) => b - a)
        .map(year => ({ text: String(year), value: String(year) }));
};

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

        cityMpg: null,
        highwayMpg: null,
        combinedMpg: null,

        expectedMileage: variant.expectedMileage,

        fuelType: variant.fuelType,
        tankCapacity: variant.tankCapacity,
        engine: variant.engine,

        dataSource: 'local-pk',
    };

    if (variant.tankCapacity) {
        details.tankCapacitySource = 'local-database';
        details.tankCapacityConfidence = 'high';
        details.tankCapacityDescription = 'From local Pakistani vehicle database';
    }

    return details;
};

export const getVehicleAPIForCountry = (countryCode) => {
    if (countryCode === 'PK') {
        return {
            fetchMakes: fetchPakistaniMakes,
            fetchModels: fetchPakistaniModels,
            fetchYears: fetchPakistaniYears,
            fetchVariants: fetchPakistaniVariants,
            getVehicleDetails: getPakistaniVehicleDetails,
            usesYearFirst: false,
        };
    }

    return {
        fetchMakes,
        fetchModels,
        fetchYears,
        fetchVariants: fetchOptions,
        getVehicleDetails: fetchVehicleDetails,
        usesYearFirst: true,
    };
};

export default {
    fetchYears,
    fetchMakes,
    fetchModels,
    fetchOptions,
    fetchVehicleDetails,
    searchVehicle,
    mpgToKmPerLiter,
    kmPerLiterToMpg,
    clearCache,

    loadPakistaniVehicles,
    fetchPakistaniMakes,
    fetchPakistaniModels,
    fetchPakistaniYears,
    fetchPakistaniVariants,
    getPakistaniVehicleDetails,

    getVehicleAPIForCountry,

    estimateFuelTankCapacity: estimateEnhancedTankCapacity,
    getFuelTankCapacity,
    estimateEnhancedTankCapacity,
};
