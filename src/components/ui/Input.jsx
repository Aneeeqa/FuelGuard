import { forwardRef } from 'react';
import { clsx } from 'clsx';

/**
 * Mobile-optimized Input component
 * - Min-height 48px for touch targets
 * - Font-size 16px to prevent iOS zoom
 * - Proper inputmode support for mobile keyboards
 * - Error state styling
 */
const Input = forwardRef(({
  label,
  error,
  helperText,
  className,
  inputClassName,
  type = 'text',
  inputMode,
  ...props
}, ref) => {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        inputMode={inputMode}
        className={clsx(
          'w-full min-h-[48px] px-4 py-3 text-base rounded-xl border bg-[#0f172a] text-white',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'placeholder:text-gray-500',
          error
            ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500'
            : 'border-gray-600',
          inputClassName
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-danger-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-gray-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

