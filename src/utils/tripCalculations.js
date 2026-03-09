export const calculateTrips = (logs = [], vehicleProfile = {}) => {
  if (!logs || logs.length < 2) return [];

  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  const trips = [];
  const {
    expectedMileage = 15,
    theftThreshold = 0.75,
    distanceUnit = 'km',
    fuelVolumeUnit = 'L'
  } = vehicleProfile;

  for (let i = 1; i < sortedLogs.length; i++) {
    const prevLog = sortedLogs[i - 1];
    const currLog = sortedLogs[i];

    const distance = currLog.odometer - prevLog.odometer;

    if (distance <= 0) continue;

    const fuelConsumed = currLog.liters || 0;

    if (fuelConsumed <= 0) continue;

    const tripMileage = distance / fuelConsumed;

    const thresholdMileage = expectedMileage * theftThreshold;
    let status = 'Normal';

    if (tripMileage < thresholdMileage) {
      status = 'Potential Theft';
    } else if (tripMileage < expectedMileage * 0.85) {
      status = 'Heavy Traffic';
    }

    trips.push({
      id: `trip-${prevLog.id}-${currLog.id}`,
      startDate: prevLog.date,
      endDate: currLog.date,
      startOdometer: prevLog.odometer,
      endOdometer: currLog.odometer,
      distance,
      fuelConsumed,
      tripMileage: Math.round(tripMileage * 100) / 100,
      status,
      isTheftAlert: status === 'Potential Theft',
      isSuspicious: status !== 'Normal',
      expectedMileage,
      thresholdMileage,
      distanceUnit,
      fuelVolumeUnit,
      startLogId: prevLog.id,
      endLogId: currLog.id,
      duration: new Date(currLog.date) - new Date(prevLog.date),
    });
  }

  return trips.reverse();
};

export const getRecentTrips = (trips, count = 5) => {
  return trips.slice(0, count);
};

export const calculateTripStatistics = (trips) => {
  if (!trips || trips.length === 0) {
    return {
      totalTrips: 0,
      normalTrips: 0,
      suspiciousTrips: 0,
      theftAlertTrips: 0,
      avgTripMileage: 0,
      avgTripDistance: 0,
      totalDistance: 0,
      totalFuelConsumed: 0,
    };
  }

  const normalTrips = trips.filter(t => t.status === 'Normal').length;
  const suspiciousTrips = trips.filter(t => t.isSuspicious).length;
  const theftAlertTrips = trips.filter(t => t.isTheftAlert).length;

  const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
  const totalFuelConsumed = trips.reduce((sum, t) => sum + t.fuelConsumed, 0);

  const avgTripMileage = trips.reduce((sum, t) => sum + t.tripMileage, 0) / trips.length;
  const avgTripDistance = totalDistance / trips.length;

  return {
    totalTrips: trips.length,
    normalTrips,
    suspiciousTrips,
    theftAlertTrips,
    avgTripMileage: Math.round(avgTripMileage * 100) / 100,
    avgTripDistance: Math.round(avgTripDistance * 100) / 100,
    totalDistance: Math.round(totalDistance * 100) / 100,
    totalFuelConsumed: Math.round(totalFuelConsumed * 100) / 100,
  };
};

export const formatTripDuration = (durationMs) => {
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

export const formatTripDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) + ', ' + start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return `${start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} - ${end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
};

export const getTripStatusColor = (status) => {
  switch (status) {
    case 'Potential Theft':
      return 'var(--accent-alert)';
    case 'Heavy Traffic':
      return 'var(--accent-warning)';
    case 'Normal':
    default:
      return 'var(--accent-success)';
  }
};

export const getBarColor = (mileage, threshold) => {
  if (mileage < threshold) return '#ef4444';
  if (mileage < threshold * 1.15) return '#f59e0b';
  return '#22c55e';
};
