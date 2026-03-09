import React, { memo } from 'react';
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { formatTripDateRange, getTripStatusColor } from '../../utils/tripCalculations';

const LastTripSummary = memo(({ trip, vehicleProfile }) => {
  if (!trip) {
    return (
      <Card variant="elevated" className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Last Trip
          </h3>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          No trip data available. Add fuel entries to see trip statistics.
        </p>
      </Card>
    );
  }

  const {
    efficiencyUnit = 'km/L',
    distanceUnit = 'km',
    fuelVolumeUnit = 'L',
    expectedMileage = 15
  } = vehicleProfile;

  const statusColor = getTripStatusColor(trip.status);
  const isTheftAlert = trip.status === 'Potential Theft';
  const isNormal = trip.status === 'Normal';

  const MileageIcon = isNormal ? TrendingUp : (isTheftAlert ? AlertTriangle : TrendingDown);
  const mileageColor = isNormal ? 'var(--accent-success)' : (isTheftAlert ? 'var(--accent-alert)' : 'var(--accent-warning)');

  return (
    <Card
      variant="elevated"
      className={`p-5 transition-all ${isTheftAlert ? 'shadow-glow-danger' : ''}`}
      style={{
        borderLeft: isTheftAlert ? '4px solid var(--accent-alert)' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Last Trip Summary
          </h3>
        </div>
        <Badge
          variant={isTheftAlert ? 'danger' : (isNormal ? 'success' : 'warning')}
          icon={isTheftAlert ? AlertTriangle : (isNormal ? CheckCircle : Clock)}
          size="sm"
        >
          {trip.status}
        </Badge>
      </div>

      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Start
            </p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {trip.startOdometer.toLocaleString()}
            </p>
          </div>

          <div className="flex-1 mx-3 relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--border-color)' }}></div>
            <div className="relative flex justify-center">
              <div className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                {trip.distance.toFixed(0)} {distanceUnit}
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              End
            </p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {trip.endOdometer.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {formatTripDateRange(trip.startDate, trip.endDate)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Distance
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {trip.distance.toFixed(0)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {distanceUnit}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Fuel Used
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {trip.fuelConsumed.toFixed(1)}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {fuelVolumeUnit}
          </p>
        </div>

        <div className="p-3 rounded-lg relative overflow-hidden" style={{
          backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)`
        }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            Average
          </p>
          <div className="flex items-center gap-1">
            <MileageIcon className="w-4 h-4" style={{ color: mileageColor }} />
            <p className="text-lg font-bold" style={{ color: mileageColor }}>
              {trip.tripMileage.toFixed(1)}
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {efficiencyUnit}
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
              Unusual Mileage Detected
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This trip's mileage ({trip.tripMileage.toFixed(1)} {efficiencyUnit}) is significantly below your vehicle's expected average ({expectedMileage.toFixed(1)} {efficiencyUnit}). Possible fuel theft or leak detected.
            </p>
          </div>
        </div>
      )}

      {/* Heavy Traffic Warning */}
      {trip.status === 'Heavy Traffic' && (
        <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
          border: '1px solid var(--accent-warning)'
        }}>
          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-warning)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--accent-warning)' }}>
              Lower Efficiency Detected
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This trip's mileage is slightly below normal. This could be due to heavy traffic, aggressive driving, or short trips.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
});

LastTripSummary.displayName = 'LastTripSummary';

export default LastTripSummary;
