/**
 * Data Migration Utility for Tank-to-Tank System
 *
 * This module handles migration of existing fuel data to the new
 * Tank-to-Tank schema while maintaining backward compatibility.
 */

import {
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption
} from './tankToTankCalculations.js';
import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeLocalStorageRemove,
} from './secureStorage';

/**
 * Migration version
 * Each schema change should increment this version
 */
export const SCHEMA_VERSION = '1.0.0'; // Tank-to-Tank support
export const CURRENT_VERSION_KEY = 'fuelGuardDB_version';

/**
 * Get current schema version from storage
 * @returns {Promise<string|null>} Current version or null if not set
 */
export const getCurrentSchemaVersion = async () => {
  try {
    const version = safeLocalStorageGet(CURRENT_VERSION_KEY, { parseJson: false });
    return version;
  } catch (error) {
    console.error('Failed to get schema version:', error);
    return null;
  }
};

/**
 * Set current schema version in storage
 * @param {string} version - Schema version to set
 */
export const setCurrentSchemaVersion = async (version) => {
  try {
    safeLocalStorageSet(CURRENT_VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to set schema version:', error);
  }
};

/**
 * Check if migration is needed
 * @returns {Promise<boolean>} True if migration is needed
 */
export const needsMigration = async () => {
  const currentVersion = await getCurrentSchemaVersion();
  return !currentVersion || currentVersion !== SCHEMA_VERSION;
};

/**
 * Migrate data to Tank-to-Tank schema
 * This function updates existing logs and vehicle profiles with Tank-to-Tank fields
 *
 * @param {Object} storedData - Stored data from database
 * @returns {Promise<Object>} Migrated data
 *
 * Time Complexity: O(n) where n is number of logs
 * Space Complexity: O(n) for storing migrated data
 */
export const migrateToTankToTankSystem = async (storedData) => {
  console.log('🔄 Starting Tank-to-Tank migration...');
  
  if (!storedData) {
    console.log('No data to migrate');
    return null;
  }
  
  const { logs, vehicles, vehicleProfile } = storedData;

  // ========================================
  // Step 1: Update Vehicle Profiles
  // ========================================
  console.log('📋 Updating vehicle profiles...');
  
  const updatedVehicles = (vehicles || []).map(v => ({
    ...v,
    // NEW: Tank-to-Tank fields
    lastFullFillLogId: v.lastFullFillLogId || null,
    lastFullFillDate: v.lastFullFillDate || null,
    averageTankToTankMileage: v.averageTankToTankMileage || v.expectedMileage || 15,
    tankToTankTrips: v.tankToTankTrips || [],
    // NEW: Theft detection settings
    tankToTankTheftThreshold: v.tankToTankTheftThreshold ?? 25,
    minimumFillPercentage: v.minimumFillPercentage ?? 80,
    useFullTankOnly: v.useFullTankOnly ?? false,
    // NEW: GPS settings
    enableGpsTracking: v.enableGpsTracking ?? false,
    minimumTripDistance: v.minimumTripDistance ?? 10,
  }));

  // Also update current vehicleProfile (for backward compatibility)
  const updatedVehicleProfile = {
    ...vehicleProfile,
    lastFullFillLogId: vehicleProfile?.lastFullFillLogId || null,
    lastFullFillDate: vehicleProfile?.lastFullFillDate || null,
    averageTankToTankMileage: vehicleProfile?.averageTankToTankMileage || vehicleProfile?.expectedMileage || 15,
    tankToTankTrips: vehicleProfile?.tankToTankTrips || [],
    tankToTankTheftThreshold: vehicleProfile?.tankToTankTheftThreshold ?? 25,
    minimumFillPercentage: vehicleProfile?.minimumFillPercentage ?? 80,
    useFullTankOnly: vehicleProfile?.useFullTankOnly ?? false,
    enableGpsTracking: vehicleProfile?.enableGpsTracking ?? false,
    minimumTripDistance: vehicleProfile?.minimumTripDistance ?? 10,
  };

  // ========================================
  // Step 2: Update Logs with Tank-to-Tank Fields
  // ========================================
  console.log('📝 Updating logs with Tank-to-Tank fields...');
  
  const updatedLogs = [];
  
  // Process logs in chronological order (oldest to newest)
  const sortedLogs = [...(logs || [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  let lastFullFill = null;
  const tankToTankTrips = [];

  for (const log of sortedLogs) {
    const updatedLog = { ...log };

    // Ensure vehicleId is set
    if (!updatedLog.vehicleId) {
      updatedLog.vehicleId = storedData.currentVehicleId || null;
    }

    // Initialize Tank-to-Tank fields
    updatedLog.isFullTank = false;
    updatedLog.tankCapacity = updatedVehicleProfile.tankCapacity;
    updatedLog.fuelLevelBeforeFill = null;
    updatedLog.fuelLevelAfterFill = null;
    updatedLog.fillPercentage = null;
    updatedLog.gaugeReading = null;
    updatedLog.tankToTankData = null;
    updatedLog.gpsDistance = null;
    updatedLog.gpsRoute = null;

    // Check if this log qualifies as full tank
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
      // Set tank capacity and fill percentage
      updatedLog.tankCapacity = updatedVehicleProfile.tankCapacity;
      updatedLog.fillPercentage = (log.liters / updatedVehicleProfile.tankCapacity) * 100;

      // If we have a previous full fill, calculate Tank-to-Tank data
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

          // Add to vehicle's tank-to-tank trips
          if (tankToTankData.isValid) {
            tankToTankTrips.push(tankToTankData);
          }

          // Update vehicle references
          updatedLog.lastFullFillLogId = lastFullFill.id;
        } catch (error) {
          console.warn(`Failed to calculate Tank-to-Tank for log ${log.id}:`, error);
        }
      }

      // Mark this as the last full fill
      lastFullFill = updatedLog;

      // Update vehicle profile with last full fill info
      updatedVehicleProfile.lastFullFillLogId = log.id;
      updatedVehicleProfile.lastFullFillDate = log.date;
    }

    updatedLogs.push(updatedLog);
  }

  // ========================================
  // Step 3: Update Vehicle Statistics
  // ========================================
  console.log('📊 Calculating Tank-to-Tank statistics...');

  if (tankToTankTrips.length > 0) {
    const totalMileage = tankToTankTrips
      .filter(t => t.isValid)
      .reduce((sum, t) => sum + t.actualMileage, 0);

    const validTrips = tankToTankTrips.filter(t => t.isValid);
    const avgTankToTankMileage = validTrips.length > 0
      ? totalMileage / validTrips.length
      : updatedVehicleProfile.expectedMileage || 15;

    updatedVehicleProfile.averageTankToTankMileage = Math.round(avgTankToTankMileage * 100) / 100;
    updatedVehicleProfile.tankToTankTrips = tankToTankTrips.slice(-50); // Keep last 50 trips
  }

  // ========================================
  // Step 4: Return Migrated Data
  // ========================================
  console.log('✅ Tank-to-Tank migration complete');
  console.log(`   - Processed ${updatedLogs.length} logs`);
  console.log(`   - Found ${tankToTankTrips.length} Tank-to-Tank trips`);
  console.log(`   - Average Tank-to-Tank mileage: ${updatedVehicleProfile.averageTankToTankMileage}`);

  return {
    ...storedData,
    logs: updatedLogs,
    vehicles: updatedVehicles,
    vehicleProfile: updatedVehicleProfile,
    // Mark as migrated
    _migrated: true,
    _migrationDate: new Date().toISOString(),
    _migrationVersion: SCHEMA_VERSION
  };
};

/**
 * Validate migrated data
 * @param {Object} data - Migrated data to validate
 * @returns {Object} Validation result with errors array
 */
export const validateMigratedData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data) {
    errors.push('No data provided for validation');
    return { valid: false, errors, warnings };
  }

  // Validate vehicle profile
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

  // Validate logs
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
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Rollback migration (emergency use only)
 * @returns {Promise<boolean>} True if rollback was successful
 */
export const rollbackMigration = async () => {
  console.warn('⚠️ Rolling back migration - this may cause data loss!');

  try {
    // Clear migrated data
    safeLocalStorageRemove('fuelGuardDB');

    // Clear version marker
    safeLocalStorageRemove(CURRENT_VERSION_KEY);

    console.log('✅ Migration rolled back successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to rollback migration:', error);
    return false;
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
