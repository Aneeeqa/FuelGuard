import { clsx } from 'clsx';
import { useState } from 'react';
import {
  Route,
  Droplet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  MapPin,
  Calendar,
  Car,
  Copy,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  Flame
} from 'lucide-react';
import Card from './ui/Card';
import Alert from './ui/Alert';
import Button from './ui/Button';
import { formatFuelVolume, formatDistance } from '../utils/units';
import {
  getTankToTankTheftSeverity,
  getEfficiencyColor,
  getFuelLevelColor,
  calculateTheftCost
} from '../utils/tankToTankCalculations';
import './TankToTankTripCard.css';

/**
 * TankToTankTripCard Component
 *
 * Displays detailed Tank-to-Tank fuel consumption analysis including:
 * - Trip summary (distance, fuel consumed, mileage)
 * - Theft detection analysis
 * - Mileage efficiency indicator
 * - Visual fuel level display
 * - Action buttons for reports and details
 *
 * Time Complexity: O(1) - Static component rendering
 * Space Complexity: O(1) - No additional data structures
 *
 * @param {Object} props
 * @param {Object} props.tripData - Tank-to-Tank calculation result from tankToTankCalculations
 * @param {Object} props.vehicleProfile - Vehicle profile with expected mileage and tank capacity
 * @param {Object} props.units - Unit system { distanceUnit: 'km', fuelVolumeUnit: 'L' }
 * @param {string} props.currency - Currency code (default: 'USD')
 * @param {string} props.pricePerLiter - Price per liter for theft cost calculation
 * @param {Function} props.onViewDetails - Callback when clicking view details
 * @param {Function} props.onExportReport - Callback when exporting report
 * @param {Function} props.onCopyReport - Callback when copying report
 * @param {string} props.className - Additional CSS classes
 */
const TankToTankTripCard = ({
  tripData,
  vehicleProfile,
  units = { distanceUnit: 'km', fuelVolumeUnit: 'L' },
  currency = 'USD',
  pricePerLiter = 0,
  onViewDetails,
  onExportReport,
  onCopyReport,
  className,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle null or invalid trip data
  if (!tripData || !tripData.isValid) {
    return (
      <Card variant="outlined" padding="default" className={className} {...props}>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Info size={20} className="text-blue-500" />
            Tank-to-Tank Analysis
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <p className="text-sm text-[var(--text-secondary)]">
            {tripData?.message || 'No valid Tank-to-Tank data available for this trip.'}
          </p>
        </Card.Body>
      </Card>
    );
  }

  const { distanceUnit = 'km', fuelVolumeUnit = 'L' } = units;
  const severity = getTankToTankTheftSeverity(tripData.theftPercentage);
  const efficiencyColor = getEfficiencyColor(tripData.mileageEfficiency);
  const fuelLevelColor = getFuelLevelColor(
    (tripData.remainingFuelBeforeFill / tripData.tankCapacity) * 100
  );
  const theftCost = calculateTheftCost(tripData.theftAmount, pricePerLiter);

  // Format date range
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Same day';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get currency symbol
  const getCurrencySymbol = (code) => {
    const symbols = {
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
      'PKR': '₨',
      'CAD': 'C$',
      'AUD': 'A$',
    };
    return symbols[code] || '$';
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <Card
      variant={severity === 'critical' ? 'outlined' : 'default'}
      padding="default"
      className={clsx(
        'tank-to-tank-trip-card transition-all duration-300',
        severity === 'critical' && 'border-l-4 border-l-danger-500 shadow-glow-danger',
        severity === 'warning' && 'border-l-4 border-l-warning-500',
        severity === 'normal' && 'border-l-4 border-l-success-500',
        className
      )}
      {...props}
    >
      {/* Header */}
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 flex-1">
            <Route size={20} className="text-[var(--accent-blue)]" />
            <Card.Title>Tank-to-Tank Trip</Card.Title>
            {tripData.isTheftSuspected && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
                  severity === 'critical' && 'bg-danger-500/10 text-danger-600',
                  severity === 'warning' && 'bg-warning-500/10 text-warning-600',
                  severity === 'normal' && 'bg-success-500/10 text-success-600'
                )}
              >
                <AlertTriangle size={14} weight="fill" />
                Theft Detected
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        <Card.Subtitle className="flex items-center gap-2 mt-2">
          <Calendar size={14} />
          {formatDateRange(tripData.startDate, tripData.endDate)}
          <span className="text-[var(--border-color)]">•</span>
          {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
        </Card.Subtitle>
      </Card.Header>

      {/* Body - Always Visible */}
      <Card.Body>
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Distance */}
          <div className="stat-box">
            <label className="stat-label text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Route size={14} className="text-[var(--accent-blue)]" />
              Distance
            </label>
            <div className="stat-value text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {formatDistance(tripData.distance, distanceUnit)}
            </div>
          </div>

          {/* Fuel Added */}
          <div className="stat-box">
            <label className="stat-label text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Droplet size={14} className="text-blue-500" />
              Fuel Added
            </label>
            <div className="stat-value text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {formatFuelVolume(tripData.actualFuelConsumed, fuelVolumeUnit, 1)}
            </div>
          </div>

          {/* Actual Mileage */}
          <div className="stat-box">
            <label className="stat-label text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={14} className="text-purple-500" />
              Actual Mileage
            </label>
            <div
              className={clsx(
                'stat-value text-lg font-bold tabular-nums',
                tripData.actualMileage < vehicleProfile?.expectedMileage
                  ? 'text-warning-500'
                  : 'text-success-500'
              )}
            >
              {tripData.actualMileage.toFixed(2)} {distanceUnit}/{fuelVolumeUnit}
            </div>
          </div>

          {/* Expected Consumption */}
          <div className="stat-box">
            <label className="stat-label text-xs font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1.5">
              <Info size={14} className="text-gray-500" />
              Expected
            </label>
            <div className="stat-value text-lg font-bold tabular-nums text-[var(--text-primary)]">
              {formatFuelVolume(tripData.expectedFuelConsumed, fuelVolumeUnit, 1)}
            </div>
          </div>
        </div>

        {/* Theft Analysis - Only if theft detected */}
        {tripData.theftAmount > 0 && (
          <div className="mt-4">
            <Alert
              variant={severity === 'critical' ? 'danger' : 'warning'}
              className="animate-fade-in"
            >
              <div>
                <div className="font-semibold text-[var(--text-primary)] mb-1">
                  Fuel Theft Detected
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={14} weight="fill" />
                    <span className="font-medium">
                      {formatFuelVolume(tripData.theftAmount, fuelVolumeUnit, 1)} unaccounted for
                    </span>
                    <span className="text-[var(--accent-danger)]">
                      ({tripData.theftPercentage.toFixed(0)}% deviation)
                    </span>
                  </div>
                  {theftCost > 0 && (
                    <div className="text-xs">
                      Estimated loss: <span className="font-medium">{currencySymbol}{theftCost.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Normal Status - Only if no theft */}
        {tripData.theftAmount === 0 && (
          <div className="mt-4">
            <Alert variant="success" className="animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} weight="fill" />
                <span className="font-medium">Normal fuel consumption detected</span>
              </div>
              <div className="text-sm mt-1">
                Fuel efficiency is within expected range
              </div>
            </Alert>
          </div>
        )}

        {/* Mileage Efficiency Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Mileage Efficiency</span>
            <span className="text-xs font-bold" style={{ color: efficiencyColor }}>
              {tripData.mileageEfficiency.toFixed(0)}% of expected
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, tripData.mileageEfficiency)}%`,
                backgroundColor: efficiencyColor,
              }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[var(--text-muted)]">
            <span>{tripData.actualMileage.toFixed(1)} {distanceUnit}/{fuelVolumeUnit}</span>
            <span>Expected: {tripData.expectedMileage.toFixed(1)} {distanceUnit}/{fuelVolumeUnit}</span>
          </div>
        </div>
      </Card.Body>

      {/* Expanded Details */}
      {isExpanded && (
        <Card.Body className="animate-fade-in pt-0">
          {/* Trip Information */}
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Car size={16} className="text-[var(--accent-blue)]" />
              Trip Information
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Start Date</div>
                <div className="font-medium text-[var(--text-primary)]">{formatDate(tripData.startDate)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">End Date</div>
                <div className="font-medium text-[var(--text-primary)]">{formatDate(tripData.endDate)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Start Odometer</div>
                <div className="font-medium text-[var(--text-primary)] tabular-nums">
                  {tripData.startOdometer.toLocaleString()} {distanceUnit}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">End Odometer</div>
                <div className="font-medium text-[var(--text-primary)] tabular-nums">
                  {tripData.endOdometer.toLocaleString()} {distanceUnit}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Duration</div>
                <div className="font-medium text-[var(--text-primary)]">{tripData.durationDays} days</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-0.5">Tank Capacity</div>
                <div className="font-medium text-[var(--text-primary)]">
                  {formatFuelVolume(tripData.tankCapacity, fuelVolumeUnit, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Fuel Consumption Breakdown */}
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Droplet size={16} className="text-blue-500" />
              Fuel Consumption Breakdown
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Actual Fuel Consumed</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatFuelVolume(tripData.actualFuelConsumed, fuelVolumeUnit, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-secondary)]">Expected Consumption</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatFuelVolume(tripData.expectedFuelConsumed, fuelVolumeUnit, 1)}
                </span>
              </div>
              {tripData.theftAmount > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[var(--text-secondary)] font-medium">Fuel Difference (Stolen)</span>
                  <span className="font-bold tabular-nums text-[var(--accent-danger)]">
                    +{formatFuelVolume(tripData.fuelDifference, fuelVolumeUnit, 1)}
                  </span>
                </div>
              )}
              {tripData.remainingFuelBeforeFill > 0 && (
                <div className="flex justify-between items-center text-sm pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="text-[var(--text-secondary)]">Fuel Before Fill</span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {formatFuelVolume(tripData.remainingFuelBeforeFill, fuelVolumeUnit, 1)}
                    <span className="text-xs text-[var(--text-muted)] ml-1">
                      ({((tripData.remainingFuelBeforeFill / tripData.tankCapacity) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Theft Analysis Details */}
          {tripData.isTheftSuspected && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--accent-danger)]" />
                Theft Analysis Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Theft Amount</span>
                  <span className="font-bold tabular-nums text-[var(--accent-danger)]">
                    {formatFuelVolume(tripData.theftAmount, fuelVolumeUnit, 1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Theft Percentage</span>
                  <span className="font-bold tabular-nums text-[var(--accent-danger)]">
                    {tripData.theftPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Severity</span>
                  <span
                    className={clsx(
                      'font-semibold text-xs px-2 py-0.5 rounded-full',
                      severity === 'critical' && 'bg-danger-500/10 text-danger-600',
                      severity === 'warning' && 'bg-warning-500/10 text-warning-600'
                    )}
                  >
                    {severity === 'critical' ? 'Critical' : 'Warning'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-secondary)]">Threshold</span>
                  <span className="font-medium text-[var(--text-primary)]">{tripData.theftThreshold}%</span>
                </div>
                {theftCost > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-[var(--text-secondary)]">Estimated Loss</span>
                    <span className="font-bold tabular-nums text-[var(--accent-danger)]">
                      {currencySymbol}{theftCost.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fuel Level Visual */}
          <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Droplet size={16} className="text-blue-500" />
              Fuel Level Before Fill
            </h4>
            <div className="flex items-center gap-4">
              {/* Tank Visual */}
              <div className="relative w-16 h-24 rounded-lg border-2 border-[var(--border-color)] overflow-hidden bg-[var(--bg-primary)] flex flex-col items-center justify-end">
                <div
                  className="w-full transition-all duration-300"
                  style={{
                    height: `${(tripData.remainingFuelBeforeFill / tripData.tankCapacity) * 100}%`,
                    backgroundColor: fuelLevelColor,
                  }}
                />
                {/* Markers */}
                <div className="absolute inset-0 flex flex-col justify-between py-1 px-1 pointer-events-none">
                  <div className="text-[8px] font-bold text-[var(--text-primary)]">F</div>
                  <div className="text-[8px] font-bold text-[var(--text-primary)]">1/2</div>
                  <div className="text-[8px] font-bold text-[var(--text-primary)]">E</div>
                </div>
              </div>
              {/* Fuel Level Info */}
              <div className="flex-1">
                <div className="text-lg font-bold tabular-nums text-[var(--text-primary)]">
                  {tripData.remainingFuelBeforeFill.toFixed(1)} {fuelVolumeUnit}
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  {((tripData.remainingFuelBeforeFill / tripData.tankCapacity) * 100).toFixed(0)}% of tank capacity
                </div>
                <div className="text-xs text-[var(--text-muted)] mt-1">
                  You filled {formatFuelVolume(tripData.actualFuelConsumed, fuelVolumeUnit, 1)} to reach full
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      )}

      {/* Footer - Action Buttons */}
      <Card.Footer>
        <Card.Actions>
          {onCopyReport && (
            <Button
              variant="secondary"
              size="default"
              fullWidth={false}
              onClick={onCopyReport}
              icon={Copy}
            >
              Copy
            </Button>
          )}
          {onViewDetails && (
            <Button
              variant="primary"
              size="default"
              fullWidth={false}
              onClick={() => onViewDetails(tripData)}
              icon={Eye}
            >
              View Details
            </Button>
          )}
          {onExportReport && (
            <Button
              variant="outline"
              size="default"
              fullWidth={false}
              onClick={() => onExportReport(tripData)}
              icon={FileText}
            >
              Export
            </Button>
          )}
        </Card.Actions>
      </Card.Footer>
    </Card>
  );
};

export default TankToTankTripCard;
