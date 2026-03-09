export const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
    { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', locale: 'en-PK' },
];

export const SUPPORTED_COUNTRIES = [
    { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currency: 'PKR', vehicleSource: 'local' },
    { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', vehicleSource: 'epa' },
    { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', vehicleSource: 'local' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', vehicleSource: 'epa' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', currency: 'USD', vehicleSource: 'epa' },
];

export const COUNTRY_CURRENCY_MAP = {
    'PK': 'PKR',
    'US': 'USD',
    'IN': 'INR',
    'UK': 'GBP',
    'AE': 'USD',
    'EU': 'EUR',
};

export const getDefaultCurrencyForCountry = (countryCode) => {
    return COUNTRY_CURRENCY_MAP[countryCode] || 'USD';
};

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
        return `${currency.symbol}${amount.toFixed(2)}`;
    }
};

export const formatPricePerLiter = (pricePerLiter, currencyCode = 'USD') => {
    if (pricePerLiter === null || pricePerLiter === undefined || isNaN(pricePerLiter)) {
        return '—';
    }
    return `${formatCurrency(pricePerLiter, currencyCode)}/L`;
};

export const getCurrencySymbol = (currencyCode = 'USD') => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '$';
};

export const parseCurrencyValue = (value) => {
    if (!value) return null;

    const cleaned = String(value).replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
};

const EXCHANGE_RATES_KEY = 'fuelGuardExchangeRates';
const EXCHANGE_RATES_CACHE_DURATION = 24 * 60 * 60 * 1000;

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

            if (typeof window !== 'undefined') {
                localStorage.setItem(EXCHANGE_RATES_KEY, JSON.stringify(ratesWithTimestamp));
            }

            return ratesWithTimestamp;
        } else {
            throw new Error('Failed to fetch exchange rates');
        }
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return getCachedExchangeRates();
    }
};

export const getCachedExchangeRates = () => {
    try {
        if (typeof window === 'undefined') return null;

        const cached = localStorage.getItem(EXCHANGE_RATES_KEY);
        if (!cached) return null;

        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;

        if (age < EXCHANGE_RATES_CACHE_DURATION) {
            return data;
        }

        return null;
    } catch (error) {
        console.error('Error reading cached exchange rates:', error);
        return null;
    }
};

export const convertCurrency = async (amount, fromCurrency, toCurrency, rates = null) => {
    if (!amount || isNaN(amount)) return amount;
    if (fromCurrency === toCurrency) return amount;

    let exchangeRates = rates;

    if (!exchangeRates) {
        exchangeRates = getCachedExchangeRates();
    }

    if (!exchangeRates) {
        exchangeRates = await fetchExchangeRates(fromCurrency);
    }

  if (!exchangeRates || !exchangeRates.rates) {
    return amount;
  }

    const rate = exchangeRates.rates[toCurrency];

  if (!rate) {
    return amount;
  }

  return amount * rate;
};

export const convertCurrencySync = (amount, fromCurrency, toCurrency) => {
  if (!amount || isNaN(amount)) return amount;
  if (fromCurrency === toCurrency) return amount;

    const exchangeRates = getCachedExchangeRates();

  if (!exchangeRates || !exchangeRates.rates) {
    return amount;
  }

  const rate = exchangeRates.rates[toCurrency];
  if (!rate) {
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
