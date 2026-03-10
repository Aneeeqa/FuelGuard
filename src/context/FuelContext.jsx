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
    // Existing fields - preserved for backward compatibility
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
    theftThreshold: 0.75, // Default 75% (25% below average triggers alert)
    monthlyBudget: 200, // Default $200 monthly budget per vehicle
    geofences: [],
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },

    // ========================================
    // NEW: Tank-to-Tank Settings (Task 2)
    // ========================================
    // Tank-to-Tank tracking
    lastFullFillLogId: null,       // Reference to most recent full tank fill
    lastFullFillDate: null,         // Date of last full tank fill
    averageTankToTankMileage: 15,  // Calculated from full fills (defaults to expectedMileage)
    tankToTankTrips: [],           // Array of tank-to-tank trip data objects

    // Theft detection settings
    tankToTankTheftThreshold: 25,  // 25% deviation = theft alert (percentage)
    minimumFillPercentage: 80,      // Min % to consider as "full tank"
    useFullTankOnly: false,        // If true, only use full fills for stats (default: use all)

    // GPS tracking settings
    enableGpsTracking: false,     // Enable GPS-based distance tracking
    minimumTripDistance: 10,       // Minimum km for trip tracking

    // ========================================
    // NEW: Odometer Tampering Detection (Task 10)
    // ========================================
    // Odometer tampering settings
    odometerTolerancePercentage: 10, // Tolerance for GPS vs odometer comparison (default: 10%)
    enableOdometerVerification: false, // Enable automatic odometer verification with GPS
    lastKnownLocation: null,         // Last known GPS position for distance tracking
    gpsRoutes: [],                  // Array of GPS route histories
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
  lastLocation: null, // Last known GPS location for distance tracking (root level)
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
  const calculateStats = useCallback((logs, vehicleId = null, monthlyBudget = 200) => {
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
  }, [data.vehicleProfile?.fuelType, data.currentVehicleId, data.vehicles?.length]);

  // Add a new log entry
  const addLog = useCallback((newLog) => {
    setData((prev) => {
      // Sort logs by date descending to get most recent
      const sortedLogs = [...prev.logs].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      const lastLog = sortedLogs.find(
        (log) => new Date(log.date) < new Date(newLog.date)
      );

      // Existing theft detection (preserved for backward compatibility)
      let mileage = 0;
      let isFlagged = false;

      if (lastLog && newLog.liters > 0) {
        const distance = newLog.odometer - lastLog.odometer;

        // Require minimum distance to avoid division by zero and false theft alerts
        if (distance > 1) {
          mileage = distance / newLog.liters;

          // Legacy theft detection: Flag if efficiency is below vehicle-specific threshold
          const theftThreshold = prev.vehicleProfile.theftThreshold ?? 0.75;
          if (mileage < prev.stats.avgMileage * theftThreshold && mileage > 0) {
            isFlagged = true;
          }
        } else {
          // Distance is too small (0-1 km), skip mileage calculation and theft detection
          mileage = 0;
        }
      }

      // ========================================
      // NEW: Tank-to-Tank Integration (Task 3)
      // ========================================
      let tankToTankData = null;
      let updatedVehicleProfile = { ...prev.vehicleProfile };

      // Check if this is a full tank fill
      const fullTankCheck = isFullTankFill(
        {
          liters: newLog.liters,
          tankCapacity: newLog.tankCapacity || prev.vehicleProfile.tankCapacity,
          isFullTank: newLog.isFullTank
        },
        prev.vehicleProfile
      );

      if (fullTankCheck.isFullTank) {
        // Find previous full tank fill
        const previousFullFill = findPreviousFullFill(
          prev.logs,
          prev.currentVehicleId || newLog.vehicleId,
          newLog.date
        );

        // Calculate Tank-to-Tank consumption if we have a previous full fill
        if (previousFullFill) {
          try {
            tankToTankData = calculateTankToTankConsumption(
              {
                ...newLog,
                isFullTank: fullTankCheck.isFullTank,
                tankCapacity: newLog.tankCapacity || prev.vehicleProfile.tankCapacity
              },
              previousFullFill,
              prev.vehicleProfile
            );

            // Update vehicle profile with Tank-to-Tank data
            updatedVehicleProfile.lastFullFillLogId = Date.now().toString();
            updatedVehicleProfile.lastFullFillDate = newLog.date;

            // Store Tank-to-Tank trip in vehicle profile
            const existingTrips = updatedVehicleProfile.tankToTankTrips || [];
            if (tankToTankData.isValid) {
              updatedVehicleProfile.tankToTankTrips = [
                tankToTankData,
                ...existingTrips
              ].slice(0, 50); // Keep last 50 trips

              // Calculate average Tank-to-Tank mileage
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
          // This is the first full tank fill - no previous full fill to compare against
          updatedVehicleProfile.lastFullFillLogId = Date.now().toString();
          updatedVehicleProfile.lastFullFillDate = newLog.date;
          console.log('First full tank fill recorded - no Tank-to-Tank data calculated yet');
        }
      }

      // Create log entry with all fields
      const logEntry = {
        ...newLog,
        // Existing fields - preserved for backward compatibility
        mileage: Math.round(mileage * 100) / 100,
        isFlagged,
        id: Date.now().toString(),
        fuelType: newLog.fuelType || prev.vehicleProfile.fuelType || 'gasoline',
        // Store currency information with the log
        currency: prev.vehicleProfile.currency || 'USD',
        originalCurrency: prev.vehicleProfile.currency || 'USD',
        originalPrice: newLog.price,

        // ========================================
        // Tank-to-Tank Fields (Task 2 + Task 3)
        // ========================================
        // Tank fill tracking
        isFullTank: fullTankCheck.isFullTank,
        fuelLevelBeforeFill: newLog.fuelLevelBeforeFill || null,
        fuelLevelAfterFill: newLog.fuelLevelAfterFill || null,
        tankCapacity: newLog.tankCapacity || prev.vehicleProfile.tankCapacity,
        fillPercentage: fullTankCheck.isFullTank
          ? ((newLog.liters / (newLog.tankCapacity || prev.vehicleProfile.tankCapacity)) * 100).toFixed(1)
          : null,
        gaugeReading: newLog.gaugeReading || null,
        lastFullFillLogId: updatedVehicleProfile.lastFullFillLogId,

        // Tank-to-Tank calculation results
        tankToTankData: tankToTankData,

        // GPS tracking (optional, for future use)
        gpsDistance: newLog.gpsDistance || null,
        gpsRoute: newLog.gpsRoute || null,
      };

      const updatedLogs = [logEntry, ...prev.logs];
      const newStats = calculateStats(updatedLogs);

      return {
        ...prev,
        logs: updatedLogs,
        stats: newStats,
        vehicleProfile: updatedVehicleProfile
      };
    });
  }, [calculateStats]);

  // Delete a log entry
  const deleteLog = useCallback((logId) => {
    setData((prev) => {
      const updatedLogs = prev.logs.filter((log) => log.id !== logId);
      const newStats = calculateStats(updatedLogs);

      // Recalculate Tank-to-Tank data after deletion
      // Find all full tank fills and recalculate trips
      const sortedLogs = [...updatedLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const fullFillLogs = sortedLogs.filter(log => log.isFullTank === true);

      // Recalculate Tank-to-Tank trips
      const tankToTankTrips = [];
      let lastFullFill = null;

      for (const log of fullFillLogs) {
        if (lastFullFill) {
          try {
            const tankToTankData = calculateTankToTankConsumption(
              {
                ...log,
                tankCapacity: log.tankCapacity || prev.vehicleProfile.tankCapacity
              },
              lastFullFill,
              prev.vehicleProfile
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

      // Update vehicle profile with recalculated data
      const updatedVehicleProfile = { ...prev.vehicleProfile };

      if (fullFillLogs.length > 0) {
        const mostRecentFullFill = fullFillLogs[fullFillLogs.length - 1];
        updatedVehicleProfile.lastFullFillLogId = mostRecentFullFill.id;
        updatedVehicleProfile.lastFullFillDate = mostRecentFullFill.date;

        // Calculate average Tank-to-Tank mileage
        if (tankToTankTrips.length > 0) {
          const avgMileage = tankToTankTrips.reduce((sum, t) => sum + t.actualMileage, 0) / tankToTankTrips.length;
          updatedVehicleProfile.averageTankToTankMileage = Math.round(avgMileage * 100) / 100;
        }
      } else {
        // No full fills left
        updatedVehicleProfile.lastFullFillLogId = null;
        updatedVehicleProfile.lastFullFillDate = null;
        updatedVehicleProfile.averageTankToTankMileage = prev.vehicleProfile.expectedMileage || 15;
        updatedVehicleProfile.tankToTankTrips = [];
      }

      updatedVehicleProfile.tankToTankTrips = tankToTankTrips.slice(-50); // Keep last 50 trips

      return {
        ...prev,
        logs: updatedLogs,
        stats: newStats,
        vehicleProfile: updatedVehicleProfile
      };
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
        monthlyBudget: vehicle.monthlyBudget ?? 200, // Default $200 budget per vehicle
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

  // ========================================
  // GPS Tracking Functions (Task 10)
  // ========================================

  // Start GPS route tracking
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

    // Start watching GPS positions
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

  // Stop GPS route tracking
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

  // Get current GPS position
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

  // Calculate distance from last GPS position
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

  // Clear GPS routes
  const clearGPSRoutes = useCallback(() => {
    setData((prev) => ({
      ...prev,
      vehicleProfile: {
        ...prev.vehicleProfile,
        gpsRoutes: []
      }
    }));
  }, []);

  // ========================================
  // End GPS Tracking Functions
  // ========================================

  // Inject demo data with random values and 3 alerts
  const injectDemoData = useCallback(() => {
    const now = new Date();

    // Helper function for random numbers in range
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    // Tank capacity for demo
    const tankCapacity = 50;
    const expectedMileage = 15;

    // Generate random fuel logs with realistic variation
    // Average mileage target: ~15 km/L
    // Base odometer: randomly start between 5,000-10,000 km
    let currentOdometer = Math.floor(randomInRange(5000, 10000));

    // Fuel price per liter: $3.00-$4.50 range
    const basePricePerLiter = randomInRange(3.00, 4.50);

    // Generate 15-20 random logs spanning 2-3 months
    const numLogs = Math.floor(randomInRange(15, 20));
    const demoLogs = [];

    // Store calculated distances for later use
    const distances = [];

    for (let i = 0; i < numLogs; i++) {
      // Days between logs: randomly 2-7 days
      const daysBetween = Math.floor(randomInRange(2, 7));
      const logDate = new Date(now - i * daysBetween * 24 * 60 * 60 * 1000);

      // Determine if this should be a theft entry (3 entries total will be flagged)
      // We'll set the first 3 entries (most recent) to be flagged
      const isFlagged = i < 3;

      // Determine if this is a full tank fill (every 3-5 logs for realism)
      const isFullTank = i % Math.floor(randomInRange(3, 6)) === 0;

      // Random fuel amount
      let fuelAmount;
      if (isFullTank) {
        // Full tank: 40-48 liters (80-96% of 50L capacity)
        fuelAmount = parseFloat(randomInRange(40, 48).toFixed(1));
      } else {
        // Partial fill: 7-25 liters
        fuelAmount = parseFloat(randomInRange(7, 25).toFixed(1));
      }

      // Calculate distance and mileage
      let mileage;
      let distance;

      if (isFlagged) {
        // Theft scenario: low mileage (4-7 km/L, 25-50% below average)
        mileage = parseFloat(randomInRange(4, 7).toFixed(1));
        distance = Math.round(mileage * fuelAmount);
      } else {
        // Normal: good mileage (13-17 km/L, around average)
        mileage = parseFloat(randomInRange(13, 17).toFixed(1));
        distance = Math.round(mileage * fuelAmount);
      }

      // Calculate price based on fuel amount
      const price = parseFloat((fuelAmount * basePricePerLiter * randomInRange(0.95, 1.05)).toFixed(2));

      // Store distance for later odometer calculation
      distances.push(distance);

      demoLogs.push({
        id: `log-${i}`,
        date: logDate.toISOString(),
        odometer: 0, // Temporary placeholder, will recalculate after sorting
        liters: fuelAmount,
        price: price,
        mileage: mileage,
        isFlagged: isFlagged,
        fuelType: 'gasoline',
        currency: 'USD',
        originalCurrency: 'USD',
        originalPrice: price,
        pumpName: i % 3 === 0 ? 'Shell Station' : i % 3 === 1 ? 'Chevron' : 'BP',
        // Tank-to-tank fields
        isFullTank: isFullTank,
        tankCapacity: tankCapacity,
        fuelLevelBeforeFill: isFullTank ? null : Math.floor(randomInRange(10, 30)),
        fuelLevelAfterFill: isFullTank ? 100 : Math.floor(randomInRange(40, 80)),
        fillPercentage: isFullTank ? ((fuelAmount / tankCapacity) * 100).toFixed(1) : null,
        gaugeReading: isFullTank ? 'Full' : ['3/4', '1/2', '1/4'][Math.floor(randomInRange(0, 3))],
      });
    }

    // Sort logs by date descending (most recent first)
    demoLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Recalculate odometers to ensure they increase correctly over time
    // Start from base odometer and work backwards (oldest to newest)
    let baseOdometer = Math.floor(randomInRange(5000, 10000));

    // Reverse to iterate from oldest to newest
    for (let i = demoLogs.length - 1; i >= 0; i--) {
      const log = demoLogs[i];

      if (i === demoLogs.length - 1) {
        // Oldest log: set base odometer
        log.odometer = baseOdometer;
      } else {
        // Subsequent logs: add distance from previous log
        log.odometer = demoLogs[i + 1].odometer + distances[i + 1];
      }
    }

    // Add random offset to all odometers for realism
    const odometerOffset = Math.floor(randomInRange(500, 1500));
    demoLogs.forEach(log => {
      log.odometer += odometerOffset;
    });

    // ========================================
    // Generate Tank-to-Tank Trip Data
    // ========================================
    const tankToTankTrips = [];
    const fullFillLogs = demoLogs.filter(log => log.isFullTank === true);

    // Sort full fills by date ascending (oldest to newest) for proper calculation
    const sortedFullFills = [...fullFillLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate tank-to-tank trips from consecutive full fills
    for (let i = 1; i < sortedFullFills.length; i++) {
      const currentFill = sortedFullFills[i];
      const previousFill = sortedFullFills[i - 1];

      const distance = currentFill.odometer - previousFill.odometer;
      const duration = new Date(currentFill.date) - new Date(previousFill.date);
      const durationDays = Math.round(duration / (1000 * 60 * 60 * 24));

      const actualFuelConsumed = currentFill.liters;
      const expectedFuelConsumed = distance / expectedMileage;
      const fuelDifference = actualFuelConsumed - expectedFuelConsumed;
      const theftAmount = Math.max(0, fuelDifference);
      const theftPercentage = theftAmount > 0 ? (theftAmount / actualFuelConsumed) * 100 : 0;

      const actualMileage = distance / actualFuelConsumed;
      const remainingFuelBeforeFill = Math.max(0, tankCapacity - actualFuelConsumed);
      const fillPercentage = (currentFill.liters / tankCapacity) * 100;

      // Determine if this should be flagged as theft (make some trips show theft)
      // Randomly flag 1-2 trips as theft for demo purposes
      const isTheftSuspected = Math.random() < 0.25 && theftPercentage > 15;

      tankToTankTrips.push({
        isValid: true,
        tankCapacity,
        remainingFuelBeforeFill,
        fillPercentage,
        actualFuelConsumed,
        expectedFuelConsumed: parseFloat(expectedFuelConsumed.toFixed(2)),
        fuelDifference: parseFloat(fuelDifference.toFixed(2)),
        theftAmount: parseFloat(theftAmount.toFixed(2)),
        theftPercentage: parseFloat(theftPercentage.toFixed(1)),
        isTheftSuspected,
        distance,
        actualMileage: parseFloat(actualMileage.toFixed(2)),
        expectedMileage,
        mileageEfficiency: parseFloat(((actualMileage / expectedMileage) * 100).toFixed(1)),
        startDate: previousFill.date,
        endDate: currentFill.date,
        startOdometer: previousFill.odometer,
        endOdometer: currentFill.odometer,
        duration,
        durationDays,
        previousFullFillLogId: previousFill.id,
        currentLogId: currentFill.id,
        calculatedAt: new Date().toISOString(),
        theftThreshold: 25,
      });
    }

    // Sort tank-to-tank trips by date descending (most recent first)
    tankToTankTrips.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    const stats = calculateStats(demoLogs);

    // Calculate average tank-to-tank mileage
    const avgTankToTankMileage = tankToTankTrips.length > 0
      ? tankToTankTrips.reduce((sum, t) => sum + t.actualMileage, 0) / tankToTankTrips.length
      : expectedMileage;

    // Random vehicle selection from demo options
    const vehicleOptions = [
      {
        name: '2020 Toyota Corolla',
        make: 'Toyota',
        model: 'Corolla',
        variant: '2.0L 4cyl Auto CVT',
        year: 2020,
        vehicleId: 41190,
        epaCity: 30,
        epaHighway: 38,
        epaCombined: 33,
      },
      {
        name: '2021 Honda Civic',
        make: 'Honda',
        model: 'Civic',
        variant: '2.0L 4cyl Auto',
        year: 2021,
        vehicleId: 41542,
        epaCity: 33,
        epaHighway: 42,
        epaCombined: 36,
      },
      {
        name: '2022 Hyundai Elantra',
        make: 'Hyundai',
        model: 'Elantra',
        variant: '2.0L 4cyl Auto',
        year: 2022,
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
      expectedMileage: selectedVehicle.epaCombined || expectedMileage,
      tankCapacity: tankCapacity,
      country: 'US',
      currency: 'USD',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      fuelType: 'gasoline',
      theftThreshold: 0.75, // Default 75% threshold for demo
      monthlyBudget: 200, // Default $200 budget for demo
      assignedDriverId: 'driver-1',
      status: 'Active',
      createdAt: new Date('2020-01-01').toISOString(),
      // Tank-to-tank settings
      lastFullFillLogId: sortedFullFills.length > 0 ? sortedFullFills[sortedFullFills.length - 1].id : null,
      lastFullFillDate: sortedFullFills.length > 0 ? sortedFullFills[sortedFullFills.length - 1].date : null,
      averageTankToTankMileage: parseFloat(avgTankToTankMileage.toFixed(2)),
      tankToTankTrips: tankToTankTrips.slice(0, 50),
      tankToTankTheftThreshold: 25,
      minimumFillPercentage: 80,
      useFullTankOnly: false,
    };

    // Random driver names
    const driverNames = ['Sample Driver 1', 'Sample Driver 2', 'Sample Driver 3', 'Sample Driver 4'];
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
      createdAt: new Date('2020-01-01').toISOString(),
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
    // GPS Tracking (Task 10)
    startGPSRouteTracking,
    stopGPSRouteTracking,
    getCurrentPositionGPS,
    calculateDistanceFromGPS,
    clearGPSRoutes,
  };

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
};

