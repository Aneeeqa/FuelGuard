export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toFixed(decimals);
};

export const formatMileage = (mileage, vehicleProfile) => {
  const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
  const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
  return `${formatNumber(mileage)} ${efficiencyUnit}`;
};

export const formatDistance = (distance, vehicleProfile) => {
  const distanceUnit = vehicleProfile?.distanceUnit || 'km';
  if (!distance) return `0 ${distanceUnit}`;

  if (distanceUnit === 'mi') {
    const miles = distance * 0.621371;
    return `${Number(miles).toLocaleString()} mi`;
  }

  return `${Number(distance).toLocaleString()} km`;
};

export const formatFuel = (liters, vehicleProfile) => {
  const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
  if (!liters) return `0 ${fuelVolumeUnit}`;

  if (fuelVolumeUnit === 'gal') {
    const gallons = liters * 0.264172;
    return `${formatNumber(gallons, 0)} gal`;
  }

  return `${formatNumber(liters, 0)} L`;
};

export const formatCurrency = (amount, currency = '₹') => {
  if (!amount) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString()}`;
};

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

export const formatOdometer = (odometer, vehicleProfile) => {
  const distanceUnit = vehicleProfile?.distanceUnit || 'km';
  if (!odometer) return `0 ${distanceUnit}`;

  if (distanceUnit === 'mi') {
    const miles = odometer * 0.621371;
    return `${Number(miles).toLocaleString()} mi`;
  }

  return `${Number(odometer).toLocaleString()} km`;
};

export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '0%';
  return `${formatNumber(value, decimals)}%`;
};

export const truncateText = (text, maxLength = 20) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
