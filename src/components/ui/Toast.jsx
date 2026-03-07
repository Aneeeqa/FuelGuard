import { clsx } from 'clsx';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Toast notification component
 * - Slide-in from top-right
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss option
 * - Multiple variants: success, error, warning, info
 */
const Toast = ({ 
  message, 
  variant = 'info', 
  duration = 5000,
  onDismiss,
  className 
}) => {
  const [visible, setVisible] = useState(true);

  const variants = {
    success: {
      icon: CheckCircle,
      container: 'glass border-l-4 animate-fade-in-right',
      borderClass: 'border-l-success-500',
      iconColor: 'text-success-500',
      bgClass: 'bg-success-50 dark:bg-success-900/10',
    },
    error: {
      icon: XCircle,
      container: 'glass border-l-4 animate-fade-in-right',
      borderClass: 'border-l-danger-500',
      iconColor: 'text-danger-500',
      bgClass: 'bg-danger-50 dark:bg-danger-900/10',
    },
    warning: {
      icon: AlertCircle,
      container: 'glass border-l-4 animate-fade-in-right',
      borderClass: 'border-l-warning-500',
      iconColor: 'text-warning-500',
      bgClass: 'bg-warning-50 dark:bg-warning-900/10',
    },
    info: {
      icon: Info,
      container: 'glass border-l-4 animate-fade-in-right',
      borderClass: 'border-l-primary-500',
      iconColor: 'text-primary-500',
      bgClass: 'bg-primary-50 dark:bg-primary-900/10',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 300);
  };

  if (!visible) return null;

  return (
    <div
      className={clsx(
        'fixed top-4 right-4 z-[100] min-w-[320px] max-w-md rounded-xl shadow-lg',
        'transition-all duration-300 transform',
        'flex items-start gap-3 p-4',
        config.container,
        config.borderClass,
        config.bgClass,
        className
      )}
      style={{
        animation: 'slideInRight 0.3s ease-out',
        boxShadow: 'var(--shadow-xl)',
      }}
      role="alert"
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-black/5 active:bg-black/10"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Toast container component for managing multiple toasts
 */
export const ToastContainer = ({ toasts = [], removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Hook for managing toasts
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, variant = 'info', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showSuccess = (message, duration) => addToast(message, 'success', duration);
  const showError = (message, duration) => addToast(message, 'error', duration);
  const showWarning = (message, duration) => addToast(message, 'warning', duration);
  const showInfo = (message, duration) => addToast(message, 'info', duration);

  return {
    toasts,
    removeToast,
    addToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default Toast;