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
  if (!currentOdometer || !previousOdometer) return 0;
  return Math.max(0, currentOdometer - previousOdometer);
};

/**
 * Check if mileage indicates potential theft
 * Theft is flagged if efficiency is 25% below average
 * @param {number} mileage - Current mileage
 * @param {number} avgMileage - Average mileage
 * @param {number} threshold - Threshold percentage (default 0.75 = 25% below)
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
 * @returns {string} 'normal' | 'warning' | 'critical'
 */
export const getTheftSeverity = (mileage, avgMileage) => {
  if (!mileage || !avgMileage) return 'normal';
  
  const ratio = mileage / avgMileage;
  
  if (ratio < 0.5) return 'critical';  // More than 50% below average
  if (ratio < 0.75) return 'warning';  // 25-50% below average
  return 'normal';
};

