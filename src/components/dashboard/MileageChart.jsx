import React, { memo, lazy, Suspense } from 'react';
import Skeleton from '../ui/Skeleton';

// Lazy load recharts components
const LazyChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data }) => {
      const { 
        LineChart, 
        Line, 
        XAxis, 
        YAxis, 
        Tooltip, 
        ResponsiveContainer,
        ReferenceLine,
        CartesianGrid 
      } = module;

      // Format date for display
      const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };

      // Prepare chart data (reverse to show oldest first)
      const chartData = [...data]
        .reverse()
        .map(log => ({
          ...log,
          dateFormatted: formatDate(log.date),
          mileage: log.mileage || 0,
        }));

      // Calculate average for reference line
      const validMileages = chartData.filter(d => d.mileage > 0);
      const avgMileage = validMileages.length > 0
        ? validMileages.reduce((sum, d) => sum + d.mileage, 0) / validMileages.length
        : 15;

      // Custom tooltip for touch-friendly display
      const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="bg-[#1E293B] p-3 rounded-lg shadow-lg border border-gray-700 min-w-[120px]">
              <p className="text-xs text-gray-400 mb-1">{data.dateFormatted}</p>
              <p className={`text-lg font-bold ${data.isFlagged ? 'text-danger-500' : 'text-primary-500'}`}>
                {data.mileage.toFixed(1)} km/L
              </p>
              {data.isFlagged && (
                <p className="text-xs text-danger-500 mt-1">⚠️ Alert</p>
              )}
            </div>
          );
        }
        return null;
      };

      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart 
            data={chartData} 
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="dateFormatted" 
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={avgMileage} 
              stroke="#6b7280" 
              strokeDasharray="5 5"
              label={{ 
                value: `Avg: ${avgMileage.toFixed(1)}`, 
                position: 'right',
                fontSize: 10,
                fill: '#9ca3af'
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
                    fill={payload.isFlagged ? '#dc2626' : '#3b82f6'}
                    stroke={payload.isFlagged ? '#dc2626' : '#3b82f6'}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 8, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  }))
);

// Custom comparison function for memo
const chartPropsAreEqual = (prevProps, nextProps) => {
  if (prevProps.data.length !== nextProps.data.length) return false;
  if (prevProps.data.length === 0) return true;
  // Compare last item ID to detect new entries
  return prevProps.data[prevProps.data.length - 1]?.id === 
         nextProps.data[nextProps.data.length - 1]?.id;
};

/**
 * MileageChart component
 * - Recharts LineChart with ResponsiveContainer
 * - Wrapped in React.memo with custom comparator
 * - Touch-friendly tooltip
 * - Lazy loaded for performance
 */
const MileageChart = memo(({ data, className }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] bg-gray-800 rounded-xl">
        <p className="text-gray-400 text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
        <LazyChart data={data} />
      </Suspense>
    </div>
  );
}, chartPropsAreEqual);

MileageChart.displayName = 'MileageChart';

export default MileageChart;

