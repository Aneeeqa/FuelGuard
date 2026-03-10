/**
 * Custom hook for handling tank-to-tank export functionality
 *
 * This hook provides functions to export tank-to-tank data to various formats
 * and integrates with the FuelContext for accessing vehicle data.
 *
 * Time Complexity: O(1) for all operations
 * Space Complexity: O(1) - No additional data structures created
 */

import { useState, useCallback } from 'react';
import { useFuelData } from './useFuelData';
import {
  exportTankToTankTripToPDF,
  exportTankToTankTripsToPDF,
  exportTankToTankToExcel,
  exportSingleTankToTankToExcel,
  generateTankToTankTextReport,
} from '../utils/export';

/**
 * Hook for tank-to-tank export operations
 * @returns {Object} Export functions and state
 */
export const useTankToTankExport = () => {
  const { data, vehicleProfile } = useFuelData();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  /**
   * Get currency symbol
   * @returns {string} Currency symbol
   */
  const getCurrencySymbol = useCallback(() => {
    const currencyCode = data?.vehicleProfile?.currency || 'USD';
    const symbols = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'PKR': '₨',
      'CAD': 'C$',
      'AUD': 'A$',
    };
    return symbols[currencyCode] || '$';
  }, [data?.vehicleProfile?.currency]);

  /**
   * Get price per liter from vehicle profile
   * @returns {number} Price per liter
   */
  const getPricePerLiter = useCallback(() => {
    return data?.vehicleProfile?.pricePerLiter || 0;
  }, [data?.vehicleProfile?.pricePerLiter]);

  /**
   * Export single tank-to-tank trip to PDF
   * @param {Object} tripData - Tank-to-Tank calculation result
   * @returns {Promise<boolean>} Success status
   */
  const exportTripToPDF = useCallback(async (tripData) => {
    if (!tripData || !tripData.isValid) {
      setExportError('Invalid trip data');
      return false;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const currency = getCurrencySymbol();
      const pricePerLiter = getPricePerLiter();

      const success = exportTankToTankTripToPDF(
        tripData,
        data.vehicleProfile,
        currency,
        pricePerLiter
      );

      setIsExporting(false);
      return success;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [data.vehicleProfile, getCurrencySymbol, getPricePerLiter]);

  /**
   * Export multiple tank-to-tank trips to PDF
   * @param {Array} trips - Array of tank-to-tank trip data
   * @returns {Promise<boolean>} Success status
   */
  const exportAllTripsToPDF = useCallback(async (trips) => {
    if (!trips || trips.length === 0) {
      setExportError('No trips to export');
      return false;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const currency = getCurrencySymbol();
      const pricePerLiter = getPricePerLiter();

      const success = exportTankToTankTripsToPDF(
        trips,
        data.vehicleProfile,
        currency,
        pricePerLiter
      );

      setIsExporting(false);
      return success;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [data.vehicleProfile, getCurrencySymbol, getPricePerLiter]);

  /**
   * Export tank-to-tank trips to Excel
   * @param {Array} trips - Array of tank-to-tank trip data
   * @returns {Promise<boolean>} Success status
   */
  const exportToExcel = useCallback(async (trips) => {
    if (!trips || trips.length === 0) {
      setExportError('No trips to export');
      return false;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const currency = getCurrencySymbol();
      const pricePerLiter = getPricePerLiter();

      const success = exportTankToTankToExcel(
        trips,
        data.vehicleProfile,
        currency,
        pricePerLiter
      );

      setIsExporting(false);
      return success;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [data.vehicleProfile, getCurrencySymbol, getPricePerLiter]);

  /**
   * Export single tank-to-tank trip to Excel
   * @param {Object} tripData - Tank-to-Tank calculation result
   * @returns {Promise<boolean>} Success status
   */
  const exportSingleTripToExcel = useCallback(async (tripData) => {
    if (!tripData || !tripData.isValid) {
      setExportError('Invalid trip data');
      return false;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const currency = getCurrencySymbol();
      const pricePerLiter = getPricePerLiter();

      const success = exportSingleTankToTankToExcel(
        tripData,
        data.vehicleProfile,
        currency,
        pricePerLiter
      );

      setIsExporting(false);
      return success;
    } catch (error) {
      setExportError(error.message);
      setIsExporting(false);
      return false;
    }
  }, [data.vehicleProfile, getCurrencySymbol, getPricePerLiter]);

  /**
   * Generate text report for copying to clipboard
   * @param {Object} tripData - Tank-to-Tank calculation result
   * @returns {string} Formatted text report
   */
  const generateTextReport = useCallback((tripData) => {
    const currency = getCurrencySymbol();
    const pricePerLiter = getPricePerLiter();

    return generateTankToTankTextReport(
      tripData,
      data.vehicleProfile,
      currency,
      pricePerLiter
    );
  }, [data.vehicleProfile, getCurrencySymbol, getPricePerLiter]);

  /**
   * Copy text report to clipboard
   * @param {Object} tripData - Tank-to-Tank calculation result
   * @returns {Promise<boolean>} Success status
   */
  const copyReportToClipboard = useCallback(async (tripData) => {
    try {
      const report = generateTextReport(tripData);
      await navigator.clipboard.writeText(report);
      return true;
    } catch (error) {
      setExportError('Failed to copy to clipboard: ' + error.message);
      return false;
    }
  }, [generateTextReport]);

  return {
    // State
    isExporting,
    exportError,
    vehicleProfile: data.vehicleProfile,

    // Export functions
    exportTripToPDF,
    exportAllTripsToPDF,
    exportToExcel,
    exportSingleTripToExcel,
    generateTextReport,
    copyReportToClipboard,

    // Clear error
    clearExportError: () => setExportError(null),
  };
};

export default useTankToTankExport;
