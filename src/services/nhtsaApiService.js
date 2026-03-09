const BASE_URL = 'https://vpic.nhtsa.dot.gov/api';

const nhtsaCache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

export const fetchVehicleByVIN = async (vin) => {
    if (!vin || vin.length < 17) {
        return null;
    }

    const cacheKey = `vin-${vin}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${BASE_URL}/vehicles/DecodeVin/${vin}?format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NHTSA API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Results) {
            const specifications = {};
            data.Results.forEach((item) => {
                if (item.Value && item.Value !== 'null') {
                    specifications[item.Variable] = item.Value;
                }
            });

            const fuelCapacity = parseFloat(specifications['Fuel Tank Capacity (Gal)']) || null;
            const fuelCapacityLiters = fuelCapacity ? fuelCapacity * 3.78541 : null;

            const result = {
                vin,
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

export const searchVehiclesByMakeModelYear = async (make, model, year) => {
    if (!make || !model || !year) {
        return [];
    }

    const cacheKey = `search-${make}-${model}-${year}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${BASE_URL}/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`NHTSA API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.Results) {
            const filteredResults = data.Results
                .filter((item) => {
                    const itemModel = item.Model_Name.toLowerCase();
                    const searchModel = model.toLowerCase();
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

export const getVehicleEquipment = async (make, model, year) => {
    if (!make || !model || !year) {
        return null;
    }

    const cacheKey = `equipment-${make}-${model}-${year}`;
    const cached = nhtsaCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    try {
        const url = `${BASE_URL}/vehicles/GetEquipmentPlantCodes/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}/modelyear/${year}?format=json`;
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

export const estimateFuelTankCapacity = (vehicleClass, make, model) => {
    const classCapacities = {
        'Two Seaters': 50,
        'Minicompact Cars': 35,
        'Subcompact Cars': 40,
        'Compact Cars': 45,
        'Midsize Cars':55,
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

    const makeModelAdjustments = {
        'toyota-prius': 45,
        'toyota-corolla': 50,
        'toyota-camry':55,
        'honda-civic': 47,
        'honda-accord': 56,
        'ford-f-150': 87,
        'chevrolet-silverado': 85,
        'nissan-altima': 56,
        'hyundai-elantra': 50,
        'kia-sorento': 67,
        'bmw-3-series':55,
        'mercedes-benz-c-class': 66,
    };

    const key = `${make.toLowerCase()}-${model.toLowerCase()}`;

    if (makeModelAdjustments[key]) {
        return makeModelAdjustments[key];
    }

    if (vehicleClass && classCapacities[vehicleClass]) {
        return classCapacities[vehicleClass];
    }

    return 50;
};

export const fetchFuelTankCapacity = async (vehicleData) => {
    if (vehicleData.tankCapacity) {
        return vehicleData.tankCapacity;
    }

    const estimated = estimateFuelTankCapacity(
        vehicleData.vehicleClass,
        vehicleData.make,
        vehicleData.model
    );

    return estimated || 50;
};

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
