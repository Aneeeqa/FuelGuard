import { clsx } from 'clsx';

/**
 * StatCard component for dashboard statistics
 * - Icon + large value + label layout
 * - Min-height 80px for easy tapping
 * - Conditional coloring based on status
 */
const StatCard = ({
  icon: Icon,
  value,
  label,
  unit,
  status = 'default', // 'default' | 'success' | 'warning' | 'danger'
  trend,
  className,
  onClick,
  ...props
}) => {
  const statusStyles = {
    default: {
      container: 'bg-[var(--bg-secondary)] border-[var(--border-color)]',
      icon: 'text-[var(--text-muted)]',
      value: 'text-[var(--text-primary)]',
    },
    success: {
      container: 'bg-success-600/20 border-success-600/30',
      icon: 'text-success-500',
      value: 'text-success-400',
    },
    warning: {
      container: 'bg-warning-500/20 border-warning-500/30',
      icon: 'text-warning-500',
      value: 'text-warning-400',
    },
    danger: {
      container: 'bg-danger-600/20 border-danger-600/30',
      icon: 'text-danger-500',
      value: 'text-danger-400',
    },
    fuel: {
      container: 'bg-warning-500/20 border-warning-500/30',
      icon: 'text-warning-500',
      value: 'text-warning-400',
    },
  };

  const styles = statusStyles[status];

  return (
    <div
      className={clsx(
        'rounded-xl p-4 shadow-sm border min-h-[100px]',
        'transition-all duration-200',
        styles.container,
        onClick && 'cursor-pointer hover:shadow-md active:shadow-sm',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Icon and Label */}
      <div className={clsx('flex items-center gap-2 mb-2', styles.icon)}>
        {Icon && <Icon className="w-5 h-5" />}
        <span className="text-sm font-medium">{label}</span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className={clsx('text-2xl font-bold', styles.value)}>
          {value}
        </span>
        {unit && (
          <span className="text-sm font-normal text-[var(--text-muted)]">{unit}</span>
        )}
      </div>

      {/* Optional Trend Indicator */}
      {trend && (
        <div
          className={clsx(
            'mt-2 text-xs font-medium',
            trend.direction === 'up' ? 'text-success-500' : 'text-danger-500'
          )}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};

export default StatCard;

