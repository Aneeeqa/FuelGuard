import { useFuelData } from '../hooks/useFuelData';
import { Fuel, TrendingUp, AlertTriangle, Route } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import StatCard from '../components/dashboard/StatCard';
import MileageChart from '../components/dashboard/MileageChart';
import MileageComparison from '../components/dashboard/MileageComparison';
import Alert from '../components/ui/Alert';
import Card from '../components/ui/Card';

const Dashboard = () => {
  const { data, loading } = useFuelData();

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

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 20%, transparent)' }}
        >
          <Fuel className="w-10 h-10" style={{ color: 'var(--accent-fuel)' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome to Fuel Guard</h1>
        <p className="mb-6 max-w-sm" style={{ color: 'var(--text-secondary)' }}>
          Start tracking your fuel consumption to detect anomalies and prevent theft.
        </p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-6 py-3 text-white font-semibold rounded-xl transition-colors min-h-[48px]"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          Add Your First Entry
        </a>
        <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
          Or go to <a href="/settings" className="underline" style={{ color: 'var(--accent-blue)' }}>Settings</a> to load demo data
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Your fuel efficiency overview</p>
      </div>

      {/* Alert Banner */}
      {flaggedCount > 0 && (
        <Alert
          variant="danger"
          title={`${flaggedCount} Potential Theft${flaggedCount > 1 ? 's' : ''} Detected`}
        >
          Unusual mileage drops found. Check your history for details.
        </Alert>
      )}

      {/* Desktop: Two-column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Stats + Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid - Using StatCard component */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={TrendingUp}
              label="Avg Mileage"
              value={stats.avgMileage.toFixed(1)}
              unit="km/L"
              status="default"
            />

            <StatCard
              icon={Fuel}
              label="Total Fuel"
              value={stats.totalFuel.toFixed(0)}
              unit="L"
              status="fuel"
            />

            <StatCard
              icon={Route}
              label="Distance"
              value={stats.totalDistance.toLocaleString()}
              unit="km"
              status="default"
            />

            <StatCard
              icon={AlertTriangle}
              label="Alerts"
              value={flaggedCount}
              unit="flagged"
              status={flaggedCount > 0 ? 'danger' : 'success'}
            />
          </div>

          {/* Mileage Chart */}
          {logs.length > 1 && (
            <Card>
              <Card.Header>
                <Card.Title>Mileage Trend</Card.Title>
              </Card.Header>
              <div className="pt-2">
                <MileageChart data={logs} />
              </div>
            </Card>
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
        <div className="mt-6 lg:mt-0">
          <Card padding="none">
            <div className="p-4 border-b transition-colors duration-300" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Entries</h2>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: 'var(--border-color)' }}>
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex justify-between items-center transition-colors"
                  style={{
                    backgroundColor: log.isFlagged ? 'color-mix(in srgb, var(--accent-alert) 10%, transparent)' : 'transparent',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {log.liters}L @ {log.odometer.toLocaleString()} km
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-semibold"
                      style={{ color: log.isFlagged ? 'var(--accent-alert)' : 'var(--text-primary)' }}
                    >
                      {log.mileage.toFixed(1)} km/L
                    </p>
                    {log.isFlagged && (
                      <span className="text-xs font-medium" style={{ color: 'var(--accent-alert)' }}>⚠️ Alert</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {logs.length > 5 && (
              <a
                href="/history"
                className="block p-4 text-center font-medium transition-colors"
                style={{ color: 'var(--accent-blue)' }}
              >
                View All History →
              </a>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
