/**
 * Carbon footprint configuration
 * Centralized thresholds for carbon emissions and comparisons
 */

// CO2 emission level thresholds (kg CO2)
export const CARBON_LEVELS = {
  LOW: 100,      // Below 100kg = Good (green)
  MODERATE: 200, // 100-200kg = Moderate (yellow)
  // Above 200kg = High (red)
};

// Percentage thresholds for comparing with average vehicle
export const COMPARISON_THRESHOLDS = {
  EXCELLENT: -15, // 15%+ below average
  GOOD: 0,        // Up to 15% below average
  MODERATE: 20,   // Up to 20% above average
  // Above 20% = Poor
};

// Status labels for comparison results
export const COMPARISON_STATUS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  MODERATE: 'moderate',
  POOR: 'poor',
  NEUTRAL: 'neutral',
};

// Color scheme for carbon emissions (can be customized for different themes)
export const CARBON_COLORS = {
  LOW: 'var(--accent-success)',
  MODERATE: 'var(--accent-warning)',
  HIGH: 'var(--accent-alert)',
};

// Color scheme for comparison status
export const COMPARISON_STATUS_COLORS = {
  excellent: 'success',
  good: 'success',
  moderate: 'warning',
  poor: 'danger',
  neutral: 'default',
};

// Eco-driving score thresholds
export const ECO_DRIVING_SCORES = {
  EXCELLENT: 85,  // 85-100
  GOOD: 70,       // 70-84
  MODERATE: 50,   // 50-69
  // Below 50 = Needs improvement
};

// Eco-driving score categories
export const ECO_DRIVING_CATEGORIES = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  MODERATE: 'moderate',
  NEEDS_IMPROVEMENT: 'needs-improvement',
};

// Eco-driving badge configuration
export const ECO_BADGES = {
  excellent: { emoji: '🌱', label: 'Eco Champion', color: 'green' },
  good: { emoji: '🌿', label: 'Eco Friendly', color: 'blue' },
  moderate: { emoji: '🍃', label: 'Moderate', color: 'yellow' },
  'needs-improvement': { emoji: '🍂', label: 'Needs Work', color: 'red' },
};

// Vehicle type multipliers for average emissions (SUVs/trucks emit more)
export const VEHICLE_MULTIPLIERS = {
  compact: 0.85,
  sedan: 1.0,
  suv: 1.35,
  truck: 1.55,
  default: 1.0,
};

// Average vehicle CO2 emissions per km (baseline for comparison)
export const AVERAGE_CO2_PER_KM = 0.38; // ~0.38 kg CO2 per km

// Average vehicle emissions per year (kg CO2/year)
export const AVERAGE_YEARLY_EMISSIONS = {
  compact: 3989,   // 4.4 tonnes
  sedan: 4669,     // 5.1 tonnes
  suv: 6350,       // 7.0 tonnes
  truck: 7711,     // 8.5 tonnes
  default: 4990,   // 5.5 tonnes (average all vehicles)
};

// Default thresholds for eco-driving score calculation
export const ECO_DRIVING_THRESHOLDS = {
  TREND_BONUS_MAX: 15,        // Maximum bonus for improving trend
  TREND_PENALTY_MAX: 10,     // Maximum penalty for declining trend
  FLAGGED_RATIO_PENALTY: 50,  // Penalty percentage for flagged logs
  CONSISTENCY_BONUS: 10,      // Bonus for consistent driving
  VARIANCE_THRESHOLD: 2,      // Variance below this gets consistency bonus
};

/**
 * Get CO2 level color based on emission value
 * @param {number} co2 - CO2 amount in kg
 * @returns {string} CSS color reference
 */
export const getCO2LevelColor = (co2) => {
  if (co2 < CARBON_LEVELS.LOW) return CARBON_COLORS.LOW;
  if (co2 < CARBON_LEVELS.MODERATE) return CARBON_COLORS.MODERATE;
  return CARBON_COLORS.HIGH;
};

/**
 * Get comparison status based on percentage difference
 * @param {number} percentage - Percentage difference from average
 * @returns {string} Status: excellent, good, moderate, poor, or neutral
 */
export const getComparisonStatus = (percentage) => {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return COMPARISON_STATUS.NEUTRAL;
  }

  if (percentage <= COMPARISON_THRESHOLDS.EXCELLENT) {
    return COMPARISON_STATUS.EXCELLENT;
  }
  if (percentage <= COMPARISON_THRESHOLDS.GOOD) {
    return COMPARISON_STATUS.GOOD;
  }
  if (percentage <= COMPARISON_THRESHOLDS.MODERATE) {
    return COMPARISON_STATUS.MODERATE;
  }
  return COMPARISON_STATUS.POOR;
};

/**
 * Get eco-driving category based on score
 * @param {number} score - Eco-driving score (0-100)
 * @returns {string} Category: excellent, good, moderate, or needs-improvement
 */
export const getEcoDrivingCategory = (score) => {
  if (score >= ECO_DRIVING_SCORES.EXCELLENT) {
    return ECO_DRIVING_CATEGORIES.EXCELLENT;
  }
  if (score >= ECO_DRIVING_SCORES.GOOD) {
    return ECO_DRIVING_CATEGORIES.GOOD;
  }
  if (score >= ECO_DRIVING_SCORES.MODERATE) {
    return ECO_DRIVING_CATEGORIES.MODERATE;
  }
  return ECO_DRIVING_CATEGORIES.NEEDS_IMPROVEMENT;
};

/**
 * Get eco-driving badge based on score
 * @param {number} score - Eco-driving score (0-100)
 * @returns {Object} Badge info with emoji, label, and color
 */
export const getEcoBadge = (score) => {
  const category = getEcoDrivingCategory(score);
  return ECO_BADGES[category];
};

/**
 * Get vehicle type multiplier for average emissions
 * @param {string} vehicleType - Vehicle type (compact, sedan, suv, truck)
 * @returns {number} Multiplier value
 */
export const getVehicleMultiplier = (vehicleType) => {
  return VEHICLE_MULTIPLIERS[vehicleType?.toLowerCase()] || VEHICLE_MULTIPLIERS.default;
};
