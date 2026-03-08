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

export const FuelContext = createContext();

const STORAGE_KEY = 'fuelGuardDB';

const defaultState = {
  logs: [],
  drivers: [],
  vehicles: [],
  currentVehicleId: null,
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
    theftThreshold: 0.75,
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
  monthlyBudget: 200,
  budgetAlert: null,
  lastLocation: null,
};

export const FuelProvider = ({ children }) => {
  const [data, setData] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState('loading');
  const [skipPersist, setSkipPersist] = useState(false);

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

  useEffect(() => {
    if (!loading && !skipPersist) {
      storage.set(STORAGE_KEY, data);
    }
    if (skipPersist) {
      setSkipPersist(false);
    }
  }, [data, loading, skipPersist]);

  const calculateStats = useCallback((logs, vehicleId = null) => {
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

    const sortedLogs = [...filteredLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    const totalDistance =
      sortedLogs.length > 1
        ? sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer
        : 0;

    const fuelType = data.vehicleProfile?.fuelType || 'gasoline';
    const totalCO2 = calculateTotalCO2(filteredLogs, fuelType);
    const co2PerKm = calculateCO2PerKm(totalCO2, totalDistance);
    const monthlyCO2 = calculateMonthlyCO2(filteredLogs, fuelType);
    const yearlyCO2 = calculateYearlyCO2(filteredLogs, fuelType);

    const totalExpenditure = filteredLogs.reduce((sum, log) => sum + (log.price || 0), 0);
    const costPerKm = totalDistance > 0 ? totalExpenditure / totalDistance : 0;
    const averagePricePerUnit = totalFuel > 0 ? totalExpenditure / totalFuel : 0;

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
  }, [data.vehicleProfile?.fuelType, data.monthlyBudget, data.currentVehicleId, data.vehicles?.length]);

  const addLog = useCallback((newLog) => {
    setData((prev) => {
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

        if (distance > 1) {
          mileage = distance / newLog.liters;

          const theftThreshold = prev.vehicleProfile.theftThreshold ?? 0.75;
          if (mileage < prev.stats.avgMileage * theftThreshold && mileage > 0) {
            isFlagged = true;
          }
        } else {
          mileage = 0;
        }
      }

      const logEntry = {
        ...newLog,
        mileage: Math.round(mileage * 100) / 100,
        isFlagged,
        id: Date.now().toString(),
        fuelType: newLog.fuelType || prev.vehicleProfile.fuelType || 'gasoline',
        currency: prev.vehicleProfile.currency || 'USD',
        originalCurrency: prev.vehicleProfile.currency || 'USD',
        originalPrice: newLog.price,
      };

      const updatedLogs = [logEntry, ...prev.logs];
      const newStats = calculateStats(updatedLogs);

      return { ...prev, logs: updatedLogs, stats: newStats };
    });
  }, [calculateStats]);

  const deleteLog = useCallback((logId) => {
    setData((prev) => {
      const updatedLogs = prev.logs.filter((log) => log.id !== logId);
      const newStats = calculateStats(updatedLogs);
      return { ...prev, logs: updatedLogs, stats: newStats };
    });
  }, [calculateStats]);

  const updateVehicleProfile = useCallback((profile) => {
    setData((prev) => ({
      ...prev,
      vehicleProfile: { ...prev.vehicleProfile, ...profile },
    }));
  }, []);

  const updateVehicleProfileWithCurrencyConversion = useCallback(async (profile) => {
    const currentData = { ...data };
    const oldCurrency = currentData.vehicleProfile?.currency || 'USD';
    const newCurrency = profile.currency || oldCurrency;

    if (oldCurrency !== newCurrency && currentData.logs.length > 0) {
      try {
        const { fetchExchangeRates, convertCurrencySync } = await import('../utils/currency');
        const rates = await fetchExchangeRates(oldCurrency);

        const convertWithRates = (amount, from, to) => {
          if (!amount || from === to) return amount;
          const rate = rates?.rates?.[to];
          if (!rate) {
            console.warn(`No exchange rate for ${to}, using fallback`);
            return amount;
          }
          return amount / rate;
        };

        const convertedLogs = currentData.logs.map((log) => {
          const convertedPrice = convertWithRates(log.originalPrice || log.price, oldCurrency, newCurrency);
          return {
            ...log,
            price: convertedPrice,
            currency: newCurrency,
            originalCurrency: oldCurrency,
          };
        });

        setData((prev) => ({
          ...prev,
          logs: convertedLogs,
          vehicleProfile: { ...prev.vehicleProfile, ...profile },
          stats: calculateStats(convertedLogs),
        }));

        console.log('Currency conversion successful, updating state');
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setData((prev) => ({
          ...prev,
          vehicleProfile: { ...prev.vehicleProfile, currency: oldCurrency },
        }));
      }
    } else {
      setData((prev) => ({
        ...prev,
        vehicleProfile: { ...prev.vehicleProfile, ...profile },
      }));
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

  const injectDemoData = useCallback(() => {
    const now = new Date();

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    let currentOdometer = Math.floor(randomInRange(5000, 10000));

    const basePricePerLiter = randomInRange(3.00, 4.50);

    const numLogs = Math.floor(randomInRange(15, 20));
    const demoLogs = [];

    const distances = [];

    for (let i = 0; i < numLogs; i++) {
      const daysBetween = Math.floor(randomInRange(2, 7));
      const logDate = new Date(now - i * daysBetween * 24 * 60 * 60 * 1000);

      const isFlagged = i < 3;
      const isFlagged = i < 3;

      // Random fuel amount: 7-14 liters
      const fuelAmount = parseFloat(randomInRange(7, 14).toFixed(1));

      // Calculate distance and mileage
      let mileage;
      let distance;

      if (isFlagged) {
        mileage = parseFloat(randomInRange(4, 7).toFixed(1));
        distance = Math.round(mileage * fuelAmount);
      } else {
        mileage = parseFloat(randomInRange(13, 17).toFixed(1));
        distance = Math.round(mileage * fuelAmount);
      }

      const price = parseFloat((fuelAmount * basePricePerLiter * randomInRange(0.95, 1.05)).toFixed(2));

      distances.push(distance);

      demoLogs.push({
        id: `log-${i}`,
        date: logDate.toISOString(),
        odometer: 0,
        liters: fuelAmount,
        price: price,
        mileage: mileage,
        isFlagged: isFlagged,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: price,
        pumpName: i % 3 === 0 ? 'Shell Station' : i % 3 ===1 ? 'Chevron' : 'BP',
      });
    }

    demoLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    let baseOdometer = Math.floor(randomInRange(5000, 10000));

    for (let i = demoLogs.length - 1; i >= 0; i--) {
      const log = demoLogs[i];

      if (i === demoLogs.length - 1) {
        log.odometer = baseOdometer;
      } else {
        log.odometer = demoLogs[i + 1].odometer + distances[i + 1];
      }
    }

    const odometerOffset = Math.floor(randomInRange(500, 1500));
    demoLogs.forEach(log => {
      log.odometer += odometerOffset;
    });

    const stats = calculateStats(demoLogs);

    const vehicleOptions = [
      {
        name: 'Sample Vehicle 1',
        make: 'Sample',
        model: 'Vehicle',
        variant: 'Sample',
        year: new Date().getFullYear(),
        vehicleId: 41190,
        epaCity: 30,
        epaHighway: 38,
        epaCombined: 33,
      },
      {
        name: 'Sample Vehicle 2',
        make: 'Sample',
        model: 'Vehicle',
        year: new Date().getFullYear(),
        vehicleId: 41542,
        epaCity: 33,
        epaHighway: 42,
        epaCombined: 36,
      },
      {
        name: 'Sample Vehicle 3',
        make: 'Sample',
        model: 'Vehicle',
        year: new Date().getFullYear(),
        vehicleId: 42123,
        epaCity: 33,
        epaHighway: 43,
        epaCombined: 37,
      },
    ];

    const selectedVehicle = vehicleOptions[Math.floor(randomInRange(0, vehicleOptions.length))];

    const demoVehicle = {
      id: 'vehicle-1',
      ...selectedVehicle,
      expectedMileage: selectedVehicle.epaCombined || 15,
      tankCapacity: 50,
      country: 'US',
      currency: 'USD',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      fuelType: 'gasoline',
      theftThreshold: 0.75,
      assignedDriverId: 'driver-1',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };

    const driverNames = ['Sample User 1', 'Sample User 2', 'Sample User 3', 'Sample User 4'];
    const selectedDriver = driverNames[Math.floor(randomInRange(0, driverNames.length))];

    setData({
      logs: demoLogs,
      drivers: [
        {
          id: 'driver-1',
          name: selectedDriver,
          email: `${selectedDriver.toLowerCase().replace(' ', '.')}@example.com`,
          phone: '+1 ' + Math.floor(randomInRange(200, 999)) + ' ' + Math.floor(randomInRange(100, 999)) + ' ' + Math.floor(randomInRange(1000, 9999)),
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

  const clearAllData = useCallback(async () => {
    setSkipPersist(true);
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

    // Random driver names
    const driverNames = ['Sample User 1', 'Sample User 2', 'Sample User 3', 'Sample User 4'];
    const selectedDriver = driverNames[Math.floor(randomInRange(0, driverNames.length))];

    setData({
      logs: demoLogs,
      drivers: [
        {
          id: 'driver-1',
          name: selectedDriver,
          email: `${selectedDriver.toLowerCase().replace(' ', '.')}@example.com`,
          phone: '+1 ' + Math.floor(randomInRange(200, 999)) + ' ' + Math.floor(randomInRange(100, 999)) + ' ' + Math.floor(randomInRange(1000, 9999)),
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

