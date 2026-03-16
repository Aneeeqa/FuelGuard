import React, { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Custom comparison function for memo
const chartPropsAreEqual = (prevProps, nextProps) => {
  const prevLen = prevProps.data?.length || 0;
  const nextLen = nextProps.data?.length || 0;
  if (prevLen !== nextLen) return false;
  if (prevLen === 0) return true;
  return prevProps.data[prevLen - 1]?.id ===
    nextProps.data[nextLen - 1]?.id;
};

/**
 * MileageChart component
 * - Recharts LineChart with ResponsiveContainer
 * - Wrapped in React.memo with custom comparator
 * - Touch-friendly tooltip
 */
const MileageChart = memo(({ data, className, efficiencyUnit = 'km/L' }) => {
  const chartData = (data && data.length > 0)
    ? [...data]
        .reverse()
        .map(log => ({
          ...log,
          dateFormatted: formatDate(log.date),
          mileage: log.mileage || 0,
        }))
    : [];

  // Calculate average for reference line
  const validMileages = chartData.filter(d => d.mileage > 0);
  const avgMileage = validMileages.length > 0
    ? validMileages.reduce((sum, d) => sum + d.mileage, 0) / validMileages.length
    : 15;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg shadow-lg border border-[var(--border-color)] min-w-[120px]">
          <p className="text-xs text-[var(--text-muted)] mb-1">{item.dateFormatted}</p>
          <p className={`text-lg font-bold ${item.isFlagged ? 'text-danger-500' : 'text-[var(--accent-blue)]'}`}>
            {item.mileage.toFixed(1)} {efficiencyUnit}
          </p>
          {item.isFlagged && (
            <p className="text-xs text-danger-500 mt-1">⚠️ Alert</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="mileage-chart" className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="dateFormatted"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color-strong)' }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color-strong)' }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgMileage}
            stroke="var(--text-muted)"
            strokeDasharray="5 5"
            label={{
              value: `Avg: ${avgMileage.toFixed(1)}`,
              position: 'right',
              fontSize: 10,
              fill: 'var(--text-muted)'
            }}
          />
          <Line
            type="monotone"
            dataKey="mileage"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.isFlagged ? 6 : 4}
                  fill={payload.isFlagged ? 'var(--accent-alert)' : 'var(--accent-blue)'}
                  stroke={payload.isFlagged ? 'var(--accent-alert)' : 'var(--accent-blue)'}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 8, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}, chartPropsAreEqual);

MileageChart.displayName = 'MileageChart';

export default MileageChart;

