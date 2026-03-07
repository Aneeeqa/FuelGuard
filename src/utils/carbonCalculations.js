/**
 * Carbon footprint calculations for fuel consumption tracking
 *
 * CO2 Emission Factors (kg CO2 per liter):
 * - Gasoline: 2.31 kg/L
 * - Diesel: 2.68 kg/L
 * - LPG: 1.53 kg/L
 * - Hybrid: 1.5 kg/L (gasoline engine portion)
 * - Electric: 0 kg/L (direct emissions)
 *
 * Source: EPA and IPCC guidelines
 */

// CO2 emission factors in kg CO2 per liter
const CO2_EMISSION_FACTORS = {
  gasoline: 2.31,
  diesel: 2.68,
  lpg: 1.53,
  hybrid: 1.5, // Gasoline portion of hybrid
  electric: 0, // No direct tailpipe emissions
  'regular gasoline': 2.31,
  'premium gasoline': 2.31,
  'diesel': 2.68,
};

// Average vehicle CO2 emissions benchmarks (kg CO2/year)
const AVERAGE_VEHICLE_EMISSIONS = {
  compact: 3989,    // 4.4 tonnes
  sedan: 4669,      // 5.1 tonnes
  suv: 6350,        // 7.0 tonnes
  truck: 7711,       // 8.5 tonnes
  default: 4990,     // 5.5 tonnes (average all vehicles)
};

// Per km average (kg CO2/km) - based on 12,000 miles/year average
const AVERAGE_PER_KM = 0.38; // ~0.38 kg CO2 per km

/**
 * Get CO2 emission factor for a fuel type
 * @param {string} fuelType - Type of fuel (gasoline, diesel, etc.)
 * @returns {number} CO2 emission factor in kg/L
 */
export const getEmissionFactor = (fuelType) => {
  if (!fuelType) return CO2_EMISSION_FACTORS.gasoline; // Default to gasoline

  const normalizedFuelType = fuelType.toLowerCase().trim();
  return CO2_EMISSION_FACTORS[normalizedFuelType] || CO2_EMISSION_FACTORS.gasoline;
};

/**
 * Calculate CO2 emissions for a single fuel fill
 * @param {number} liters - Fuel consumed in liters
 * @param {string} fuelType - Type of fuel
 * @returns {number} CO2 emitted in kg
 */
export const calculateCO2PerTrip = (liters, fuelType = 'gasoline') => {
  if (!liters || liters <= 0) return 0;

  const emissionFactor = getEmissionFactor(fuelType);
  return liters * emissionFactor;
};

/**
 * Calculate CO2 emissions for a trip based on distance
 * @param {number} distanceKm - Distance traveled in km
 * @param {string} fuelType - Type of fuel
 * @param {number} efficiency - Vehicle efficiency in km/L
 * @returns {number} CO2 emitted in kg
 */
export const calculateCO2ByDistance = (distanceKm, fuelType = 'gasoline', efficiency = 15) => {
  if (!distanceKm || distanceKm <= 0 || !efficiency || efficiency <= 0) return 0;

  const litersConsumed = distanceKm / efficiency;
  return calculateCO2PerTrip(litersConsumed, fuelType);
};

/**
 * Calculate total CO2 emissions from all logs
 * @param {Array} logs - Array of fuel log entries
 * @param {string} fuelType - Primary fuel type (fallback if not in logs)
 * @returns {number} Total CO2 in kg
 */
export const calculateTotalCO2 = (logs, fuelType = 'gasoline') => {
  if (!logs || logs.length === 0) return 0;

  return logs.reduce((total, log) => {
    const logFuelType = log.fuelType || fuelType;
    return total + calculateCO2PerTrip(log.liters || 0, logFuelType);
  }, 0);
};

/**
 * Calculate CO2 emissions per kilometer
 * @param {number} totalCO2 - Total CO2 in kg
 * @param {number} totalDistance - Total distance in km
 * @returns {number} CO2 per km in kg
 */
export const calculateCO2PerKm = (totalCO2, totalDistance) => {
  if (!totalCO2 || !totalDistance || totalDistance <= 0) return 0;

  return totalCO2 / totalDistance;
};

/**
 * Calculate monthly CO2 emissions from logs
 * @param {Array} logs - Array of fuel log entries
 * @param {string} fuelType - Primary fuel type (fallback)
 * @returns {Array} Array of monthly data: [{ month: '2024-01', co2: 123.45 }]
 */
export const calculateMonthlyCO2 = (logs, fuelType = 'gasoline') => {
  if (!logs || logs.length === 0) return [];

  const monthlyData = {};

  logs.forEach((log) => {
    const date = new Date(log.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const logFuelType = log.fuelType || fuelType;
    const co2 = calculateCO2PerTrip(log.liters || 0, logFuelType);

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, co2: 0 };
    }
    monthlyData[monthKey].co2 += co2;
  });

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

/**
 * Calculate yearly CO2 emissions from logs
 * @param {Array} logs - Array of fuel log entries
 * @param {string} fuelType - Primary fuel type (fallback)
 * @returns {Array} Array of yearly data: [{ year: 2024, co2: 1234.56 }]
 */
export const calculateYearlyCO2 = (logs, fuelType = 'gasoline') => {
  if (!logs || logs.length === 0) return [];

  const yearlyData = {};

  logs.forEach((log) => {
    const date = new Date(log.date);
    const yearKey = date.getFullYear();
    const logFuelType = log.fuelType || fuelType;
    const co2 = calculateCO2PerTrip(log.liters || 0, logFuelType);

    if (!yearlyData[yearKey]) {
      yearlyData[yearKey] = { year: yearKey, co2: 0 };
    }
    yearlyData[yearKey].co2 += co2;
  });

  return Object.values(yearlyData).sort((a, b) => a.year - b.year);
};

/**
 * Compare user's CO2 emissions with average vehicle
 * @param {number} userCO2PerKm - User's CO2 per km in kg
 * @param {string} vehicleType - Vehicle type (compact, sedan, suv, truck)
 * @returns {Object} Comparison data with percentage
 */
export const compareWithAverage = (userCO2PerKm, vehicleType = 'sedan') => {
  console.log('compareWithAverage - Input:', { userCO2PerKm, vehicleType });

  const averagePerKm = AVERAGE_PER_KM;

  // Vehicle type multiplier (SUVs/trucks emit more)
  const vehicleMultiplier = {
    compact: 0.85,
    sedan: 1.0,
    suv: 1.35,
    truck: 1.55,
  }[vehicleType?.toLowerCase()] || 1.0;

  const adjustedAverage = averagePerKm * vehicleMultiplier;

  // Handle undefined/null/invalid inputs
  if (userCO2PerKm === null || userCO2PerKm === undefined || isNaN(userCO2PerKm)) {
    console.log('compareWithAverage - Invalid input, returning neutral');
    return {
      userCO2: 0,
      averageCO2: adjustedAverage,
      difference: -100, // -100% means unknown
      percentage: 0,
      status: 'neutral',
    };
  }

  if (userCO2PerKm <= 0) {
    console.log('compareWithAverage - Zero or negative input, returning neutral');
    return {
      userCO2: 0,
      averageCO2: adjustedAverage,
      difference: -100, // -100% means unknown
      percentage: 0,
      status: 'neutral',
    };
  }

  const difference = userCO2PerKm - adjustedAverage;
  const percentage = (difference / adjustedAverage) * 100;

  console.log('compareWithAverage - Calculated:', { difference, percentage });

  let status;
  if (percentage <= -15) {
    status = 'excellent'; // 15% or more below average
  } else if (percentage <= 0) {
    status = 'good'; // Up to 15% below average
  } else if (percentage <= 20) {
    status = 'moderate'; // Up to 20% above average
  } else {
    status = 'poor'; // More than 20% above average
  }

  return {
    userCO2: userCO2PerKm,
    averageCO2: adjustedAverage,
    difference,
    percentage,
    status,
  };
};

/**
 * Calculate eco-driving score based on driving patterns
 * Score is 0-100, with higher being more eco-friendly
 * @param {Array} logs - Array of fuel log entries
 * @returns {Object} Score and suggestions
 */
export const calculateEcoDrivingScore = (logs) => {
  if (!logs || logs.length < 3) {
    return {
      score: 75, // Default neutral score
      category: 'neutral',
      suggestions: [
        'Keep logging your fuel entries to get personalized eco-driving tips',
        'Maintain steady speeds on highways for better efficiency',
      ],
    };
  }

  // Calculate efficiency trends
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentLogs = sortedLogs.slice(-5); // Last 5 logs
  const earlierLogs = sortedLogs.slice(-10, -5) || sortedLogs.slice(0, 3);

  const recentAvg =
    recentLogs.reduce((sum, log) => sum + (log.mileage || 0), 0) / recentLogs.length;
  const earlierAvg =
    earlierLogs.reduce((sum, log) => sum + (log.mileage || 0), 0) / earlierLogs.length;

  const trend = recentAvg - earlierAvg;
  const flaggedLogs = logs.filter((log) => log.isFlagged).length;
  const flaggedRatio = flaggedLogs / logs.length;

  // Calculate score (0-100)
  let score = 75; // Base score

  // Trend bonus/penalty
  if (trend > 0) {
    score += Math.min(trend * 3, 15); // Up to +15 for improvement
  } else if (trend < 0) {
    score -= Math.min(Math.abs(trend) * 3, 10); // Up to -10 for decline
  }

  // Flagged logs penalty
  score -= flaggedRatio * 50; // -50 if 100% flagged

  // Mileage consistency bonus
  const variance = calculateVariance(recentLogs.map((log) => log.mileage || 0));
  if (variance < 2) {
    score += 10; // +10 for very consistent driving
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  // Determine category and suggestions
  let category, suggestions;

  if (score >= 85) {
    category = 'excellent';
    suggestions = [
      '🌱 Excellent driving! You\'re among the top eco-drivers',
      'Share your driving habits to help others improve',
      'Consider carpooling to further reduce your impact',
    ];
  } else if (score >= 70) {
    category = 'good';
    suggestions = [
      '✓ Good driving efficiency overall',
      'Avoid rapid acceleration and hard braking',
      'Use cruise control on highways when safe',
    ];
  } else if (score >= 50) {
    category = 'moderate';
    suggestions = [
      '⚠ Moderate efficiency - room for improvement',
      'Avoid idling for long periods',
      'Check tire pressure monthly for optimal fuel economy',
    ];
  } else {
    category = 'needs-improvement';
    suggestions = [
      '❌ Poor efficiency detected - review driving habits',
      'Avoid short trips (engine not warmed up)',
      'Consider vehicle maintenance check',
      'Reduce excess weight in vehicle',
    ];
  }

  // Add flagged entry suggestions
  if (flaggedLogs > 0) {
    suggestions.push(
      `🔔 ${flaggedLogs} flagged entry${flaggedLogs > 1 ? 'ies' : ''} detected - check for fuel theft or unusual driving conditions`
    );
  }

  return {
    score: Math.round(score),
    category,
    suggestions,
  };
};

/**
 * Calculate variance for consistency check
 * @param {Array} values - Array of numbers
 * @returns {number} Variance
 */
function calculateVariance(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

/**
 * Get CO2 emissions label for comparison display
 * @param {number} co2kg - CO2 in kg
 * @returns {string} Formatted label (e.g., "123.45 kg" or "0.12 tonnes")
 */
export const formatCO2Label = (co2kg) => {
  // Check for null, undefined, NaN, or invalid numbers
  if (co2kg === null || co2kg === undefined || isNaN(co2kg)) {
    return '0 kg';
  }

  // Ensure it's a number
  const value = Number(co2kg);
  if (isNaN(value)) {
    return '0 kg';
  }

  if (value >= 1000) {
    // Convert to tonnes
    const tonnes = value / 1000;
    return `${tonnes.toFixed(2)} tonnes`;
  }

  return `${value.toFixed(2)} kg`;
};

/**
 * Get eco-driving badge based on score
 * @param {number} score - Eco-driving score (0-100)
 * @returns {Object} Badge info with emoji and color
 */
export const getEcoBadge = (score) => {
  if (score >= 85) {
    return { emoji: '🌱', label: 'Eco Champion', color: 'green' };
  } else if (score >= 70) {
    return { emoji: '🌿', label: 'Eco Friendly', color: 'blue' };
  } else if (score >= 50) {
    return { emoji: '🍃', label: 'Moderate', color: 'yellow' };
  } else {
    return { emoji: '🍂', label: 'Needs Work', color: 'red' };
  }
};
