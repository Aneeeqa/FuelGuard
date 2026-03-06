import { clsx } from 'clsx';

/**
 * Card component with multiple variants
 * - Rounded corners, shadow, padding
 * - Supports different padding sizes
 * - Optional hover/active states
 */
const Card = ({
  children,
  className,
  padding = 'default',
  variant = 'default',
  interactive = false,
  ...props
}) => {
  const paddingSizes = {
    none: '',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-5',
  };

  const variants = {
    default: 'bg-[var(--bg-secondary)] border border-[var(--border-color)]',
    elevated: 'bg-[var(--bg-secondary)] shadow-md shadow-[var(--shadow-color)]',
    outlined: 'bg-[var(--bg-secondary)] border-2 border-[var(--border-color-strong)]',
    filled: 'bg-[var(--bg-input)] border border-[var(--border-color)]',
  };

  return (
    <div
      className={clsx(
        'rounded-xl shadow-sm',
        variants[variant],
        paddingSizes[padding],
        interactive && 'cursor-pointer hover:shadow-md active:shadow-sm transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card subcomponents for structured layouts
Card.Header = ({ children, className, ...props }) => (
  <div className={clsx('pb-3 border-b border-[var(--border-color)]', className)} {...props}>
    {children}
  </div>
);

Card.Title = ({ children, className, ...props }) => (
  <h3 className={clsx('font-semibold text-[var(--text-primary)]', className)} {...props}>
    {children}
  </h3>
);

Card.Body = ({ children, className, ...props }) => (
  <div className={clsx('py-3', className)} {...props}>
    {children}
  </div>
);

Card.Footer = ({ children, className, ...props }) => (
  <div className={clsx('pt-3 border-t border-[var(--border-color)]', className)} {...props}>
    {children}
  </div>
);

export default Card;

