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

  const calculateStats = useCallback((logs, vehicleId = null, monthlyBudget = 200) => {
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

      let tankToTankData = null;
      let updatedVehicleProfile = { ...prev.vehicleProfile };

      const fullTankCheck = isFullTankFill(
        {
          liters: newLog.liters,
          tankCapacity: newLog.tankCapacity || prev.vehicleProfile.tankCapacity,
          isFullTank: newLog.isFullTank
        },
        prev.vehicleProfile
      );

      if (fullTankCheck.isFullTank) {
        const previousFullFill = findPreviousFullFill(
          prev.logs,
          prev.currentVehicleId || newLog.vehicleId,
          newLog.date
        );

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
        id: Date.now().toString(),
        fuelType: newLog.fuelType || prev.vehicleProfile.fuelType || 'gasoline',
        currency: prev.vehicleProfile.currency || 'USD',
        originalCurrency: prev.vehicleProfile.currency || 'USD',
        originalPrice: newLog.price,
        isFullTank: fullTankCheck.isFullTank,
        fuelLevelBeforeFill: newLog.fuelLevelBeforeFill || null,
        fuelLevelAfterFill: newLog.fuelLevelAfterFill || null,
        tankCapacity: newLog.tankCapacity || prev.vehicleProfile.tankCapacity,
        fillPercentage: fullTankCheck.isFullTank
          ? ((newLog.liters / (newLog.tankCapacity || prev.vehicleProfile.tankCapacity)) * 100).toFixed(1)
          : null,
        gaugeReading: newLog.gaugeReading || null,
        lastFullFillLogId: updatedVehicleProfile.lastFullFillLogId,
        tankToTankData: tankToTankData,
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

  const deleteLog = useCallback((logId) => {
    setData((prev) => {
      const updatedLogs = prev.logs.filter((log) => log.id !== logId);
      const newStats = calculateStats(updatedLogs);

      const sortedLogs = [...updatedLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
      const fullFillLogs = sortedLogs.filter(log => log.isFullTank === true);

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
        }
      }
        lastFullFill = log;
      }

      const updatedVehicleProfile = { ...prev.vehicleProfile };

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
        updatedVehicleProfile.averageTankToTankMileage = prev.vehicleProfile.expectedMileage || 15;
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

  const updateDriver = useCallback((driverId, updates) => {
    setData((prev) => ({
      ...prev,
      drivers: prev.drivers.map((driver) =>
        driver.id === driverId ? { ...driver, ...updates } : driver
      ),
    }));
  }, []);

  const deleteDriver = useCallback((driverId) => {
    setData((prev) => {
      const updatedDrivers = prev.drivers.filter((driver) => driver.id !== driverId);
      return { ...prev, drivers: updatedDrivers };
    });
  }, []);

  const addVehicle = useCallback((vehicle) => {
    setData((prev) => {
      const newVehicle = {
        ...vehicle,
        id: vehicle.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        monthlyBudget: vehicle.monthlyBudget ?? 200,
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
    const tankCapacity = 50;
    const expectedMileage = 15;

    let currentOdometer = Math.floor(randomInRange(5000, 10000));
    const basePricePerLiter = randomInRange(3.00, 4.50);
    const numLogs = Math.floor(randomInRange(15, 20));
    const demoLogs = [];
    const distances = [];

    for (let i = 0; i < numLogs; i++) {
      const daysBetween = Math.floor(randomInRange(2, 7));
      const logDate = new Date(now - i * daysBetween * 24 * 60 * 60 * 1000);
      const isFlagged = i < 3;
      const isFullTank = i % Math.floor(randomInRange(3, 6)) === 0;

      let fuelAmount;
      if (isFullTank) {
        fuelAmount = parseFloat(randomInRange(40, 48).toFixed(1));
      } else {
        fuelAmount = parseFloat(randomInRange(7, 25).toFixed(1));
      }

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
        pumpName: i % 3 === 0 ? 'Shell Station' : i % 3 === 1 ? 'Chevron' : 'BP',
        isFullTank: isFullTank,
        tankCapacity: tankCapacity,
        fuelLevelBeforeFill: isFullTank ? null : Math.floor(randomInRange(10, 30)),
        fuelLevelAfterFill: isFullTank ? 100 : Math.floor(randomInRange(40, 80)),
        fillPercentage: isFullTank ? ((fuelAmount / tankCapacity) * 100).toFixed(1) : null,
        gaugeReading: isFullTank ? 'Full' : ['3/4', '1/2', '1/4'][Math.floor(randomInRange(0, 3))],
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

    const tankToTankTrips = [];
    const fullFillLogs = demoLogs.filter(log => log.isFullTank === true);
    const sortedFullFills = [...fullFillLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

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

    tankToTankTrips.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    const stats = calculateStats(demoLogs);

    const avgTankToTankMileage = tankToTankTrips.length > 0
      ? tankToTankTrips.reduce((sum, t) => sum + t.actualMileage, 0) / tankToTankTrips.length
      : expectedMileage;

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
        name: 'Sample Hyundai Elantra',
        make: 'Hyundai',
        model: 'Elantra',
        variant: '2.0L 4cyl Auto',
        year: 2020,
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
      theftThreshold: 0.75,
      monthlyBudget: 200,
      assignedDriverId: 'driver-1',
      status: 'Active',
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastFullFillLogId: sortedFullFills.length > 0 ? sortedFullFills[sortedFullFills.length - 1].id : null,
      lastFullFillDate: sortedFullFills.length > 0 ? sortedFullFills[sortedFullFills.length - 1].date : null,
      averageTankToTankMileage: parseFloat(avgTankToTankMileage.toFixed(2)),
      tankToTankTrips: tankToTankTrips.slice(0, 50),
      tankToTankTheftThreshold: 25,
      minimumFillPercentage: 80,
      useFullTankOnly: false,
    };

    const driverNames = ['Driver One', 'Driver Two', 'Driver Three', 'Driver Four'];
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
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
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
