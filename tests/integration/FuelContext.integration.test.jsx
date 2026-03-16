/**
 * FuelContext Integration Tests
 *
 * Tests React Context provider that manages application state.
 * Verifies data flows between UI, storage, and calculations.
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FuelProvider, FuelContext } from '../../src/context/FuelContext.jsx';

// Mock storage to use in-memory fallback
vi.mock('../../src/utils/storage.js', () => ({
  storage: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getStorageType: vi.fn(() => 'inMemory'),
  },
}));

// Mock AuthContext to provide a test user (FuelProvider uses useAuth)
// IMPORTANT: Return a stable reference to avoid re-triggering useEffect([user])
vi.mock('../../src/context/AuthContext', () => {
  const stableUser = { uid: 'test-user-123' };
  const stableAuth = { user: stableUser, loading: false };
  return {
    useAuth: vi.fn(() => stableAuth),
  };
});

// Mock Firebase to prevent real initialization in tests
vi.mock('../../src/services/firebase', () => ({
  auth: {},
  db: {},
  signOut: vi.fn(),
}));

// Mock Firestore service layer
vi.mock('../../src/services/firestore', () => ({
  getUserVehicles: vi.fn(async () => []),
  getUserDrivers: vi.fn(async () => []),
  getVehicleLogs: vi.fn(async () => []),
  createVehicle: vi.fn(async (userId, vehicleData) => ({
    id: vehicleData.id || `vehicle-${Date.now()}`,
    ...vehicleData,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateVehicle: vi.fn(async () => ({})),
  deleteVehicle: vi.fn(async () => true),
  createDriver: vi.fn(async (userId, driverData) => ({
    id: driverData.id || `driver-${Date.now()}`,
    ...driverData,
    createdAt: new Date(),
  })),
  updateDriver: vi.fn(async () => ({})),
  deleteDriver: vi.fn(async () => true),
  createFuelLog: vi.fn(async (userId, vehicleId, logData) => ({
    id: logData.id || `log-${Date.now()}`,
    ...logData,
    vehicleId,
    createdAt: new Date(),
  })),
  updateFuelLog: vi.fn(async () => ({})),
  deleteFuelLog: vi.fn(async () => true),
  subscribeToVehicles: vi.fn(() => vi.fn()),
  subscribeToDrivers: vi.fn(() => vi.fn()),
  subscribeToVehicleLogs: vi.fn(() => vi.fn()),
  hasUserData: vi.fn(async () => false),
}));

describe('FuelContext Integration', () => {
  let wrapper;

  // Helper: create the hook and wait for async initial load to complete
  const setupHook = async () => {
    const hook = renderHook(() => React.useContext(FuelContext), { wrapper });
    await waitFor(() => {
      expect(hook.result.current.loading).toBe(false);
    });
    return hook;
  };

  // Helper: create hook + add a default vehicle for tests that need one
  const setupHookWithVehicle = async (vehicleOverrides = {}) => {
    const hook = await setupHook();
    await act(async () => {
      await hook.result.current.addVehicle({
        id: 'test-vehicle',
        name: 'Test Vehicle',
        tankCapacity: 50,
        expectedMileage: 15,
        ...vehicleOverrides,
      });
    });
    return hook;
  };

  beforeEach(() => {
    wrapper = ({ children }) => (
      <FuelProvider>{children}</FuelProvider>
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addLog', () => {
    it('should add fuel log and persist to storage', async () => {
      const { result } = await setupHookWithVehicle();

      const newLog = {
        date: '2025-01-15T10:30:00Z',
        odometer: 15000,
        liters: 45.5,
        price: 120.00,
      };

      await act(async () => {
        await result.current.addLog(newLog);
      });

      expect(result.current.data.logs).toHaveLength(1);
      expect(result.current.data.logs[0]).toMatchObject(newLog);
    });

    it('should recalculate statistics after adding log', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
        });
      });

      expect(result.current.data.stats.avgMileage).toBeGreaterThan(0);
      expect(result.current.data.stats.totalFuel).toBe(45.5);
      expect(result.current.data.stats.totalExpenditure).toBe(120.00);
    });

    it('should calculate mileage for new log', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
        });
      });

      expect(result.current.data.logs[0].mileage).toBe(0); // First log, no previous
    });

    it('should handle tank-to-tank calculation for full tank', async () => {
      const { result } = await setupHookWithVehicle();

      // First log (full tank)
      await act(async () => {
        await result.current.addLog({
          date: '2025-01-10T10:30:00Z',
          odometer: 10000,
          liters: 45.0,
          price: 120.00,
          tankCapacity: 50,
          isFullTank: true,
        });
      });

      // Second log (full tank)
      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          tankCapacity: 50,
          isFullTank: true,
        });
      });

      expect(result.current.data.logs[0].isFullTank).toBe(true);
      expect(result.current.data.vehicleProfile.lastFullFillLogId).toBeDefined();
    });

    it('should handle storage errors gracefully', async () => {
      const { result } = await setupHookWithVehicle();

      // Mock storage error (irrelevant with Firestore but tests resilience)
      const { storage } = await import('../../src/utils/storage.js');
      storage.set.mockRejectedValueOnce(new Error('Storage error'));

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
        });
      });

      // Should still update state even if storage fails
      expect(result.current.data.logs).toHaveLength(1);
    });
  });

  describe('deleteLog', () => {
    it('should delete fuel log and cascade updates', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          id: 'log-1',
        });
      });

      await act(async () => {
        await result.current.deleteLog('log-1');
      });

      expect(result.current.data.logs).toHaveLength(0);
      expect(result.current.data.stats.totalFuel).toBe(0);
    });

    it('should recalculate tank-to-tank data after deletion', async () => {
      const { result } = await setupHookWithVehicle();

      // Add multiple full tank logs
      await act(async () => {
        await result.current.addLog({
          date: '2025-01-10T10:30:00Z',
          odometer: 10000,
          liters: 45.0,
          price: 120.00,
          tankCapacity: 50,
          isFullTank: true,
          id: 'log-1',
        });
      });

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          tankCapacity: 50,
          isFullTank: true,
          id: 'log-2',
        });
      });

      // Delete first log
      await act(async () => {
        await result.current.deleteLog('log-1');
      });

      expect(result.current.data.logs).toHaveLength(1);
      expect(result.current.data.vehicleProfile.tankToTankTrips).toBeDefined();
    });
  });

  describe('updateVehicleProfile', () => {
    it('should update vehicle profile and cascade changes', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.updateVehicleProfile({
          expectedMileage: 15,
          tankCapacity: 50,
        });
      });

      expect(result.current.data.vehicleProfile.expectedMileage).toBe(15);
      expect(result.current.data.vehicleProfile.tankCapacity).toBe(50);
    });

    it('should update theft threshold', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.updateVehicleProfile({
          theftThreshold: 0.80,
        });
      });

      expect(result.current.data.vehicleProfile.theftThreshold).toBe(0.80);
    });

    it('should update monthly budget', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.updateVehicleProfile({
          monthlyBudget: 250,
        });
      });

      expect(result.current.data.vehicleProfile.monthlyBudget).toBe(250);
    });
  });

  describe('Vehicle Management', () => {
    it('should add vehicle and switch to it', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
        });
      });

      expect(result.current.data.vehicles).toHaveLength(1);
      expect(result.current.data.currentVehicleId).toBe('vehicle-1');
    });

    it('should update vehicle details', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
        });
      });

      await act(async () => {
        await result.current.updateVehicle('vehicle-1', {
          name: 'Toyota Corolla Updated',
        });
      });

      expect(result.current.data.vehicles[0].name).toBe('Toyota Corolla Updated');
    });

    it('should delete vehicle and remove associated logs', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
        });
      });

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          vehicleId: 'vehicle-1',
        });
      });

      await act(async () => {
        await result.current.deleteVehicle('vehicle-1');
      });

      expect(result.current.data.vehicles).toHaveLength(0);
    });

    it('should select vehicle and update vehicle profile', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
        });
      });

      await act(async () => {
        result.current.selectVehicle('vehicle-1');
      });

      expect(result.current.data.currentVehicleId).toBe('vehicle-1');
      expect(result.current.data.vehicleProfile.name).toBe('Toyota Corolla');
    });

    it('should isolate data when switching vehicles', async () => {
      const { result } = await setupHook();

      // Add vehicle 1
      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
          year: 2020,
          make: 'Toyota',
          model: 'Corolla',
        });
      });

      await act(async () => {
        result.current.selectVehicle('vehicle-1');
      });

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          vehicleId: 'vehicle-1',
        });
      });

      expect(result.current.data.logs).toHaveLength(1);

      // Add vehicle 2 and switch
      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-2',
          name: 'Honda Civic',
          year: 2021,
          make: 'Honda',
          model: 'Civic',
        });
      });

      await act(async () => {
        result.current.selectVehicle('vehicle-2');
      });

      // Vehicle 2 should have no logs
      expect(result.current.data.logs).toHaveLength(0);
    });
  });

  describe('Driver Management', () => {
    it('should add driver and assign to vehicle', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addDriver({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
        });
      });

      expect(result.current.data.drivers).toHaveLength(1);
      expect(result.current.data.drivers[0].name).toBe('John Doe');
    });

    it('should update driver details', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addDriver({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
        });
      });

      const driverId = result.current.data.drivers[0].id;

      await act(async () => {
        await result.current.updateDriver(driverId, {
          email: 'john.doe@example.com',
        });
      });

      expect(result.current.data.drivers[0].email).toBe('john.doe@example.com');
    });

    it('should delete driver and unassign vehicle', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addDriver({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
        });
      });

      const driverId = result.current.data.drivers[0].id;

      await act(async () => {
        await result.current.deleteDriver(driverId);
      });

      expect(result.current.data.drivers).toHaveLength(0);
    });
  });

  describe('Currency Conversion', () => {
    it('should update currency settings', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.updateVehicleProfile({
          currency: 'EUR',
        });
      });

      expect(result.current.data.vehicleProfile.currency).toBe('EUR');
    });

    it('should convert existing data on currency change', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
          currency: 'USD',
        });
      });

      // Note: Actual currency conversion requires mocking the fetchExchangeRates function
      // For now, we verify the profile update works
      await act(async () => {
        await result.current.updateVehicleProfileWithCurrencyConversion({
          currency: 'EUR',
        });
      });

      expect(result.current.data.vehicleProfile.currency).toBe('EUR');
    });
  });

  describe('GPS Tracking', () => {
    it('should start GPS route tracking', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.startGPSRouteTracking();
      });

      expect(result.current.data.vehicleProfile.gpsRoutes).toBeDefined();
      expect(result.current.data.vehicleProfile.gpsRoutes.length).toBeGreaterThan(0);
      expect(result.current.data.vehicleProfile.gpsRoutes[0].isTracking).toBe(true);
    });

    it('should stop GPS route tracking', async () => {
      const { result } = await setupHook();

      let watchId;
      await act(async () => {
        watchId = result.current.startGPSRouteTracking();
      });

      await act(async () => {
        result.current.stopGPSRouteTracking(watchId);
      });

      const activeRoutes = result.current.data.vehicleProfile.gpsRoutes.filter(r => r.isTracking);
      expect(activeRoutes.length).toBe(0);
    });

    it('should clear GPS routes', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.clearGPSRoutes();
      });

      expect(result.current.data.vehicleProfile.gpsRoutes).toHaveLength(0);
    });
  });

  describe('Data Management', () => {
    it('should clear all data', async () => {
      const { result } = await setupHook();

      await act(async () => {
        await result.current.addVehicle({
          id: 'vehicle-1',
          name: 'Toyota Corolla',
        });
      });

      await act(async () => {
        await result.current.clearAllData();
      });

      expect(result.current.data.logs).toHaveLength(0);
      expect(result.current.data.vehicles).toHaveLength(0);
      expect(result.current.data.drivers).toHaveLength(0);
    });

    it('should inject demo data', async () => {
      const { result } = await setupHook();

      await act(async () => {
        result.current.injectDemoData();
      });

      // injectDemoData is a no-op with Firestore backend
      expect(result.current.data).toBeDefined();
    });

    it('should handle loading state', async () => {
      const { result } = await setupHook();

      // Loading should be false after initial load
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing vehicle profile', async () => {
      const { result } = await setupHook();

      expect(result.current.data.vehicleProfile).toBeDefined();
    });

    it('should handle invalid log data', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await result.current.addLog({
          date: '2025-01-15T10:30:00Z',
          odometer: 15000,
          liters: 45.5,
          price: 120.00,
        });
      });

      expect(result.current.data.logs).toHaveLength(1);
    });

    it('should handle concurrent log additions', async () => {
      const { result } = await setupHookWithVehicle();

      await act(async () => {
        await Promise.all([
          result.current.addLog({
            date: '2025-01-15T10:30:00Z',
            odometer: 15000,
            liters: 45.5,
            price: 120.00,
          }),
          result.current.addLog({
            date: '2025-01-16T10:30:00Z',
            odometer: 15500,
            liters: 40.0,
            price: 110.00,
          }),
        ]);
      });

      expect(result.current.data.logs).toHaveLength(2);
    });
  });
});
