import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

/**
 * Alert component for status banners
 * - Color-coded: success (green), warning (yellow), danger (red), info (blue)
 * - Optional dismiss button
 * - Icon support
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
      container: 'bg-success-600/20 border-success-600/30 text-success-400',
      icon: CheckCircle,
      iconColor: 'text-success-500',
    },
    warning: {
      container: 'bg-warning-500/20 border-warning-500/30 text-warning-400',
      icon: AlertTriangle,
      iconColor: 'text-warning-500',
    },
    danger: {
      container: 'bg-danger-600/20 border-danger-600/30 text-danger-400',
      icon: XCircle,
      iconColor: 'text-danger-500',
    },
    info: {
      container: 'bg-primary-600/20 border-primary-600/30 text-primary-400',
      icon: Info,
      iconColor: 'text-primary-500',
    },
  };

  const config = variants[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div
      className={clsx(
        'rounded-xl border p-4 flex items-start gap-3',
        config.container,
        className
      )}
      role="alert"
      {...props}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={clsx(
            'flex-shrink-0 p-1 rounded-lg transition-colors',
            'hover:bg-black/5 active:bg-black/10',
            'min-w-[32px] min-h-[32px] flex items-center justify-center'
          )}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;

