import React, { createContext, useState, useEffect, useCallback } from 'react';
import { storage } from '../utils/storage';
import {
  calculateTotalCO2,
  calculateCO2PerKm,
  calculateMonthlyCO2,
  calculateYearlyCO2,
} from '../utils/carbonCalculations';
import {
  calculateTotalExpenditure,
  calculateCostPerKm,
  checkBudgetAlert,
} from '../utils/calculations';
import { convertCurrencySync } from '../utils/currency';

// Add console logging for debugging
console.log('FuelContext module loaded');

export const FuelContext = createContext();

const STORAGE_KEY = 'fuelGuardDB';

// Default state shape
const defaultState = {
  logs: [],
  drivers: [],
  vehicles: [],
  currentVehicleId: null,
  // Backward compatibility - derived from currentVehicleId
  vehicleProfile: {
    name: '',
    expectedMileage: 15,
    tankCapacity: 50,
    country: 'US',
    currency: 'USD',
    distanceUnit: 'km',
    fuelVolumeUnit: 'L',
    efficiencyUnit: 'km/L',
    vehicleId: null,
    year: null,
    make: null,
    model: null,
    variant: null,
    epaCity: null,
    epaHighway: null,
    epaCombined: null,
    fuelType: null,
    assignedDriverId: null,
    geofences: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  },
  stats: {
    avgMileage: 15,
    totalFuel: 0,
    totalDistance: 0,
    totalCO2: 0,
    co2PerKm: 0,
    monthlyCO2: [],
    yearlyCO2: [],
    totalExpenditure: 0,
    costPerKm: 0,
    averagePricePerUnit: 0,
  },
  // Monthly budget for budget alerts
  monthlyBudget: 200, // Default $200 monthly budget
  budgetAlert: null,
  // Last known GPS location for distance tracking
  lastLocation: null,
};

export const FuelProvider = ({ children }) => {
  console.log('FuelProvider: Initializing...');

  const [data, setData] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState('loading');
  const [skipPersist, setSkipPersist] = useState(false);

  console.log('FuelProvider: State initialized');

  // Load from storage on mount
  useEffect(() => {
    const loadData = async () => {
      console.log('FuelProvider: Loading data from storage...');
      try {
        const stored = await storage.get(STORAGE_KEY);
        console.log('FuelProvider: Stored data loaded:', stored);
        if (stored) {
          setData({ ...defaultState, ...stored });
        }
        setStorageType(storage.getStorageType());
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        console.log('FuelProvider: Loading complete');
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
  const calculateStats = useCallback((logs, vehicleId = null) => {
    // Filter logs by vehicle if vehicleId is provided
    const filteredLogs = vehicleId && data.vehicles && data.vehicles.length > 1
      ? logs.filter(log => log.vehicleId === vehicleId || (!log.vehicleId && vehicleId === data.currentVehicleId))
      : logs;

    if (filteredLogs.length === 0) {
      return {
        avgMileage: 15,
        totalFuel: 0,
        totalDistance: 0,
        totalCO2: 0,
        co2PerKm: 0,
        monthlyCO2: [],
        yearlyCO2: [],
      };
    }

    const totalFuel = filteredLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const validMileages = filteredLogs.filter((log) => log.mileage > 0);
    const avgMileage =
      validMileages.length > 0
        ? validMileages.reduce((sum, log) => sum + log.mileage, 0) / validMileages.length
        : 15;

    // Calculate total distance from first to last odometer reading
    const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalDistance =
      sortedLogs.length > 1
        ? sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer
        : 0;

    // Calculate carbon emissions
    const fuelType = data.vehicleProfile?.fuelType || 'gasoline';
    const totalCO2 = calculateTotalCO2(filteredLogs, fuelType);
    const co2PerKm = calculateCO2PerKm(totalCO2, totalDistance);
    const monthlyCO2 = calculateMonthlyCO2(filteredLogs, fuelType);
    const yearlyCO2 = calculateYearlyCO2(filteredLogs, fuelType);

    // Calculate cost statistics
    const totalExpenditure = filteredLogs.reduce((sum, log) => sum + (log.price || 0), 0);
    const costPerKm = totalDistance > 0 ? totalExpenditure / totalDistance : 0;
    const averagePricePerUnit = totalFuel > 0 ? totalExpenditure / totalFuel : 0;

    // Check budget alert
    const budgetAlert = checkBudgetAlert(totalExpenditure, data.monthlyBudget || 200);

    return {
      avgMileage,
      totalFuel,
      totalDistance,
      totalCO2,
      co2PerKm,
      monthlyCO2,
      yearlyCO2,
      totalExpenditure,
      costPerKm,
      averagePricePerUnit,
    };
  }, [data.vehicleProfile?.fuelType, data.monthlyBudget, data.currentVehicleId, data.vehicles]);

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
        fuelType: newLog.fuelType || prev.vehicleProfile.fuelType || 'gasoline',
        // Store currency information with the log
        currency: prev.vehicleProfile.currency || 'USD',
        originalCurrency: prev.vehicleProfile.currency || 'USD',
        originalPrice: newLog.price,
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

  // Update vehicle profile with currency conversion
  const updateVehicleProfileWithCurrencyConversion = useCallback(async (profile) => {
    // Get current values first
    const currentData = { ...data };
    const oldCurrency = currentData.vehicleProfile?.currency || 'USD';
    const newCurrency = profile.currency || oldCurrency;

    console.log(`Currency conversion request: ${oldCurrency} -> ${newCurrency}`);

    // Only convert if currency is actually changing and we have logs
    if (oldCurrency !== newCurrency && currentData.logs.length > 0) {
      console.log(`Converting currency from ${oldCurrency} to ${newCurrency}`);

      try {
        // Import and fetch exchange rates
        const { fetchExchangeRates, convertCurrencySync } = await import('../utils/currency');
        const rates = await fetchExchangeRates(oldCurrency);
        console.log('Exchange rates fetched:', rates);

        // Create conversion function using fetched rates
        const convertWithRates = (amount, from, to) => {
          if (!amount || from === to) return amount;
          const rate = rates?.rates?.[to];
          if (!rate) {
            console.warn(`No exchange rate for ${to}, using fallback`);
            return convertCurrencySync(amount, from, to);
          }
          return amount * rate;
        };

        // Convert all log prices
        const convertedLogs = currentData.logs.map(log => ({
          ...log,
          currency: newCurrency,
          price: convertWithRates(log.price, oldCurrency, newCurrency),
          pricePerLiter: log.pricePerLiter
            ? convertWithRates(log.pricePerLiter, oldCurrency, newCurrency)
            : null,
          costPerKm: log.costPerKm
            ? convertWithRates(log.costPerKm, oldCurrency, newCurrency)
            : null,
          costPerMile: log.costPerMile
            ? convertWithRates(log.costPerMile, oldCurrency, newCurrency)
            : null,
          originalCurrency: log.originalCurrency || oldCurrency,
          originalPrice: log.originalPrice || log.price,
        }));

        // Recalculate stats with converted logs
        const newStats = calculateStats(convertedLogs);

        console.log('Currency conversion successful, updating state');
        setData({
          ...currentData,
          vehicleProfile: { ...currentData.vehicleProfile, ...profile, currency: newCurrency },
          logs: convertedLogs,
          stats: newStats,
        });
      } catch (error) {
        console.error('Failed to convert currency:', error);
        // Fallback: just update currency label without conversion
        setData({
          ...currentData,
          vehicleProfile: { ...currentData.vehicleProfile, ...profile, currency: newCurrency },
        });
      }
    } else {
      // Just update profile without currency conversion
      setData({
        ...currentData,
        vehicleProfile: { ...currentData.vehicleProfile, ...profile },
      });
    }
    }, [data, calculateStats]);

  // Add a new driver
  const addDriver = useCallback((driver) => {
    setData((prev) => ({
      ...prev,
      drivers: [
        ...prev.drivers,
        {
          ...driver,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  // Update a driver
  const updateDriver = useCallback((driverId, updates) => {
    setData((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId ? { ...driver, ...updates } : driver
      ),
    }));
  }, []);

  // Delete a driver
  const deleteDriver = useCallback((driverId) => {
    setData((prev) => {
      const updatedDrivers = prev.drivers.filter((driver) => driver.id !== driverId);
      return { ...prev, drivers: updatedDrivers };
    });
  }, []);

  // Add a new vehicle
  const addVehicle = useCallback((vehicle) => {
    setData((prev) => {
      const newVehicle = {
        ...vehicle,
        id: vehicle.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      const updatedVehicles = [...prev.vehicles, newVehicle];
      const newCurrentVehicleId = prev.currentVehicleId || newVehicle.id;
      const updatedProfile = { ...newVehicle, id: undefined, createdAt: undefined };
      return {
        ...prev,
        vehicles: updatedVehicles,
        currentVehicleId: newCurrentVehicleId,
        vehicleProfile: updatedProfile,
      };
    });
  }, []);

  // Update a vehicle
  const updateVehicle = useCallback((vehicleId, updates) => {
    setData((prev) => {
      const updatedVehicles = prev.vehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, ...updates } : vehicle
      );
      const updatedProfile = prev.currentVehicleId === vehicleId
        ? { ...prev.vehicleProfile, ...updates, id: undefined, createdAt: undefined }
        : prev.vehicleProfile;
      return {
        ...prev,
        vehicles: updatedVehicles,
        vehicleProfile: updatedProfile,
      };
    });
  }, []);

  // Delete a vehicle
  const deleteVehicle = useCallback((vehicleId) => {
    setData((prev) => {
      const updatedVehicles = prev.vehicles.filter((vehicle) => vehicle.id !== vehicleId);
      const newCurrentVehicleId = prev.currentVehicleId === vehicleId
        ? (updatedVehicles.length > 0 ? updatedVehicles[0].id : null)
        : prev.currentVehicleId;
      const updatedProfile = newCurrentVehicleId
        ? { ...updatedVehicles.find(v => v.id === newCurrentVehicleId), id: undefined, createdAt: undefined }
        : prev.vehicleProfile;
      return {
        ...prev,
        vehicles: updatedVehicles,
        currentVehicleId: newCurrentVehicleId,
        vehicleProfile: updatedProfile,
      };
    });
  }, []);

  // Select current vehicle
  const selectVehicle = useCallback((vehicleId) => {
    setData((prev) => {
      const selectedVehicle = prev.vehicles.find(v => v.id === vehicleId);
      if (!selectedVehicle) return prev;
      return {
        ...prev,
        currentVehicleId: vehicleId,
        vehicleProfile: { ...selectedVehicle, id: undefined, createdAt: undefined },
      };
    });
  }, []);

  // Inject demo data for demonstration
  const injectDemoData = useCallback(() => {
    const now = new Date();
    const demoLogs = [
      // Most recent - THEFT scenario (dramatic mileage drop)
      {
        id: '1',
        date: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 9480, // USC: miles (9,480 miles = ~15,250 km)
        liters: 11.9, // USC: gallons (11.9 gallons = ~45 liters)
        price: 45.00, // USC: dollars (not cents)
        mileage: 5.5, // Very low - THEFT
        isFlagged: true,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 45.00,
      },
      // Normal entry
      {
        id: '2',
        date: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 9317,
        liters: 9.2,
        price: 35.00,
        mileage: 14.3,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 35.00,
      },
      // Normal entry
      {
        id: '3',
        date: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 9008,
        liters: 8.5,
        price: 32.00,
        mileage: 15.6,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 32.00,
      },
      // Another THEFT scenario
      {
        id: '4',
        date: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 8700,
        liters: 13.2,
        price: 50.00,
        mileage: 6.0, // Very low - THEFT
        isFlagged: true,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 50.00,
      },
      // Normal entries
      {
        id: '5',
        date: new Date(now - 16 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 8513,
        liters: 7.9,
        price: 30.00,
        mileage: 13.3,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 30.00,
      },
      {
        id: '6',
        date: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 8264,
        liters: 7.4,
        price: 28.00,
        mileage: 14.3,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 28.00,
      },
      {
        id: '7',
        date: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 8013,
        liters: 7.9,
        price: 30.00,
        mileage: 15.0,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 30.00,
      },
      {
        id: '8',
        date: new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 7736,
        liters: 9.2,
        price: 35.00,
        mileage: 14.0,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 35.00,
      },
      // Another THEFT
      {
        id: '9',
        date: new Date(now - 32 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 7434,
        liters: 14.5,
        price: 55.00,
        mileage: 4.5, // Very low - THEFT
        isFlagged: true,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 55.00,
      },
      {
        id: '10',
        date: new Date(now - 36 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 7273,
        liters: 8.5,
        price: 32.00,
        mileage: 15.6,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 32.00,
      },
      {
        id: '11',
        date: new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 6963,
        liters: 8.7,
        price: 33.00,
        mileage: 14.2,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 33.00,
      },
      {
        id: '12',
        date: new Date(now - 44 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 6675,
        liters: 7.9,
        price: 30.00,
        mileage: 15.3,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 30.00,
      },
      {
        id: '13',
        date: new Date(now - 48 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 6376,
        liters: 8.2,
        price: 31.00,
        mileage: 14.8,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 31.00,
      },
      {
        id: '14',
        date: new Date(now - 52 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 6076,
        liters: 7.7,
        price: 29.00,
        mileage: 14.5,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 29.00,
      },
      {
        id: '15',
        date: new Date(now - 56 * 24 * 60 * 60 * 1000).toISOString(),
        odometer: 5841,
        liters: 7.4,
        price: 28.00,
        mileage: 15.0,
        isFlagged: false,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: 28.00,
      },
    ];

    const stats = calculateStats(demoLogs);

    const demoVehicle = {
      id: 'vehicle-1',
      name: 'Sample Vehicle',
      expectedMileage: 15,
      tankCapacity: 50,
      country: 'US',
      currency: 'USD',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      vehicleId: 41190,
      make: 'Sample',
      model: 'Vehicle',
      variant: '2.0L 4cyl Auto CVT',
      epaCity: 30,
      epaHighway: 38,
      epaCombined: 33,
      fuelType: 'gasoline',
      assignedDriverId: 'driver-1',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    setData({
      logs: demoLogs,
      drivers: [
        {
          id: 'driver-1',
          name: 'Sample Driver',
          email: 'driver@example.com',
          phone: '+1 555 123 4567',
          assignedVehicleId: 'vehicle-1',
      createdAt: new Date().toISOString(),
        },
      ],
      vehicles: [demoVehicle],
      currentVehicleId: 'vehicle-1',
      vehicleProfile: { ...demoVehicle, id: undefined, createdAt: undefined },
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
    updateVehicleProfileWithCurrencyConversion,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    selectVehicle,
    addDriver,
    updateDriver,
    deleteDriver,
    injectDemoData,
    clearAllData,
  };

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
};

