import { useFuelData } from '../hooks/useFuelData';
import { Fuel, TrendingUp, AlertTriangle, Route } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import StatCard from '../components/dashboard/StatCard';
import MileageChart from '../components/dashboard/MileageChart';
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
        <div className="w-20 h-20 bg-primary-600/20 rounded-full flex items-center justify-center mb-4">
          <Fuel className="w-10 h-10 text-warning-500" />
        </div>
        <h1 className="text-xl font-bold text-[#F3F4F6] mb-2">Welcome to Fuel Guard</h1>
        <p className="text-[#D1D5DB] mb-6 max-w-sm">
          Start tracking your fuel consumption to detect anomalies and prevent theft.
        </p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors min-h-[48px]"
        >
          Add Your First Entry
        </a>
        <p className="text-sm text-[#9CA3AF] mt-4">
          Or go to <a href="/settings" className="text-[#60A5FA] underline">Settings</a> to load demo data
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#F3F4F6]">Dashboard</h1>
        <p className="text-[#9CA3AF]">Your fuel efficiency overview</p>
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
        </div>

        {/* Recent Entries Column */}
        <div className="mt-6 lg:mt-0">
          <Card padding="none">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-[#F3F4F6]">Recent Entries</h2>
            </div>
            <div className="divide-y divide-gray-700 max-h-[500px] overflow-y-auto">
              {logs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className={`p-4 flex justify-between items-center hover:bg-gray-700/50 transition-colors ${
                    log.isFlagged ? 'bg-danger-600/20 hover:bg-danger-600/30' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-[#F3F4F6]">
                      {log.liters}L @ {log.odometer.toLocaleString()} km
                    </p>
                    <p className="text-sm text-[#9CA3AF]">
                      {new Date(log.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      log.isFlagged ? 'text-danger-500' : 'text-[#F3F4F6]'
                    }`}>
                      {log.mileage.toFixed(1)} km/L
                    </p>
                    {log.isFlagged && (
                      <span className="text-xs text-danger-500 font-medium">⚠️ Alert</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {logs.length > 5 && (
              <a
                href="/history"
                className="block p-4 text-center text-[#60A5FA] font-medium hover:bg-gray-700/50 transition-colors"
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
