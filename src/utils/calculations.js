export const calculateMileage = (distance, liters) => {
  if (!liters || liters <= 0) return 0;
  return distance / liters;
};

export const calculateDistance = (currentOdometer, previousOdometer) => {
  if (!currentOdometer || !previousOdometer) return 0;

  const distance = currentOdometer - previousOdometer;

  if (distance < 0) {
    return Math.max(0, distance);
  }

  return Math.max(0, distance);
};

export const isTheftSuspected = (mileage, avgMileage, threshold = 0.75) => {
  if (!mileage || !avgMileage || mileage <= 0) return false;
  return mileage < avgMileage * threshold;
};

export const calculateAverageMileage = (logs) => {
  if (!logs || logs.length === 0) return 15;

  const validLogs = logs.filter(log => log.mileage && log.mileage > 0);
  if (validLogs.length === 0) return 15;

  const sum = validLogs.reduce((acc, log) => acc + log.mileage, 0);
  return sum / validLogs.length;
};

export const calculateTotalFuel = (logs) => {
  if (!logs || logs.length === 0) return 0;
  return logs.reduce((sum, log) => sum + (log.liters || 0), 0);
};

export const calculateTotalDistance = (logs) => {
  if (!logs || logs.length < 2) return 0;

  const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return Math.max(0, last.odometer - first.odometer);
};

export const calculateCostPerKm = (price, distance) => {
  if (!price || !distance || distance <= 0) return 0;
  return price / distance;
};

export const calculatePricePerLiter = (price, liters) => {
  if (!price || !liters || liters <= 0) return 0;
  return price / liters;
};

export const getTheftSeverity = (mileage, avgMileage, warningThreshold = 0.75, criticalThreshold = 0.5) => {
  if (!mileage || !avgMileage) return 'normal';

  const ratio = mileage / avgMileage;

  if (ratio < criticalThreshold) return 'critical';
  if (ratio < warningThreshold) return 'warning';
  return 'normal';
};

export const calculateTotalExpenditure = (logs, currency = '$') => {
  if (!logs || logs.length === 0) return 0;
  return logs.reduce((sum, log) => sum + (log.price || 0), 0);
};

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

export const calculateAverageCostPerUnit = (logs) => {
  if (!logs || logs.length === 0) return 0;

  const validLogs = logs.filter(log => log.price && log.liters && log.liters > 0);
  if (validLogs.length === 0) return 0;

  const costPerUnit = validLogs.map(log => log.price / log.liters);
  const total = costPerUnit.reduce((a, b) => a + b, 0);
  return total / costPerUnit.length;
};

export const calculateMonthlyExpenditure = (logs, month, year) => {
  if (!logs) return 0;

  return logs
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === month && logDate.getFullYear() === year;
    })
    .reduce((sum, log) => sum + (log.price || 0), 0);
};

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

export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD', exchangeRate = 1) => {
  if (!amount || fromCurrency === toCurrency) return amount;
  return amount * exchangeRate;
};

export const formatCost = (amount, currency = '$') => {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toFixed(2)}`;
};

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
