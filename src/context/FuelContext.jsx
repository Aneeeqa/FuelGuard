import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { storage } from '../utils/storage';
import { enqueue, flushQueue, hasPendingItems } from '../utils/offlineQueue';
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
          ? { ...defaultState.vehicleProfile, ...currentVehicle, id: undefined, createdAt: undefined }
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

        // Cache Firestore data to IndexedDB so offline reads work
        try {
          await storage.set(STORAGE_KEY, {
            logs: allLogs,
            drivers,
            vehicles,
            currentVehicleId,
            vehicleProfile,
          });
        } catch (cacheErr) {
          console.warn('Failed to cache Firestore data to IndexedDB:', cacheErr);
        }

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
            vehicleProfile: { ...defaultState.vehicleProfile, ...first, id: undefined, createdAt: undefined },
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

  // Debounced IndexedDB cache sync — keeps offline backup up to date whenever
  // data changes while Firestore is the primary (or after real-time updates).
  useEffect(() => {
    if (loading || isDemoMode.current || !user) return;
    const timer = setTimeout(async () => {
      try {
        await storage.set(STORAGE_KEY, {
          logs: data.logs,
          drivers: data.drivers,
          vehicles: data.vehicles,
          currentVehicleId: data.currentVehicleId,
          vehicleProfile: data.vehicleProfile,
        });
      } catch (err) {
        console.warn('IndexedDB cache update failed:', err);
      }
    }, 2000); // debounce 2 s so rapid updates don't thrash the DB
    return () => clearTimeout(timer);
  }, [data, loading, user]);

  // ── Offline queue flush ────────────────────────────────────────────────────
  // When connectivity is restored, attempt to sync any entries that were saved
  // locally while offline. On success:
  //   - The Firestore real-time subscription will push the new log back in.
  //   - We remove the optimistic (temp-ID) copy from local state to avoid
  //     showing a duplicate.
  useEffect(() => {
    if (!user) return;

    const flush = async () => {
      const hasPending = await hasPendingItems();
      if (!hasPending) return;

      console.log('[OfflineQueue] Back online — flushing pending entries…');

      const synced = await flushQueue(async ({ userId, vehicleId, logEntry }) => {
        return createFuelLog(userId, vehicleId, logEntry);
      });

      if (synced.length === 0) return;

      // Remove the optimistic temp-ID copies; Firestore's real-time listener
      // will add the definitive records automatically.
      setData((prev) => {
        const tempIds = new Set(synced.map((s) => s.tempId));
        const updatedLogs = prev.logs.filter((l) => !tempIds.has(l.id));
        const newStats = calculateStats(updatedLogs);
        return { ...prev, logs: updatedLogs, stats: newStats };
      });

      console.log(`[OfflineQueue] Synced ${synced.length} queued entry/entries.`);
    };

    // Try to flush on mount in case the app was reopened with pending items.
    if (navigator.onLine) {
      flush();
    }

    // Also flush every time connectivity is restored.
    window.addEventListener('app:online', flush);
    return () => window.removeEventListener('app:online', flush);
  }, [user, calculateStats]);

  /**
   * Build the enriched log entry object (mileage, flags, tank-to-tank data, etc.)
   * from a raw form submission. Extracted so it can be shared between the online
   * and offline paths.
   */
  const buildLogEntry = useCallback((newLog, currentData) => {
    const vehicleId = newLog.vehicleId || currentData.currentVehicleId;

    const sortedLogs = [...currentData.logs].sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    const lastLog = sortedLogs.find((log) => {
      const logDate = log.date?.toDate ? log.date.toDate() : new Date(log.date);
      const newDate = new Date(newLog.date);
      return logDate < newDate;
    });

    let mileage = 0;
    let isFlagged = false;

    if (lastLog && newLog.liters > 0) {
      const distance = newLog.odometer - lastLog.odometer;
      if (distance > 1) {
        mileage = distance / newLog.liters;
        const theftThreshold = currentData.vehicleProfile.theftThreshold ?? 0.75;
        if (mileage < currentData.stats.avgMileage * theftThreshold && mileage > 0) {
          isFlagged = true;
        }
      }
    }

    let tankToTankData = null;
    const updatedVehicleProfile = { ...currentData.vehicleProfile };

    const fullTankCheck = isFullTankFill(
      {
        liters: newLog.liters,
        tankCapacity: newLog.tankCapacity || currentData.vehicleProfile.tankCapacity,
        isFullTank: newLog.isFullTank,
      },
      currentData.vehicleProfile
    );

    if (fullTankCheck.isFullTank) {
      const previousFullFill = findPreviousFullFill(
        currentData.logs,
        vehicleId,
        newLog.date
      );

      if (previousFullFill) {
        try {
          tankToTankData = calculateTankToTankConsumption(
            {
              ...newLog,
              isFullTank: fullTankCheck.isFullTank,
              tankCapacity: newLog.tankCapacity || currentData.vehicleProfile.tankCapacity,
            },
            previousFullFill,
            currentData.vehicleProfile
          );

          updatedVehicleProfile.lastFullFillLogId = Date.now().toString();
          updatedVehicleProfile.lastFullFillDate = newLog.date;

          const existingTrips = updatedVehicleProfile.tankToTankTrips || [];
          if (tankToTankData.isValid) {
            updatedVehicleProfile.tankToTankTrips = [tankToTankData, ...existingTrips].slice(0, 50);
            const allTrips = [tankToTankData, ...existingTrips];
            const validTrips = allTrips.filter((t) => t.isValid);
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
      }
    }

    const logEntry = {
      ...newLog,
      mileage: Math.round(mileage * 100) / 100,
      isFlagged,
      fuelType: newLog.fuelType || currentData.vehicleProfile.fuelType || 'gasoline',
      currency: currentData.vehicleProfile.currency || 'USD',
      originalCurrency: currentData.vehicleProfile.currency || 'USD',
      originalPrice: newLog.price,
      isFullTank: fullTankCheck.isFullTank,
      fuelLevelBeforeFill: newLog.fuelLevelBeforeFill || null,
      fuelLevelAfterFill: newLog.fuelLevelAfterFill || null,
      tankCapacity: newLog.tankCapacity || currentData.vehicleProfile.tankCapacity,
      fillPercentage: fullTankCheck.isFullTank
        ? ((newLog.liters / (newLog.tankCapacity || currentData.vehicleProfile.tankCapacity)) * 100).toFixed(1)
        : null,
      gaugeReading: newLog.gaugeReading || null,
      lastFullFillLogId: updatedVehicleProfile.lastFullFillLogId ?? null,
      tankToTankData: tankToTankData,
      gpsDistance: newLog.gpsDistance || null,
      gpsRoute: newLog.gpsRoute || null,
    };

    return { logEntry, updatedVehicleProfile };
  }, []);

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

    const { logEntry, updatedVehicleProfile } = buildLogEntry(newLog, data);

    // ── Offline path ──────────────────────────────────────────────────────────
    // If the browser reports no connectivity, skip the Firestore call entirely.
    // Enqueue the entry and add it optimistically to local state so history
    // updates immediately without any spinner.
    if (!navigator.onLine) {
      const queuedEntry = await enqueue({ userId, vehicleId, logEntry });
      setData((prev) => {
        const updatedLogs = [queuedEntry, ...prev.logs];
        const newStats = calculateStats(updatedLogs);
        return {
          ...prev,
          logs: updatedLogs,
          stats: newStats,
          vehicleProfile: updatedVehicleProfile,
        };
      });
      // Resolve normally — LogEntry will check the `pendingSync` flag on the
      // returned entry via the `offlineSaved` flag we add to the thrown value.
      const offlineError = new Error('offline');
      offlineError.offlineSaved = true;
      throw offlineError;
    }

    // ── Online path ───────────────────────────────────────────────────────────
    try {
      const createdLog = await createFuelLog(userId, vehicleId, logEntry);

      setData((prev) => {
        // If the real-time subscription already added this log, don't duplicate it
        if (prev.logs.some((l) => l.id === createdLog.id)) {
          return { ...prev, vehicleProfile: updatedVehicleProfile };
        }
        const updatedLogs = [createdLog, ...prev.logs];
        const newStats = calculateStats(updatedLogs);
        return {
          ...prev,
          logs: updatedLogs,
          stats: newStats,
          vehicleProfile: updatedVehicleProfile,
        };
      });
    } catch (error) {
      // Firestore failed even though navigator.onLine was true (e.g. flaky
      // connection). Queue the entry so it is not lost.
      if (!error.offlineSaved) {
        console.warn('Firestore write failed — queuing entry for later sync:', error);
        const queuedEntry = await enqueue({ userId, vehicleId, logEntry });
        setData((prev) => {
          if (prev.logs.some((l) => l.id === queuedEntry.id)) return prev;
          const updatedLogs = [queuedEntry, ...prev.logs];
          const newStats = calculateStats(updatedLogs);
          return {
            ...prev,
            logs: updatedLogs,
            stats: newStats,
            vehicleProfile: updatedVehicleProfile,
          };
        });
        const offlineError = new Error('offline');
        offlineError.offlineSaved = true;
        throw offlineError;
      }
      throw error;
    }
  }, [calculateStats, buildLogEntry, user, data]);

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

    // Persist to Firestore when a user and vehicle are available
    const userId = user?.uid;
    const vehicleId = data.currentVehicleId;
    if (userId && vehicleId) {
      updateVehicleFirestore(userId, vehicleId, profile).catch((err) => {
        console.error('Failed to persist vehicle profile to Firestore:', err);
      });
    }
  }, [user, data.currentVehicleId]);

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
        const updatedProfile = { ...defaultState.vehicleProfile, ...newVehicle, id: undefined, createdAt: undefined };
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
          ? { ...defaultState.vehicleProfile, ...prev.vehicleProfile, ...updates, id: undefined, createdAt: undefined }
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
          ? { ...defaultState.vehicleProfile, ...updatedVehicles.find(v => v.id === newCurrentVehicleId), id: undefined, createdAt: undefined }
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
        vehicleProfile: { ...defaultState.vehicleProfile, ...selectedVehicle, id: undefined, createdAt: undefined },
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

    // Deterministic log templates: 10 entries with exactly 3 theft alerts.
    // Theft logs (indices 3, 6, 9): vehicle travelled a normal distance but a large
    // amount of fuel was stolen/siphoned, so the driver must refill almost the full
    // tank — resulting in suspiciously low mileage (well below the 11.25 km/L threshold).
    const logTemplates = [
      // i=0: Initial reference fill (mileage not calculated)
      { dayOffset:  0, distance:   0, liters: 42.0, pricePerLiter: 1.35, isFullTank: true  },
      // i=1: Normal commute week
      { dayOffset:  7, distance: 285, liters: 19.0, pricePerLiter: 1.38, isFullTank: false },
      // i=2: Normal highway trip
      { dayOffset: 14, distance: 255, liters: 17.0, pricePerLiter: 1.40, isFullTank: false },
      // i=3: THEFT — ~25 L siphoned overnight; driver drove 270 km but needed 43.5 L (≈6.2 km/L)
      { dayOffset: 21, distance: 270, liters: 43.5, pricePerLiter: 1.42, isFullTank: true  },
      // i=4: Normal fill after theft
      { dayOffset: 29, distance: 295, liters: 19.7, pricePerLiter: 1.38, isFullTank: false },
      // i=5: Normal longer trip
      { dayOffset: 37, distance: 310, liters: 20.7, pricePerLiter: 1.35, isFullTank: true  },
      // i=6: THEFT — ~22 L stolen at weekend parking; 240 km driven, 41 L needed (≈5.9 km/L)
      { dayOffset: 44, distance: 240, liters: 41.0, pricePerLiter: 1.45, isFullTank: true  },
      // i=7: Normal commute
      { dayOffset: 51, distance: 280, liters: 18.7, pricePerLiter: 1.42, isFullTank: false },
      // i=8: Normal short trip
      { dayOffset: 58, distance: 265, liters: 17.7, pricePerLiter: 1.40, isFullTank: false },
      // i=9: THEFT — ~28 L missing after fleet parking; 220 km, 42.7 L needed (≈5.2 km/L)
      { dayOffset: 62, distance: 220, liters: 42.7, pricePerLiter: 1.48, isFullTank: true  },
    ];

    const demoLogs = [];
    let odometer = 45000;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 62); // begin ~2 months ago

    logTemplates.forEach((tpl, i) => {
      const logDate = new Date(startDate);
      logDate.setDate(logDate.getDate() + tpl.dayOffset);
      odometer += tpl.distance;
      const price = parseFloat((tpl.liters * tpl.pricePerLiter).toFixed(2));
      const mileage = i > 0 ? parseFloat((tpl.distance / tpl.liters).toFixed(2)) : 0;
      const isFlagged = mileage > 0 && mileage < 15 * 0.75; // threshold: 11.25 km/L

      demoLogs.push({
        id: `demo-log-${i}-${Date.now()}`,
        vehicleId: demoVehicleId,
        date: logDate.toISOString(),
        odometer,
        liters: tpl.liters,
        price,
        mileage,
        isFlagged,
        fuelType: 'gasoline',
        currency: 'USD',
        isFullTank: tpl.isFullTank,
      });
    });

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
