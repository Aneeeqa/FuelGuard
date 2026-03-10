/**
 * TankToTankTripCard Demo Component
 *
 * This file demonstrates how to use the TankToTankTripCard component
 * with various scenarios (normal, theft warning, critical theft)
 */

import TankToTankTripCard from '../components/TankToTankTripCard';

/**
 * Demo Component showing different Tank-to-Tank scenarios
 */
const TankToTankTripCardDemo = () => {
  // Sample vehicle profile
  const vehicleProfile = {
    tankCapacity: 100,
    expectedMileage: 15,
    theftThreshold: 25
  };

  // Sample units
  const units = {
    distanceUnit: 'km',
    fuelVolumeUnit: 'L'
  };

  // Sample trip data - Normal scenario
  const normalTripData = {
    isValid: true,
    tankCapacity: 100,
    remainingFuelBeforeFill: 20,
    fillPercentage: 80,
    actualFuelConsumed: 80,
    expectedFuelConsumed: 75,
    fuelDifference: 5,
    theftAmount: 0,
    theftPercentage: 0,
    isTheftSuspected: false,
    distance: 1125,
    actualMileage: 14.06,
    expectedMileage: 15,
    mileageEfficiency: 93.75,
    startDate: '2020-01-15T10:00:00Z',
    endDate: '2020-01-20T14:30:00Z',
    startOdometer: 15000,
    endOdometer: 16125,
    duration: 436500000,
    durationDays: 5,
    previousFullFillLogId: 'log-1',
    currentLogId: 'log-2',
    calculatedAt: '2020-01-24T10:30:00Z',
    theftThreshold: 25
  };

  // Sample trip data - Theft warning scenario
  const warningTripData = {
    isValid: true,
    tankCapacity: 100,
    remainingFuelBeforeFill: 64,
    fillPercentage: 36,
    actualFuelConsumed: 36,
    expectedFuelConsumed: 13.33,
    fuelDifference: 22.67,
    theftAmount: 22.67,
    theftPercentage: 63,
    isTheftSuspected: true,
    distance: 200,
    actualMileage: 5.56,
    expectedMileage: 15,
    mileageEfficiency: 37,
    startDate: '2020-01-20T10:00:00Z',
    endDate: '2020-01-24T14:30:00Z',
    startOdometer: 15000,
    endOdometer: 15200,
    duration: 350100000,
    durationDays: 4,
    previousFullFillLogId: 'log-1',
    currentLogId: 'log-3',
    calculatedAt: '2020-01-24T14:30:00Z',
    theftThreshold: 25
  };

  // Sample trip data - Critical theft scenario
  const criticalTripData = {
    isValid: true,
    tankCapacity: 50,
    remainingFuelBeforeFill: 30,
    fillPercentage: 40,
    actualFuelConsumed: 40,
    expectedFuelConsumed: 10,
    fuelDifference: 30,
    theftAmount: 30,
    theftPercentage: 75,
    isTheftSuspected: true,
    distance: 150,
    actualMileage: 3.75,
    expectedMileage: 15,
    mileageEfficiency: 25,
    startDate: '2020-01-10T08:00:00Z',
    endDate: '2020-01-15T16:00:00Z',
    startOdometer: 10000,
    endOdometer: 10150,
    duration: 432000000,
    durationDays: 5,
    previousFullFillLogId: 'log-1',
    currentLogId: 'log-4',
    calculatedAt: '2020-01-15T16:00:00Z',
    theftThreshold: 25
  };

  // Handle view details
  const handleViewDetails = (tripData) => {
    console.log('View Details:', tripData);
    alert(`Viewing details for trip:\n${JSON.stringify(tripData, null, 2)}`);
  };

  // Handle export report
  const handleExportReport = (tripData) => {
    console.log('Export Report:', tripData);
    alert('Exporting report for trip...');
  };

  // Handle copy report
  const handleCopyReport = (tripData) => {
    console.log('Copy Report:', tripData);
    alert('Copying report to clipboard...');
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Tank-to-Tank Trip Card Demo</h1>

      {/* Normal Scenario */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Normal Consumption Scenario</h2>
        <TankToTankTripCard
          tripData={normalTripData}
          vehicleProfile={vehicleProfile}
          units={units}
          currency="USD"
          pricePerLiter={3.33}
          onViewDetails={handleViewDetails}
          onExportReport={handleExportReport}
          onCopyReport={handleCopyReport}
        />
      </div>

      {/* Warning Scenario */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Theft Warning Scenario (63% deviation)</h2>
        <TankToTankTripCard
          tripData={warningTripData}
          vehicleProfile={vehicleProfile}
          units={units}
          currency="USD"
          pricePerLiter={3.33}
          onViewDetails={handleViewDetails}
          onExportReport={handleExportReport}
          onCopyReport={handleCopyReport}
        />
      </div>

      {/* Critical Scenario */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Critical Theft Scenario (75% deviation)</h2>
        <TankToTankTripCard
          tripData={criticalTripData}
          vehicleProfile={vehicleProfile}
          units={units}
          currency="USD"
          pricePerLiter={3.33}
          onViewDetails={handleViewDetails}
          onExportReport={handleExportReport}
          onCopyReport={handleCopyReport}
        />
      </div>

      {/* Invalid Data Scenario */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Invalid Data Scenario</h2>
        <TankToTankTripCard
          tripData={{
            isValid: false,
            message: 'This is the first full tank fill. Cannot calculate consumption yet.'
          }}
          vehicleProfile={vehicleProfile}
          units={units}
        />
      </div>
    </div>
  );
};

export default TankToTankTripCardDemo;
