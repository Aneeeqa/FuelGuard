import { clsx } from 'clsx';
import { CheckCircle, Warning, WarningCircle, Info, XCircle, X } from '@phosphor-icons/react';

/**
 * Alert component for status banners
 * - Color-coded: success (green), warning (yellow), danger (red), info (blue)
 * - Optional dismiss button
 * - Icon support
 * - Fade-in animation
 * - Glow effects for danger variant
 */
const Alert = ({
  children,
  variant = 'info',
  title,
  icon: CustomIcon,
  dismissible = false,
  onDismiss,
  className,
  ...props
}) => {
  const variants = {
    success: {
      container: 'glass border-l-4 animate-fade-in',
      borderClass: 'border-l-success-500',
      icon: CheckCircle,
      iconColor: 'text-success-500',
      iconBg: 'bg-success-500/10',
      textColor: 'text-[var(--text-secondary)]',
      titleColor: 'text-[var(--text-primary)]',
    },
    warning: {
      container: 'glass border-l-4 animate-fade-in',
      borderClass: 'border-l-warning-500',
      icon: Warning,
      iconColor: 'text-warning-500',
      iconBg: 'bg-warning-500/10',
      textColor: 'text-[var(--text-secondary)]',
      titleColor: 'text-[var(--text-primary)]',
    },
    danger: {
      container: 'glass border-l-4 shadow-glow-danger animate-fade-in-up',
      borderClass: 'border-l-danger-500',
      icon: WarningCircle,
      iconColor: 'text-danger-500',
      iconBg: 'bg-danger-500/10',
      textColor: 'text-[var(--text-secondary)]',
      titleColor: 'text-[var(--text-primary)]',
    },
    info: {
      container: 'glass border-l-4 animate-fade-in',
      borderClass: 'border-l-primary-500',
      icon: Info,
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-500/10',
      textColor: 'text-[var(--text-secondary)]',
      titleColor: 'text-[var(--text-primary)]',
    },
  };

  const config = variants[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 flex items-start gap-3 transition-all duration-200',
        config.container,
        config.borderClass,
        dismissible && 'pr-10',
        className
      )}
      style={{
        borderColor: `var(--accent-${variant === 'info' ? 'blue' : variant})`,
        backgroundColor: `color-mix(in srgb, var(--accent-${variant === 'info' ? 'blue' : variant}) 5%, var(--bg-secondary))`,
      }}
      role="alert"
      {...props}
    >
      <div
        className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', config.iconBg)}
      >
        <Icon
          size={20}
          weight={variant === 'danger' || variant === 'warning' ? 'fill' : 'regular'}
          className={clsx(config.iconColor)}
        />
      </div>

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={clsx('font-semibold mb-1', config.titleColor)} style={{ fontWeight: '600' }}>{title}</h4>
        )}
        <div className={clsx('text-sm leading-relaxed', config.textColor)}>{children}</div>
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={clsx(
            'flex-shrink-0 p-2 rounded-xl transition-colors absolute top-4 right-4',
            'hover:bg-black/5 active:bg-black/10',
            'min-w-[32px] min-h-[32px] flex items-center justify-center'
          )}
          style={{ color: 'var(--text-muted)' }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Alert;

