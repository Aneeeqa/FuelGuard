/**
 * GPS Odometer Verification Component
 *
 * Displays GPS vs Odometer distance comparison
 * Shows odometer tampering alerts when detected
 */

import React from 'react';
import { MapPin, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

/**
 * GPS Odometer Verification Status Display
 * @param {Object} props - Component props
 * @param {Object} props.verificationData - Verification data from tank-to-tank calculations
 * @param {Object} props.settings - Vehicle GPS settings
 * @param {string} props.distanceUnit - Distance unit ('km' or 'mi')
 */
const GPSOdometerVerification = ({ verificationData, settings = {}, distanceUnit = 'km' }) => {
  if (!verificationData || !verificationData.odometerTampering) {
    return null;
  }

  const { odometerTampering } = verificationData;
  const tolerance = settings.odometerTolerancePercentage || 10;

  // No GPS data available
  if (!odometerTampering.hasGPSData) {
    return (
      <div className="gps-verification gps-verification--no-data">
        <MapPin size={16} className="text-gray-400" />
        <span className="text-sm text-gray-500">
          No GPS data available for odometer verification
        </span>
      </div>
    );
  }

  const { gpsDistance, odometerDistance, difference, differencePercentage, isWithinTolerance, possibleTampering } = odometerTampering;

  // Determine status
  let status = 'unknown';
  let statusColor = 'gray';
  let statusIcon = <Activity size={16} />;

  if (isWithinTolerance) {
    status = 'verified';
    statusColor = 'green';
    statusIcon = <CheckCircle size={16} />;
  } else if (possibleTampering) {
    status = 'tampering-detected';
    statusColor = 'red';
    statusIcon = <AlertTriangle size={16} />;
  } else {
    status = 'outside-tolerance';
    statusColor = 'yellow';
    statusIcon = <AlertTriangle size={16} />;
  }

  const statusColors = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-600 dark:text-green-400'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: 'text-yellow-600 dark:text-yellow-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-600 dark:text-red-400'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-800',
      icon: 'text-gray-600 dark:text-gray-400'
    }
  };

  const colors = statusColors[statusColor] || statusColors.gray;

  return (
    <div className={`gps-verification gps-verification--${status} ${colors.bg} ${colors.border} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`${colors.icon} ${statusIcon}`}>{statusIcon}</div>
          <h4 className={`font-semibold ${colors.text}`}>
            GPS Odometer Verification
          </h4>
        </div>
        {isWithinTolerance && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
            ✓ Verified
          </span>
        )}
        {possibleTampering && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
            ⚠ Tampering Detected
          </span>
        )}
        {!isWithinTolerance && !possibleTampering && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}>
            Outside Tolerance
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        {/* GPS Distance */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
            GPS Distance
          </label>
          <div className="font-mono font-semibold text-lg">
            {gpsDistance !== null && gpsDistance !== undefined
              ? `${gpsDistance.toFixed(2)} ${distanceUnit}`
              : 'N/A'
            }
          </div>
        </div>

        {/* Odometer Distance */}
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
            Odometer Distance
          </label>
          <div className="font-mono font-semibold text-lg">
            {odometerDistance.toFixed(2)} {distanceUnit}
          </div>
        </div>
      </div>

      {/* Difference */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
          Difference
        </label>
        <div className={`font-mono font-semibold ${difference > 0 ? 'text-blue-600' : difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
          {difference > 0 ? '+' : ''}{difference.toFixed(2)} {distanceUnit}
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
            ({difference > 0 ? '+' : ''}{differencePercentage.toFixed(1)}%)
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-sm ${colors.text} p-3 rounded ${colors.bg} border-l-4 ${colors.border.replace('border', 'border-l')}`}>
        {possibleTampering && (
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Possible Odometer Tampering Detected</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                GPS shows {Math.abs(difference).toFixed(2)} {distanceUnit} {difference > 0 ? 'less' : 'more'} than odometer.
                This may indicate odometer rollback or tampering.
              </p>
            </div>
          </div>
        )}
        {!isWithinTolerance && !possibleTampering && (
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Odometer Outside Tolerance</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Difference is {Math.abs(differencePercentage).toFixed(1)}% which exceeds the {tolerance}% tolerance.
                This could be due to GPS signal issues or vehicle transport.
              </p>
            </div>
          </div>
        )}
        {isWithinTolerance && (
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Odometer Verified by GPS</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Odometer and GPS distances are within {tolerance}% tolerance.
                Odometer readings are reliable.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tolerance Note */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Tolerance: ±{tolerance}% | GPS Accuracy: ±{settings.gpsAccuracy || 10}m
        </p>
      </div>
    </div>
  );
};

/**
 * GPS Route Quality Indicator
 * @param {Object} props - Component props
 * @param {Object} props.gpsRouteQuality - GPS route quality data
 */
const GPSRouteQualityIndicator = ({ gpsRouteQuality }) => {
  if (!gpsRouteQuality) {
    return null;
  }

  const qualityColors = {
    excellent: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
    good: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
    fair: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
    poor: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
    insufficient: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-500' }
  };

  const colors = qualityColors[gpsRouteQuality.quality] || qualityColors.poor;

  return (
    <div className={`gps-quality-indicator ${colors.bg} ${colors.text} border-l-4 ${colors.border} p-3 rounded`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide mb-1">
            GPS Route Quality
          </p>
          <p className="text-sm font-semibold">
            {gpsRouteQuality.quality.charAt(0).toUpperCase() + gpsRouteQuality.quality.slice(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs">
            {gpsRouteQuality.pointCount} points
          </p>
          {gpsRouteQuality.averageAccuracy !== null && (
            <p className="text-xs">
              ±{gpsRouteQuality.averageAccuracy.toFixed(0)}m accuracy
            </p>
          )}
        </div>
      </div>
      {gpsRouteQuality.message && (
        <p className="text-xs mt-2 opacity-75">
          {gpsRouteQuality.message}
        </p>
      )}
    </div>
  );
};

export { GPSOdometerVerification, GPSRouteQualityIndicator };
export default GPSOdometerVerification;
