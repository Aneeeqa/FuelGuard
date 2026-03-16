/**
 * Export utilities for PDF and Excel formats
 * Includes tank-to-tank fuel consumption and theft analysis exports
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getTankToTankTheftSeverity, calculateTankToTankStatistics } from './tankToTankCalculations';

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

     // Use landscape orientation for better table width
     const doc = new jsPDF({
       orientation: 'landscape',
       unit: 'mm',
       format: 'a4',
     });

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
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 },
        7: { cellWidth: 30 },
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

/**
 * Export single tank-to-tank trip to PDF
 * @param {Object} tripData - Tank-to-Tank calculation result
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 * @param {number} pricePerLiter - Price per liter for theft cost calculation
 *
 * Time Complexity: O(1) - Fixed number of operations
 * Space Complexity: O(1) - Fixed data structures
 */
export const exportTankToTankTripToPDF = (tripData, vehicleProfile, currency = '$', pricePerLiter = 0) => {
   try {
     if (!tripData || !tripData.isValid) {
       alert('No valid Tank-to-Tank data to export.');
       return false;
     }

     const distanceUnit = vehicleProfile?.distanceUnit || 'km';
     const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
     const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
     const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

     // Use landscape orientation for better table width
     const doc = new jsPDF({
       orientation: 'landscape',
       unit: 'mm',
       format: 'a4',
     });

    // Document title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Fuel Guard - Tank-to-Tank Analysis', 14, 15);

    // Vehicle info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle: ' + (vehicleProfile?.name || 'Not set'), 14, 25);
    doc.text('Export Date: ' + new Date().toLocaleDateString(), 14, 32);

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 38, 196, 38);

    // Trip Summary Section
    const severity = getTankToTankTheftSeverity(tripData.theftPercentage);

    // Title with severity color
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    if (tripData.isTheftSuspected) {
      if (severity === 'critical') {
        doc.setTextColor(220, 38, 38);
        doc.text('⚠️ THEFT DETECTED', 14, 48);
      } else {
        doc.setTextColor(245, 158, 11);
        doc.text('⚠️ THEFT DETECTED', 14, 48);
      }
    } else {
      doc.setTextColor(34, 197, 94);
      doc.text('✓ Normal Fuel Consumption', 14, 48);
    }
    doc.setTextColor(0, 0, 0);

    // Trip period
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const startDate = new Date(tripData.startDate).toLocaleDateString();
    const endDate = new Date(tripData.endDate).toLocaleDateString();
    doc.text(`Trip Period: ${startDate} - ${endDate} (${tripData.durationDays} days)`, 14, 56);

    // Key Metrics Table
    const metricsData = [
      ['Metric', 'Value'],
      ['Distance Traveled', `${Math.round(tripData.distance)} ${distanceUnit}`],
      ['Fuel Added', `${tripData.actualFuelConsumed.toFixed(1)} ${fuelDisplayUnit}`],
      ['Expected Consumption', `${tripData.expectedFuelConsumed.toFixed(1)} ${fuelDisplayUnit}`],
      ['Actual Mileage', `${tripData.actualMileage.toFixed(2)} ${efficiencyUnit}`],
      ['Expected Mileage', `${tripData.expectedMileage.toFixed(2)} ${efficiencyUnit}`],
      ['Mileage Efficiency', `${tripData.mileageEfficiency.toFixed(0)}%`],
      ['Tank Capacity', `${tripData.tankCapacity} ${fuelDisplayUnit}`],
    ];

    autoTable(doc, {
      startY: 62,
      head: [metricsData[0]],
      body: metricsData.slice(1),
      theme: 'grid',
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
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
      },
    });

    // Theft Analysis Section
    const currentY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Theft Analysis', 14, currentY);

    const theftData = [
      ['Metric', 'Value'],
      ['Fuel Difference', `${tripData.fuelDifference > 0 ? '+' : ''}${tripData.fuelDifference.toFixed(1)} ${fuelDisplayUnit}`],
      ['Theft Amount', `${tripData.theftAmount.toFixed(1)} ${fuelDisplayUnit}`],
      ['Theft Percentage', `${tripData.theftPercentage.toFixed(1)}%`],
      ['Severity', severity.charAt(0).toUpperCase() + severity.slice(1)],
      ['Theft Threshold', `${tripData.theftThreshold}%`],
    ];

    if (pricePerLiter > 0 && tripData.theftAmount > 0) {
      theftData.push(['Estimated Loss', `${currency}${(tripData.theftAmount * pricePerLiter).toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: currentY + 8,
      head: [theftData[0]],
      body: theftData.slice(1),
      theme: 'grid',
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
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
      },
      didParseCell: function (data) {
        // Color-code theft indicators
        if (data.section === 'body' && data.column.index === 1) {
          if (data.row.index === 1 && tripData.theftAmount > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.row.index === 2 && tripData.theftPercentage > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Odometer Readings
    const odometerY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Odometer Readings', 14, odometerY);

    const odometerData = [
      ['Reading', 'Value'],
      ['Start Odometer', tripData.startOdometer.toLocaleString() + ` ${distanceUnit}`],
      ['End Odometer', tripData.endOdometer.toLocaleString() + ` ${distanceUnit}`],
      ['Distance Calculated', `${Math.round(tripData.distance)} ${distanceUnit}`],
    ];

    autoTable(doc, {
      startY: odometerY + 8,
      head: [odometerData[0]],
      body: odometerData.slice(1),
      theme: 'grid',
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
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
      },
    });

    // Fuel Level Analysis
    const fuelY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Fuel Level Analysis', 14, fuelY);

    const fuelData = [
      ['Metric', 'Value'],
      ['Tank Capacity', `${tripData.tankCapacity} ${fuelDisplayUnit}`],
      ['Fuel Before Fill', `${tripData.remainingFuelBeforeFill.toFixed(1)} ${fuelDisplayUnit}`],
      ['Fuel Added', `${tripData.actualFuelConsumed.toFixed(1)} ${fuelDisplayUnit}`],
      ['Fuel After Fill', `${tripData.tankCapacity} ${fuelDisplayUnit} (100%)`],
      ['Fill Percentage', `${tripData.fillPercentage.toFixed(0)}%`],
    ];

    autoTable(doc, {
      startY: fuelY + 8,
      head: [fuelData[0]],
      body: fuelData.slice(1),
      theme: 'grid',
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
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
      },
    });

    // Footer
    const footerY = doc.lastAutoTable.finalY + 15;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by Fuel Guard - Tank-to-Tank Fuel Tracking System', 14, footerY);
    doc.text('Report ID: ' + tripData.currentLogId || 'N/A', 14, footerY + 5);

    const filename = `tank-to-tank-trip-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Tank-to-Tank PDF export failed:', error);
    alert('Failed to export Tank-to-Tank PDF: ' + error.message);
    return false;
  }
};

/**
 * Export multiple tank-to-tank trips to PDF
 * @param {Array} trips - Array of tank-to-tank trip data
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 * @param {number} pricePerLiter - Price per liter
 *
 * Time Complexity: O(n) where n is number of trips
 * Space Complexity: O(1) - Fixed data structures
 */
export const exportTankToTankTripsToPDF = (trips, vehicleProfile, currency = '$', pricePerLiter = 0) => {
   try {
     if (!trips || trips.length === 0) {
       alert('No tank-to-tank trip data to export.');
       return false;
     }

     const distanceUnit = vehicleProfile?.distanceUnit || 'km';
     const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
     const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
     const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

     // Use landscape orientation for better table width
     const doc = new jsPDF({
       orientation: 'landscape',
       unit: 'mm',
       format: 'a4',
     });

    // Document title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Fuel Guard - Tank-to-Tank Report', 14, 15);

    // Vehicle info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Vehicle: ' + (vehicleProfile?.name || 'Not set'), 14, 25);
    doc.text('Export Date: ' + new Date().toLocaleDateString(), 14, 32);

    // Statistics
    const stats = calculateTankToTankStatistics(trips);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary Statistics', 14, 42);

    const summaryData = [
      ['Metric', 'Value'],
      ['Total Trips', stats.count.toString()],
      ['Average Distance', `${stats.avgDistance} ${distanceUnit}`],
      ['Average Fuel per Trip', `${stats.avgFuelConsumed} ${fuelDisplayUnit}`],
      ['Average Mileage', `${stats.avgActualMileage} ${efficiencyUnit}`],
      ['Total Thefts', `${stats.theftIncidents} (${stats.theftPercentage}%)`],
      ['Total Fuel Stolen', `${stats.totalTheftAmount} ${fuelDisplayUnit}`],
    ];

    if (pricePerLiter > 0 && stats.totalTheftAmount > 0) {
      summaryData.push(['Total Loss', `${currency}${(stats.totalTheftAmount * pricePerLiter).toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: 50,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
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
        0: { cellWidth: 70 },
        1: { cellWidth: 60 },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 1) {
          if (data.row.index === 4) { // Total Thefts
            if (stats.theftIncidents > 0) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            }
          }
          if (data.row.index === 5) { // Total Fuel Stolen
            if (stats.totalTheftAmount > 0) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
    });

    // Trips table
    const tableY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('All Trips', 14, tableY);

    const tripsTableData = trips.map((trip, index) => [
      index + 1,
      new Date(trip.startDate).toLocaleDateString(),
      Math.round(trip.distance),
      trip.actualFuelConsumed.toFixed(1),
      trip.actualMileage.toFixed(2),
      trip.theftPercentage.toFixed(0) + '%',
      trip.isTheftSuspected ? '⚠️ THEFT' : 'Normal',
    ]);

    const headers = [
      '#',
      'Start Date',
      `Distance (${distanceUnit})`,
      `Fuel (${fuelDisplayUnit})`,
      `Mileage (${efficiencyUnit})`,
      'Theft %',
      'Status',
    ];

     autoTable(doc, {
       startY: tableY + 8,
       head: [headers],
       body: tripsTableData,
       styles: {
         fontSize: 8,
         cellPadding: 2,
         overflow: 'linebreak',
       },
       headStyles: {
         fillColor: [59, 130, 246],
         textColor: 255,
         fontStyle: 'bold',
       },
       columnStyles: {
         0: { cellWidth: 25 },
         1: { cellWidth: 35 },
         2: { cellWidth: 25 },
         3: { cellWidth: 25 },
         4: { cellWidth: 20 },
         5: { cellWidth: 30 },
       },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === '⚠️ THEFT') {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    // Footer
    const footerY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Generated by Fuel Guard - Tank-to-Tank Fuel Tracking System', 14, footerY);

    const filename = `tank-to-tank-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return true;
  } catch (error) {
    console.error('Tank-to-Tank PDF export failed:', error);
    alert('Failed to export Tank-to-Tank PDF: ' + error.message);
    return false;
  }
};

/**
 * Export tank-to-tank trips to Excel (XLSX)
 * @param {Array} trips - Array of tank-to-tank trip data
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 * @param {number} pricePerLiter - Price per liter
 *
 * Time Complexity: O(n) where n is number of trips
 * Space Complexity: O(n) - Creates sheet data
 */
export const exportTankToTankToExcel = (trips, vehicleProfile, currency = '$', pricePerLiter = 0) => {
  try {
    if (!trips || trips.length === 0) {
      alert('No tank-to-tank trip data to export.');
      return false;
    }

    const distanceUnit = vehicleProfile?.distanceUnit || 'km';
    const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
    const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
    const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

    // Create Summary Sheet
    const stats = calculateTankToTankStatistics(trips);

    const summaryData = [
      { 'Metric': 'Report Date', 'Value': new Date().toLocaleDateString() },
      { 'Metric': 'Vehicle Name', 'Value': vehicleProfile?.name || 'Not set' },
      { 'Metric': 'Distance Unit', 'Value': distanceUnit },
      { 'Metric': 'Fuel Unit', 'Value': fuelDisplayUnit },
      { 'Metric': '', 'Value': '' },
      { 'Metric': 'Total Trips', 'Value': stats.count },
      { 'Metric': 'Average Distance', 'Value': stats.avgDistance + ' ' + distanceUnit },
      { 'Metric': 'Average Fuel per Trip', 'Value': stats.avgFuelConsumed + ' ' + fuelDisplayUnit },
      { 'Metric': 'Average Mileage', 'Value': stats.avgActualMileage + ' ' + efficiencyUnit },
      { 'Metric': 'Total Thefts', 'Value': stats.theftIncidents },
      { 'Metric': 'Theft Percentage', 'Value': stats.theftPercentage + '%' },
      { 'Metric': 'Total Fuel Stolen', 'Value': stats.totalTheftAmount + ' ' + fuelDisplayUnit },
    ];

    if (pricePerLiter > 0 && stats.totalTheftAmount > 0) {
      summaryData.push({ 'Metric': 'Total Loss', 'Value': currency + (stats.totalTheftAmount * pricePerLiter).toFixed(2) });
    }

    // Create Trips Sheet
    const tripsData = trips.map((trip, index) => {
      // Skip invalid trips
      if (!trip || !trip.isValid) {
        return null;
      }

      const obj = {
        '#': index + 1,
        'Start Date': new Date(trip.startDate).toLocaleDateString(),
        'End Date': new Date(trip.endDate).toLocaleDateString(),
        'Duration (days)': trip.durationDays,
      };
      obj[`Distance (${distanceUnit})`] = Math.round(trip.distance);
      obj[`Fuel Added (${fuelDisplayUnit})`] = (trip.actualFuelConsumed || 0).toFixed(2);
      obj[`Expected Consumption (${fuelDisplayUnit})`] = (trip.expectedFuelConsumed || 0).toFixed(2);
      obj[`Fuel Difference (${fuelDisplayUnit})`] = (trip.fuelDifference || 0).toFixed(2);
      obj[`Actual Mileage (${efficiencyUnit})`] = (trip.actualMileage || 0).toFixed(2);
      obj[`Expected Mileage (${efficiencyUnit})`] = (trip.expectedMileage || 0).toFixed(2);
      obj['Mileage Efficiency (%)'] = (trip.mileageEfficiency || 0).toFixed(0);
      obj[`Theft Amount (${fuelDisplayUnit})`] = (trip.theftAmount || 0).toFixed(2);
      obj['Theft Percentage (%)'] = (trip.theftPercentage || 0).toFixed(1);
      obj['Severity'] = getTankToTankTheftSeverity(trip.theftPercentage || 0).toUpperCase();
      obj['Start Odometer'] = trip.startOdometer || 0;
      obj['End Odometer'] = trip.endOdometer || 0;
      obj[`Tank Capacity (${fuelDisplayUnit})`] = trip.tankCapacity || 0;
      obj[`Fuel Before Fill (${fuelDisplayUnit})`] = (trip.remainingFuelBeforeFill || 0).toFixed(1);
      obj['Fill Percentage (%)'] = (trip.fillPercentage || 0).toFixed(0);
      obj['Is Theft Suspected'] = trip.isTheftSuspected ? 'Yes' : 'No';

      if (pricePerLiter > 0 && trip.theftAmount > 0) {
        obj[`Estimated Loss (${currency})`] = (trip.theftAmount * pricePerLiter).toFixed(2);
      }

      return obj;
    }).filter(trip => trip !== null); // Remove invalid trips

    // Create Theft Incidents Sheet
    const theftTrips = trips.filter(t => t.isTheftSuspected);

    if (theftTrips.length > 0) {
      const theftData = theftTrips.map((trip, index) => {
        const obj = {
          '#': index + 1,
          'Date': new Date(trip.startDate).toLocaleDateString(),
        };
        obj[`Distance (${distanceUnit})`] = Math.round(trip.distance);
        obj[`Fuel Added (${fuelDisplayUnit})`] = trip.actualFuelConsumed.toFixed(2);
        obj[`Expected (${fuelDisplayUnit})`] = trip.expectedFuelConsumed.toFixed(2);
        obj[`Stolen (${fuelDisplayUnit})`] = trip.theftAmount.toFixed(2);
        obj['Theft %'] = trip.theftPercentage.toFixed(1);
        obj['Severity'] = getTankToTankTheftSeverity(trip.theftPercentage).toUpperCase();

        if (pricePerLiter > 0) {
          obj[`Loss (${currency})`] = (trip.theftAmount * pricePerLiter).toFixed(2);
        }

        return obj;
      });

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsTrips = XLSX.utils.json_to_sheet(tripsData);
      const wsTheft = XLSX.utils.json_to_sheet(theftData);

      // Set column widths
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
      wsTrips['!cols'] = tripsData[0] ? Object.keys(tripsData[0]).map(() => ({ wch: 18 })) : [];
      wsTheft['!cols'] = theftData[0] ? Object.keys(theftData[0]).map(() => ({ wch: 18 })) : [];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsTrips, 'All Trips');
      XLSX.utils.book_append_sheet(wb, wsTheft, 'Theft Incidents');

      const filename = 'tank-to-tank-report-' + new Date().toISOString().split('T')[0] + '.xlsx';
      XLSX.writeFile(wb, filename);
    } else {
      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsTrips = XLSX.utils.json_to_sheet(tripsData);

      wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
      wsTrips['!cols'] = tripsData[0] ? Object.keys(tripsData[0]).map(() => ({ wch: 18 })) : [];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      XLSX.utils.book_append_sheet(wb, wsTrips, 'All Trips');

      const filename = 'tank-to-tank-report-' + new Date().toISOString().split('T')[0] + '.xlsx';
      XLSX.writeFile(wb, filename);
    }

    return true;
  } catch (error) {
    console.error('Tank-to-Tank Excel export failed:', error);
    alert('Failed to export Tank-to-Tank Excel: ' + error.message);
    return false;
  }
};

/**
 * Export single tank-to-tank trip to Excel
 * @param {Object} tripData - Single tank-to-tank trip data
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 * @param {number} pricePerLiter - Price per liter
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const exportSingleTankToTankToExcel = (tripData, vehicleProfile, currency = '$', pricePerLiter = 0) => {
  return exportTankToTankToExcel([tripData], vehicleProfile, currency, pricePerLiter);
};

/**
 * Generate text report for tank-to-tank trip (for copying to clipboard)
 * @param {Object} tripData - Tank-to-Tank calculation result
 * @param {Object} vehicleProfile - Vehicle profile info
 * @param {string} currency - Currency symbol
 * @param {number} pricePerLiter - Price per liter
 * @returns {string} Formatted text report
 *
 * Time Complexity: O(1)
 * Space Complexity: O(1)
 */
export const generateTankToTankTextReport = (tripData, vehicleProfile, currency = '$', pricePerLiter = 0) => {
  if (!tripData || !tripData.isValid) {
    return 'No valid Tank-to-Tank data available.';
  }

  const distanceUnit = vehicleProfile?.distanceUnit || 'km';
  const fuelVolumeUnit = vehicleProfile?.fuelVolumeUnit || 'L';
  const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';
  const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';

  const severity = getTankToTankTheftSeverity(tripData.theftPercentage);

  let report = `
═══════════════════════════════════════════════════════════════
  FUEL GUARD - TANK-TO-TANK ANALYSIS REPORT
═══════════════════════════════════════════════════════════════

VEHICLE INFORMATION
  Vehicle: ${vehicleProfile?.name || 'Not set'}
  Tank Capacity: ${tripData.tankCapacity} ${fuelDisplayUnit}
  Expected Mileage: ${tripData.expectedMileage} ${efficiencyUnit}

TRIP DETAILS
  Start Date: ${new Date(tripData.startDate).toLocaleDateString()}
  End Date: ${new Date(tripData.endDate).toLocaleDateString()}
  Duration: ${tripData.durationDays} days

FUEL CONSUMPTION
  Distance Traveled: ${Math.round(tripData.distance)} ${distanceUnit}
  Fuel Added: ${tripData.actualFuelConsumed.toFixed(1)} ${fuelDisplayUnit}
  Expected Consumption: ${tripData.expectedFuelConsumed.toFixed(1)} ${fuelDisplayUnit}
  Fuel Difference: ${tripData.fuelDifference > 0 ? '+' : ''}${tripData.fuelDifference.toFixed(1)} ${fuelDisplayUnit}

MILEAGE ANALYSIS
  Actual Mileage: ${tripData.actualMileage.toFixed(2)} ${efficiencyUnit}
  Expected Mileage: ${tripData.expectedMileage.toFixed(2)} ${efficiencyUnit}
  Mileage Efficiency: ${tripData.mileageEfficiency.toFixed(0)}%

`;

  if (tripData.isTheftSuspected) {
    report += `THEFT DETECTION ⚠️
  Severity: ${severity.toUpperCase()}
  Theft Amount: ${tripData.theftAmount.toFixed(1)} ${fuelDisplayUnit}
  Theft Percentage: ${tripData.theftPercentage.toFixed(1)}%
  Threshold: ${tripData.theftThreshold}%
`;
    if (pricePerLiter > 0) {
      const loss = tripData.theftAmount * pricePerLiter;
      report += `  Estimated Loss: ${currency}${loss.toFixed(2)}\n`;
    }
  } else {
    report += `THEFT DETECTION ✓
  Status: Normal fuel consumption
  Theft Amount: ${tripData.theftAmount.toFixed(1)} ${fuelDisplayUnit}
  Theft Percentage: ${tripData.theftPercentage.toFixed(1)}%
`;
  }

  report += `
ODOMETER READINGS
  Start Odometer: ${tripData.startOdometer.toLocaleString()} ${distanceUnit}
  End Odometer: ${tripData.endOdometer.toLocaleString()} ${distanceUnit}
  Distance Calculated: ${Math.round(tripData.distance)} ${distanceUnit}

FUEL LEVEL ANALYSIS
  Fuel Before Fill: ${tripData.remainingFuelBeforeFill.toFixed(1)} ${fuelDisplayUnit}
  Fuel Added: ${tripData.actualFuelConsumed.toFixed(1)} ${fuelDisplayUnit}
  Fuel After Fill: ${tripData.tankCapacity} ${fuelDisplayUnit} (100%)
  Fill Percentage: ${tripData.fillPercentage.toFixed(0)}%

═══════════════════════════════════════════════════════════════
  Generated by Fuel Guard
  ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════
`;

  return report;
};

export default {
  exportToPDF,
  exportToExcel,
  exportTripsToCSV,
  exportTankToTankTripToPDF,
  exportTankToTankTripsToPDF,
  exportTankToTankToExcel,
  exportSingleTankToTankToExcel,
  generateTankToTankTextReport,
};
