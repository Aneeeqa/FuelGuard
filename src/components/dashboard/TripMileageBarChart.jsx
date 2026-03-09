import React, { memo } from 'react';
import Skeleton from '../ui/Skeleton';

const TripMileageBarChart = memo(({ trips, vehicleProfile }) => {
  if (!trips || trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] rounded-xl bg-[var(--bg-input)]">
        <p className="text-sm text-[var(--text-muted)]">No trip data to display</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Add fuel entries to see trip statistics</p>
      </div>
    );
  }

  const { expectedMileage = 15, theftThreshold = 0.75, efficiencyUnit = 'km/L' } = vehicleProfile;
  const thresholdMileage = expectedMileage * theftThreshold;

  const recentTrips = trips.slice(0, 5);
  const chartTrips = [...recentTrips].reverse();

  const allMileages = chartTrips.map(t => t.tripMileage);
  const maxMileage = Math.max(...allMileages, expectedMileage * 1.5);
  const minMileage = Math.min(...allMileages, thresholdMileage * 0.8);

  const chartHeight = 220;
  const chartWidth = 800;
  const padding = { left: 50, right: 30, top: 20, bottom: 50 };
  const availableWidth = chartWidth - padding.left - padding.right;
  const barWidth = Math.min(100, (availableWidth / chartTrips.length) * 0.6);
  const barGap = (availableWidth / chartTrips.length) * 0.25;

  const getYPosition = (mileage) => {
    const range = maxMileage - minMileage;
    const normalized = (mileage - minMileage) / range;
    return chartHeight - (normalized * chartHeight * 0.8) - 20; // 20px padding bottom, 80% usable height
  };

  const getBarColor = (mileage, isTheftAlert) => {
    if (isTheftAlert) return '#ef4444'; // Red
    if (mileage < expectedMileage * 0.85) return '#f59e0b'; // Orange
    return '#22c55e'; // Green
  };

  const getBarHeight = (mileage) => {
    const range = maxMileage - minMileage;
    const normalized = (mileage - minMileage) / range;
    return Math.max(normalized * chartHeight * 0.8, 10); // Minimum 10px height
  };

  const formatTripLabel = (trip, index) => {
    const date = new Date(trip.endDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const thresholdY = getYPosition(thresholdMileage);
  const expectedY = getYPosition(expectedMileage);

  return (
    <div className="w-full" style={{ height: '350px' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Last 5 Trips
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mileage efficiency per trip
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#22c55e]"></div>
            <span style={{ color: 'var(--text-muted)' }}>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#f59e0b]"></div>
            <span style={{ color: 'var(--text-muted)' }}>Heavy Traffic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#ef4444]"></div>
            <span style={{ color: 'var(--text-muted)' }}>Theft</span>
          </div>
        </div>
      </div>

      <div className="relative w-full" style={{ height: `${chartHeight + padding.bottom}px` }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding.bottom}`}
          width="100%"
          height={chartHeight + padding.bottom}
          className="overflow-visible"
           preserveAspectRatio="xMidYMid meet"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = padding.top + (fraction * chartHeight * 0.8);
            const value = maxMileage - (fraction * (maxMileage - minMileage));
            return (
              <g key={`grid-${fraction}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="var(--border-color)"
                  strokeWidth="1"
                  strokeDasharray={fraction === 0 ? '0' : '4 4'}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--text-muted)"
                >
                  {value.toFixed(1)}
                </text>
              </g>
            );
           })}
 
          <line
            x1={padding.left}
            y1={expectedY}
            x2={chartWidth - padding.right}
            y2={expectedY}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 3"
          />
          <text
            x={chartWidth - padding.right}
            y={expectedY - 6}
            textAnchor="end"
            fontSize="11"
            fill="#3b82f6"
            fontWeight="bold"
          >
            Expected: {expectedMileage.toFixed(1)} {efficiencyUnit}
           </text>
 
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={chartWidth - padding.right}
            y2={thresholdY}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.5"
          />
          <text
            x={chartWidth - padding.right}
            y={thresholdY + 12}
            textAnchor="end"
            fontSize="10"
            fill="#ef4444"
            opacity="0.7"
          >
            Alert: {thresholdMileage.toFixed(1)}
           </text>
 
          {chartTrips.map((trip, index) => {
            const totalBarSpace = barWidth + barGap;
            const x = padding.left + (index * totalBarSpace) + (barGap / 2);
            const barWidthPx = barWidth;
            const y = getYPosition(trip.tripMileage);
            const height = getBarHeight(trip.tripMileage);
             const color = getBarColor(trip.tripMileage, trip.isTheftAlert);

             return (
               <g key={trip.id}>
                <rect
                  x={x}
                  y={y}
                  width={barWidthPx}
                  height={height}
                  fill={color}
                  rx="4"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ filter: trip.isTheftAlert ? 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))' : 'none' }}
                >
                  <title>
                    Trip: {formatTripLabel(trip, index)}
                    Mileage: {trip.tripMileage.toFixed(1)} {efficiencyUnit}
                    Distance: {trip.distance.toFixed(0)} {trip.distanceUnit}
                    Status: {trip.status}
                 </title>
                 </rect>

                 <text
                  x={x + barWidthPx / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="12"
                  fill={color}
                  fontWeight="bold"
                >
                  {trip.tripMileage.toFixed(1)}
                 </text>

                 <text
                  x={x + barWidthPx / 2}
                  y={chartHeight + 35}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--text-muted)"
                  style={{ fontWeight: '500' }}
                >
                  {formatTripLabel(trip, index)}
                 </text>

                 {trip.isTheftAlert && (
                  <text
                    x={x + barWidthPx / 2}
                    y={y + 20}
                    textAnchor="middle"
                    fontSize="18"
                  >
                    ⚠️
                  </text>
                )}
              </g>
            );
          })}

          {/* X-axis line */}
          <line
            x1={padding.left}
            y1={chartHeight + padding.top}
            x2={chartWidth - padding.right}
            y2={chartHeight + padding.top}
            stroke="var(--border-color)"
            strokeWidth="1"
          />

          {/* Y-axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight + padding.top}
            stroke="var(--border-color)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Unit label */}
      <div className="text-center mt-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Trip Mileage ({efficiencyUnit})
        </span>
      </div>
    </div>
  );
});

TripMileageBarChart.displayName = 'TripMileageBarChart';

export default TripMileageBarChart;
