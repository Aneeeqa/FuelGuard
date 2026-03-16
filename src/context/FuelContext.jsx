import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
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
import {
  convertCurrencySync,
  fetchExchangeRates
} from '../utils/currency';
import {
  isFullTankFill,
  findPreviousFullFill,
  calculateTankToTankConsumption,
  calculateTankToTankStatistics
} from '../utils/tankToTankCalculations';
import {
  calculateGPSRouteDistance,
  calculateDistanceFromLastGPS,
  getCurrentGPSPosition,
  startGPSTracking,
  stopGPSTracking
} from '../utils/gpsRouteTracking';
import {
  getUserVehicles,
  getUserDrivers,
  getVehicleLogs,
  createVehicle,
  updateVehicle as updateVehicleFirestore,
  deleteVehicle as deleteVehicleFirestore,
  createDriver,
  updateDriver as updateDriverFirestore,
  deleteDriver as deleteDriverFirestore,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog as deleteFuelLogFirestore,
  subscribeToVehicles,
  subscribeToDrivers,
  subscribeToVehicleLogs,
  hasUserData,
} from '../services/firestore';

console.log('FuelContext module loaded');

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
    monthlyBudget: 200,
    geofences: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    lastFullFillLogId: null,
    lastFullFillDate: null,
    averageTankToTankMileage: 15,
    tankToTankTrips: [],
    tankToTankTheftThreshold: 25,
    minimumFillPercentage: 80,
    useFullTankOnly: false,
    enableGpsTracking: false,
    minimumTripDistance: 10,
    odometerTolerancePercentage: 10,
    enableOdometerVerification: false,
    lastKnownLocation: null,
    gpsRoutes: [],
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
  lastLocation: null,
};

export const FuelProvider = ({ children }) => {
  console.log('FuelProvider: Initializing...');

  const { user } = useAuth();
  const [data, setData] = useState(defaultState);
  const [loading, setLoading] = useState(true);
  const [storageType, setStorageType] = useState('firestore');
  const [skipPersist, setSkipPersist] = useState(false);
  const isDemoMode = useRef(false);
  const calculateStatsRef = useRef(null);

  console.log('FuelProvider: State initialized');

  useEffect(() => {
    const loadData = async () => {
      console.log('FuelProvider: Loading data from Firestore...');

      if (!user) {
        console.log('FuelProvider: No user authenticated, using empty state');
        setLoading(false);
        return;
      }

      try {
        const hasData = await hasUserData(user.uid);

        if (!hasData) {
          console.log('FuelProvider: No existing data, starting with default state');
          setData(defaultState);
          setLoading(false);
          return;
        }

        const vehicles = await getUserVehicles(user.uid);
        console.log('FuelProvider: Vehicles loaded:', vehicles);

        const drivers = await getUserDrivers(user.uid);
        console.log('FuelProvider: Drivers loaded:', drivers);

        let allLogs = [];
        for (const vehicle of vehicles) {
          const vehicleLogs = await getVehicleLogs(user.uid, vehicle.id);
          allLogs = [...allLogs, ...vehicleLogs];
        }

        allLogs.sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateB - dateA;
        });

        const currentVehicleId = vehicles.length > 0 ? vehicles[0].id : null;

        const currentVehicle = currentVehicleId
          ? vehicles.find(v => v.id === currentVehicleId)
          : null;

        const vehicleProfile = currentVehicle
          ? { ...currentVehicle, id: undefined, createdAt: undefined }
          : defaultState.vehicleProfile;

        const stats = calculateStats(allLogs);

        setData({
          ...defaultState,
          logs: allLogs,
          drivers: drivers,
          vehicles: vehicles,
          currentVehicleId: currentVehicleId,
          vehicleProfile: vehicleProfile,
          stats: stats,
        });

        setStorageType('firestore');
        console.log('FuelProvider: Data loaded successfully');
      } catch (error) {
        console.error('Failed to load data:', error);
        console.log('FuelProvider: Falling back to IndexedDB...');
        try {
          const stored = await storage.get(STORAGE_KEY);
          if (stored) {
            setData({
              ...defaultState,
              ...stored,
              vehicleProfile: {
                ...defaultState.vehicleProfile,
                ...(stored.vehicleProfile || {}),
                emergencyContact: {
                  ...defaultState.vehicleProfile.emergencyContact,
                  ...(stored.vehicleProfile?.emergencyContact || {}),
                },
              },
              stats: {
                ...defaultState.stats,
                ...(stored.stats || {}),
              },
            });
            setStorageType('indexeddb');
          }
        } catch (fallbackError) {
          console.error('Fallback to IndexedDB failed:', fallbackError);
        }
      } finally {
        console.log('FuelProvider: Loading complete');
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;

    const unsubscribers = [];

    const unsubscribeVehicles = subscribeToVehicles(user.uid, (vehicles) => {
      if (isDemoMode.current) return;
      console.log('FuelProvider: Vehicles updated via real-time subscription');
      setData(prev => {
        // If no vehicle is currently selected but Firestore has vehicles, auto-select the first one
        if (vehicles.length > 0 && !prev.currentVehicleId) {
          const first = vehicles[0];
          return {
            ...prev,
            vehicles,
            currentVehicleId: first.id,
            vehicleProfile: { ...first, id: undefined, createdAt: undefined },
          };
        }
        return { ...prev, vehicles };
      });
    });
    unsubscribers.push(unsubscribeVehicles);

    const unsubscribeDrivers = subscribeToDrivers(user.uid, (drivers) => {
      if (isDemoMode.current) return;
      console.log('FuelProvider: Drivers updated via real-time subscription');
      setData(prev => ({
        ...prev,
        drivers: drivers,
      }));
    });
    unsubscribers.push(unsubscribeDrivers);

    let unsubscribeLogs = null;
    if (data.currentVehicleId) {
      unsubscribeLogs = subscribeToVehicleLogs(user.uid, data.currentVehicleId, (logs) => {
        if (isDemoMode.current) return;
        console.log('FuelProvider: Logs updated via real-time subscription');
        const newStats = (calculateStatsRef.current || calculateStats)(logs);
        setData(prev => ({
          ...prev,
          logs: logs,
          stats: newStats,
        }));
      });
      if (unsubscribeLogs) {
        unsubscribers.push(unsubscribeLogs);
      }
    }

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [user, loading, data.currentVehicleId]);

  const calculateStats = useCallback((logs) => {
    if (logs.length === 0) {
      return {
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
      };
    }

    const totalFuel = logs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const validMileages = logs.filter((log) => log.mileage > 0);
    const avgMileage =
      validMileages.length > 0
        ? validMileages.reduce((sum, log) => sum + log.mileage, 0) / validMileages.length
        : 15;

    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    });
    const totalDistance =
      sortedLogs.length > 1
        ? sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer
        : 0;

    const fuelType = data.vehicleProfile?.fuelType || 'gasoline';
    const totalCO2 = calculateTotalCO2(logs, fuelType);
    const co2PerKm = calculateCO2PerKm(totalCO2, totalDistance);
    const monthlyCO2 = calculateMonthlyCO2(logs, fuelType);
    const yearlyCO2 = calculateYearlyCO2(logs, fuelType);

    const totalExpenditure = logs.reduce((sum, log) => sum + (log.price || 0), 0);
    const costPerKm = totalDistance > 0 ? totalExpenditure / totalDistance : 0;
    const averagePricePerUnit = totalFuel > 0 ? totalExpenditure / totalFuel : 0;

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
  }, [data.vehicleProfile?.fuelType]);

  // Keep calculateStatsRef up-to-date so the real-time subscription always uses the latest version
  useEffect(() => {
    calculateStatsRef.current = calculateStats;
  }, [calculateStats]);

  const addLog = useCallback(async (newLog) => {
    // Exit demo mode when the user adds a real log entry
    isDemoMode.current = false;

    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot add log: No user authenticated');
      return;
    }

    const vehicleId = newLog.vehicleId || data.currentVehicleId;
    if (!vehicleId) {
      console.error('Cannot add log: No vehicle ID');
      return;
    }

    const sortedLogs = [...data.logs].sort(
      (a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      }
    );
    const lastLog = sortedLogs.find(
      (log) => {
        const logDate = log.date?.toDate ? log.date.toDate() : new Date(log.date);
        const newDate = new Date(newLog.date);
        return logDate < newDate;
      }
    );

    let mileage = 0;
    let isFlagged = false;

    if (lastLog && newLog.liters > 0) {
      const distance = newLog.odometer - lastLog.odometer;

      if (distance > 1) {
        mileage = distance / newLog.liters;

        const theftThreshold = data.vehicleProfile.theftThreshold ?? 0.75;
        if (mileage < data.stats.avgMileage * theftThreshold && mileage > 0) {
          isFlagged = true;
        }
      } else {
        mileage = 0;
      }
    }

    let tankToTankData = null;
    let updatedVehicleProfile = { ...data.vehicleProfile };

    const fullTankCheck = isFullTankFill(
      {
        liters: newLog.liters,
        tankCapacity: newLog.tankCapacity || data.vehicleProfile.tankCapacity,
        isFullTank: newLog.isFullTank
      },
      data.vehicleProfile
    );

    if (fullTankCheck.isFullTank) {
      const previousFullFill = findPreviousFullFill(
        data.logs,
        data.currentVehicleId || newLog.vehicleId,
        newLog.date
      );

      if (previousFullFill) {
        try {
          tankToTankData = calculateTankToTankConsumption(
            {
              ...newLog,
              isFullTank: fullTankCheck.isFullTank,
              tankCapacity: newLog.tankCapacity || data.vehicleProfile.tankCapacity
            },
            previousFullFill,
            data.vehicleProfile
          );

          updatedVehicleProfile.lastFullFillLogId = Date.now().toString();
          updatedVehicleProfile.lastFullFillDate = newLog.date;

          const existingTrips = updatedVehicleProfile.tankToTankTrips || [];
          if (tankToTankData.isValid) {
            updatedVehicleProfile.tankToTankTrips = [
              tankToTankData,
              ...existingTrips
            ].slice(0, 50);

            const allTrips = [tankToTankData, ...existingTrips];
            const validTrips = allTrips.filter(t => t.isValid);
            if (validTrips.length > 0) {
              const avgMileage = validTrips.reduce((sum, t) => sum + t.actualMileage, 0) / validTrips.length;
              updatedVehicleProfile.averageTankToTankMileage = Math.round(avgMileage * 100) / 100;
            }
          }
        } catch (error) {
          console.warn('Tank-to-Tank calculation failed:', error);
          tankToTankData = null;
        }
      } else {
        updatedVehicleProfile.lastFullFillLogId = Date.now().toString();
        updatedVehicleProfile.lastFullFillDate = newLog.date;
        console.log('First full tank fill recorded - no Tank-to-Tank data calculated yet');
      }
    }

    const logEntry = {
      ...newLog,
      mileage: Math.round(mileage * 100) / 100,
      isFlagged,
      fuelType: newLog.fuelType || data.vehicleProfile.fuelType || 'gasoline',
      currency: data.vehicleProfile.currency || 'USD',
      originalCurrency: data.vehicleProfile.currency || 'USD',
      originalPrice: newLog.price,
      isFullTank: fullTankCheck.isFullTank,
      fuelLevelBeforeFill: newLog.fuelLevelBeforeFill || null,
      fuelLevelAfterFill: newLog.fuelLevelAfterFill || null,
      tankCapacity: newLog.tankCapacity || data.vehicleProfile.tankCapacity,
      fillPercentage: fullTankCheck.isFullTank
        ? ((newLog.liters / (newLog.tankCapacity || data.vehicleProfile.tankCapacity)) * 100).toFixed(1)
        : null,
      gaugeReading: newLog.gaugeReading || null,
      lastFullFillLogId: updatedVehicleProfile.lastFullFillLogId,
      tankToTankData: tankToTankData,
      gpsDistance: newLog.gpsDistance || null,
      gpsRoute: newLog.gpsRoute || null,
    };

    try {
      const createdLog = await createFuelLog(userId, vehicleId, logEntry);

      setData((prev) => {
        // If the real-time subscription already added this log, don't duplicate it
        if (prev.logs.some(l => l.id === createdLog.id)) {
          return { ...prev, vehicleProfile: updatedVehicleProfile };
        }
        const updatedLogs = [createdLog, ...prev.logs];
        const newStats = calculateStats(updatedLogs);
        return {
          ...prev,
          logs: updatedLogs,
          stats: newStats,
          vehicleProfile: updatedVehicleProfile
        };
      });
    } catch (error) {
      console.error('Failed to add log to Firestore:', error);
      throw error;
    }
  }, [calculateStats, user, data]);

  const deleteLog = useCallback(async (logId) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot delete log: No user authenticated');
      return;
    }

    const vehicleId = data.currentVehicleId;
    if (!vehicleId) {
      console.error('Cannot delete log: No vehicle ID');
      return;
    }

    try {
      await deleteFuelLogFirestore(userId, vehicleId, logId);

      setData((prev) => {
        const updatedLogs = prev.logs.filter((log) => log.id !== logId);
        const newStats = calculateStats(updatedLogs);

        const sortedLogs = [...updatedLogs].sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateA - dateB;
        });
        const fullFillLogs = sortedLogs.filter(log => log.isFullTank === true);

        const tankToTankTrips = [];
        let lastFullFill = null;

        for (const log of fullFillLogs) {
          if (lastFullFill) {
            try {
              const tankToTankData = calculateTankToTankConsumption(
                {
                  ...log,
                  tankCapacity: log.tankCapacity || data.vehicleProfile.tankCapacity
                },
                lastFullFill,
                data.vehicleProfile
              );

              if (tankToTankData.isValid) {
                tankToTankTrips.push(tankToTankData);
              }
            } catch (error) {
              console.warn(`Failed to recalculate Tank-to-Tank for log ${log.id}:`, error);
            }
          }
          lastFullFill = log;
        }

        const updatedVehicleProfile = { ...data.vehicleProfile };

        if (fullFillLogs.length > 0) {
          const mostRecentFullFill = fullFillLogs[fullFillLogs.length - 1];
          updatedVehicleProfile.lastFullFillLogId = mostRecentFullFill.id;
          updatedVehicleProfile.lastFullFillDate = mostRecentFullFill.date;

          if (tankToTankTrips.length > 0) {
            const avgMileage = tankToTankTrips.reduce((sum, t) => sum + t.actualMileage, 0) / tankToTankTrips.length;
            updatedVehicleProfile.averageTankToTankMileage = Math.round(avgMileage * 100) / 100;
          }
        } else {
          updatedVehicleProfile.lastFullFillLogId = null;
          updatedVehicleProfile.lastFullFillDate = null;
          updatedVehicleProfile.averageTankToTankMileage = data.vehicleProfile.expectedMileage || 15;
          updatedVehicleProfile.tankToTankTrips = [];
        }

        updatedVehicleProfile.tankToTankTrips = tankToTankTrips.slice(-50);

        return {
          ...prev,
          logs: updatedLogs,
          stats: newStats,
          vehicleProfile: updatedVehicleProfile
        };
      });
    } catch (error) {
      console.error('Failed to delete log from Firestore:', error);
      throw error;
    }
  }, [calculateStats, user, data]);

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

    console.log(`Currency conversion request: ${oldCurrency} -> ${newCurrency}`);

    if (oldCurrency !== newCurrency && currentData.logs.length > 0) {
      console.log(`Converting currency from ${oldCurrency} to ${newCurrency}`);

      try {
        const rates = await fetchExchangeRates(oldCurrency);
        console.log('Exchange rates fetched:', rates);

        const convertWithRates = (amount, from, to) => {
          if (!amount || from === to) return amount;
          const rate = rates?.rates?.[to];
          if (!rate) {
            console.warn(`No exchange rate for ${to}, using fallback`);
            return convertCurrencySync(amount, from, to);
          }
          return amount * rate;
        };

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
        setData({
          ...currentData,
          vehicleProfile: { ...currentData.vehicleProfile, ...profile, currency: newCurrency },
        });
      }
    } else {
      setData({
        ...currentData,
        vehicleProfile: { ...currentData.vehicleProfile, ...profile },
      });
    }
  }, [data, calculateStats]);

  const addDriver = useCallback(async (driver) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot add driver: No user authenticated');
      return;
    }

    try {
      const createdDriver = await createDriver(userId, driver);
      setData((prev) => ({
        ...prev,
        drivers: [...prev.drivers, createdDriver],
      }));
    } catch (error) {
      console.error('Failed to add driver to Firestore:', error);
      throw error;
    }
  }, [user]);

  const updateDriver = useCallback(async (driverId, updates) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot update driver: No user authenticated');
      return;
    }

    try {
      await updateDriverFirestore(userId, driverId, updates);
      setData((prev) => ({
        ...prev,
        drivers: prev.drivers.map((driver) =>
          driver.id === driverId ? { ...driver, ...updates } : driver
        ),
      }));
    } catch (error) {
      console.error('Failed to update driver in Firestore:', error);
      throw error;
    }
  }, [user]);

  const deleteDriver = useCallback(async (driverId) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot delete driver: No user authenticated');
      return;
    }

    try {
      await deleteDriverFirestore(userId, driverId);
      setData((prev) => {
        const updatedDrivers = prev.drivers.filter((driver) => driver.id !== driverId);
        return { ...prev, drivers: updatedDrivers };
      });
    } catch (error) {
      console.error('Failed to delete driver from Firestore:', error);
      throw error;
    }
  }, [user]);

  const addVehicle = useCallback(async (vehicle) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot add vehicle: No user authenticated');
      return;
    }

    // Exit demo mode when the user adds a real vehicle
    const wasDemo = isDemoMode.current;
    isDemoMode.current = false;

    try {
      const createdVehicle = await createVehicle(userId, vehicle);
      setData((prev) => {
        const newVehicle = {
          ...createdVehicle,
          monthlyBudget: createdVehicle.monthlyBudget ?? 200,
        };
        // If we were in demo mode, start fresh (clear demo vehicles and logs)
        const baseState = wasDemo ? defaultState : prev;
        const updatedVehicles = [...(wasDemo ? [] : prev.vehicles), newVehicle];
        const updatedProfile = { ...newVehicle, id: undefined, createdAt: undefined };
        return {
          ...baseState,
          vehicles: updatedVehicles,
          currentVehicleId: newVehicle.id,
          vehicleProfile: updatedProfile,
        };
      });
    } catch (error) {
      console.error('Failed to add vehicle to Firestore:', error);
      throw error;
    }
  }, [user]);

  const updateVehicle = useCallback(async (vehicleId, updates) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot update vehicle: No user authenticated');
      return;
    }

    try {
      await updateVehicleFirestore(userId, vehicleId, updates);
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
    } catch (error) {
      console.error('Failed to update vehicle in Firestore:', error);
      throw error;
    }
  }, [user]);

  const deleteVehicle = useCallback(async (vehicleId) => {
    const userId = user?.uid;
    if (!userId) {
      console.error('Cannot delete vehicle: No user authenticated');
      return;
    }

    try {
      await deleteVehicleFirestore(userId, vehicleId);
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
    } catch (error) {
      console.error('Failed to delete vehicle from Firestore:', error);
      throw error;
    }
  }, [user]);

  const selectVehicle = useCallback((vehicleId) => {
    setData((prev) => {
      const selectedVehicle = prev.vehicles.find(v => v.id === vehicleId);
      if (!selectedVehicle) return prev;

      const existingAll = prev._allLogs || [];
      const merged = new Map(existingAll.map(l => [l.id, l]));
      for (const log of prev.logs) {
        merged.set(log.id, log);
      }
      const allLogs = [...merged.values()];

      const vehicleLogs = allLogs.filter(log => log.vehicleId === vehicleId);

      return {
        ...prev,
        _allLogs: allLogs,
        currentVehicleId: vehicleId,
        vehicleProfile: { ...selectedVehicle, id: undefined, createdAt: undefined },
        logs: vehicleLogs,
      };
    });
  }, []);

  const startGPSRouteTracking = useCallback(() => {
    setData((prev) => ({
      ...prev,
      vehicleProfile: {
        ...prev.vehicleProfile,
        gpsRoutes: [
          {
            id: Date.now().toString(),
            startTime: new Date().toISOString(),
            points: [],
            isTracking: true
          },
          ...(prev.vehicleProfile.gpsRoutes || [])
        ]
      }
    }));

    const watchId = startGPSTracking(
      (position) => {
        setData((prev) => {
          const activeRoute = prev.vehicleProfile.gpsRoutes?.find(r => r.isTracking);
          if (!activeRoute) return prev;

          const updatedRoutes = prev.vehicleProfile.gpsRoutes.map(route =>
            route.id === activeRoute.id
              ? {
                  ...route,
                  points: [...route.points, {
                    lat: position.lat,
                    lng: position.lng,
                    accuracy: position.accuracy,
                    timestamp: position.timestamp
                  }]
                }
              : route
          );

          return {
            ...prev,
            vehicleProfile: {
              ...prev.vehicleProfile,
              gpsRoutes: updatedRoutes
            }
          };
        });
      },
      (error) => {
        console.error('GPS tracking error:', error);
      }
    );

    return watchId;
  }, []);

  const stopGPSRouteTracking = useCallback((watchId) => {
    if (watchId) {
      stopGPSTracking(watchId);
    }

    setData((prev) => {
      const updatedRoutes = (prev.vehicleProfile.gpsRoutes || []).map(route =>
        route.isTracking
          ? {
              ...route,
              isTracking: false,
              endTime: new Date().toISOString(),
              totalDistance: calculateGPSRouteDistance(route.points)
            }
          : route
      );

      return {
        ...prev,
        vehicleProfile: {
          ...prev.vehicleProfile,
          gpsRoutes: updatedRoutes
        }
      };
    });
  }, []);

  const getCurrentPositionGPS = useCallback(async (highAccuracy = false) => {
    try {
      const position = await getCurrentGPSPosition(highAccuracy);
      setData((prev) => ({
        ...prev,
        lastLocation: position,
        vehicleProfile: {
          ...prev.vehicleProfile,
          lastKnownLocation: position
        }
      }));
      return position;
    } catch (error) {
      console.error('Failed to get GPS position:', error);
      throw error;
    }
  }, []);

  const calculateDistanceFromGPS = useCallback(async (highAccuracy = false) => {
    const lastPosition = data.vehicleProfile?.lastKnownLocation || data.lastLocation;

    if (!lastPosition) {
      return null;
    }

    try {
      const result = await calculateDistanceFromLastGPS(lastPosition, highAccuracy);
      if (result) {
        setData((prev) => ({
          ...prev,
          lastLocation: result.currentPosition,
          vehicleProfile: {
            ...prev.vehicleProfile,
            lastKnownLocation: result.currentPosition
          }
        }));
      }
      return result;
    } catch (error) {
      console.error('Failed to calculate distance from GPS:', error);
      return null;
    }
  }, [data.vehicleProfile?.lastKnownLocation, data.lastLocation]);

  const clearGPSRoutes = useCallback(() => {
    setData((prev) => ({
      ...prev,
      vehicleProfile: {
        ...prev.vehicleProfile,
        gpsRoutes: []
      }
    }));
  }, []);

  const injectDemoData = useCallback(() => {
    isDemoMode.current = true;
    const demoVehicleId = `demo-vehicle-${Date.now()}`;
    const now = new Date();

    const demoVehicle = {
      id: demoVehicleId,
      name: '2020 Toyota Corolla',
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      fuelType: 'gasoline',
      tankCapacity: 50,
      expectedMileage: 15,
      theftThreshold: 0.75,
      monthlyBudget: 200,
      currency: 'USD',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      status: 'Active',
      emergencyContact: { name: '', phone: '', relationship: '' },
      tankToTankTrips: [],
      geofences: [],
      gpsRoutes: [],
    };

    // Generate 10 realistic fuel logs over the past 2 months
    const demoLogs = [];
    let odometer = 45000;
    const baseDate = new Date(now);
    baseDate.setMonth(baseDate.getMonth() - 2);

    for (let i = 0; i < 10; i++) {
      const dayOffset = Math.floor(5 + Math.random() * 5);
      baseDate.setDate(baseDate.getDate() + dayOffset);
      const distance = Math.floor(200 + Math.random() * 300);
      odometer += distance;
      const liters = parseFloat((distance / (12 + Math.random() * 6)).toFixed(1));
      const pricePerLiter = parseFloat((1.2 + Math.random() * 0.5).toFixed(2));
      const price = parseFloat((liters * pricePerLiter).toFixed(2));
      const mileage = i > 0 ? parseFloat((distance / liters).toFixed(2)) : 0;
      const isFlagged = mileage > 0 && mileage < 15 * 0.75;

      demoLogs.push({
        id: `demo-log-${i}-${Date.now()}`,
        vehicleId: demoVehicleId,
        date: new Date(baseDate).toISOString(),
        odometer,
        liters,
        price,
        mileage,
        isFlagged,
        fuelType: 'gasoline',
        currency: 'USD',
        isFullTank: i % 3 === 0,
      });
    }

    // Sort newest first
    demoLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const newStats = calculateStats(demoLogs);

    // Use functional setData to PRESERVE the existing currentVehicleId.
    // This prevents the subscription effect (which depends on currentVehicleId) from
    // re-running and immediately overwriting demo data with Firestore data.
    setData(prev => ({
      ...defaultState,
      logs: demoLogs,
      vehicles: [demoVehicle],
      currentVehicleId: prev.currentVehicleId,
      vehicleProfile: demoVehicle,
      stats: newStats,
    }));

    console.log('Demo data injected successfully with', demoLogs.length, 'logs');
  }, [calculateStats]);

  const clearAllData = useCallback(async () => {
    isDemoMode.current = false;
    setSkipPersist(true);
    const userId = user?.uid;
    if (userId) {
      try {
        await storage.clear(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear IndexedDB:', error);
      }
    }
    setData(defaultState);
  }, [user]);

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
    startGPSRouteTracking,
    stopGPSRouteTracking,
    getCurrentPositionGPS,
    calculateDistanceFromGPS,
    clearGPSRoutes,
  };

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
};
