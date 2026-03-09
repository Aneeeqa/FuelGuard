import { useContext, useMemo } from 'react';
import { FuelContext } from '../context/FuelContext';

export const useFuelData = () => {
  const context = useContext(FuelContext);

if (!context) {
    throw new Error('useFuelData must be used within a FuelProvider');
  }

  const { data, loading, storageType, addLog, deleteLog, updateVehicleProfile, updateVehicleProfileWithCurrencyConversion, addVehicle, updateVehicle, deleteVehicle, selectVehicle, addDriver, updateDriver, deleteDriver, injectDemoData, clearAllData } = context;

  const computed = useMemo(() => {
    const { logs = [], stats = {} } = data;

    return {
      avgMileage: stats.avgMileage || 0,
      totalFuel: stats.totalFuel || 0,
      totalDistance: stats.totalDistance || 0,
      flaggedCount: logs.filter((log) => log.isFlagged).length,
      totalEntries: logs.length,
      latestLog: logs[0] || null,
      totalExpenditure: stats.totalExpenditure || 0,
      costPerKm: stats.costPerKm || 0,
      budgetAlert: stats.budgetAlert || null,
    };
  }, [data]);

  return {
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
    ...computed,
    monthlyBudget: data.monthlyBudget || 200,
  };
};

export default useFuelData;
