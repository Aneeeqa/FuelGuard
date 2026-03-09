import React, { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { MapPin, AlertTriangle, TrendingUp, Activity, Clock, Filter } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import { calculateTrips, formatTripDateRange, getTripStatusColor } from '../utils/tripCalculations';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

const TripsPage = () => {
  const { data } = useFuelData();

  // Calculate trips from logs
  const trips = useMemo(() => {
    return calculateTrips(data.logs || [], data.vehicleProfile || {});
  }, [data.logs, data.vehicleProfile]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        normalTrips: 0,
        suspiciousTrips: 0,
        theftAlertTrips: 0,
        avgTripMileage: 0,
        avgTripDistance: 0,
        totalDistance: 0,
        totalFuelConsumed: 0,
      };
    }

    const normalTrips = trips.filter((t) => t.status === 'Normal').length;
    const suspiciousTrips = trips.filter((t) => t.isSuspicious).length;
    const theftAlertTrips = trips.filter((t) => t.isTheftAlert).length;

    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const totalFuelConsumed = trips.reduce((sum, t) => sum + t.fuelConsumed, 0);
    const avgTripMileage = trips.reduce((sum, t) => sum + t.tripMileage, 0) / trips.length;
    const avgTripDistance = totalDistance / trips.length;

    return {
      totalTrips: trips.length,
      normalTrips,
      suspiciousTrips,
      theftAlertTrips,
      avgTripMileage: avgTripMileage.toFixed(1),
      avgTripDistance: avgTripDistance.toFixed(0),
      totalDistance: totalDistance.toFixed(0),
      totalFuelConsumed: totalFuelConsumed.toFixed(1),
    };
  }, [trips]);

  const [filter, setFilter] = useState('all');

  const filteredTrips = useMemo(() => {
    if (filter === 'all') return trips;
    if (filter === 'normal') return trips.filter((t) => t.status === 'Normal');
    if (filter === 'suspicious') return trips.filter((t) => t.isSuspicious);
    if (filter === 'theft') return trips.filter((t) => t.isTheftAlert);
    return trips;
  }, [trips, filter]);

  const { efficiencyUnit = 'km/L', distanceUnit = 'km', fuelVolumeUnit = 'L' } = data.vehicleProfile || {};

  if (data.loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-bounce"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Activity className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          No Trip Data
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          Add at least 2 fuel entries to calculate trip statistics
        </p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-xl min-h-[56px] transition-all duration-300 hover-lift active-scale"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          Add Entry
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Trip Analysis
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Detect fuel theft with per-trip mileage analysis
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Trips</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalTrips}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Mileage</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
            {stats.avgTripMileage}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {efficiencyUnit}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" style={{ color: stats.theftAlertTrips > 0 ? 'var(--accent-alert)' : 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Theft Alerts</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: stats.theftAlertTrips > 0 ? 'var(--accent-alert)' : 'var(--text-primary)' }}>
            {stats.theftAlertTrips}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Normal Trips</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
            {stats.normalTrips}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'all' ? 'shadow-glow-blue' : ''}`}
          style={{
            background: filter === 'all' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
            color: filter === 'all' ? 'white' : 'var(--text-secondary)',
            border: filter === 'all' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          <Filter className="w-4 h-4" />
          All ({trips.length})
        </button>
        <button
          onClick={() => setFilter('normal')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'normal' ? 'shadow-glow-blue' : ''}`}
          style={{
            background: filter === 'normal' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
            color: filter === 'normal' ? 'white' : 'var(--text-secondary)',
            border: filter === 'normal' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          Normal ({stats.normalTrips})
        </button>
        <button
          onClick={() => setFilter('suspicious')}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'suspicious' ? 'shadow-glow-blue' : ''}`}
          style={{
            background: filter === 'suspicious' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
            color: filter === 'suspicious' ? 'white' : 'var(--text-secondary)',
            border: filter === 'suspicious' ? 'none' : '1px solid var(--border-color)',
          }}
        >
          <Clock className="w-4 h-4" />
          Suspicious ({stats.suspiciousTrips})
        </button>
        {stats.theftAlertTrips > 0 && (
          <button
            onClick={() => setFilter('theft')}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'theft' ? 'shadow-glow-danger' : ''}`}
            style={{
              background: filter === 'theft' ? 'var(--gradient-danger)' : 'var(--bg-secondary)',
              color: filter === 'theft' ? 'white' : 'var(--text-secondary)',
              border: filter === 'theft' ? 'none' : '1px solid var(--border-color)',
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            Theft Alerts ({stats.theftAlertTrips})
          </button>
        )}
      </div>

      {stats.theftAlertTrips > 0 && (
        <Card className="p-4 border-l-4" style={{ borderLeftColor: 'var(--accent-alert)', backgroundColor: 'color-mix(in srgb, var(--accent-alert) 5%, transparent)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-alert)' }} />
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--accent-alert)' }}>
                Fuel Theft Alerts Detected
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {stats.theftAlertTrips} trip(s) show significantly lower mileage than expected. This could indicate fuel siphoning, leaks, or odometer tampering. Check these trips for suspicious activity.
              </p>
            </div>
          </div>
        </Card>
      )}

      {filteredTrips.length === 0 ? (
        <Card className="p-8 text-center">
          <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
            No trips match selected filter
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip, index) => {
            const statusColor = getTripStatusColor(trip.status);
            const isTheftAlert = trip.status === 'Potential Theft';

            return (
              <Card
                key={trip.id}
                variant="elevated"
                className={`p-5 transition-all hover:shadow-lg ${isTheftAlert ? 'shadow-glow-danger' : ''}`}
                style={{
                  borderLeft: isTheftAlert ? '4px solid var(--accent-alert)' : undefined,
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {formatTripDateRange(trip.startDate, trip.endDate)}
                    </span>
                  </div>
                  <Badge
                    variant={isTheftAlert ? 'danger' : (trip.status === 'Normal' ? 'success' : 'warning')}
                    size="sm"
                  >
                    {trip.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {trip.startOdometer.toLocaleString()}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>➔</span>
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {trip.endOdometer.toLocaleString()}
                    </span>
                    <span className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                      {trip.distanceUnit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Distance
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {trip.distance.toFixed(0)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.distanceUnit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Fuel Used
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {trip.fuelConsumed.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.fuelVolumeUnit}
                    </p>
                  </div>

                  <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)` }}>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Average
                    </p>
                    <p className="text-base font-bold" style={{ color: statusColor }}>
                      {trip.tripMileage.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.efficiencyUnit}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Expected
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--accent-blue)' }}>
                      {trip.expectedMileage.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.efficiencyUnit}
                    </p>
                  </div>
                </div>

                {isTheftAlert && (
                  <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
                    border: '1px solid var(--accent-alert)'
                  }}>
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-alert)' }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--accent-alert)' }}>
                        Potential Fuel Theft Detected
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Mileage dropped to {trip.tripMileage.toFixed(1)} {trip.efficiencyUnit} (expected: {trip.expectedMileage.toFixed(1)} {trip.efficiencyUnit}). This indicates {((1 - trip.tripMileage / trip.expectedMileage) * 100).toFixed(0)}% lower efficiency than normal. Check for fuel siphoning or leaks.
                      </p>
                    </div>
                  </div>
                )}

                {trip.status === 'Heavy Traffic' && (
                  <div className="mt-4 p-2 rounded-lg flex items-start gap-2" style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
                  }}>
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-warning)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Mileage is slightly below normal. Could be due to traffic conditions or driving style.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
