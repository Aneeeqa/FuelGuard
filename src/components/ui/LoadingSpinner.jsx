import { clsx } from 'clsx';

/**
 * LoadingSpinner component
 * - Animated spinner
 * - Multiple sizes: sm, md, lg, xl
 * - With or without label
 */
const LoadingSpinner = ({ 
  size = 'md', 
  label,
  className 
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div 
        className={clsx(
          sizes[size],
          'rounded-full animate-spin',
          'border-[var(--border-color)]',
          'border-t-[var(--accent-blue)]'
        )}
      />
      {label && (
        <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      )}
    </div>
  );
};

/**
 * Inline spinner for buttons and small spaces
 */
export const InlineSpinner = ({ className }) => (
  <svg 
    className={clsx('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    style={{ width: '20px', height: '20px' }}
  >
    <circle 
      className="opacity-25" 
      cx="12" 
      cy="12" 
      r="10" 
      stroke="currentColor" 
      strokeWidth="4"
      style={{ color: 'var(--border-color)' }}
    />
    <path 
      className="opacity-75" 
      fill="currentColor" 
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      style={{ color: 'var(--accent-blue)' }}
    />
  </svg>
);

export default LoadingSpinner;