/**
 * Full Tank Toggle Component
 *
 * Purpose: Toggle switch to enable/disable tank-to-tank tracking
 *
 * @component FullTankToggle
 * @description A toggle that enables Tank-to-Tank tracking when the user fills their tank to full.
 * This is critical for accurate fuel consumption tracking and theft detection.
 */

import { useState } from 'react';
import { Info, Fuel } from 'lucide-react';

/**
 * FullTankToggle Component
 *
 * Props:
 * - checked: boolean - Current toggle state (true = full tank, false = partial)
 * - onChange: (checked: boolean) => void - Callback when toggle changes
 * - tankCapacity: number - Vehicle's tank capacity in liters
 * - showLearnMore: boolean - Whether to show the "Learn more" link (default: true)
 *
 * Time Complexity: O(1) - Simple toggle with conditional rendering
 * Space Complexity: O(1) - Fixed component size
 */
const FullTankToggle = ({ checked, onChange, tankCapacity, showLearnMore = true }) => {
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  const handleToggleChange = (e) => {
    if (typeof onChange === 'function') {
      onChange(e.target.checked);
    }
  };

  const handleLearnMore = (e) => {
    e.preventDefault();
    setShowLearnMoreModal(true);
  };

  return (
    <>
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: `1px solid ${checked ? 'var(--accent-success)' : 'var(--border-color)'}`
        }}
      >
        {/* Toggle Label */}
        <div className="flex items-start gap-3">
          {/* Toggle Switch */}
          <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={checked}
              onChange={handleToggleChange}
            />
            <div
              className="w-11 h-6 rounded-full peer peer-focus:outline-none peer-focus:ring-2 transition-all duration-200"
              style={{
                backgroundColor: checked ? 'var(--accent-success)' : 'var(--bg-tertiary)'
              }}
            >
              <div
                className={`absolute top-0.5 left-0.5 bg-white rounded-full transition-all duration-200 ${
                  checked ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ width: '20px', height: '20px' }}
              />
            </div>
          </label>

          {/* Toggle Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold"
                style={{
                  color: checked ? 'var(--accent-success)' : 'var(--text-primary)',
                  fontSize: '1rem'
                }}
              >
                🚗 Filled tank to full
              </span>
            </div>

            {/* Benefits Text */}
            {checked && (
              <div className="mt-2 space-y-1 animate-in fade-in duration-300">
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  ✓ Enable accurate Tank-to-Tank tracking
                </p>
                <ul
                  className="text-sm space-y-0.5 ml-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <li>• Detect fuel theft more precisely</li>
                  <li>• Track real fuel consumption</li>
                  <li>• Better mileage statistics</li>
                </ul>
              </div>
            )}

            {/* Tank Capacity Info */}
            {tankCapacity && (
              <div className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                Tank capacity: <span className="font-medium">{tankCapacity} L</span>
              </div>
            )}
          </div>
        </div>

        {/* Learn More Link */}
        {showLearnMore && (
          <button
            onClick={handleLearnMore}
            className="mt-3 flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: 'var(--accent-blue)' }}
          >
            <Info size={16} />
            Learn more about Tank-to-Tank tracking
          </button>
        )}
      </div>

      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowLearnMoreModal(false)}
        >
          <div
            className="rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-blue) 20%, transparent)'
                }}
              >
                <Fuel size={24} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                What is Tank-to-Tank Tracking?
              </h2>
            </div>

            <div className="space-y-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Tank-to-Tank tracking is the <strong>most accurate method</strong> to measure
                fuel consumption and detect fuel theft.
              </p>

              <div>
                <p className="font-semibold mb-2">How it works:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Fill your tank to full</li>
                  <li>Drive normally</li>
                  <li>Fill tank to full again</li>
                  <li>The amount added = fuel consumed</li>
                </ol>
              </div>

              <div>
                <p className="font-semibold mb-2">Benefits:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>More accurate theft detection</li>
                  <li>Better mileage statistics</li>
                  <li>No estimation required</li>
                </ul>
              </div>

              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, transparent)',
                  border: '1px solid var(--accent-blue)'
                }}
              >
                <p className="font-semibold" style={{ color: 'var(--accent-blue)' }}>
                  Example:
                </p>
                <p className="mt-1">
                  Tank: 100L, Start: 100L (full), Drive: 200 km, Refill: 36L (now full)
                </p>
                <p className="mt-1 font-mono">
                  Theft: 36L - (200km ÷ 15km/L) = 22.7L
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLearnMoreModal(false)}
              className="w-full mt-6 py-3 rounded-lg font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--accent-blue)',
                color: 'white'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FullTankToggle;
