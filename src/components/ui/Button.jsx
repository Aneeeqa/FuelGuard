import { clsx } from 'clsx';
import { Spinner } from '@phosphor-icons/react';

/**
 * Mobile-optimized Button component
 * - Min-height 48px for touch targets
 * - Ripple effect on click
 * - Hover lift effect
 * - Loading state with spinner
 * - Multiple variants: primary, secondary, danger, ghost, outline, gradient
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = true,
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'transition-all duration-200 touchable no-select active-scale',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'relative overflow-hidden'
  );

  const variants = {
    primary: clsx(
      'bg-gradient-primary text-white shadow-glow-blue',
      'hover:shadow-lg hover:-translate-y-0.5',
      'active:translate-y-0 active:shadow-md'
    ),
    secondary: clsx(
      'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]',
      'hover:bg-[var(--bg-primary)] hover:shadow-md',
      'active:scale-95'
    ),
    danger: clsx(
      'bg-gradient-danger text-white shadow-glow-danger',
      'hover:shadow-lg hover:-translate-y-0.5',
      'active:translate-y-0 active:shadow-md'
    ),
    success: clsx(
      'bg-gradient-success text-white shadow-glow-success',
      'hover:shadow-lg hover:-translate-y-0.5',
      'active:translate-y-0 active:shadow-md'
    ),
    ghost: clsx(
      'bg-transparent text-[var(--text-secondary)]',
      'hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]',
      'active:scale-95'
    ),
    outline: clsx(
      'border-2 text-[var(--accent-blue)] border-[var(--accent-blue)]',
      'hover:bg-[var(--accent-blue)]/10 hover:shadow-md',
      'active:scale-95'
    ),
    gradient: clsx(
      'bg-gradient-primary text-white shadow-glow-blue',
      'hover:shadow-xl hover:-translate-y-0.5',
      'active:translate-y-0 active:shadow-lg'
    ),
  };

  const sizes = {
    sm: 'min-h-[40px] px-4 py-2 text-sm',
    default: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[56px] px-8 py-4 text-lg',
    icon: 'min-h-[48px] w-12 h-12 p-0',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          props.onClick?.(e);
        }
        props.onKeyDown?.(e);
      }}
      {...props}
    >
      {/* Ripple effect overlay */}
      <span className="absolute inset-0 ripple" />

      {loading && (
        <Spinner size={20} className="animate-spin" />
      )}

      {!loading && Icon && iconPosition === 'left' && (
        <Icon size={20} className="mr-2" />
      )}

      {!loading ? children : null}

      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={20} className="ml-2" />
      )}
    </button>
  );
};

export default Button;

