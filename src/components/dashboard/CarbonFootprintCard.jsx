import { useState } from 'react';
import { Leaf, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import Card from '../ui/Card';
import {
  formatCO2Label,
  compareWithAverage,
  calculateEcoDrivingScore,
  getEcoBadge,
  calculateMonthlyCO2,
} from '../../utils/carbonCalculations';

/**
 * CarbonFootprintCard component
 * Displays CO2 emissions, comparison with average, and eco-driving score
 * Mobile-first design with collapsible eco-driving tips
 */
const CarbonFootprintCard = ({
  logs = [],
  totalCO2 = 0,
  totalDistance = 0,
  co2PerKm = 0,
  fuelType = 'gasoline',
  vehicleType = 'sedan',
}) => {
  const [showTips, setShowTips] = useState(false);

  // Ensure values are numbers, default to 0 if undefined
  const safeTotalCO2 = Number(totalCO2) || 0;
  const safeTotalDistance = Number(totalDistance) || 0;
  const safeCo2PerKm = Number(co2PerKm) || 0;

  console.log('CarbonFootprintCard - Props:', { totalCO2, co2PerKm, logs, fuelType, vehicleType });
  console.log('CarbonFootprintCard - Safe values:', { safeTotalCO2, safeCo2PerKm, safeTotalDistance });

  // Calculate comparisons
  const comparison = compareWithAverage(safeCo2PerKm, vehicleType);
  const ecoData = calculateEcoDrivingScore(logs);
  const ecoBadge = getEcoBadge(ecoData.score);
  const monthlyData = calculateMonthlyCO2(logs, fuelType);

  // Get current month's CO2
  const currentMonthData = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null;
  const previousMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  // Calculate monthly trend
  const monthlyTrend = currentMonthData && previousMonthData
    ? {
        direction: currentMonthData.co2 > previousMonthData.co2 ? 'up' : 'down',
        percentage: Math.abs(
          ((currentMonthData.co2 - previousMonthData.co2) / previousMonthData.co2) * 100
        ),
      }
    : null;

  // Status colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'moderate':
      case 'warning':
        return 'warning';
      case 'poor':
      case 'needs-improvement':
      case 'danger':
        return 'danger';
      default:
        return 'default';
    }
  };

  const statusColor = getStatusColor(comparison.status);

  return (
    <Card variant="elevated" className="w-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'color-mix(in srgb, #22c55e 15%, transparent)',
              }}
            >
              <Leaf className="w-5 h-5 text-success-500" />
            </div>
            <div>
              <Card.Title>Carbon Footprint</Card.Title>
              <Card.Subtitle>Track your environmental impact</Card.Subtitle>
            </div>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="space-y-5">
        {/* Total CO2 Emissions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Emissions */}
          <div
            className="rounded-xl p-4 transition-all duration-300"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Total Emissions
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatCO2Label(safeTotalCO2)}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                CO₂
              </span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              All time
            </p>
          </div>

          {/* CO2 per KM */}
          <div
            className="rounded-xl p-4 transition-all duration-300"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Per Kilometer
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className="text-3xl font-bold"
                style={{
                  color: safeCo2PerKm > 0.5 ? 'var(--accent-alert)' : 'var(--accent-blue)',
                }}
              >
                {safeCo2PerKm.toFixed(3)}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                kg/km
              </span>
            </div>
            <div
              className={clsx(
                'mt-1 text-xs font-medium flex items-center gap-1',
                comparison.status === 'excellent' || comparison.status === 'good'
                  ? 'text-success-500'
                  : comparison.status === 'moderate'
                  ? 'text-warning-500'
                  : 'text-danger-500'
              )}
            >
              {comparison.status === 'excellent' || comparison.status === 'good' ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              <span>
                {comparison.percentage >= 0 ? '+' : ''}
                {comparison.percentage.toFixed(1)}% vs avg
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Progress Bar */}
        {co2PerKm > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                vs Average Vehicle
              </span>
              <span
                className={clsx(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  comparison.status === 'excellent' || comparison.status === 'good'
                    ? 'bg-success-500/20 text-success-500'
                    : comparison.status === 'moderate'
                    ? 'bg-warning-500/20 text-warning-500'
                    : 'bg-danger-500/20 text-danger-500'
                )}
              >
                {comparison.status === 'excellent'
                  ? 'Excellent'
                  : comparison.status === 'good'
                  ? 'Good'
                  : comparison.status === 'moderate'
                  ? 'Moderate'
                  : 'Poor'}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              {/* Background (average) */}
              <div className="h-full" style={{ width: '100%', background: '#e5e7eb' }}></div>
              {/* User value overlay */}
              <div
                className={clsx('h-full rounded-full transition-all duration-500')}
                style={{
                  width: `${Math.min((comparison.userCO2 / (comparison.averageCO2 * 2)) * 100, 100)}%`,
                  background:
                    comparison.status === 'excellent' || comparison.status === 'good'
                      ? 'var(--accent-success)'
                      : comparison.status === 'moderate'
                      ? 'var(--accent-warning)'
                      : 'var(--accent-alert)',
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>0 kg/km</span>
              <span>Avg: {comparison.averageCO2.toFixed(3)} kg/km</span>
              <span>
                You: {comparison.userCO2.toFixed(3)} kg/km
              </span>
            </div>
          </div>
        )}

        {/* Eco-Driving Score Section */}
        <div
          className="rounded-xl p-4 transition-all duration-300"
          style={{
            background:
              'linear-gradient(135deg, color-mix(in srgb, var(--accent-success) 8%, var(--bg-secondary)) 0%, var(--bg-secondary) 100%)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{ecoBadge.emoji}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Eco-Driving Score
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {ecoData.score}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    /100
                  </span>
                </div>
              </div>
            </div>
            <div
              className={clsx(
                'text-xs font-semibold px-3 py-1.5 rounded-full',
                ecoData.category === 'excellent'
                  ? 'bg-success-500 text-white'
                  : ecoData.category === 'good'
                  ? 'bg-blue-500 text-white'
                  : ecoData.category === 'moderate'
                  ? 'bg-warning-500 text-white'
                  : 'bg-danger-500 text-white'
              )}
            >
              {ecoBadge.label}
            </div>
          </div>

          {/* Toggle Tips Button */}
          <button
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 active-scale"
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
              {showTips ? 'Hide' : 'View'} Eco-Tips
            </span>
            {showTips ? (
              <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>

          {/* Collapsible Tips */}
          {showTips && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {ecoData.suggestions.map((tip, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm p-2 rounded-lg"
                  style={{
                    background: 'color-mix(in srgb, var(--bg-primary) 50%, transparent)',
                  }}
                >
                  <span className="flex-shrink-0 mt-0.5">•</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default CarbonFootprintCard;
