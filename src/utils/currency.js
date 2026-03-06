/**
 * Currency formatting utilities for Fuel Guard
 */

export const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', locale: 'en-PK' },
];

/**
 * Supported countries with their default currencies and vehicle data sources
 */
export const SUPPORTED_COUNTRIES = [
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', vehicleSource: 'local' },
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', vehicleSource: 'epa' },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', vehicleSource: 'local' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', vehicleSource: 'epa' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'USD', vehicleSource: 'epa' },
];

/**
 * Map country codes to default currency codes
 */
export const COUNTRY_CURRENCY_MAP = {
    'PK': 'PKR',
    'US': 'USD',
    'IN': 'INR',
    'UK': 'GBP',
    'AE': 'USD',
    'EU': 'EUR',
};

/**
 * Get the default currency for a country
 * @param {string} countryCode 
 * @returns {string}
 */
export const getDefaultCurrencyForCountry = (countryCode) => {
    return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
};

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - Currency code (INR, USD, EUR, GBP)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'INR') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '—';
    }

    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
        || SUPPORTED_CURRENCIES[0];

    try {
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback formatting
        return `${currency.symbol}${amount.toFixed(2)}`;
    }
};

/**
 * Format price per liter with currency
 * @param {number} pricePerLiter 
 * @param {string} currencyCode 
 * @returns {string}
 */
export const formatPricePerLiter = (pricePerLiter, currencyCode = 'INR') => {
    if (pricePerLiter === null || pricePerLiter === undefined || isNaN(pricePerLiter)) {
        return '—';
    }
    return `${formatCurrency(pricePerLiter, currencyCode)}/L`;
};

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode 
 * @returns {string}
 */
export const getCurrencySymbol = (currencyCode = 'INR') => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '₹';
};

/**
 * Parse a currency string to number
 * @param {string} value - String that may contain currency symbols
 * @returns {number|null}
 */
export const parseCurrencyValue = (value) => {
    if (!value) return null;

    // Remove all non-numeric characters except decimal point
    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
};

export default {
    SUPPORTED_CURRENCIES,
    formatCurrency,
    formatPricePerLiter,
    getCurrencySymbol,
    parseCurrencyValue,
};
