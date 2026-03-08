import { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeSlash, MagnifyingGlass, MapPin, Drop, Calendar } from '@phosphor-icons/react';

/**
 * Mobile-optimized Input component
 * - Min-height 48px for touch targets
 * - Font-size 16px to prevent iOS zoom
 * - Proper inputmode support for mobile keyboards
 * - Floating label support
 * - Icon support
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
  icon,
  floatingLabel = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const handleChange = (e) => {
    setHasValue(e.target.value.length > 0);
    props.onChange?.(e);
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const getIcon = () => {
    if (icon === 'search') return MagnifyingGlass;
    if (icon === 'map-pin') return MapPin;
    if (icon === 'fuel') return Drop;
    if (icon === 'calendar') return Calendar;
    return null;
  };

  const Icon = getIcon();

  if (floatingLabel) {
    return (
      <div className={clsx('relative w-full', className)}>
        <input
          ref={ref}
          type={inputType}
          inputMode={inputMode}
          className={clsx(
            'w-full min-h-[52px] px-4 pt-6 pb-2 text-base rounded-xl border',
            'transition-all duration-200 bg-transparent',
            'focus:outline-none focus:ring-2',
            'placeholder:opacity-0',
            error
              ? 'border-danger-500 focus:ring-danger-500/20'
              : 'border-[var(--border-color)] focus:ring-[var(--accent-blue)]/20',
            inputClassName
          )}
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            borderColor: isFocused 
              ? 'var(--accent-blue)' 
              : error 
              ? 'var(--accent-alert)' 
              : 'var(--border-color)',
          }}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <label
          className={clsx(
            'absolute left-4 transition-all duration-200 pointer-events-none text-sm',
            isFocused || hasValue
              ? '-translate-y-1 top-2 text-xs'
              : 'top-1/2 -translate-y-1/2 text-base'
          )}
          style={{
            color: isFocused 
              ? 'var(--accent-blue)' 
              : error 
              ? 'var(--accent-alert)' 
              : 'var(--text-muted)',
          }}
        >
          {label}
        </label>
         {type === 'password' && (
           <button
             type="button"
             onClick={() => setShowPassword(!showPassword)}
             className="absolute right-4 top-1/2 -translate-y-1/2 p-2 transition-colors"
             style={{ color: 'var(--text-muted)' }}
           >
             {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
           </button>
         )}
        {error && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--accent-alert)' }}>{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium mb-2 transition-colors duration-200" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
       <div className="relative">
         {Icon && (
           <Icon
             size={20}
             className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
             style={{ color: 'var(--text-muted)' }}
           />
         )}
        <input
          ref={ref}
          type={inputType}
          inputMode={inputMode}
          className={clsx(
            'w-full min-h-[48px] px-4 py-3 text-base rounded-xl border',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'placeholder:text-sm',
            error
              ? 'border-[var(--accent-alert)] focus:ring-[var(--accent-alert)]/20'
              : 'border-[var(--border-color)] focus:ring-[var(--accent-blue)]/20 focus:border-[var(--accent-blue)]',
            inputClassName
          )}
          style={{
            backgroundColor: 'var(--bg-input)',
            color: 'var(--text-primary)',
            paddingLeft: Icon ? '2.75rem' : '1rem',
          }}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
         {type === 'password' && (
           <button
             type="button"
             onClick={() => setShowPassword(!showPassword)}
             className="absolute right-4 top-1/2 -translate-y-1/2 p-1 transition-colors rounded-lg hover:bg-black/5 active:bg-black/10"
             style={{ color: 'var(--text-muted)' }}
           >
             {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
           </button>
         )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm flex items-center gap-1.5" style={{ color: 'var(--accent-alert)' }}>
          <span className="inline-block w-1 h-1 rounded-full bg-current" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <span className="inline-block w-1 h-1 rounded-full bg-current" />
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

