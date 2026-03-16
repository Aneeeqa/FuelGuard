/**
 * ValidatedInput Component
 *
 * A reusable input component with built-in validation support
 * Displays error messages, loading states, and validation indicators
 *
 * @module components/ui/ValidatedInput
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * ValidatedInput component with validation support
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onBlur - Blur handler
 * @param {string} props.error - Error message
 * @param {boolean} props.isValid - Whether field is valid
 * @param {boolean} props.isTouched - Whether field has been blurred
 * @param {boolean} props.isDirty - Whether field has been modified
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.required - Required field indicator
 * @param {string} props.type - Input type (text, number, etc.)
 * @param {string} props.name - Input name
 * @param {string} props.id - Input ID
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSuccess - Show success indicator
 * @param {string} props.helperText - Helper text below input
 * @param {Object} props.inputProps - Additional input attributes
 *
 * @example
 * const yearField = useYearValidation('');
 *
 * <ValidatedInput
 *   label="Year"
 *   placeholder="e.g., TBD"
 *   {...yearField.inputProps}
 *   error={yearField.error}
 *   isValid={yearField.isValid}
 *   isTouched={yearField.isTouched}
 *   showSuccess
 * />
 */
const ValidatedInput = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValid,
  isTouched,
  isDirty,
  loading = false,
  disabled = false,
  required = false,
  type = 'text',
  name,
  id,
  className = '',
  showSuccess = false,
  helperText,
  inputProps = {},
}) => {
  const [focused, setFocused] = useState(false);

  // Determine validation state
  const hasError = error && isTouched;
  const showValidState = isValid && isDirty && showSuccess && !hasError;

  // Border color based on state
  const getBorderColor = () => {
    if (loading) return 'var(--text-muted)';
    if (hasError) return 'var(--accent-alert)';
    if (showValidState) return 'var(--accent-success)';
    if (focused) return 'var(--accent-blue)';
    return 'var(--border-color)';
  };

  // Background color based on state
  const getBackgroundColor = () => {
    if (loading) return 'var(--bg-secondary)';
    if (disabled) return 'var(--bg-secondary)';
    return 'var(--bg-input)';
  };

  // Text color based on state
  const getTextColor = () => {
    if (disabled) return 'var(--text-muted)';
    return 'var(--text-primary)';
  };

  // Handle focus event
  const handleFocus = (e) => {
    setFocused(true);
    inputProps.onFocus?.(e);
  };

  // Handle blur event
  const handleBlurWrapper = (e) => {
    setFocused(false);
    onBlur?.(e);
    inputProps.onBlur?.(e);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label */}
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id || name}
            className="text-sm font-medium transition-colors"
            style={{
              color: hasError ? 'var(--accent-alert)' : 'var(--text-secondary)',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--accent-alert)' }}> *</span>}
          </label>

          {/* Validation indicator */}
          {isTouched && (hasError || showValidState) && !loading && (
            <div className="flex items-center gap-1 text-xs">
              {hasError ? (
                <>
                  <AlertCircle className="w-3.5 h-3" style={{ color: 'var(--accent-alert)' }} />
                  <span style={{ color: 'var(--accent-alert)' }}>Invalid</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3" style={{ color: 'var(--accent-success)' }} />
                  <span style={{ color: 'var(--accent-success)' }}>Valid</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Input */}
        <input
          type={type}
          name={name}
          id={id || name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlurWrapper}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none transition-all duration-200"
          style={{
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            borderColor: getBorderColor(),
            borderWidth: '2px',
            borderStyle: 'solid',
            opacity: disabled ? 0.6 : 1,
          }}
          {...inputProps}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Success Indicator */}
        {showValidState && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
          </div>
        )}

        {/* Error Indicator */}
        {hasError && !loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {hasError && (
        <div
          className="flex items-start gap-1.5 px-3 py-2 rounded-lg text-sm animate-in slide-in-from-top-2 fade-in-50"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
            color: 'var(--accent-alert)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !hasError && (
        <p
          className="text-xs"
          style={{
            color: 'var(--text-muted)',
          }}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * ValidatedTextarea component
 * Same as ValidatedInput but for textarea
 */
export const ValidatedTextarea = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  isValid,
  isTouched,
  isDirty,
  loading = false,
  disabled = false,
  required = false,
  name,
  id,
  className = '',
  showSuccess = false,
  helperText,
  rows = 3,
  inputProps = {},
}) => {
  const [focused, setFocused] = useState(false);

  const hasError = error && isTouched;
  const showValidState = isValid && isDirty && showSuccess && !hasError;

  const getBorderColor = () => {
    if (loading) return 'var(--text-muted)';
    if (hasError) return 'var(--accent-alert)';
    if (showValidState) return 'var(--accent-success)';
    if (focused) return 'var(--accent-blue)';
    return 'var(--border-color)';
  };

  const getBackgroundColor = () => {
    if (loading) return 'var(--bg-secondary)';
    if (disabled) return 'var(--bg-secondary)';
    return 'var(--bg-input)';
  };

  const getTextColor = () => {
    if (disabled) return 'var(--text-muted)';
    return 'var(--text-primary)';
  };

  const handleFocus = (e) => {
    setFocused(true);
    inputProps.onFocus?.(e);
  };

  const handleBlurWrapper = (e) => {
    setFocused(false);
    onBlur?.(e);
    inputProps.onBlur?.(e);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id || name}
            className="text-sm font-medium transition-colors"
            style={{
              color: hasError ? 'var(--accent-alert)' : 'var(--text-secondary)',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--accent-alert)' }}> *</span>}
          </label>

          {isTouched && (hasError || showValidState) && !loading && (
            <div className="flex items-center gap-1 text-xs">
              {hasError ? (
                <>
                  <AlertCircle className="w-3.5 h-3" style={{ color: 'var(--accent-alert)' }} />
                  <span style={{ color: 'var(--accent-alert)' }}>Invalid</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3" style={{ color: 'var(--accent-success)' }} />
                  <span style={{ color: 'var(--accent-success)' }}>Valid</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <textarea
          name={name}
          id={id || name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlurWrapper}
          placeholder={placeholder}
          disabled={disabled || loading}
          required={required}
          rows={rows}
          className="w-full px-4 py-3 rounded-xl min-h-[100px] focus:outline-none transition-all duration-200 resize-none"
          style={{
            backgroundColor: getBackgroundColor(),
            color: getTextColor(),
            borderColor: getBorderColor(),
            borderWidth: '2px',
            borderStyle: 'solid',
            opacity: disabled ? 0.6 : 1,
          }}
          {...inputProps}
        />

        {hasError && !loading && (
          <div className="absolute right-3 top-3">
            <AlertCircle className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />
          </div>
        )}
      </div>

      {hasError && (
        <div
          className="flex items-start gap-1.5 px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
            color: 'var(--accent-alert)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {helperText && !hasError && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
