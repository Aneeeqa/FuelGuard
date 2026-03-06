import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';

export const FuelContext = createContext();

const STORAGE_KEY = 'fuelGuardDB';

// Default state shape
const defaultState = {
  logs: [],
  vehicleProfile: {
    name: '',
    expectedMileage: 15,
    tankCapacity: 50,
    country: 'US', // Default to US
    currency: 'USD',
    // EPA vehicle data (populated when user selects from database)
    vehicleId: null,
    year: null,
    make: null,
    model: null,
    variant: null,
    epaCity: null,
    epaHighway: null,
    epaCombined: null,
    fuelType: null,
  },
  stats: {
    avgMileage: 15,
    totalFuel: 0,
    totalDistance: 0,
  },
  // Last known GPS location for distance tracking
  lastLocation: null,
};

export const FuelProvider = ({ children }) => {
  const [data, setData] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState('loading');
  const [skipPersist, setSkipPersist] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await storage.get(STORAGE_KEY);
        if (stored) {
          setData({ ...defaultState, ...stored });
        }
        setStorageType(storage.getStorageType());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to storage on data change (skip initial load and when clearing)
  useEffect(() => {
    if (!loading && !skipPersist) {
      storage.set(STORAGE_KEY, data);
    }
    // Reset skipPersist after the effect runs
    if (skipPersist) {
      setSkipPersist(false);
    }
  }, [data, loading, skipPersist]);

  // Calculate stats when logs change
  const calculateStats = useCallback((logs) => {
    if (logs.length === 0) {
      return { avgMileage: 15, totalFuel: 0, totalDistance: 0 };
    }

    const totalFuel = logs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const validMileages = logs.filter((log) => log.mileage > 0);
    const avgMileage =
      validMileages.length > 0
        ? validMileages.reduce((sum, log) => sum + log.mileage, 0) / validMileages.length
        : 15;

    // Calculate total distance from first to last odometer reading
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalDistance =
      sortedLogs.length > 1
        ? sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer
        : 0;

    return { avgMileage, totalFuel, totalDistance };
  }, []);

  // Add a new log entry
  const addLog = useCallback((newLog) => {
    setData((prev) => {
      // Sort logs by date descending to get the most recent
      const sortedLogs = [...prev.logs].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const lastLog = sortedLogs.find(
        (log) => new Date(log.date) < new Date(newLog.date)
      );

      let mileage = 0;
      let isFlagged = false;

      if (lastLog && newLog.liters > 0) {
        const distance = newLog.odometer - lastLog.odometer;
        mileage = distance / newLog.liters;

        // Theft detection: Flag if efficiency is 25% below average
        if (mileage < prev.stats.avgMileage * 0.75 && mileage > 0) {
          isFlagged = true;
        }
      }

      const logEntry = {
        ...newLog,
        mileage: Math.round(mileage * 100) / 100,
        isFlagged,
        id: Date.now().toString(),
      };

      const updatedLogs = [logEntry, ...prev.logs];
      const newStats = calculateStats(updatedLogs);

      return { ...prev, logs: updatedLogs, stats: newStats };
    });
  }, [calculateStats]);

  // Delete a log entry
  const deleteLog = useCallback((logId) => {
    setData((prev) => {
      const updatedLogs = prev.logs.filter((log) => log.id !== logId);
      const newStats = calculateStats(updatedLogs);
      return { ...prev, logs: updatedLogs, stats: newStats };
    });
  }, [calculateStats]);

  // Update vehicle profile
  const updateVehicleProfile = useCallback((profile) => {
    setData((prev) => ({
      ...prev,
      vehicleProfile: { ...prev.vehicleProfile, ...profile },
    }));
  }, []);

  const injectDemoData = useCallback(() => {
    const now = new Date();
    const demoLogs = [
      // Most recent - THEFT scenario (dramatic mileage drop)
      {
        id: '1',
        date: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 15250,
        liters: 45,
        price: 4500,
        mileage: 5.5, // Very low - THEFT
        isFlagged: true,
      },
      // Normal entry
      {
        id: '2',
        date: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 15000,
        liters: 35,
        price: 3500,
        mileage: 14.3,
        isFlagged: false,
      },
      // Normal entry
      {
        id: '3',
        date: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 14500,
        liters: 32,
        price: 3200,
        mileage: 15.6,
        isFlagged: false,
      },
      // Another THEFT scenario
      {
        id: '4',
        date: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 14000,
        liters: 50,
        price: 5000,
        mileage: 6.0, // Very low - THEFT
        isFlagged: true,
      },
      // Normal entries
      {
        id: '5',
        date: new Date(now - 16 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 13700,
        liters: 30,
        price: 3000,
        mileage: 13.3,
        isFlagged: false,
      },
      {
        id: '6',
        date: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 13300,
        liters: 28,
        price: 2800,
        mileage: 14.3,
        isFlagged: false,
      },
      {
        id: '7',
        date: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 12900,
        liters: 30,
        price: 3000,
        mileage: 15.0,
        isFlagged: false,
      },
      {
        id: '8',
        date: new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 12450,
        liters: 35,
        price: 3500,
        mileage: 14.0,
        isFlagged: false,
      },
      // Another THEFT
      {
        id: '9',
        date: new Date(now - 32 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 11960,
        liters: 55,
        price: 5500,
        mileage: 4.5, // Very low - THEFT
        isFlagged: true,
      },
      {
        id: '10',
        date: new Date(now - 36 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 11710,
        liters: 32,
        price: 3200,
        mileage: 15.6,
        isFlagged: false,
      },
      {
        id: '11',
        date: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 11210,
        liters: 33,
        price: 3300,
        mileage: 14.2,
        isFlagged: false,
      },
      {
        id: '12',
        date: new Date(now - 44 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 10740,
        liters: 30,
        price: 3000,
        mileage: 15.3,
        isFlagged: false,
      },
      {
        id: '13',
        date: new Date(now - 48 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 10280,
        liters: 31,
        price: 3100,
        mileage: 14.8,
        isFlagged: false,
      },
      {
        id: '14',
        date: new Date(now - 52 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 9820,
        liters: 29,
        price: 2900,
        mileage: 14.5,
        isFlagged: false,
      },
      {
        id: '15',
        date: new Date(now - 56 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 9400,
        liters: 28,
        price: 2800,
        mileage: 15.0,
        isFlagged: false,
      },
    ];

    const stats = calculateStats(demoLogs);

    setData({
      logs: demoLogs,
      vehicleProfile: {
        name: 'Sample Vehicle',
        expectedMileage: 15,
        tankCapacity: 50,
        country: 'US',
        currency: 'USD',
        vehicleId: null,
        year: null,
        make: null,
        model: null,
        variant: null,
        epaCity: null,
        epaHighway: null,
        epaCombined: null,
        fuelType: null,
      },
      stats,
      lastLocation: null,
    });
  }, [calculateStats]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    setSkipPersist(true); // Prevent the persistence effect from saving defaultState
    await storage.clear(STORAGE_KEY);
    setData(defaultState);
  }, []);

  const value = {
    data,
    loading,
    storageType,
    addLog,
    deleteLog,
    updateVehicleProfile,
    injectDemoData,
    clearAllData,
  };

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
};

