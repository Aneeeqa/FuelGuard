/**
 * Tank Visual Indicator Component
 *
 * Purpose: Visual representation of fuel level in tank with interactive slider
 *
 * @component TankVisualIndicator
 * @description Displays a visual fuel tank with liquid level that users can adjust using a slider.
 * Color-coded based on fuel level: Green (100-70%), Yellow (70-40%), Orange (40-20%), Red (<20%).
 */

import { Fuel } from 'lucide-react';
import { getFuelLevelColor } from '../utils/tankToTankCalculations';

/**
 * TankVisualIndicator Component
 *
 * Props:
 * - currentLevel: number - Current fuel level in liters (0 to tankCapacity)
 * - tankCapacity: number - Tank capacity in liters
 * - editable: boolean - Whether user can adjust the level (default: false)
 * - onChange: (level: number) => void - Callback when level changes
 * - units: string - Volume unit ('L' or 'gal')
 *
 * Time Complexity: O(1) - Simple render with color lookup
 * Space Complexity: O(1) - Fixed component size
 */
const TankVisualIndicator = ({
  currentLevel,
  tankCapacity,
  editable = false,
  onChange,
  units = 'L'
}) => {
  const percentage = Math.min(100, Math.max(0, (currentLevel / tankCapacity) * 100));
  const fuelColor = getFuelLevelColor(percentage);

  const handleSliderChange = (e) => {
    if (!editable || !onChange) return;
    const newPercentage = parseFloat(e.target.value);
    const newLevel = (newPercentage / 100) * tankCapacity;
    onChange(parseFloat(newLevel.toFixed(2)));
  };

  const handleSliderBlur = () => {
    if (!editable || !onChange) return;
    // Round to nearest liter on blur
    onChange(Math.round(currentLevel));
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
      <label
        className="block text-sm font-medium mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        {editable ? 'Adjust Fuel Level Before Fill' : 'Fuel Level Before Fill'}
      </label>

      <div className="flex gap-6">
        {/* Tank Visual */}
        <div className="flex-1 flex flex-col items-center">
          {/* Tank Container */}
          <div
            className="relative w-20 h-32 rounded-lg border-4 flex items-end overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              marginBottom: '8px'
            }}
          >
            {/* Fuel Liquid */}
            <div
              className="w-full transition-all duration-300 ease-in-out"
              style={{
                height: `${percentage}%`,
                backgroundColor: fuelColor,
                minHeight: percentage > 0 ? '4px' : '0'
              }}
            />

            {/* Tank Markers */}
            <div
              className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between py-1 px-1 pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                F
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                1/2
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: 'var(--text-muted)' }}
              >
                E
              </span>
            </div>
          </div>

          {/* Tank Cap */}
          <div
            className="w-8 h-2 rounded-t"
            style={{ backgroundColor: 'var(--border-color)' }}
          />
        </div>

        {/* Fuel Level Info */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {/* Fuel Level Display */}
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'var(--bg-tertiary)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Fuel size={16} style={{ color: fuelColor }} />
              <span
                className="text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentLevel.toFixed(1)}
              </span>
              <span
                className="text-lg"
                style={{ color: 'var(--text-muted)' }}
              >
                {units}
              </span>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <span className="font-medium">{percentage.toFixed(0)}%</span> of {tankCapacity} {units}
            </div>
          </div>

          {/* Slider (if editable) */}
          {editable && (
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={percentage}
                onChange={handleSliderChange}
                onBlur={handleSliderBlur}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${fuelColor} 0%, ${fuelColor} ${percentage}%, var(--bg-input) ${percentage}%, var(--bg-input) 100%)`
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          {/* Color Legend */}
          <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              <span>Full (100-70%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />
              <span>Medium (70-40%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#ef4444' }}
              />
              <span>Low (40-20%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#991b1b' }}
              />
              <span>Critical (&lt;20%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      {editable && (
        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          Drag the slider or use gauge buttons below to set fuel level
        </p>
      )}
    </div>
  );
};

export default TankVisualIndicator;
