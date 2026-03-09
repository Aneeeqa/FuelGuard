import { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import {
  Droplet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Route,
  Zap,
  Leaf,
  DollarSign,
  Wallet,
  Phone,
  Star,
  Settings,
  AlertCircle,
  Flame
} from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import StatCard from '../components/dashboard/StatCard';
import MileageChart from '../components/dashboard/MileageChart';
import MileageComparison from '../components/dashboard/MileageComparison';
import CarbonFootprintCard from '../components/dashboard/CarbonFootprintCard';
import CarbonChart from '../components/dashboard/CarbonChart';
import BudgetCard from '../components/dashboard/BudgetCard';
import TripMileageBarChart from '../components/dashboard/TripMileageBarChart';
import LastTripSummary from '../components/dashboard/LastTripSummary';
import EmptyDashboardState from '../components/dashboard/EmptyDashboardState';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';
import EmergencyContact from '../components/EmergencyContact';
import {
  calculateTotalExpenditure,
  calculateCostPerKm,
  checkBudgetAlert,
  getCostStatistics
} from '../utils/calculations';
import { getCurrencySymbol } from '../utils/currency';
import { analyzeFuelDrain, generateDrainAlertMessage, formatDrainRate } from '../utils/fuelDrainCalculator';
import { getFuelStatus } from '../utils/fuelLevelAlerts';
import { calculateTrips, calculateTripStatistics } from '../utils/tripCalculations';
import { calculateTankToTankStatistics } from '../utils/tankToTankCalculations';

const Dashboard = () => {
  const { data, loading } = useFuelData();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState({
    theft: false,
    drain: false,
    fuelLevel: false,
    budget: false,
  });

  const { logs, stats } = data;
  const flaggedCount = logs.filter((log) => log.isFlagged).length;

  const drainAnalysis = analyzeFuelDrain(logs || [], data.vehicleProfile?.tankCapacity);

  const trips = useMemo(() => {
    return calculateTrips(logs || [], data.vehicleProfile || {});
  }, [logs, data.vehicleProfile]);

  const lastTrip = trips.length > 0 ? trips[0] : null;

  const tripStats = useMemo(() => {
    return calculateTripStatistics(trips);
  }, [trips]);

  const tankToTankTrips = useMemo(() => {
    return data.vehicleProfile?.tankToTankTrips || [];
  }, [data.vehicleProfile]);

  const lastTankToTankTrip = tankToTankTrips.length > 0 ? tankToTankTrips[0] : null;

  const tankToTankStats = useMemo(() => {
    return calculateTankToTankStatistics(tankToTankTrips);
  }, [tankToTankTrips]);

  const pricePerLiter = useMemo(() => {
    if (logs.length > 0 && logs[0].price && logs[0].liters) {
      return logs[0].price / logs[0].liters;
    }
    return 0;
  }, [logs]);

  const lastFuelLog = logs.length > 0 ? logs[0] : null;
  const currentFuelAmount = lastFuelLog ? lastFuelLog.liters : 0;

  const fuelLevelAnalysis = getFuelStatus(
    currentFuelAmount,
    data.vehicleProfile?.tankCapacity || 50,
    data.stats?.avgMileage || 15
  );

  const budgetAlert = checkBudgetAlert(stats.monthlyBudget || 200, stats.totalExpenditure);

  const dismissAlert = (alertType) => {
    setDismissedAlerts(prev => ({ ...prev, [alertType]: false }));
    setTimeout(() => setDismissedAlerts({ ...prev, [alertType]: true }), 3000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {(!loading && logs.length > 0) ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Average Mileage"
              icon="Droplet"
              value={`${stats.avgMileage.toFixed(1)} ${data.vehicleProfile?.efficiencyUnit || 'km/L'}`}
              change={`${Math.round((stats.avgMileage / (data.vehicleProfile?.expectedMileage || 15))}`}
            />
            <StatCard
              title="Total Fuel Used"
              icon="Fuel"
              value={`${stats.totalFuel.toFixed(0)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
              icon="Droplet"
              change={`${(stats.totalFuel / logs.length).toFixed(1)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
            />

            <CarbonFootprintCard />
            <BudgetCard budgetAlert={budgetAlert} />
         </div>

      ) : (
        <EmptyDashboardState />
      )}

      {(!loading && logs.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-4 gap-4">
             <StatCard
                title="Total Entries"
                icon="FileText"
                value={logs.length}
                change={logs.length}
             />
             <StatCard
                title="Theft Alerts"
                icon="AlertTriangle"
                value={flaggedCount}
                change={flaggedCount}
             />
             <StatCard
                title="Total Distance"
                icon="Route"
                value={`${Math.round(stats.totalDistance)} ${data.vehicleProfile?.distanceUnit || 'km'}`}
                change={Math.round(stats.totalDistance / (logs.length || 1) * 50)}
             />
             <StatCard
                title="Total Cost"
                icon="Wallet"
                value={`${getCurrencySymbol(data.vehicleProfile?.currency || '$')}${stats.totalExpenditure.toFixed(2)}`}
                change={`${getCurrencySymbol(data.vehicleProfile?.currency || '$')}${(stats.costPerKm || 0).toFixed(4)}/${data.vehicleProfile?.distanceUnit || 'km'}`}
             />

             <BudgetCard budgetAlert={budgetAlert} />

             <TripMileageBarChart trips={trips} />

             <div className="col-span-2">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Recent Mileage Trends
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                     Track your mileage over recent trips
                  </p>
                </div>

                <LastTripSummary trip={lastTrip} />
             </div>

             <div className="col-span-2">
                <div className="mb-6">
                   <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                     Tank-to-Tank Analysis
                   </h2>
                   <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                     Monitor fuel theft between full tank fills
                   </p>
                </div>

                {tankToTankStats.totalTrips > 0 && (
                  <>
                     <StatCard
                        title="Tank-to-Tank Trips"
                        icon="Zap"
                        value={tankToTankStats.totalTrips}
                        change={tankToTankStats.totalTrips}
                     />
                     <StatCard
                        title="Avg. Mileage"
                        icon="Droplet"
                        value={`${tankToTankStats.avgActualMileage.toFixed(2)} ${data.vehicleProfile?.efficiencyUnit || 'km/L'}`}
                        change={tankToTankStats.avgActualMileage / (data.vehicleProfile?.expectedMileage || 15)}
                     />
                     <StatCard
                        title="Avg. Fuel/Trip"
                        icon="Droplet"
                        value={`${tankToTankStats.avgFuelConsumed.toFixed(1)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
                        change={(tankToTankStats.avgFuelConsumed / tankToTankStats.totalTrips).toFixed(1)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
                     />

                     <StatCard
                        title="Theft Alerts"
                        icon="AlertTriangle"
                        value={tankToTankStats.theftAlertTrips}
                        change={tankToTankStats.theftAlertTrips}
                     />

                     {tankToTankStats.totalFuelConsumed > 0 && (
                        <StatCard
                             title="Fuel Stolen"
                             icon="Flame"
                             value={`${tankToTankStats.totalFuelConsumed.toFixed(1)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
                             change={tankToTankStats.totalFuelConsumed}
                             change={(tankToTankStats.totalFuelConsumed * (100 / tankToTankStats.totalFuelConsumed || 1) * 100)}
                             iconColor="red"
                        />
                     )}

                     <div className="mt-6">
                        <LastTripSummary trip={lastTankToTankTrip} />
                     </div>
                  </>
                )}

                <MileageComparison stats={stats} />
                <CarbonChart />
                <CarbonFootprintCard />
             </div>
          </div>
        )}
     </div>

     {(!loading && logs.length > 0 && lastFuelLog && (
        <>
           <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <StatCard
                    title="Current Fuel Level"
                    icon="Droplet"
                    value={`${currentFuelAmount.toFixed(1)} ${data.vehicleProfile?.fuelVolumeUnit || 'L'}`}
                    change={`${Math.round((currentFuelAmount / (data.vehicleProfile?.tankCapacity || 50) * 100)}%`}
                    level={fuelLevelAnalysis.level}
                 />

                 <div className="col-span-2">
                    <FuelLevelDisplay tankCapacity={data.vehicleProfile?.tankCapacity || 50} />
                 />
                 <div className="mt-4">
                    {fuelLevelAnalysis.needsRefill && (
                       <Alert
                          title="Low Fuel Alert"
                          message={fuelLevelAnalysis.message}
                          severity={fuelLevelAnalysis.level}
                       />
                    )}
                 </div>
              </div>

              <EmergencyContact />
           </div>
        )}

        {loading && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-24 w-full" />
           </div>
        )}
     </>
  );
};

export default Dashboard;
