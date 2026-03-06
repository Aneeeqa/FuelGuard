/**
 * Formatting utilities for display
 */

/**
 * Format a number with specified decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Decimal places (default 1)
 * @returns {string} Formatted number
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toFixed(decimals);
};

/**
 * Format mileage value with unit
 * @param {number} mileage - Mileage in km/L
 * @returns {string} Formatted mileage (e.g., "14.5 km/L")
 */
export const formatMileage = (mileage) => {
  return `${formatNumber(mileage)} km/L`;
};

/**
 * Format distance with thousand separators
 * @param {number} distance - Distance in km
 * @returns {string} Formatted distance (e.g., "12,500 km")
 */
export const formatDistance = (distance) => {
  if (!distance) return '0 km';
  return `${Number(distance).toLocaleString()} km`;
};

/**
 * Format fuel volume
 * @param {number} liters - Volume in liters
 * @returns {string} Formatted volume (e.g., "35 L")
 */
export const formatFuel = (liters) => {
  if (!liters) return '0 L';
  return `${formatNumber(liters, 0)} L`;
};

/**
 * Format currency (Indian Rupee by default)
 * @param {number} amount - Amount
 * @param {string} currency - Currency symbol (default ₹)
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = '₹') => {
  if (!amount) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString()}`;
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'short', 'long', 'relative'
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const d = new Date(date);
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    
    case 'relative':
      return getRelativeTime(d);
    
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
  }
};

/**
 * Get relative time string (e.g., "2 days ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Format odometer reading
 * @param {number} odometer - Odometer reading
 * @returns {string} Formatted odometer (e.g., "12,500 km")
 */
export const formatOdometer = (odometer) => {
  if (!odometer) return '0 km';
  return `${Number(odometer).toLocaleString()} km`;
};

/**
 * Format percentage
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  return `${formatNumber(value, decimals)}%`;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 20) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

