/**
 * Currency formatting utilities for Fuel Guard
 */

import { safeJsonParse, Schemas } from './safeJson';
import {
  safeSetExchangeRates,
  safeGetExchangeRates,
} from './secureStorage';

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
export const formatCurrency = (amount, currencyCode = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '—';
    }

    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
        || SUPPORTED_CURRENCIES.find(c => c.code === 'USD');

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
export const formatPricePerLiter = (pricePerLiter, currencyCode = 'USD') => {
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
export const getCurrencySymbol = (currencyCode = 'USD') => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
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

// ============================================================================
// EXCHANGE RATE MANAGEMENT
// ============================================================================

const EXCHANGE_RATES_KEY = 'fuelGuardExchangeRates';
const EXCHANGE_RATES_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch exchange rates from free API (open.er-api.com)
 * @param {string} baseCurrency - Base currency code (default: 'USD')
 * @returns {Promise<Object>} Object with rates and timestamp
 */
export const fetchExchangeRates = async (baseCurrency = 'USD') => {
    try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await response.json();

        if (data.result === 'success') {
            const ratesWithTimestamp = {
                rates: data.rates,
                timestamp: Date.now(),
                base: baseCurrency
            };

            // Cache the rates with secure storage
            if (typeof window !== 'undefined') {
                safeSetExchangeRates(EXCHANGE_RATES_KEY, ratesWithTimestamp);
            }

            return ratesWithTimestamp;
        } else {
            throw new Error('Failed to fetch exchange rates');
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        // Return cached rates if available
        return getCachedExchangeRates();
    }
};

/**
 * Get cached exchange rates
 * @returns {Object|null} Cached rates object or null if expired/not found
 */
export const getCachedExchangeRates = () => {
    try {
        if (typeof window === 'undefined') return null;

        const cached = safeGetExchangeRates(EXCHANGE_RATES_KEY);
        if (!cached) return null;

        // Validate with schema (additional layer of validation)
        const validation = safeJsonParse(JSON.stringify(cached), { schema: Schemas.exchangeRates });
        if (!validation) return null;

        const age = Date.now() - cached.timestamp;

        // Return cached rates if they're not too old
        if (age < EXCHANGE_RATES_CACHE_DURATION) {
            return cached;
        }

        return null;
    } catch (error) {
        console.error('Error reading cached exchange rates:', error);
        return null;
    }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} rates - Exchange rates object (optional, will fetch if not provided)
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency, rates = null) => {
    if (!amount || isNaN(amount)) return amount;
    if (fromCurrency === toCurrency) return amount;

    let exchangeRates = rates;

    // If no rates provided, try to get cached rates
    if (!exchangeRates) {
        exchangeRates = getCachedExchangeRates();
    }

    // If still no rates, fetch fresh rates
    if (!exchangeRates) {
        exchangeRates = await fetchExchangeRates(fromCurrency);
    }

    if (!exchangeRates || !exchangeRates.rates) {
        console.warn('Could not get exchange rates, returning original amount');
        return amount;
    }

    // Get the conversion rate
    const rate = exchangeRates.rates[toCurrency];

    if (!rate) {
        console.warn(`Exchange rate for ${toCurrency} not found, returning original amount`);
        return amount;
    }

    return amount * rate;
};

/**
 * Convert amount synchronously using cached rates
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount (or original if rates unavailable)
 */
export const convertCurrencySync = (amount, fromCurrency, toCurrency) => {
    if (!amount || isNaN(amount)) return amount;
    if (fromCurrency === toCurrency) return amount;

    const exchangeRates = getCachedExchangeRates();

    if (!exchangeRates || !exchangeRates.rates) {
        console.warn('No cached exchange rates available, returning original amount');
        return amount;
    }

    const rate = exchangeRates.rates[toCurrency];

    if (!rate) {
        console.warn(`Exchange rate for ${toCurrency} not found, returning original amount`);
        return amount;
    }

    return amount * rate;
};

export default {
    SUPPORTED_CURRENCIES,
    formatCurrency,
    formatPricePerLiter,
    getCurrencySymbol,
    parseCurrencyValue,
    fetchExchangeRates,
    getCachedExchangeRates,
    convertCurrency,
    convertCurrencySync,
};
