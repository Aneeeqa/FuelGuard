/**
 * Tank Capacity Display Component
 *
 * Purpose: Display vehicle's tank capacity with confidence badge
 *
 * @component TankCapacityDisplay
 * @description Shows the vehicle's tank capacity with a confidence level indicator
 * and provides options to edit the capacity or view the data source.
 */

import { Info, Edit3 } from 'lucide-react';

/**
 * TankCapacityDisplay Component
 *
 * Props:
 * - capacity: number - Tank capacity in liters
 * - confidence: 'high' | 'medium' | 'low' - Confidence level of the capacity data
 * - source: string - Data source description (e.g., 'Vehicle Database')
 * - onEdit: () => void - Callback when user wants to edit capacity
 * - units: string - Volume unit ('L' or 'gal')
 *
 * Time Complexity: O(1) - Simple display component
 * Space Complexity: O(1) - Fixed component size
 */
const TankCapacityDisplay = ({
  capacity,
  confidence = 'medium',
  source = 'Not specified',
  onEdit,
  units = 'L'
}) => {
  // Get confidence badge configuration
  const getConfidenceConfig = () => {
    switch (confidence) {
      case 'high':
        return {
          icon: '✓',
          color: 'var(--accent-success)',
          bgColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
          borderColor: 'var(--accent-success)',
          text: 'Verified from vehicle database'
        };
      case 'medium':
        return {
          icon: '~',
          color: 'var(--accent-warning)',
          bgColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
          borderColor: 'var(--accent-warning)',
          text: 'Estimated based on vehicle model'
        };
      case 'low':
      default:
        return {
          icon: '!',
          color: 'var(--accent-alert)',
          bgColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
          borderColor: 'var(--accent-alert)',
          text: 'Default value - please verify'
        };
    }
  };

  const confidenceConfig = getConfidenceConfig();

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)'
      }}
    >
      {/* Main Content */}
      <div className="flex items-start justify-between gap-4">
        {/* Tank Capacity Info */}
        <div className="flex-1">
          {/* Tank Capacity Label */}
          <div className="flex items-center gap-2 mb-2">
            <Info size={18} style={{ color: 'var(--accent-blue)' }} />
            <label
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Vehicle Tank Capacity
            </label>
          </div>

          {/* Capacity Value */}
          <div className="flex items-baseline gap-2">
            <span
              className="text-3xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {capacity}
            </span>
            <span
              className="text-xl font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              {units}
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            backgroundColor: confidenceConfig.bgColor,
            color: confidenceConfig.color,
            border: `1px solid ${confidenceConfig.borderColor}`
          }}
        >
          <span className="mr-1">{confidenceConfig.icon}</span>
          {confidence === 'high' ? 'Verified' : confidence === 'medium' ? 'Estimated' : 'Default'}
        </div>
      </div>

      {/* Source Information */}
      {source && (
        <div className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          Source: <span className="font-medium">{source}</span>
        </div>
      )}

      {/* Edit Button */}
      {onEdit && (
        <div className="mt-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <Edit3 size={16} style={{ color: 'var(--accent-blue)' }} />
            Change capacity
          </button>
        </div>
      )}

      {/* Info Box */}
      <div
        className="mt-3 p-3 rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, transparent)',
          border: '1px solid var(--accent-blue)'
        }}
      >
        <div className="flex items-start gap-2">
          <Info size={16} style={{ color: 'var(--accent-blue)', marginTop: '1px' }} />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-semibold">Tip:</span> Tank capacity is used to calculate
            fuel consumption and detect theft. If this value is incorrect, theft
            detection may be inaccurate. Verify your vehicle's tank capacity in the
            owner's manual or manufacturer's website.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TankCapacityDisplay;
