/**
 * Export utilities for PDF and Excel formats
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export fuel logs to PDF
 * @param {Array} logs - Array of fuel log entries
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 */
export const exportToPDF = (logs, vehicleProfile, currency) => {
  try {
    if (!logs || logs.length === 0) {
      alert('No data to export. Please add fuel entries first.');
      return false;
    }

    const distanceUnit = vehicleProfile?.distanceUnit || 'km';
    const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
    const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
    const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Fuel Guard - Fuel Log Report', 14, 15);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle: ' + (vehicleProfile?.name || 'Not set'), 14, 25);
    doc.text('Expected Mileage: ' + (vehicleProfile?.expectedMileage || 'N/A') + ' ' + efficiencyUnit, 14, 32);
    doc.text('Export Date: ' + new Date().toLocaleDateString(), 14, 39);

    const tableData = logs.map((log, index) => [
      index + 1,
      new Date(log.date).toLocaleDateString(),
      distanceUnit === 'mi' ? (log.odometer * 0.621371).toFixed(0) : log.odometer,
      fuelDisplayUnit === 'gal' ? (log.liters * 0.264172).toFixed(2) : log.liters,
      log.price ? currency + log.price.toFixed(2) : 'N/A',
      log.mileage.toFixed(2),
      log.distance ? (distanceUnit === 'mi' ? (log.distance * 0.621371).toFixed(0) : log.distance) : '-',
      log.isFlagged ? 'THEFT' : 'Normal',
    ]);

    const tableHeaders = [
      '#',
      'Date',
      'Odometer (' + distanceUnit + ')',
      'Fuel (' + fuelDisplayUnit + ')',
      'Cost (' + currency + ')',
      'Mileage (' + efficiencyUnit + ')',
      'Distance (' + distanceUnit + ')',
      'Status',
    ];

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 50,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        7: { cellWidth: 35 },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 7 && data.cell.raw === 'THEFT') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    const totalFuel = logs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.price || 0), 0);
    const totalDistance = logs.reduce((sum, log) => sum + (log.distance || 0), 0);
    const flaggedCount = logs.filter(log => log.isFlagged).length;

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Entries: ' + logs.length, 14, finalY + 10);
    doc.text('Total Fuel: ' + (fuelDisplayUnit === 'gal' ? (totalFuel * 0.264172).toFixed(2) : totalFuel.toFixed(2)) + ' ' + fuelDisplayUnit, 14, finalY + 18);
    doc.text('Total Cost: ' + currency + totalCost.toFixed(2), 14, finalY + 26);
    doc.text('Total Distance: ' + (distanceUnit === 'mi' ? (totalDistance * 0.621371).toFixed(2) : totalDistance.toFixed(2)) + ' ' + distanceUnit, 14, finalY + 34);
    doc.text('Theft Alerts: ' + flaggedCount, 14, finalY + 42);
    doc.setTextColor(220, 38, 38);
    doc.text(flaggedCount > 0 ? 'Potential fuel theft detected!' : 'No theft detected', 14, finalY + 50);

    const filename = 'fuel-guard-report-' + new Date().toISOString().split('T')[0] + '.pdf';
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to export PDF: ' + error.message);
    return false;
  }
};

/**
 * Export fuel logs to Excel (XLSX)
 * @param {Array} logs - Array of fuel log entries
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 */
export const exportToExcel = (logs, vehicleProfile, currency) => {
  try {
    if (!logs || logs.length === 0) {
      alert('No data to export. Please add fuel entries first.');
      return false;
    }

    const distanceUnit = vehicleProfile?.distanceUnit || 'km';
    const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
    const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
    const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

    const costColumn = 'Cost (' + currency + ')';
    const data = logs.map((log, index) => {
      const obj = {
        '#': index + 1,
        'Date': new Date(log.date).toLocaleDateString(),
      };

      obj['Odometer (' + distanceUnit + ')'] = distanceUnit === 'mi' ? (log.odometer * 0.621371).toFixed(0) : log.odometer;
      obj['Fuel Added (' + fuelDisplayUnit + ')'] = fuelDisplayUnit === 'gal' ? (log.liters * 0.264172).toFixed(2) : log.liters;
      obj[costColumn] = log.price ? log.price : 0;
      obj['Mileage (' + efficiencyUnit + ')'] = parseFloat(log.mileage || 0).toFixed(2);
      obj['Distance (' + distanceUnit + ')'] = distanceUnit === 'mi' ? (log.distance * 0.621371).toFixed(0) : log.distance || 0;
      obj['Status'] = log.isFlagged ? 'THEFT' : 'Normal';

      if (log.pricePerLiter) {
        obj['Price per ' + fuelDisplayUnit] = log.pricePerLiter.toFixed(2);
      }
      if (log.costPerKm) {
        obj['Cost per ' + distanceUnit] = log.costPerKm.toFixed(4);
      }

      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);

    const totalFuel = logs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const totalCost = logs.reduce((sum, log) => sum + (log.price || 0), 0);
    const totalDistance = logs.reduce((sum, log) => sum + (log.distance || 0), 0);
    const avgMileage = logs.length > 0 ? logs.reduce((sum, log) => sum + (log.mileage || 0), 0) / logs.length : 0;
    const flaggedCount = logs.filter(log => log.isFlagged).length;

    const summaryData = [
      { 'Metric': 'Report Date', 'Value': new Date().toLocaleDateString() },
      { 'Metric': 'Vehicle Name', 'Value': vehicleProfile?.name || 'Not set' },
      { 'Metric': 'Expected Mileage', 'Value': (vehicleProfile?.expectedMileage || 'N/A') + ' ' + efficiencyUnit },
      {},
      { 'Metric': 'Total Entries', 'Value': logs.length },
      { 'Metric': 'Total Fuel', 'Value': (fuelDisplayUnit === 'gal' ? (totalFuel * 0.264172).toFixed(2) : totalFuel.toFixed(2)) + ' ' + fuelDisplayUnit },
      { 'Metric': 'Total Cost', 'Value': currency + totalCost.toFixed(2) },
      { 'Metric': 'Total Distance', 'Value': (distanceUnit === 'mi' ? (totalDistance * 0.621371).toFixed(2) : totalDistance.toFixed(2)) + ' ' + distanceUnit },
      { 'Metric': 'Average Mileage', 'Value': avgMileage.toFixed(2) + ' ' + efficiencyUnit },
      { 'Metric': 'Theft Alerts', 'Value': flaggedCount },
    ];

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fuel Logs');
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    const filename = 'fuel-guard-data-' + new Date().toISOString().split('T')[0] + '.xlsx';
    XLSX.writeFile(wb, filename);

    return true;
  } catch (error) {
    console.error('Excel export failed:', error);
    alert('Failed to export Excel: ' + error.message);
    return false;
  }
};

/**
 * Export trip data to CSV
 * @param {Array} trips - Array of trip entries
 * @param {string} currency - Currency symbol
 */
export const exportTripsToCSV = (trips, currency) => {
  try {
    if (!trips || trips.length === 0) {
      alert('No trip data to export. Please add fuel entries first.');
      return false;
    }

    const headers = ['Date', 'Start Odometer', 'End Odometer', 'Distance (km)', 'Fuel Used (L)', 'Cost (' + currency + ')', 'Mileage (km/L)', 'Status'];
    
    const rows = trips.map(trip => {
      const startLog = trip.logs && trip.logs[0] ? trip.logs[0] : {};
      const endLog = trip.logs && trip.logs[1] ? trip.logs[1] : {};
      
      return [
        new Date(trip.startDate).toLocaleDateString(),
        startLog.odometer || '-',
        endLog.odometer || '-',
        trip.odometerDistance || '-',
        endLog.liters || '-',
        endLog.price || '-',
        endLog.mileage ? endLog.mileage.toFixed(2) : '-',
        trip.isSuspicious ? 'SUSPICIOUS' : 'Normal',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => '"' + cell + '"').join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fuel-guard-trips-' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);

    return true;
  } catch (error) {
    console.error('CSV export failed:', error);
    alert('Failed to export CSV: ' + error.message);
    return false;
  }
};

export default {
  exportToPDF,
  exportToExcel,
  exportTripsToCSV,
};
