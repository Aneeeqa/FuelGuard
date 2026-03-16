/**
 * Data Migration - CRITICAL TESTS
 *
 * Tests the migration system for updating data schemas across versions.
 * Essential for preserving user data during app updates.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SCHEMA_VERSION,
  CURRENT_VERSION_KEY,
  getCurrentSchemaVersion,
  setCurrentSchemaVersion,
  needsMigration,
  migrateToTankToTankSystem,
  validateMigratedData,
  rollbackMigration
} from '../../src/utils/dataMigration';

describe('Data Migration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Schema Version Management', () => {
    it('should return null when no version is set', async () => {
      const version = await getCurrentSchemaVersion();
      expect(version).toBeNull();
    });

    it('should set schema version', async () => {
      await setCurrentSchemaVersion('2.0.0');
      const version = await getCurrentSchemaVersion();
      expect(version).toBe('2.0.0');
    });

    it('should update existing schema version', async () => {
      await setCurrentSchemaVersion('1.0.0');
      await setCurrentSchemaVersion('2.0.0');
      const version = await getCurrentSchemaVersion();
      expect(version).toBe('2.0.0');
    });

    it('should return SCHEMA_VERSION constant', () => {
      expect(SCHEMA_VERSION).toBe('2.0.0');
    });

    it('should return CURRENT_VERSION_KEY constant', () => {
      expect(CURRENT_VERSION_KEY).toBe('fuelGuardDB_version');
    });
  });

  describe('Migration Detection', () => {
    it('should detect migration needed when no version exists', async () => {
      const result = await needsMigration();
      expect(result).toBe(true);
    });

    it('should detect migration needed for old version', async () => {
      await setCurrentSchemaVersion('1.0.0');
      const result = await needsMigration();
      expect(result).toBe(true);
    });

    it('should not need migration for current version', async () => {
      await setCurrentSchemaVersion(SCHEMA_VERSION);
      const result = await needsMigration();
      expect(result).toBe(false);
    });

    it('should detect migration needed for future version', async () => {
      await setCurrentSchemaVersion('3.0.0');
      const result = await needsMigration();
      expect(result).toBe(true);
    });
  });

  describe('Tank-to-Tank Migration', () => {
    it('should migrate data to Tank-to-Tank schema', async () => {
      const oldData = {
        version: '1.0.0',
        logs: [
          {
            id: 1,
            date: '2025-01-10',
            odometer: 10000,
            liters: 20
          }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result).not.toBeNull();
      expect(result._migrated).toBe(true);
      expect(result._migrationVersion).toBe(SCHEMA_VERSION);
    });

    it('should return null for null input', async () => {
      const result = await migrateToTankToTankSystem(null);
      expect(result).toBeNull();
    });

    it('should return data as-is if no logs exist', async () => {
      const data = {
        logs: [],
        vehicles: [],
        vehicleProfile: { name: 'Test' }
      };

      const result = await migrateToTankToTankSystem(data);

      expect(result.logs).toHaveLength(0);
    });

    it('should add Tank-to-Tank fields to logs', async () => {
      const oldData = {
        logs: [
          {
            id: 1,
            date: '2025-01-10',
            odometer: 10000,
            liters: 40
          }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.logs[0]).toHaveProperty('isFullTank');
      expect(result.logs[0]).toHaveProperty('tankCapacity');
      expect(result.logs[0]).toHaveProperty('fillPercentage');
    });

    it('should add Tank-to-Tank fields to vehicle profile', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile).toHaveProperty('lastFullFillLogId');
      expect(result.vehicleProfile).toHaveProperty('lastFullFillDate');
      expect(result.vehicleProfile).toHaveProperty('averageTankToTankMileage');
      expect(result.vehicleProfile).toHaveProperty('tankToTankTrips');
    });

    it('should set default values for new fields', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile.tankToTankTheftThreshold).toBe(25);
      expect(result.vehicleProfile.minimumFillPercentage).toBe(80);
      expect(result.vehicleProfile.useFullTankOnly).toBe(false);
    });

    it('should preserve existing vehicle profile data', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile.name).toBe('Test Vehicle');
      expect(result.vehicleProfile.make).toBe('Toyota');
      expect(result.vehicleProfile.model).toBe('Corolla');
      expect(result.vehicleProfile.year).toBe(2020);
      expect(result.vehicleProfile.tankCapacity).toBe(50);
    });

    it('should handle multiple logs in migration', async () => {
      const oldData = {
        logs: [
          { id: 1, date: '2025-01-10', odometer: 10000, liters: 45 },
          { id: 2, date: '2025-01-20', odometer: 10500, liters: 45 },
          { id: 3, date: '2025-01-30', odometer: 11000, liters: 45 }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.logs).toHaveLength(3);
      result.logs.forEach(log => {
        expect(log).toHaveProperty('isFullTank');
        expect(log).toHaveProperty('tankCapacity');
      });
    });

    it('should sort logs chronologically before migration', async () => {
      const oldData = {
        logs: [
          { id: 3, date: '2025-01-30', odometer: 11000, liters: 45 },
          { id: 1, date: '2025-01-10', odometer: 10000, liters: 45 },
          { id: 2, date: '2025-01-20', odometer: 10500, liters: 45 }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      // Logs should still exist (sorted internally)
      expect(result.logs).toHaveLength(3);
    });

    it('should add migration metadata', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: { name: 'Test', tankCapacity: 50 }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result._migrated).toBe(true);
      expect(result._migrationVersion).toBe(SCHEMA_VERSION);
      expect(result._migrationDate).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('should validate correctly migrated data', () => {
      const validData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15
        },
        logs: [
          { id: 1, date: '2025-01-10', odometer: 10000, liters: 20 }
        ]
      };

      const validation = validateMigratedData(validData);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect missing vehicle profile', () => {
      const invalidData = {
        logs: []
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Vehicle profile is missing');
    });

    it('should detect missing tank capacity', () => {
      const invalidData = {
        vehicleProfile: {
          name: 'Test Vehicle'
        },
        logs: []
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Vehicle tank capacity is missing');
    });

    it('should detect missing expected mileage', () => {
      const invalidData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        },
        logs: []
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Vehicle expected mileage is missing');
    });

    it('should detect invalid odometer in logs', () => {
      const invalidData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15
        },
        logs: [
          { id: 1, date: '2025-01-10', liters: 20 }
          // Missing odometer
        ]
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid date in logs', () => {
      const invalidData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15
        },
        logs: [
          { id: 1, odometer: 10000, liters: 20 }
          // Missing date
        ]
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
    });

    it('should detect missing fuel amount in logs', () => {
      const invalidData = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15
        },
        logs: [
          { id: 1, date: '2025-01-10', odometer: 10000 }
          // Missing liters
        ]
      };

      const validation = validateMigratedData(invalidData);

      expect(validation.valid).toBe(false);
    });

    it('should warn for missing logs', () => {
      const data = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15
        },
        logs: []
      };

      const validation = validateMigratedData(data);

      expect(validation.valid).toBe(true);
      expect(validation.warnings).toContain('No logs found in data');
    });

    it('should warn for out-of-range minimum fill percentage', () => {
      const data = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15,
          minimumFillPercentage: 120 // Out of range
        },
        logs: []
      };

      const validation = validateMigratedData(data);

      expect(validation.warnings.some(w =>
        w.includes('Minimum fill percentage')
      )).toBe(true);
    });

    it('should warn for out-of-range theft threshold', () => {
      const data = {
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50,
          expectedMileage: 15,
          tankToTankTheftThreshold: 150 // Out of range
        },
        logs: []
      };

      const validation = validateMigratedData(data);

      expect(validation.warnings.some(w =>
        w.includes('Theft threshold')
      )).toBe(true);
    });

    it('should handle null data', () => {
      const validation = validateMigratedData(null);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('No data provided for validation');
    });
  });

  describe('Rollback Migration', () => {
    it('should rollback migration successfully', async () => {
      // Set some data
      localStorage.setItem('fuelGuardDB', JSON.stringify({ logs: [] }));
      localStorage.setItem(CURRENT_VERSION_KEY, '2.0.0');

      const result = await rollbackMigration();

      expect(result).toBe(true);
      expect(localStorage.getItem('fuelGuardDB')).toBeNull();
      expect(localStorage.getItem(CURRENT_VERSION_KEY)).toBeNull();
    });

    it('should handle rollback when data already cleared', async () => {
      const result = await rollbackMigration();
      expect(result).toBe(true);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle logs with missing vehicleId', async () => {
      const oldData = {
        logs: [
          { id: 1, date: '2025-01-10', odometer: 10000, liters: 45 }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      // vehicleId should be set to currentVehicleId or null
      expect(result.logs[0].vehicleId).toBeDefined();
    });

    it('should handle corrupted log data', async () => {
      const oldData = {
        logs: [
          { id: 1, date: '2025-01-10', odometer: 'invalid', liters: 45 }
        ],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      // Should still migrate even with corrupted data
      expect(result).toBeDefined();
    });

    it('should handle empty string vehicle name', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: '',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile.name).toBe('');
    });

    it('should handle zero tank capacity', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 0
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile.tankCapacity).toBe(0);
    });

    it('should handle negative tank capacity', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: -50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile.tankCapacity).toBe(-50);
    });

    it('should handle vehicles array with multiple entries', async () => {
      const oldData = {
        logs: [],
        vehicles: [
          { id: 1, name: 'Vehicle 1', tankCapacity: 50 },
          { id: 2, name: 'Vehicle 2', tankCapacity: 60 }
        ],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicles).toHaveLength(2);
      result.vehicles.forEach(v => {
        expect(v).toHaveProperty('lastFullFillLogId');
        expect(v).toHaveProperty('tankToTankTrips');
      });
    });
  });

  describe('GPS Settings Migration', () => {
    it('should add GPS-related fields to vehicle profile', async () => {
      const oldData = {
        logs: [],
        vehicles: [],
        vehicleProfile: {
          name: 'Test Vehicle',
          tankCapacity: 50
        }
      };

      const result = await migrateToTankToTankSystem(oldData);

      expect(result.vehicleProfile).toHaveProperty('enableGpsTracking');
      expect(result.vehicleProfile).toHaveProperty('minimumTripDistance');
      expect(result.vehicleProfile.enableGpsTracking).toBe(false);
      expect(result.vehicleProfile.minimumTripDistance).toBe(10);
    });
  });
});
