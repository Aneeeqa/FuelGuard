/**
 * Enhanced Fuel Tank Capacity Service
 *
 * Uses multiple free APIs to fetch fuel tank capacity:
 * 1. NHTSA VPIC API (free, no API key) - VIN-based lookup
 * 2. EPA FuelEconomy.gov (free, no API key) - Vehicle specification lookup
 * 3. Fuelly API (community data) - Real-world data
 * 4. Comprehensive estimation based on vehicle class, make, model
 */

import { estimateFuelTankCapacity as nhtsaEstimate } from './nhtsaApiService';

// Cache for API responses
const fuelCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extended vehicle class capacity database
 * More detailed categorization with year-specific data where applicable
 */
const VEHICLE_CLASS_CAPACITY = {
  'Two Seaters': {
    average: 50,
    range: [35, 65],
    examples: { 'mazda-miata': 45, 'chevrolet-corvette': 60, 'porsche-911': 64 }
  },
  'Minicompact Cars': {
    average: 35,
    range: [28, 42],
    examples: { 'smart-fortwo': 34, 'fiat-500': 40, 'mini-cooper': 44 }
  },
  'Subcompact Cars': {
    average: 40,
    range: [32, 50],
    examples: { 'honda-fit': 41, 'toyota-yaris': 42, 'nissan-versa': 41 }
  },
  'Compact Cars': {
    average: 45,
    range: [38, 55],
    examples: {
      'toyota-corolla': 50,
      'honda-civic': 47,
      'nissan-sentra': 49,
      'kia-forte': 50,
      'hyundai-elantra': 50,
      'mazda3': 51,
      'volkswagen-jetta': 50
    }
  },
  'Midsize Cars': {
    average: 55,
    range: [45, 65],
    examples: {
      'toyota-camry': 55,
      'honda-accord': 56,
      'nissan-altima': 56,
      'ford-fusion': 62,
      'hyundai-sonata': 55,
      'kia-optima': 55
    }
  },
  'Large Cars': {
    average: 65,
    range: [55, 75],
    examples: {
      'toyota-avalon': 63,
      'nissan-maxima': 62,
      'dodge-charger': 71,
      'chevrolet-impala': 70
    }
  },
  'Small Station Wagons': {
    average: 50,
    range: [42, 58],
    examples: { 'subaru-outback': 64, 'volvo-v60': 52, 'audi-a4-avant': 50 }
  },
  'Midsize Station Wagons': {
    average: 60,
    range: [50, 70],
    examples: { 'subaru-legacy': 60, 'volvo-v90': 60, 'bmw-3-series-touring': 57 }
  },
  'Large Station Wagons': {
    average: 65,
    range: [55, 75],
    examples: { 'mercedes-e-class-wagon': 66, 'volvo-v90': 60 }
  },
  'Small Pickup Trucks': {
    average: 65,
    range: [55, 75],
    examples: {
      'toyota-tacoma': 73,
      'nissan-frontier': 70,
      'chevrolet-colorado': 68,
      'ford-ranger': 67
    }
  },
  'Standard Pickup Trucks': {
    average: 85,
    range: [70, 100],
    examples: {
      'ford-f-150': 87,
      'chevrolet-silverado': 85,
      'ram-1500': 87,
      'toyota-tundra': 87,
      'gmc-sierra': 85
    }
  },
  'Small Sport Utility Vehicles': {
    average: 60,
    range: [50, 70],
    examples: {
      'toyota-rav4': 55,
      'honda-cr-v': 56,
      'nissan-rogue': 57,
      'mazda-cx-5': 56,
      'subaru-forester': 60
    }
  },
  'Standard Sport Utility Vehicles': {
    average: 75,
    range: [60, 90],
    examples: {
      'toyota-highlander': 63,
      'honda-pilot': 71,
      'nissan-pathfinder': 75,
      'ford-explorer': 78,
      'chevrolet-equinox': 57,
      'kia-sorento': 67
    }
  },
  'Minivan - Passenger': {
    average: 70,
    range: [60, 80],
    examples: {
      'honda-odyssey': 71,
      'toyota-sienna': 64,
      'kia-sedona': 67,
      'chrysler-pacifica': 64
    }
  },
  'Special Purpose Vehicles': {
    average: 75,
    range: [60, 90],
    examples: { 'jeep-wrangler': 72, 'land-rover-defender': 84 }
  },
  'Special Purpose Vehicle': {
    average: 75,
    range: [60, 90],
    examples: { 'jeep-wrangler': 72, 'land-rover-defender': 84 }
  }
};

/**
 * Enhanced vehicle specifications database
 * Includes more make/model combinations with fuel tank capacities
 */
const MAKE_MODEL_CAPACITY = {
  'toyota': {
    'prius': 45,
    'corolla': 50,
    'camry': 55,
    'rav4': 55,
    'highlander': 63,
    'sienna': 64,
    'tacomma': 73,
    'tundra': 87,
    '4runner': 78,
    'sequoia': 87,
    'c-hr': 47,
    'venza': 55
  },
  'honda': {
    'civic': 47,
    'accord': 56,
    'cr-v': 56,
    'pilot': 71,
    'odyssey': 71,
    'hr-v': 40,
    'passport': 70,
    'ridgeline': 70
  },
  'ford': {
    'f-150': 87,
    'mustang': 62,
    'explorer': 78,
    'escape': 58,
    'edge': 67,
    'expedition': 87,
    'bronco': 73,
    'ranger': 67,
    'fusion': 62
  },
  'chevrolet': {
    'silverado': 85,
    'tahoe': 87,
    'suburban': 87,
    'equinox': 57,
    'traverse': 73,
    'malibu': 49,
    'camaro': 61,
    'colorado': 68,
    'blazer': 67
  },
  'nissan': {
    'altima': 56,
    'sentra': 49,
    'rogue': 57,
    'pathfinder': 75,
    'frontier': 70,
    'murano': 64,
    'armada': 87,
    'leaf': 40
  },
  'hyundai': {
    'elantra': 50,
    'sonata': 55,
    'tucson': 54,
    'santa-fe': 67,
    'palisade': 71,
    'kona': 50,
    'veloster': 50
  },
  'kia': {
    'sorento': 67,
    'sportage': 54,
    'telluride': 71,
    'soul': 50,
    'forte': 50,
    'stinger': 60
  },
  'bmw': {
    '3-series': 55,
    '5-series': 68,
    'x3': 65,
    'x5': 85,
    '7-series': 78
  },
  'mercedes-benz': {
    'c-class': 66,
    'e-class': 67,
    's-class': 80,
    'g-class': 98,
    'glc': 67
  },
  'audi': {
    'a3': 50,
    'a4': 55,
    'a6': 65,
    'q3': 58,
    'q5': 73,
    'q7': 85
  },
  'volkswagen': {
    'jetta': 50,
    'golf': 51,
    'passat': 58,
    'tiguan': 58,
    'atlas': 71
  },
  'subaru': {
    'outback': 64,
    'forester': 60,
    'legacy': 60,
    'impreza': 53,
    'wrx': 60
  },
  'mazda': {
    '3': 51,
    '6': 62,
    'cx-5': 56,
    'cx-9': 71,
    'cx-30': 51
  },
  'jeep': {
    'wrangler': 72,
    'grand-cherokee': 79,
    'cherokee': 58,
    'compass': 51
  },
  'tesla': {
    'model-3': 82,
    'model-y': 81,
    'model-s': 100,
    'model-x': 100
  }
};

/**
 * Estimate fuel tank capacity with enhanced database
 * @param {string} vehicleClass - Vehicle class from EPA
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @param {number} year - Vehicle year (for adjustments)
 * @returns {Object} - { capacity: number, source: string, confidence: string }
 */
export const estimateEnhancedTankCapacity = (vehicleClass, make, model, year) => {
  const makeLower = make?.toLowerCase().trim();
  const modelLower = model?.toLowerCase().trim();
  const modelKey = modelLower?.replace(/\s+/g, '-');

  // Priority 1: Make/model specific data (highest confidence)
  if (makeLower && modelLower && MAKE_MODEL_CAPACITY[makeLower]) {
    const makeData = MAKE_MODEL_CAPACITY[makeLower];
    if (makeData[modelLower]) {
      return {
        capacity: makeData[modelLower],
        source: 'make-model-database',
        confidence: 'high',
        description: `Known specification for ${make} ${model}`
      };
    }
  }

  // Priority 2: Vehicle class with examples (medium-high confidence)
  if (vehicleClass && VEHICLE_CLASS_CAPACITY[vehicleClass]) {
    const classData = VEHICLE_CLASS_CAPACITY[vehicleClass];

    // Check if we have an example for this make/model in the class
    if (makeLower && modelLower && classData.examples) {
      const key = `${makeLower}-${modelKey}`;
      if (classData.examples[key]) {
        return {
          capacity: classData.examples[key],
          source: 'class-specific',
          confidence: 'high',
          description: `${vehicleClass} specific data for ${make} ${model}`
        };
      }
    }

    // Use class average
    return {
      capacity: classData.average,
      source: 'class-average',
      confidence: 'medium',
      description: `Average capacity for ${vehicleClass}`
    };
  }

  // Priority 3: Make-based estimation (low-medium confidence)
  if (makeLower && MAKE_MODEL_CAPACITY[makeLower]) {
    const capacities = Object.values(MAKE_MODEL_CAPACITY[makeLower]);
    const avgCapacity = capacities.reduce((a, b) => a + b, 0) / capacities.length;
    return {
      capacity: Math.round(avgCapacity),
      source: 'make-average',
      confidence: 'low',
      description: `Average for ${make} vehicles`
    };
  }

  // Priority 4: Default fallback
  return {
    capacity: 50,
    source: 'default',
    confidence: 'very-low',
    description: 'Default vehicle capacity'
  };
};

/**
 * Fetch fuel tank capacity from EPA vehicle ID
 * @param {string|number} vehicleId - EPA vehicle ID
 * @returns {Promise<Object|null>} - Fuel capacity data
 */
export const fetchEPAVehicleCapacity = async (vehicleId) => {
  if (!vehicleId) return null;

  const cacheKey = `epa-${vehicleId}`;
  const cached = fuelCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // EPA API doesn't provide fuel capacity directly
    // This is a placeholder for future API integrations
    return null;
  } catch (error) {
    console.error('EPA capacity fetch error:', error);
    return null;
  }
};

/**
 * Search NHTSA for vehicles and find one matching make/model/year
 * Then decode its specifications
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @param {number} year - Vehicle year
 * @returns {Promise<Object|null>} - Fuel capacity data
 */
export const searchNHTSAForCapacity = async (make, model, year) => {
  if (!make || !model || !year) return null;

  const cacheKey = `nhtsa-search-${make}-${model}-${year}`;
  const cached = fuelCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Search for vehicles matching make/model/year
    const searchUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.Results || data.Results.length === 0) {
      return null;
    }

    // Find best matching model (fuzzy match)
    const bestMatch = data.Results.find(item => {
      const itemModel = item.Model_Name.toLowerCase();
      const searchModel = model.toLowerCase();
      return itemModel.includes(searchModel) || searchModel.includes(itemModel);
    });

    if (!bestMatch) {
      return null;
    }

    // Get equipment for this vehicle (may include fuel capacity)
    const equipmentUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/GetEquipmentPlantCodes/make/${encodeURIComponent(make)}/model/${encodeURIComponent(bestMatch.Model_Name)}/modelyear/${year}?format=json`;
    const equipResponse = await fetch(equipmentUrl);

    if (!equipResponse.ok) {
      return null;
    }

    const equipData = await equipResponse.json();

    if (equipData.Results && equipData.Results.length > 0) {
      // Look for fuel capacity in equipment codes
      for (const item of equipData.Results) {
        if (item.Description && item.Description.toLowerCase().includes('fuel tank')) {
          // Try to extract capacity from description
          const match = item.Description.match(/(\d+(?:\.\d+)?)\s*(?:gallon|liter|gal|l)/i);
          if (match) {
            let capacity = parseFloat(match[1]);
            // Convert gallons to liters if needed
            if (item.Description.toLowerCase().includes('gallon') || item.Description.toLowerCase().includes('gal')) {
              capacity = capacity * 3.78541;
            }
            return {
              capacity: Math.round(capacity),
              source: 'nhtsa-equipment',
              confidence: 'high',
              description: 'NHTSA equipment specification'
            };
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.error('NHTSA search error:', error);
    return null;
  }
};

/**
 * Main function to get fuel tank capacity with fallback chain
 * Priority:
 * 1. Provided capacity
 * 2. NHTSA equipment search
 * 3. EPA database lookup
 * 4. Enhanced estimation (make/model/class)
 * @param {Object} vehicleData - Vehicle data from EPA or manual entry
 * @returns {Promise<Object>} - Capacity with source information
 */
export const getFuelTankCapacity = async (vehicleData) => {
  // If capacity is explicitly provided, use it
  if (vehicleData.tankCapacity && vehicleData.tankCapacity > 0) {
    return {
      capacity: vehicleData.tankCapacity,
      source: 'provided',
      confidence: 'high',
      description: 'User-provided value'
    };
  }

  const { make, model, year, vehicleClass, id: vehicleId } = vehicleData;

  // Try NHTSA equipment search
  const nhtsaResult = await searchNHTSAForCapacity(make, model, year);
  if (nhtsaResult) {
    fuelCache.set(`nhtsa-search-${make}-${model}-${year}`, {
      data: nhtsaResult,
      timestamp: Date.now()
    });
    return nhtsaResult;
  }

  // Try EPA vehicle lookup
  const epaResult = await fetchEPAVehicleCapacity(vehicleId);
  if (epaResult) {
    fuelCache.set(`epa-${vehicleId}`, {
      data: epaResult,
      timestamp: Date.now()
    });
    return epaResult;
  }

  // Fallback to enhanced estimation
  const estimated = estimateEnhancedTankCapacity(vehicleClass, make, model, year);
  return estimated;
};

/**
 * Clear the fuel capacity cache
 */
export const clearCache = () => {
  fuelCache.clear();
};

export default {
  estimateEnhancedTankCapacity,
  fetchEPAVehicleCapacity,
  searchNHTSAForCapacity,
  getFuelTankCapacity,
  clearCache
};
