import { clsx } from 'clsx';

/**
 * Badge component for status indicators
 * - Multiple variants: success, warning, danger, info, default
 * - Different sizes: sm, md, lg
 * - With or without icon
 */
const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className,
  ...props
}) => {
  const variants = {
    default: {
      base: 'border border-[var(--border-color)]',
      bg: 'bg-[var(--bg-secondary)]',
      text: 'text-[var(--text-primary)]',
    },
    success: {
      base: 'border border-success-500/30',
      bg: 'bg-success-500/10',
      text: 'text-success-600 dark:text-success-400',
    },
    warning: {
      base: 'border border-warning-500/30',
      bg: 'bg-warning-500/10',
      text: 'text-warning-600 dark:text-warning-400',
    },
    danger: {
      base: 'border border-danger-500/30',
      bg: 'bg-danger-500/10',
      text: 'text-danger-600 dark:text-danger-400',
    },
    info: {
      base: 'border border-primary-500/30',
      bg: 'bg-primary-500/10',
      text: 'text-primary-600 dark:text-primary-400',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const config = variants[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full transition-all duration-200',
        config.base,
        config.bg,
        config.text,
        sizes[size],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

/**
 * Dot badge for small indicators
 */
export const DotBadge = ({
  variant = 'default',
  className,
  ...props
}) => {
  const colors = {
    default: 'bg-[var(--text-muted)]',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    danger: 'bg-danger-500',
    info: 'bg-primary-500',
  };

  return (
    <span
      className={clsx(
        'inline-block w-2 h-2 rounded-full animate-pulse',
        colors[variant],
        className
      )}
      {...props}
    />
  );
};

/**
 * Pill badge for larger indicators
 */
export const PillBadge = ({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]',
    success: 'bg-success-500 text-white shadow-glow-success',
    warning: 'bg-warning-500 text-white shadow-glow-fuel',
    danger: 'bg-danger-500 text-white shadow-glow-danger',
    info: 'bg-primary-500 text-white shadow-glow-blue',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;