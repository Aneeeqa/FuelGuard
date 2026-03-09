import {
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption
} from './tankToTankCalculations.js';

export const SCHEMA_VERSION = '2.0.0';
export const CURRENT_VERSION_KEY = 'fuelGuardDB_version';

export const getCurrentSchemaVersion = async () => {
  try {
    const version = await localStorage.getItem(CURRENT_VERSION_KEY);
    return version;
  } catch (error) {
    console.error('Failed to get schema version:', error);
    return null;
  }
};

export const setCurrentSchemaVersion = async (version) => {
  try {
    await localStorage.setItem(CURRENT_VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to set schema version:', error);
  }
};

export const needsMigration = async () => {
  const currentVersion = await getCurrentSchemaVersion();
  return !currentVersion || currentVersion !== SCHEMA_VERSION;
};

export const migrateToTankToTankSystem = async (storedData) => {
  if (!storedData) {
    return null;
  }

  const { logs, vehicles, vehicleProfile } = storedData;

  if (!logs || logs.length === 0) {
    return storedData;
  }

  const { logs, vehicles, vehicleProfile } = storedData;

  const updatedVehicles = vehicles.map(v => ({
    ...v,
    lastFullFillLogId: v.lastFullFillLogId || null,
    lastFullFillDate: v.lastFullFillDate || null,
    averageTankToTankMileage: v.averageTankToTankMileage || v.expectedMileage || 15,
    tankToTankTrips: v.tankToTankTrips || [],
    tankToTankTheftThreshold: v.tankToTankTheftThreshold || 25,
    minimumFillPercentage: v.minimumFillPercentage || 80,
    useFullTankOnly: v.useFullTankOnly || false,
    enableGpsTracking: v.enableGpsTracking || false,
    minimumTripDistance: v.minimumTripDistance || 10,
  }));

  const updatedVehicleProfile = {
    ...vehicleProfile,
    lastFullFillLogId: vehicleProfile?.lastFullFillLogId || null,
    lastFullFillDate: vehicleProfile?.lastFullFillDate || null,
    averageTankToTankMileage: vehicleProfile?.averageTankToTankMileage || vehicleProfile?.expectedMileage || 15,
    tankToTankTrips: vehicleProfile?.tankToTankTrips || [],
    tankToTankTheftThreshold: vehicleProfile?.tankToTankTheftThreshold || 25,
    minimumFillPercentage: vehicleProfile?.minimumFillPercentage || 80,
    useFullTankOnly: vehicleProfile?.useFullTankOnly || false,
    enableGpsTracking: vehicleProfile?.enableGpsTracking || false,
    minimumTripDistance: vehicleProfile?.minimumTripDistance || 10,
  };

  const updatedLogs = [];

  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

  let lastFullFill = null;
  const tankToTankTrips = [];

  for (const log of sortedLogs) {
    const updatedLog = { ...log };

    if (!updatedLog.vehicleId) {
      updatedLog.vehicleId = storedData.currentVehicleId || null;
    }

    updatedLog.isFullTank = false;
    updatedLog.tankCapacity = updatedVehicleProfile.tankCapacity;
    updatedLog.fuelLevelBeforeFill = null;
    updatedLog.fuelLevelAfterFill = null;
    updatedLog.fillPercentage = null;
    updatedLog.gaugeReading = null;
    updatedLog.tankToTankData = null;
    updatedLog.gpsDistance = null;
    updatedLog.gpsRoute = null;

    const fullTankCheck = isFullTankFill(
      {
        liters: log.liters,
        tankCapacity: updatedVehicleProfile.tankCapacity,
        isFullTank: log.isFullTank
      },
      updatedVehicleProfile
    );

    updatedLog.isFullTank = fullTankCheck.isFullTank;

    if (fullTankCheck.isFullTank) {
      updatedLog.tankCapacity = updatedVehicleProfile.tankCapacity;
      updatedLog.fillPercentage = (log.liters / updatedVehicleProfile.tankCapacity) * 100;

      if (lastFullFill) {
        try {
          const tankToTankData = calculateTankToTankConsumption(
            {
              ...updatedLog,
              id: log.id,
              date: log.date,
              odometer: log.odometer,
              liters: log.liters,
              isFullTank: true,
              tankCapacity: updatedVehicleProfile.tankCapacity
            },
            lastFullFill,
            updatedVehicleProfile
          );

          updatedLog.tankToTankData = tankToTankData;

          if (tankToTankData.isValid) {
            tankToTankTrips.push(tankToTankData);
          }

          updatedLog.lastFullFillLogId = lastFullFill.id;
      } catch (error) {
      }
    }
      }

      lastFullFill = updatedLog;

      updatedVehicleProfile.lastFullFillLogId = log.id;
      updatedVehicleProfile.lastFullFillDate = log.date;
    }

    updatedLogs.push(updatedLog);
  }

  if (tankToTankTrips.length > 0) {
    const totalMileage = tankToTankTrips
      .filter(t => t.isValid)
      .reduce((sum, t) => sum + t.actualMileage, 0);

    const validTrips = tankToTankTrips.filter(t => t.isValid);
  const avgTankToTankMileage = validTrips.length > 0
    ? totalMileage / validTrips.length
    : updatedVehicleProfile.expectedMileage || 15;

  updatedVehicleProfile.averageTankToTankMileage = Math.round(avgTankToTankMileage * 100) / 100;
  updatedVehicleProfile.tankToTankTrips = tankToTankTrips.slice(-50);

  return {
    ...storedData,
    logs: updatedLogs,
    vehicles: updatedVehicles,
    vehicleProfile: updatedVehicleProfile,
    migratedToTankToTank: true,
  };
};

export const validateMigratedData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data) {
    errors.push('No data provided for validation');
    return { valid: false, errors, warnings };
  }

  if (!data.vehicleProfile) {
    errors.push('Vehicle profile is missing');
  } else {
    if (!data.vehicleProfile.tankCapacity) {
      errors.push('Vehicle tank capacity is missing');
    }
    if (!data.vehicleProfile.expectedMileage) {
      errors.push('Vehicle expected mileage is missing');
    }
    if (data.vehicleProfile.minimumFillPercentage &&
        (data.vehicleProfile.minimumFillPercentage < 50 || data.vehicleProfile.minimumFillPercentage > 100)) {
      warnings.push('Minimum fill percentage is outside recommended range (50-100%)');
    }
    if (data.vehicleProfile.tankToTankTheftThreshold &&
        (data.vehicleProfile.tankToTankTheftThreshold < 0 || data.vehicleProfile.tankToTankTheftThreshold > 100)) {
      warnings.push('Theft threshold should be between 0-100%');
    }
  }

  if (!data.logs || data.logs.length === 0) {
    warnings.push('No logs found in data');
  } else {
    data.logs.forEach((log, index) => {
      if (!log.id) {
        errors.push(`Log at index ${index} is missing ID`);
      }
      if (!log.date) {
        errors.push(`Log ${log.id} is missing date`);
      }
      if (log.odometer === undefined || log.odometer === null) {
        errors.push(`Log ${log.id} is missing odometer`);
      }
      if (log.liters === undefined || log.liters === null) {
        errors.push(`Log ${log.id} is missing fuel amount`);
      }
      });
      } catch (error) {
      }
    }
    }
};

export default {
  SCHEMA_VERSION,
  CURRENT_VERSION_KEY,
  getCurrentSchemaVersion,
  setCurrentSchemaVersion,
  needsMigration,
  migrateToTankToTankSystem,
  validateMigratedData,
  rollbackMigration
};
