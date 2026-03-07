import React, { memo, lazy, Suspense } from 'react';
import Skeleton from '../ui/Skeleton';

// Lazy load recharts components
const LazyChart = lazy(() =>
  import('recharts').then(module => ({
    default: ({ data, fuelType }) => {
      const {
        BarChart,
        Bar,
        XAxis,
        YAxis,
        Tooltip,
        ResponsiveContainer,
        CartesianGrid,
        Cell
      } = module;

      // Format month for display
      const formatMonth = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      };

      // Prepare chart data (limit to last 12 months)
      const chartData = [...data].slice(-12).map(d => ({
        ...d,
        monthFormatted: formatMonth(d.month),
      }));

      // Calculate average for reference
      const avgCO2 = chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.co2, 0) / chartData.length
        : 0;

      // Color scale based on CO2 levels (green to red)
      const getBarColor = (co2) => {
        // Normalize CO2: 0-100kg = green, 100-200kg = yellow, 200+kg = red
        if (co2 < 100) return 'var(--accent-success)';
        if (co2 < 200) return 'var(--accent-warning)';
        return 'var(--accent-alert)';
      };

      // Custom tooltip for touch-friendly display
      const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="bg-[var(--bg-secondary)] p-3 rounded-lg shadow-lg border border-[var(--border-color)] min-w-[140px]">
              <p className="text-xs text-[var(--text-muted)] mb-1">{data.monthFormatted}</p>
              <p
                className={`text-lg font-bold ${
                  data.co2 < 100
                    ? 'text-success-500'
                    : data.co2 < 200
                    ? 'text-warning-500'
                    : 'text-danger-500'
                }`}
              >
                {data.co2.toFixed(1)} kg CO₂
              </p>
              {data.co2 > avgCO2 * 1.2 && (
                <p className="text-xs text-danger-500 mt-1">⚠️ High emissions</p>
              )}
            </div>
          );
        }
        return null;
      };

      return (
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
      );
    }
  }))
);

// Custom comparison function for memo
const chartPropsAreEqual = (prevProps, nextProps) => {
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.data.length === 0) return true;
  // Compare last month to detect new entries
  return prevProps.data[prevProps.data.length - 1]?.month ===
    nextProps.data[nextProps.data.length - 1]?.month;
};

/**
 * CarbonChart component
 * - Recharts BarChart with ResponsiveContainer
 * - Wrapped in React.memo with custom comparator
 * - Touch-friendly tooltip
 * - Color-coded bars based on emission levels
 * - Lazy loaded for performance
 */
const CarbonChart = memo(({ data, fuelType = 'gasoline', className }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)]">
        <p className="text-sm text-[var(--text-muted)]">
          No carbon data to display
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
        <LazyChart data={data} fuelType={fuelType} />
      </Suspense>
    </div>
  );
}, chartPropsAreEqual);

CarbonChart.displayName = 'CarbonChart';

export default CarbonChart;
