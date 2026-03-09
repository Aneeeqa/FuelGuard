import { useState, useCallback } from 'react';
import { useFuelData } from './useFuelData';
import {
  exportTankToTankTripToPDF,
  exportTankToTankTripsToPDF,
  exportTankToTankToExcel,
  exportSingleTankToTankToExcel,
  generateTankToTankTextReport,
} from '../utils/export';

export const useTankToTankExport = () => {
  const { data, vehicleProfile } = useFuelData();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

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

  const getPricePerLiter = useCallback(() => {
    return data?.vehicleProfile?.pricePerLiter || 0;
  }, [data?.vehicleProfile?.pricePerLiter]);

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
    isExporting,
    exportError,
    vehicleProfile: data.vehicleProfile,

    exportTripToPDF,
    exportAllTripsToPDF,
    exportToExcel,
    exportSingleTripToExcel,
    generateTextReport,
    copyReportToClipboard,

    clearExportError: () => setExportError(null),
  };
};

export default useTankToTankExport;
