import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Drop, TrendUp, Warning, Path, Lightning, Leaf, CurrencyDollar, Wallet, Phone, DropHalf } from '@phosphor-icons/react';
import Skeleton from '../components/ui/Skeleton';
import StatCard from '../components/dashboard/StatCard';
import MileageChart from '../components/dashboard/MileageChart';
import MileageComparison from '../components/dashboard/MileageComparison';
import CarbonFootprintCard from '../components/dashboard/CarbonFootprintCard';
import CarbonChart from '../components/dashboard/CarbonChart';
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

const Dashboard = () => {
  const { data, loading } = useFuelData();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState({
    theft: false,
    drain: false,
    fuelLevel: false,
    budget: false
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { logs, stats } = data;
  const flaggedCount = logs.filter((log) => log.isFlagged).length;

  const drainAnalysis = analyzeFuelDrain(logs || [], data.vehicleProfile?.tankCapacity);

  const lastFuelLog = logs.length > 0 ? logs[0] : null;
  const currentFuelAmount = lastFuelLog ? lastFuelLog.liters : 0;
  const fuelLevelAnalysis = getFuelStatus(
    currentFuelAmount,
    data.vehicleProfile?.tankCapacity || 50,
    data.stats?.avgMileage || 15
  );

  const currency = data.vehicleProfile?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const fuelVolumeUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';
  const distanceUnit = data.vehicleProfile?.distanceUnit || 'km';
  const efficiencyUnit = fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';
  const fuelDisplayUnit = fuelVolumeUnit === 'gal' ? 'gal' : 'L';

  const costStats = getCostStatistics(logs, currencySymbol);
  const { vehicleProfile } = data;
  const monthlyBudget = vehicleProfile?.monthlyBudget || 200;

  const budgetAlert = checkBudgetAlert(costStats.totalExpenditure, monthlyBudget);
  const currentDate = new Date();
  const currentMonthExpenditure = logs
    .filter(log => {
      const logDate = new Date(log.date);
      return logDate.getMonth() === currentDate.getMonth() &&
             logDate.getFullYear() === currentDate.getFullYear();
    })
    .reduce((sum, log) => sum + (log.price || 0), 0);
  const monthlyBudgetAlert = checkBudgetAlert(currentMonthExpenditure, monthlyBudget);

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-bounce"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Drop size={48} weight="duotone" color="white" />
        </div>
        <h1 className="text-2xl font-bold mb-3 animate-fade-in-up" style={{ color: 'var(--text-primary)' }}>
          Welcome to Fuel Guard
        </h1>
        <p className="mb-8 max-w-md text-lg animate-fade-in-up delay-200" style={{ color: 'var(--text-secondary)' }}>
          Start tracking your fuel consumption to detect anomalies and prevent theft.
        </p>
        <a
          href="/add"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl min-h-[56px] transition-all duration-300 hover-lift active-scale animate-fade-in-up delay-300"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Lightning size={20} weight="duotone" color="white" />
          Add Your First Entry
        </a>
        <p className="text-sm mt-4 animate-fade-in delay-400" style={{ color: 'var(--text-muted)' }}>
          Or go to <a href="/settings" className="underline font-medium hover-lift" style={{ color: 'var(--accent-blue)' }}>Settings</a> to load demo data
        </p>
      </div>
    );
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

          {/* Stats Grid - Using StatCard component */}
          <div className="flex flex-row sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory px-4 sm:px-0 -mx-4 sm:mx-0 gap-4 sm:gap-4" style={{
            scrollPaddingLeft: '1rem',
            scrollPaddingRight: 'calc(100% - 1rem - 80px)',
            MsOverflowStyle: 'none',
            scrollbarWidth: 'none',
            WebkitScrollbarDisplay: 'none',
          }}>
            {/* Cost Cards - New */}
             <div className="animate-fade-in-up delay-100 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
               <StatCard
                 icon={CurrencyDollar}
                 label="Total Spent"
                 value="1,250"
                 unit="$"
                 gradientId={0}
               />
             </div>

             <div className="animate-fade-in-up delay-200 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
               <StatCard
                 icon={Wallet}
                 label="Cost/Km"
                 value="0.12"
                 unit="$"
                 gradientId={1}
               />
             </div>

              <div className="animate-fade-in-up delay-300 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
               <StatCard
                 icon={TrendUp}
                 label="Avg Mileage"
                 value="18.5"
                 unit="km/L"
                 gradientId={2}
               />
              </div>

             <div className="animate-fade-in-up delay-200 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
               <StatCard
                 icon={Drop}
                 label="Total Fuel"
                 value="245"
                 unit="L"
                 gradientId={3}
               />
             </div>

             <div className="animate-fade-in-up delay-300 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
               <StatCard
                 icon={Path}
                 label="Distance"
                 value="12,450"
                 unit="km"
                 gradientId={4}
               />
             </div>

           <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
             <StatCard
               icon={DropHalf}
               label="Fuel Drain"
               value="0.5"
               unit="L/day"
               gradientId={5}
             />
           </div>

           <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
             <StatCard
               icon={Warning}
               label="Alerts"
               value="0"
               unit="flagged"
               gradientId={6}
             />
           </div>

           <div className="animate-fade-in-up delay-400 snap-center flex-shrink-0 min-w-[160px] sm:min-w-0 w-[160px] sm:w-auto">
             <StatCard
               icon={CurrencyDollar}
               label="Budget"
               value="62"
               unit="%"
               gradientId={7}
             />
           </div>
           <div className="flex-shrink-0 w-12 sm:hidden"></div>
           </div>

          {/* Mileage Chart */}
          {logs.length > 1 && (
            <div className="animate-fade-in-up delay-500">
              <Card variant="elevated" interactive>
                <Card.Header>
                  <Card.Title>Mileage Trend</Card.Title>
                  <Card.Subtitle>Track your fuel efficiency over time</Card.Subtitle>
                </Card.Header>
                <div className="pt-4">
                  <MileageChart data={logs} />
                </div>
              </Card>
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
                        {fuelDisplayUnit === 'gal' ? (log.liters * 0.264172).toFixed(1) : log.liters}{fuelDisplayUnit} @ {log.odometer.toLocaleString()} {distanceUnit}
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
                      {log.mileage.toFixed(1)}
                     </p>
                     <span className="text-xs font-medium" style={{ color: '#64748B' }}>
                       {efficiencyUnit}
                     </span>
                   {log.isFlagged && (
                     <div className="mt-1 flex items-center gap-1 justify-end">
                       <Warning size={12} weight="fill" style={{ color: 'var(--accent-alert)' }} />
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
