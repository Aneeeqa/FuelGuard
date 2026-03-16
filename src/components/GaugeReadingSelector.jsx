/**
 * Gauge Reading Selector Component
 *
 * Purpose: Quick-select buttons for fuel gauge reading with percentage input
 *
 * @component GaugeReadingSelector
 * @description Provides quick-select buttons for common gauge readings (Full, 3/4, 1/2, 1/4, Empty)
 * along with a manual percentage input for precise values.
 */

import { Gauge } from 'lucide-react';
import { estimateFuelLevelFromGauge } from '../utils/tankToTankCalculations';

/**
 * GaugeReadingSelector Component
 *
 * Props:
 * - value: number - Currently selected percentage (0-100)
 * - onChange: (percentage: number) => void - Callback when selection changes
 * - tankCapacity: number - Vehicle's tank capacity in liters
 * - allowManual: boolean - Whether to show manual percentage input (default: true)
 * - units: string - Volume unit ('L' or 'gal')
 *
 * Time Complexity: O(1) - Simple render with quick lookup
 * Space Complexity: O(1) - Fixed component size
 */
const GaugeReadingSelector = ({
  value,
  onChange,
  tankCapacity,
  allowManual = true,
  units = 'L'
}) => {
  // Gauge reading options
  const gaugeOptions = [
    {
      label: 'Full',
      percentage: 100,
      icon: '🟢',
      description: '100% - No estimate needed'
    },
    {
      label: '3/4',
      percentage: 75,
      icon: '🟡',
      description: '75% - About 3/4 full'
    },
    {
      label: '1/2',
      percentage: 50,
      icon: '🟠',
      description: '50% - Half full'
    },
    {
      label: '1/4',
      percentage: 25,
      icon: '🟤',
      description: '25% - About a quarter'
    },
    {
      label: 'Empty',
      percentage: 5,
      icon: '🔴',
      description: '5% - Reserve fuel only'
    }
  ];

  const handleGaugeSelect = (percentage) => {
    if (typeof onChange === 'function') {
      onChange(percentage);
    }
  };

  const handleManualChange = (e) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
      if (typeof onChange === 'function') {
        onChange(newValue);
      }
    }
  };

  const getEstimatedFuelLevel = () => {
    const result = estimateFuelLevelFromGauge(
      gaugeOptions.find(o => o.percentage === value)?.label || '',
      tankCapacity
    );
    return result.fuelLevel || (value / 100) * tankCapacity;
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-3">
        <Gauge size={18} style={{ color: 'var(--accent-blue)' }} />
        <label
          className="text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          What did your fuel gauge show?
        </label>
      </div>

      {/* Quick Select Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {gaugeOptions.map((option) => {
          const isSelected = value === option.percentage;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => handleGaugeSelect(option.percentage)}
              className="relative p-3 rounded-lg transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center gap-1"
              style={{
                backgroundColor: isSelected
                  ? 'var(--accent-blue)'
                  : 'var(--bg-tertiary)',
                color: isSelected ? 'white' : 'var(--text-primary)',
                border: isSelected
                  ? '2px solid var(--accent-blue)'
                  : '1px solid var(--border-color)',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(59, 130, 246, 0.3)'
                  : 'none',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
              aria-label={`Select ${option.label} (${option.percentage}%)`}
              aria-pressed={isSelected}
            >
              <span className="text-2xl" aria-hidden="true">
                {option.icon}
              </span>
              <span className="text-sm font-semibold">{option.label}</span>
              <span
                className="text-xs"
                style={{
                  color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-muted)'
                }}
              >
                {option.percentage}%
              </span>
              {isSelected && (
                <div
                  className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--accent-success)' }}
                >
                  <span className="text-xs text-white">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Manual Percentage Input */}
      {allowManual && (
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <label
            className="block text-xs font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Or enter percentage manually:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={value}
              onChange={handleManualChange}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
              aria-label="Manual fuel percentage"
            />
            <span
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)'
              }}
            >
              %
            </span>
          </div>
          {/* Estimated Fuel Level */}
          {value > 0 && (
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Estimated: {getEstimatedFuelLevel().toFixed(1)} {units} in tank
            </p>
          )}
        </div>
      )}

      {/* Validation Warning */}
      {value < 10 && (
        <div
          className="mt-3 p-2 rounded-lg flex items-start gap-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
            border: '1px solid var(--accent-warning)'
          }}
        >
          <span className="text-lg" aria-hidden="true">⚠️</span>
          <div className="text-xs" style={{ color: 'var(--accent-warning)' }}>
            <span className="font-semibold">Low fuel level:</span> {value}% indicates you were
            almost out of fuel. Please verify your gauge reading.
          </div>
        </div>
      )}
    </div>
  );
};

export default GaugeReadingSelector;
