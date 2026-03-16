import { clsx } from 'clsx';

/**
 * Card component with multiple variants
 * - Rounded corners, shadow, padding
 * - Supports different padding sizes
 * - Optional hover/active states
 * - Glassmorphism support
 * - Gradient variants
 */
const Card = ({
  children,
  className,
  padding = 'default',
  variant = 'default',
  interactive = false,
  gradient = false,
  title,
  onClick,
  ...props
}) => {
  const paddingSizes = {
    none: '',
    false: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-5',
    xl: 'p-6',
  };

  const variants = {
    default: 'glass border',
    elevated: 'glass border shadow-lg',
    outlined: 'glass border-2',
    filled: 'border',
    flat: 'bg-transparent',
  };

  const gradients = {
    blue: 'bg-gradient-primary',
    danger: 'bg-gradient-danger',
    success: 'bg-gradient-success',
    fuel: 'bg-gradient-fuel',
  };

  // Resolve padding - support boolean false
  const resolvedPadding = padding === false ? 'none' : padding;
  // Auto-detect interactive from onClick
  const isInteractive = interactive || !!onClick;

  return (
    <div
      className={clsx(
        'rounded-xl transition-all duration-300',
        variants[variant],
        paddingSizes[resolvedPadding] ?? paddingSizes.default,
        isInteractive && 'cursor-pointer hover-lift active-scale',
        !gradient && 'shadow-sm',
        isInteractive && !gradient && 'shadow-md hover:shadow-lg',
        className
      )}
      style={{
        background: gradient 
          ? gradients[gradient] 
          : variant === 'filled' 
          ? 'var(--bg-input)' 
          : undefined,
        borderColor: 'var(--border-color)',
        color: gradient ? '#fff' : undefined,
      }}
      onClick={onClick}
      tabIndex={isInteractive ? 0 : undefined}
      role="article"
      {...props}
    >
      {title && <Card.Title>{title}</Card.Title>}
      {children}
    </div>
  );
};

// Card subcomponents for structured layouts
Card.Header = ({ children, className, ...props }) => (
  <div 
    className={clsx('pb-3 border-b', className)}
    style={{ borderColor: 'var(--border-color)' }}
    {...props}
  >
    {children}
  </div>
);

Card.Title = ({ children, className, gradient = false, ...props }) => (
  <h3 
    className={clsx('font-semibold', gradient ? 'text-white' : '', className)}
    style={{ color: gradient ? '#fff' : 'var(--text-primary)' }}
    {...props}
  >
    {children}
  </h3>
);

Card.Subtitle = ({ children, className, ...props }) => (
  <p 
    className={clsx('text-sm mt-1', className)}
    style={{ color: 'var(--text-muted)' }}
    {...props}
  >
    {children}
  </p>
);

Card.Body = ({ children, className, ...props }) => (
  <div className={clsx('py-3', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className, ...props }) => (
  <div 
    className={clsx('pt-3 border-t', className)}
    style={{ borderColor: 'var(--border-color)' }}
    {...props}
  >
    {children}
  </div>
);

Card.Actions = ({ children, className, ...props }) => (
  <div 
    className={clsx('flex gap-2 pt-3', className)}
    style={{ borderColor: 'var(--border-color)' }}
    {...props}
  >
    {children}
  </div>
);

export default Card;

