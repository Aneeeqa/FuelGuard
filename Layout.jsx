import { clsx } from 'clsx';

/**
 * StatCard component for dashboard statistics
 * - Icon + large value + label layout
 * - Min-height 100px for easy tapping
 * - Conditional coloring based on status
 * - Hover lift effect
 * - Gradient backgrounds for special statuses
 */
const StatCard = ({
  icon: Icon,
  value,
  label,
  unit,
  status = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'fuel'
  trend,
  className,
  onClick,
  ...props
}) => {
  const statusStyles = {
    default: {
      container: 'glass border',
      icon: 'text-[var(--text-muted)]',
      value: 'text-[var(--text-primary)]',
      bgGradient: false,
    },
    success: {
      container: 'glass border',
      icon: 'text-success-500',
      value: 'text-success-500',
      bgGradient: true,
      bgFrom: 'from-success-500/10',
      bgTo: 'to-success-500/5',
    },
    warning: {
      container: 'glass border',
      icon: 'text-warning-500',
      value: 'text-warning-500',
      bgGradient: true,
      bgFrom: 'from-warning-500/10',
      bgTo: 'to-warning-500/5',
    },
    danger: {
      container: 'glass border shadow-glow-danger',
      icon: 'text-danger-500',
      value: 'text-danger-500',
      bgGradient: true,
      bgFrom: 'from-danger-500/15',
      bgTo: 'to-danger-500/5',
    },
    fuel: {
      container: 'glass border',
      icon: 'text-warning-500',
      value: 'text-warning-500',
      bgGradient: true,
      bgFrom: 'from-warning-500/10',
      bgTo: 'to-warning-500/5',
    },
  };

  const styles = statusStyles[status];

  return (
    <div
      className={clsx(
        'rounded-xl p-4 shadow-md min-h-[100px]',
        'transition-all duration-300',
        styles.container,
        onClick && 'cursor-pointer hover-lift active-scale',
        className
      )}
      style={{
        background: styles.bgGradient 
          ? `linear-gradient(135deg, color-mix(in srgb, var(--accent-${status}) 10%, var(--bg-secondary)) 0%, var(--bg-secondary) 100%)`
          : 'var(--bg-secondary)',
        borderColor: status === 'danger' ? 'var(--accent-alert)' : 'var(--border-color)',
        boxShadow: onClick ? 'var(--shadow-md)' : 'var(--shadow)',
      }}
      onClick={onClick}
      {...props}
    >
      {/* Icon and Label */}
      <div className={clsx('flex items-center gap-2 mb-3', styles.icon)}>
        {Icon && (
          <div 
            className={clsx('w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300')}
            style={{
              backgroundColor: `color-mix(in srgb, var(--accent-${status}) 15%, transparent)`,
            }}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <span 
          className={clsx('text-3xl font-bold tracking-tight', styles.value)}
          style={{ 
            color: status === 'default' ? 'var(--text-primary)' : `var(--accent-${status})` 
          }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Optional Trend Indicator */}
      {trend && (
        <div
          className={clsx(
            'mt-2 text-xs font-medium flex items-center gap-1',
            trend.direction === 'up' ? 'text-success-500' : 'text-danger-500'
          )}
        >
          {trend.direction === 'up' ? '↑' : '↓'} 
          <span className="font-semibold">{trend.value}</span>
          <span style={{ color: 'var(--text-muted)' }}>vs last period</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

