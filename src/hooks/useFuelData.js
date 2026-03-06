import { useContext, useMemo } from 'react';
import { FuelContext } from '../context/FuelContext';

/**
 * Custom hook wrapper for FuelContext
 * Provides computed values and easy access to fuel data
 */
export const useFuelData = () => {
  const context = useContext(FuelContext);

  if (!context) {
    throw new Error('useFuelData must be used within a FuelProvider');
  }

  const { data, loading, storageType, addLog, deleteLog, updateVehicleProfile, injectDemoData, clearAllData } = context;

  // Computed values
  const computed = useMemo(() => {
    const { logs = [], stats = {} } = data;

    return {
      avgMileage: stats.avgMileage || 0,
      totalFuel: stats.totalFuel || 0,
      totalDistance: stats.totalDistance || 0,
      flaggedCount: logs.filter((log) => log.isFlagged).length,
      totalEntries: logs.length,
      latestLog: logs[0] || null,
    };
  }, [data]);

  return {
    data,
    loading,
    storageType,
    addLog,
    deleteLog,
    updateVehicleProfile,
    injectDemoData,
    clearAllData,
    ...computed,
  };
};

export default useFuelData;

