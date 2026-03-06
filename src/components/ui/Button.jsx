import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * Mobile-optimized Button component
 * - Min-height 48px for touch targets
 * - Full-width on mobile by default
 * - Loading state with spinner
 * - Multiple variants: primary, secondary, danger, ghost
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = true,
  loading = false,
  disabled = false,
  className,
  ...props
}) => {
  const baseStyles = clsx(
    'inline-flex items-center justify-center font-semibold rounded-xl',
    'transition-colors duration-200 touchable no-select',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  );

  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500',
    secondary: 'bg-gray-700 text-gray-200 hover:bg-gray-600 active:bg-gray-500 focus:ring-gray-500',
    danger: 'bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800 focus:ring-danger-500',
    ghost: 'bg-transparent text-gray-300 hover:bg-gray-700 active:bg-gray-600 focus:ring-gray-500',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-600/20 active:bg-primary-600/30 focus:ring-primary-500',
  };

  const sizes = {
    sm: 'min-h-[40px] px-4 py-2 text-sm',
    default: 'min-h-[48px] px-6 py-3 text-base',
    lg: 'min-h-[56px] px-8 py-4 text-lg',
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
      {...props}
    >
      {loading && (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      )}
      {children}
    </button>
  );
};

export default Button;

