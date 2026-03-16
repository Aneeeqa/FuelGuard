import { clsx } from 'clsx';

/**
 * Mobile-friendly skeleton loader for async content
 * Used in Suspense fallbacks
 * - Animated shimmer effect (animate-pulse)
 * - Multiple variants: text, circular, rectangular, card, avatar, button
 * - ARIA attributes for accessibility
 * - Dimension props (width, height)
 */
const Skeleton = ({ className, variant = 'default', width, height, ...props }) => {
  const variants = {
    default: 'h-4 rounded',
    text: 'h-4 rounded w-3/4',
    circular: 'rounded-full h-10 w-10',
    rectangular: 'rounded',
    card: 'h-24 rounded-xl',
    avatar: 'rounded-full h-12 w-12',
    button: 'h-12 rounded-xl w-20',
  };

  const dimensionStyle = {};
  if (width !== undefined) dimensionStyle.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) dimensionStyle.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        'animate-pulse relative overflow-hidden',
        variants[variant],
        className
      )}
      style={{
        backgroundColor: 'var(--bg-input)',
        ...dimensionStyle,
      }}
      role="status"
      aria-label="Loading"
      aria-live="polite"
      {...props}
    >
      {/* Shimmer effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
};

export default Skeleton;

