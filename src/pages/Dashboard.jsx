import { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import {
  Droplet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Route,
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
import TankToTankTripCard from '../components/TankToTankTripCard';

const Dashboard = () => {
  const { data, loading } = useFuelData();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState({
    theft: false,
    drain: false,
    fuelLevel: false,
    budget: false
  });

  const { logs, stats } = data;
  const flaggedCount = logs.filter((log) => log.isFlagged).length;

  // Analyze fuel drain – pass tank capacity and expected mileage so both
  // gauge-based and mileage-based strategies have the data they need.
  const drainAnalysis = analyzeFuelDrain(
    logs || [],
    data.vehicleProfile?.tankCapacity || 50,
    data.vehicleProfile?.expectedMileage || stats?.avgMileage || 15
  );

  // Calculate trips (trip-wise mileage analysis) - MUST be before loading check
  const trips = useMemo(() => {
    return calculateTrips(logs || [], data.vehicleProfile || {});
  }, [logs, data.vehicleProfile]);

  // Get last trip for summary
  const lastTrip = trips.length > 0 ? trips[0] : null;

  // Calculate trip statistics - MUST be before loading check
  const tripStats = useMemo(() => {
    return calculateTripStatistics(trips);
  }, [trips]);

  // ========================================
  // NEW: Tank-to-Tank Analysis (Task 8)
  // ========================================
  const tankToTankTrips = useMemo(() => {
    return data.vehicleProfile?.tankToTankTrips || [];
  }, [data.vehicleProfile?.tankToTankTrips]);

  const lastTankToTankTrip = tankToTankTrips.length > 0 ? tankToTankTrips[0] : null;
  const tankToTankStats = useMemo(() => {
    return calculateTankToTankStatistics(tankToTankTrips);
  }, [tankToTankTrips]);

  // Calculate price per liter for theft cost calculation
  const pricePerLiter = useMemo(() => {
    if (logs.length > 0 && logs[0].price && logs[0].liters) {
      return logs[0].price / logs[0].liters;
    }
    return 0;
  }, [logs]);

  // Calculate fuel level status - MUST be before loading check
  const lastFuelLog = logs.length > 0 ? logs[0] : null;
  const currentFuelAmount = lastFuelLog ? lastFuelLog.liters : 0;
  const fuelLevelAnalysis = getFuelStatus(
    currentFuelAmount,
    data.vehicleProfile?.tankCapacity || 50,
    data.stats?.avgMileage || 15
  );

  // Get currency symbol from vehicle profile
  const currencySymbol = getCurrencySymbol(data.vehicleProfile?.currency || 'USD');
  const fuelUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';
  const distanceUnit = data.vehicleProfile?.distanceUnit || 'km';
  const efficiencyUnit = data.vehicleProfile?.efficiencyUnit || 'km/L';
  const fuelDisplayUnit = fuelUnit;
  const vehicleProfile = data.vehicleProfile || {};

  // Calculate cost statistics - MUST be before loading check
  const costStats = getCostStatistics(logs || [], vehicleProfile?.currency || 'USD');

  // Calculate monthly budget and expenditure - MUST be before loading check
  const monthlyBudget = vehicleProfile?.monthlyBudget || 200;
  const currentMonthExpenditure = logs
    ? logs.reduce((sum, log) => {
        const logDate = new Date(log.date);
        const now = new Date();
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear()
          ? sum + (log.price || 0)
          : sum;
      }, 0)
    : 0;
  const budgetAlert = checkBudgetAlert(currentMonthExpenditure, monthlyBudget);
  const monthlyBudgetAlert = budgetAlert;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Show empty state if no logs exist
  if (!logs || logs.length === 0) {
    return <EmptyDashboardState />;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Dashboard
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-muted)' }}>
            Your fuel efficiency overview
          </p>
        </div>
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: 'var(--accent-alert)',
            color: 'white',
            boxShadow: 'var(--shadow-glow-red)',
          }}
          aria-label="Emergency Contact"
        >
          <Phone size={20} weight="duotone" color="white" />
          <span className="hidden sm:inline">Emergency</span>
        </button>
      </div>

      {/* Alert Banner - Hidden on mobile (shown in notifications) */}
      {flaggedCount > 0 && !dismissedAlerts.theft && (
        <div className="hidden lg:block animate-fade-in-up delay-100">
          <Alert
            variant="danger"
            title={`${flaggedCount} Potential Theft${flaggedCount > 1 ? 's' : ''} Detected`}
            dismissible
            onDismiss={() => setDismissedAlerts(prev => ({ ...prev, theft: true }))}
          >
            Unusual mileage drops found. Check your history for details.
          </Alert>
        </div>
      )}

      {/* Fuel Drain Alert Banner - Hidden on mobile (shown in notifications) */}
      {drainAnalysis.hasAlert && !dismissedAlerts.drain && (
        <div className="hidden lg:block animate-fade-in-up delay-100">
          <Alert
            variant="warning"
            title="Abnormal Fuel Drain Detected"
            dismissible
            onDismiss={() => setDismissedAlerts(prev => ({ ...prev, drain: true }))}
          >
            {generateDrainAlertMessage(drainAnalysis.latestDrain)}
          </Alert>
        </div>
      )}

      {/* Fuel Level Alert Banner - Hidden on mobile (shown in notifications) */}
      {fuelLevelAnalysis.fuelAlert.triggered && !dismissedAlerts.fuelLevel && (
        <div className="hidden lg:block animate-fade-in-up delay-100">
          <Alert
            variant={fuelLevelAnalysis.fuelAlert.severity === 'critical' ? 'danger' : 'warning'}
            title={fuelLevelAnalysis.fuelAlert.severity === 'critical' ? 'Critical Fuel Level!' : 'Low Fuel Warning'}
            dismissible
            onDismiss={() => setDismissedAlerts(prev => ({ ...prev, fuelLevel: true }))}
          >
            <div className="flex items-center gap-2">
              <span>{fuelLevelAnalysis.fuelAlert.message}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                ({fuelLevelAnalysis.distanceEstimate.message})
              </span>
            </div>
          </Alert>
        </div>
      )}

       {/* Desktop: Two-column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Stats + Chart Column */}
        <div className="lg:col-span-2 space-y-6">
           {/* Stats Grid - Using StatCard component */}
          <div className="flex flex-row sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory px-4 sm:px-0 -mx-4 sm:mx-0 gap-4 sm:gap-4" style={{
            scrollPaddingLeft: '1rem',
            scrollPaddingRight: 'calc(100% - 1rem - 80px)',
            MsOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitScrollbarDisplay: 'none',
          }}>
            {/* Cost Cards - Using actual data */}
              <div className="animate-fade-in-up delay-100 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
                <StatCard
                  icon={DollarSign}
                  label="Total Spent"
                  value={(costStats?.totalExpenditure || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  unit={currencySymbol}
                  gradientId={0}
                />
              </div>

              <div className="animate-fade-in-up delay-200 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
                <StatCard
                  icon={Wallet}
                  label="Cost/Km"
                  value={(costStats?.costPerKm || 0).toFixed(3)}
                  unit={currencySymbol}
                  gradientId={1}
                />
              </div>

               <div className="animate-fade-in-up delay-300 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
                <StatCard
                  icon={TrendingUp}
                  label="Avg Mileage"
                  value={(stats?.avgMileage || 0).toFixed(1)}
                  unit={efficiencyUnit}
                  gradientId={2}
                />
               </div>

              <div className="animate-fade-in-up delay-200 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
                <StatCard
                  icon={Droplet}
                  label="Total Fuel"
                  value={(stats?.totalFuel || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  unit={fuelDisplayUnit}
                  gradientId={3}
                />
              </div>

              <div className="animate-fade-in-up delay-300 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
                <StatCard
                  icon={Route}
                  label="Distance"
                  value={(stats?.totalDistance || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  unit={distanceUnit}
                  gradientId={4}
                />
              </div>

            <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
              <StatCard
                icon={Flame}
                label="Excess Fuel"
                value={drainAnalysis?.totalLostFuel > 0
                  ? drainAnalysis.totalLostFuel.toFixed(1)
                  : '0.0'}
                unit={drainAnalysis?.totalLostFuel > 0 ? fuelDisplayUnit : 'Normal'}
                gradientId={5}
                trend={drainAnalysis?.hasAlert
                  ? { direction: 'up', value: `⚠ ${drainAnalysis.abnormalDrains}` }
                  : undefined}
              />
            </div>

            <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
              <StatCard
                icon={AlertTriangle}
                label="Alerts"
                value={flaggedCount.toString()}
                unit="flagged"
                gradientId={6}
                trend={flaggedCount > 0 ? { direction: 'up', value: flaggedCount } : undefined}
              />
            </div>

            <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
              <StatCard
                icon={DollarSign}
                label="Budget"
                value={Math.round((currentMonthExpenditure / monthlyBudget) * 100).toString()}
                unit="%"
                gradientId={7}
                trend={budgetAlert?.triggered ? { direction: 'up', value: '⚠' } : undefined}
              />
            </div>
           <div className="flex-shrink-0 w-12 sm:hidden"></div>
            </div>

            {/* Trip Analysis Section - NEW */}
            {trips.length > 0 && (
              <div className="animate-fade-in-up delay-500 space-y-6">
                {/* Last Trip Summary Card */}
                <LastTripSummary trip={lastTrip} vehicleProfile={data.vehicleProfile} />

                {/* Trip Mileage Bar Chart */}
                <Card variant="elevated" interactive>
                  <div className="p-4">
                    <TripMileageBarChart trips={trips} vehicleProfile={data.vehicleProfile} />
                  </div>
                </Card>
              </div>
            )}

            {/* ========================================
                NEW: Tank-to-Tank Analysis Section (Task 8)
                ======================================== */}
            {tankToTankTrips.length > 0 && (
              <div className="animate-fade-in-up delay-500 space-y-6">
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: 'color-mix(in srgb, #8b5cf6 15%, transparent)',
                    }}
                  >
                    <Route size={16} weight="duotone" className="text-[#8b5cf6]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                      Tank-to-Tank Analysis
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Accurate fuel consumption tracking with full tank measurements
                    </p>
                  </div>
                </div>

                {/* Last Tank-to-Tank Trip Card */}
                {lastTankToTankTrip && (
                  <TankToTankTripCard
                    tripData={lastTankToTankTrip}
                    vehicleProfile={data.vehicleProfile}
                    currency={vehicleProfile?.currency || 'USD'}
                    pricePerLiter={pricePerLiter}
                    units={{
                      distanceUnit: distanceUnit,
                      fuelVolumeUnit: fuelDisplayUnit
                    }}
                  />
                )}

                {/* Tank-to-Tank Statistics Summary */}
                <Card variant="elevated" interactive>
                  <div className="p-4">
                    <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <AlertTriangle size={16} className="text-[#8b5cf6]" />
                      Tank-to-Tank Statistics
                    </h4>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Total Trips */}
                      <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
                          {tankToTankStats.count}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                          Full-Tank Trips
                        </div>
                      </div>

                      {/* Average Distance */}
                      <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
                          {tankToTankStats.avgDistance}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                          Avg Distance ({distanceUnit})
                        </div>
                      </div>

                      {/* Average Fuel Consumption */}
                      <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
                          {tankToTankStats.avgFuelConsumed}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                          Avg Fuel ({fuelDisplayUnit})
                        </div>
                      </div>

                      {/* Theft Incidents */}
                      <div className="text-center p-3 rounded-xl" style={{
                        backgroundColor: tankToTankStats.theftIncidents > 0
                          ? 'color-mix(in srgb, var(--accent-alert) 15%, transparent)'
                          : 'color-mix(in srgb, var(--accent-success) 15%, transparent)'
                      }}>
                        <div className="text-2xl font-bold tabular-nums" style={{
                          color: tankToTankStats.theftIncidents > 0
                            ? 'var(--accent-alert)'
                            : 'var(--accent-success)'
                        }}>
                          {tankToTankStats.theftIncidents}
                        </div>
                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
                          Theft Incidents
                        </div>
                      </div>
                    </div>

                    {/* Theft Summary */}
                    {tankToTankStats.totalTheftAmount > 0 && (
                      <div className="mt-4 p-4 rounded-xl" style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
                        border: '1px solid var(--accent-alert)'
                      }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                              Total Fuel Stolen Across All Trips
                            </div>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xl font-bold tabular-nums" style={{ color: 'var(--accent-alert)' }}>
                                {tankToTankStats.totalTheftAmount} {fuelDisplayUnit}
                              </span>
                              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                ({tankToTankStats.theftPercentage}% of total fuel)
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                              Estimated Loss
                            </div>
                            <div className="text-xl font-bold tabular-nums mt-1" style={{ color: 'var(--accent-alert)' }}>
                              {currencySymbol}{(tankToTankStats.totalTheftAmount * pricePerLiter).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* No Theft Message */}
                    {tankToTankStats.totalTheftAmount === 0 && tankToTankStats.count > 0 && (
                      <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{
                        backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
                        border: '1px solid var(--accent-success)'
                      }}>
                        <CheckCircle size={24} weight="fill" style={{ color: 'var(--accent-success)' }} />
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--accent-success)' }}>
                            No fuel theft detected!
                          </div>
                          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                            All {tankToTankStats.count} tank-to-tank trips show normal fuel consumption.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

           {/* Mileage Chart */}
           {logs.length > 1 && (
             <div className="animate-fade-in-up delay-600">
               <Card variant="elevated" interactive>
                 <Card.Header>
                   <Card.Title>Mileage Trend</Card.Title>
                   <Card.Subtitle>Track your fuel efficiency over time</Card.Subtitle>
                 </Card.Header>
                 <div className="pt-4">
                   <MileageChart data={logs} efficiencyUnit={efficiencyUnit} />
                 </div>
               </Card>
             </div>
           )}

          {/* Budget Card */}
          <BudgetCard
            logs={logs}
            monthlyBudget={monthlyBudget}
            currency={vehicleProfile?.currency || 'USD'}
          />
          {/* Budget Alert Banner - Hidden on mobile (shown in notifications) */}
          {(budgetAlert.triggered || monthlyBudgetAlert.triggered) && !dismissedAlerts.budget && (
            <div className="hidden lg:block animate-fade-in-up delay-50">
              <Alert
                variant={monthlyBudgetAlert.level === 'critical' ? 'danger' : 'warning'}
                title={monthlyBudgetAlert.level === 'critical' ? 'Budget Exceeded!' : 'Budget Warning'}
                dismissible
                onDismiss={() => setDismissedAlerts(prev => ({ ...prev, budget: true }))}
              >
                {monthlyBudgetAlert.message}
              </Alert>
            </div>
          )}

          {/* Carbon Footprint Section */}
          {logs.length > 0 && (
            <div className="space-y-6 animate-fade-in-up delay-600">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
                  }}
                >
                  <Leaf size={16} weight="duotone" className="text-success-500" color="#22c55e" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Carbon Footprint
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Monitor your environmental impact
                  </p>
                </div>
              </div>

              {/* Carbon Footprint Card */}
              <CarbonFootprintCard
                logs={logs}
                totalCO2={stats.totalCO2}
                totalDistance={stats.totalDistance}
                co2PerKm={stats.co2PerKm}
                fuelType={data.vehicleProfile?.fuelType || 'gasoline'}
                vehicleType={data.vehicleProfile?.make?.toLowerCase()?.includes('suv')
                  ? 'suv'
                  : data.vehicleProfile?.make?.toLowerCase()?.includes('truck')
                  ? 'truck'
                  : 'sedan'}
              />

              {/* Carbon Chart */}
              {stats.monthlyCO2 && stats.monthlyCO2.length > 0 && (
                <Card variant="elevated" interactive>
                  <Card.Header>
                    <Card.Title>CO₂ Emissions Trend</Card.Title>
                    <Card.Subtitle>Monthly carbon emissions over time</Card.Subtitle>
                  </Card.Header>
                  <div className="pt-4">
                    <CarbonChart
                      data={stats.monthlyCO2}
                      fuelType={data.vehicleProfile?.fuelType || 'gasoline'}
                    />
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* EPA Mileage Comparison - Only shows if EPA data is available */}
          <MileageComparison
            userAverage={stats.avgMileage}
            epaRating={data.vehicleProfile?.epaCombined}
            vehicleId={data.vehicleProfile?.vehicleId}
            vehicleName={data.vehicleProfile?.name}
            efficiencyUnit={efficiencyUnit}
          />
        </div>

        {/* Recent Entries Column */}
        <div className="mt-6 lg:mt-0 animate-fade-in-up delay-500">
          <Card variant="elevated" padding="none">
            <div
              className="p-4 border-b transition-colors duration-300"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                Recent Entries
              </h2>
            </div>
            <div
              className="divide-y max-h-[500px] overflow-y-auto scrollbar-smooth"
              style={{ borderColor: 'var(--border-color)' }}
            >
              {logs.slice(0, 5).map((log, index) => (
                <div
                  key={log.id}
                  className="p-4 flex justify-between items-center transition-all duration-200 hover:bg-[var(--bg-primary)] active-lift"
                  style={{
                    backgroundColor: log.isFlagged
                      ? 'color-mix(in srgb, var(--accent-alert) 10%, transparent)'
                      : 'transparent',
                    borderColor: 'var(--border-color)',
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div>
                      <p className="font-bold text-lg tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: '700' }}>
                        {fuelDisplayUnit === 'gal' ? ((log.liters || 0) * 0.264172).toFixed(1) : (log.liters || 0)}{fuelDisplayUnit} @ {(log.odometer || 0).toLocaleString()} {distanceUnit}
                      </p>
                     <p className="text-xs" style={{ color: '#64748B', fontWeight: '400' }}>
                       {new Date(log.date).toLocaleDateString('en-US', {
                         weekday: 'short',
                         month: 'short',
                         day: 'numeric',
                       })}
                       {log.pumpName && ` · ${log.pumpName}`}
                     </p>
                   </div>
                  <div className="text-right">
                    <p
                      className="font-bold text-xl tabular-nums"
                      style={{
                        color: log.isFlagged
                          ? 'var(--accent-alert)'
                          : 'var(--accent-blue)'
                      }}
                    >
                      {(log.mileage || 0).toFixed(1)}
                     </p>
                     <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                       {efficiencyUnit}
                     </span>
                   {log.isFlagged && (
                      <div className="mt-1 flex items-center gap-1 justify-end">
                        <AlertTriangle size={12} weight="fill" style={{ color: 'var(--accent-alert)' }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--accent-alert)' }}>
                          Alert
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {logs.length > 5 && (
              <a
                href="/history"
                className="block p-4 text-center font-semibold transition-colors hover:bg-[var(--bg-primary)] active-lift"
                style={{ color: 'var(--accent-blue)' }}
              >
                View All History →
              </a>
            )}
          </Card>
        </div>
      </div>

      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <EmergencyContact onClose={() => setShowEmergencyModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;
