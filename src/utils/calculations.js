/**
 * Fuel efficiency calculations for theft detection
 */

/**
 * Calculate mileage (km per liter)
 * @param {number} distance - Distance traveled in km
 * @param {number} liters - Fuel consumed in liters
 * @returns {number} Mileage in km/L
 */
export const calculateMileage = (distance, liters) => {
  if (!liters || liters <= 0) return 0;
  return distance / liters;
};

/**
 * Calculate distance between two odometer readings
 * @param {number} currentOdometer - Current odometer reading
 * @param {number} previousOdometer - Previous odometer reading
 * @returns {number} Distance in km
 */
export const calculateDistance = (currentOdometer, previousOdometer) => {
  if (currentOdometer === null || currentOdometer === undefined || 
      previousOdometer === null || previousOdometer === undefined) return 0;
  
  const distance = currentOdometer - previousOdometer;
  
  // Log warning if odometer decreased (potential data entry error)
  // This can happen if odometer was reset or entered incorrectly
  if (distance < 0) {
    console.warn(`Odometer decreased from ${previousOdometer.toLocaleString()} to ${currentOdometer.toLocaleString()} km. Please verify your data entry. This may indicate an odometer reset or incorrect values.`);
  }
  
  return Math.max(0, distance);
};

/**
 * Check if mileage indicates potential theft
 * Theft is flagged if efficiency is below the specified threshold of average
 * @param {number} mileage - Current mileage
 * @param {number} avgMileage - Average mileage
 * @param {number} threshold - Threshold ratio (default 0.75 = flag if below 75% of average)
 * @returns {boolean} True if theft is suspected
 */
export const isTheftSuspected = (mileage, avgMileage, threshold = 0.75) => {
  if (!mileage || !avgMileage || mileage <= 0) return false;
  return mileage < avgMileage * threshold;
};

/**
 * Calculate average mileage from logs
 * @param {Array} logs - Array of log entries
 * @returns {number} Average mileage
 */
export const calculateAverageMileage = (logs) => {
  if (!logs || logs.length === 0) return 15; // Default expected mileage
  
  const validLogs = logs.filter(log => log.mileage && log.mileage > 0);
  if (validLogs.length === 0) return 15;
  
  const sum = validLogs.reduce((acc, log) => acc + log.mileage, 0);
  return sum / validLogs.length;
};

/**
 * Calculate total fuel consumed
 * @param {Array} logs - Array of log entries
 * @returns {number} Total liters consumed
 */
export const calculateTotalFuel = (logs) => {
  if (!logs || logs.length === 0) return 0;
  return logs.reduce((sum, log) => sum + (log.liters || 0), 0);
};

/**
 * Calculate total distance traveled
 * @param {Array} logs - Array of log entries (sorted by date)
 * @returns {number} Total distance in km
 */
export const calculateTotalDistance = (logs) => {
  if (!logs || logs.length < 2) return 0;
  
  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  return Math.max(0, last.odometer - first.odometer);
};

/**
 * Calculate fuel cost per kilometer
 * @param {number} price - Total cost
 * @param {number} distance - Distance traveled
 * @returns {number} Cost per km
 */
export const calculateCostPerKm = (price, distance) => {
  if (!price || !distance || distance <= 0) return 0;
  return price / distance;
};

/**
 * Calculate fuel cost per liter
 * @param {number} price - Total cost
 * @param {number} liters - Liters filled
 * @returns {number} Price per liter
 */
export const calculatePricePerLiter = (price, liters) => {
  if (!price || !liters || liters <= 0) return 0;
  return price / liters;
};

/**
 * Get theft severity level
 * @param {number} mileage - Current mileage
 * @param {number} avgMileage - Average mileage
 * @param {number} warningThreshold - Warning threshold ratio (default 0.75)
 * @param {number} criticalThreshold - Critical threshold ratio (default 0.5)
 * @returns {string} 'normal' | 'warning' | 'critical'
 */
export const getTheftSeverity = (mileage, avgMileage, warningThreshold = 0.75, criticalThreshold = 0.5) => {
  if (!mileage || !avgMileage) return 'normal';

  const ratio = mileage / avgMileage;

  if (ratio < criticalThreshold) return 'critical';  // Below critical threshold
  if (ratio < warningThreshold) return 'warning';    // Below warning threshold
  return 'normal';
};

/**
 * Calculate total fuel expenditure (sum of all fuel costs)
 * @param {Array} logs - Array of log entries
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {number} Total expenditure in currency units
 */
export const calculateTotalExpenditure = (logs, currency = '$') => {
  if (!logs || logs.length === 0) return 0;
  return logs.reduce((sum, log) => sum + (log.price || 0), 0);
};

/**
 * Calculate fuel price trends over time
 * @param {Array} logs - Array of log entries (sorted by date)
 * @returns {Object} Object with prices array, average, min, max, trend
 */
export const calculateFuelPriceTrends = (logs) => {
  if (!logs || logs.length === 0) {
    return {
      prices: [],
      average: 0,
      min: 0,
      max: 0,
      trend: 'stable'
    };
  }

  const sorted = [...logs]
    .filter(log => log.price && log.liters && log.liters > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const prices = sorted.map(log => log.price / log.liters);

  const average = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;

  // Determine trend (increasing, decreasing, or stable)
  let trend = 'stable';
  if (prices.length >= 3) {
    const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
    const secondHalf = prices.slice(Math.floor(prices.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const diff = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (diff > 5) trend = 'increasing';
    else if (diff < -5) trend = 'decreasing';
  }

  return {
    prices,
    average,
    min,
    max,
    trend
  };
};

/**
 * Calculate average fuel cost per unit (per liter/gallon)
 * @param {Array} logs - Array of log entries
 * @returns {number} Average cost per unit
 */
export const calculateAverageCostPerUnit = (logs) => {
  if (!logs || logs.length === 0) return 0;

  const validLogs = logs.filter(log => log.price && log.liters && log.liters > 0);
  if (validLogs.length === 0) return 0;

  const costPerUnit = validLogs.map(log => log.price / log.liters);
  const total = costPerUnit.reduce((a, b) => a + b, 0);
  return total / costPerUnit.length;
};

/**
 * Calculate monthly fuel expenditure
 * @param {Array} logs - Array of log entries
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {number} Monthly expenditure
 */
export const calculateMonthlyExpenditure = (logs, month, year) => {
  if (!logs) return 0;

  return logs
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === month && logDate.getFullYear() === year;
    })
    .reduce((sum, log) => sum + (log.price || 0), 0);
};

/**
 * Check if budget alert is triggered
 * @param {number} currentSpend - Current spending
 * @param {number} budget - Budget threshold
 * @returns {Object} Alert status with level and message
 */
export const checkBudgetAlert = (currentSpend, budget) => {
  if (!currentSpend || !budget || budget <= 0) {
    return {
      triggered: false,
      level: 'normal',
      message: '',
      percentage: 0
    };
  }

  const percentage = (currentSpend / budget) * 100;

  if (percentage >= 100) {
    return {
      triggered: true,
      level: 'critical',
      message: `You have exceeded your fuel budget by ${Math.round(percentage - 100)}%!`,
      percentage
    };
  }

  if (percentage >= 80) {
    return {
      triggered: true,
      level: 'warning',
      message: `You have used ${Math.round(percentage)}% of your monthly fuel budget`,
      percentage
    };
  }

  return {
    triggered: false,
    level: 'normal',
    message: '',
    percentage
  };
};

/**
 * Currency-aware cost calculation for USC/Metric units
 * @param {number} amount - Amount in base currency
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {number} exchangeRate - Exchange rate (default: 1)
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD', exchangeRate = 1) => {
  if (!amount || fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
};

/**
 * Format cost with currency symbol
 * @param {number} amount - Cost amount
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {string} Formatted cost
 */
export const formatCost = (amount, currency = '$') => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
};

/**
 * Get cost statistics for display
 * @param {Array} logs - Array of log entries
 * @param {string} currency - Currency symbol (default: '$')
 * @returns {Object} Cost statistics object
 */
export const getCostStatistics = (logs, currency = '$') => {
  const totalExpenditure = calculateTotalExpenditure(logs, currency);
  const totalDistance = calculateTotalDistance(logs);
  const costPerKm = totalDistance > 0 ? totalExpenditure / totalDistance : 0;
  const priceTrends = calculateFuelPriceTrends(logs);
  const avgCostPerUnit = calculateAverageCostPerUnit(logs);
  
  return {
    totalExpenditure,
    costPerKm,
    averagePricePerUnit: avgCostPerUnit,
    priceTrends,
    currency
  };
};

