import React, { memo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { getCO2LevelColor } from '../../config/carbonConfig';

// Format month for display - supports "YYYY-MM" and short month names like "Jan"
const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  if (monthStr.includes('-')) {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  return monthStr;
};

// Custom comparison function for memo
const chartPropsAreEqual = (prevProps, nextProps) => {
  const prevLen = prevProps.data?.length || 0;
  const nextLen = nextProps.data?.length || 0;
  if (prevLen !== nextLen) return false;
  if (prevLen === 0) return true;
  return prevProps.data[prevLen - 1]?.month ===
    nextProps.data[nextLen - 1]?.month;
};

/**
 * CarbonChart component
 * - Recharts BarChart with ResponsiveContainer
 * - Wrapped in React.memo with custom comparator
 * - Touch-friendly tooltip
 * - Color-coded bars based on emission levels
 */
const CarbonChart = memo(({ data, fuelType = 'gasoline', className, loading, period }) => {
  const chartData = (data && data.length > 0)
    ? [...data].slice(-12).map(d => ({
        ...d,
        monthFormatted: formatMonth(d.month),
        co2: d.co2 || 0,
      }))
    : [];

  // Calculate average for reference
  const avgCO2 = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + (d.co2 || 0), 0) / chartData.length
    : 0;

  const getBarColor = (co2) => co2 ? getCO2LevelColor(co2) : 'var(--accent-blue)';

  // Custom tooltip for touch-friendly display
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[var(--bg-secondary)] p-3 rounded-lg shadow-lg border border-[var(--border-color)] min-w-[140px]">
          <p className="text-xs text-[var(--text-muted)] mb-1">{item.monthFormatted}</p>
          <p
            className={`text-lg font-bold ${
              (item.co2 || 0) < 100
                ? 'text-success-500'
                : (item.co2 || 0) < 200
                ? 'text-warning-500'
                : 'text-danger-500'
            }`}
          >
            {(item.co2 || 0).toFixed(1)} kg CO₂
          </p>
          {(item.co2 || 0) > avgCO2 * 1.2 && (
            <p className="text-xs text-danger-500 mt-1">⚠️ High emissions</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div data-testid="carbon-chart" className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis
            dataKey="monthFormatted"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color-strong)' }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-color-strong)' }}
            tickFormatter={(value) => `${value}kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="co2"
            radius={[4, 4, 0, 0]}
            fill="var(--accent-blue)"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.co2)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}, chartPropsAreEqual);

CarbonChart.displayName = 'CarbonChart';

export default CarbonChart;
