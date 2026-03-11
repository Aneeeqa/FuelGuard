/**
 * useValidation Hook
 *
 * Custom React hook for managing form field validation
 * Provides validation state, error messages, and change handlers
 *
 * @module hooks/useValidation
 */

import { useState, useCallback, useRef } from 'react';
import {
  validateYear,
  validateMake,
  validateModel,
  validateVin,
  validateLatitude,
  validateLongitude,
  sanitizeQuery,
  validateVehicleId,
} from '../utils/validation.js';

/**
 * Validation configuration for a field
 * @typedef {Object} ValidationConfig
 * @property {Function} validator - Validation function
 * @property {boolean} validateOnBlur - Validate on blur event
 * @property {boolean} validateOnChange - Validate on change event
 * @property {string} customError - Custom error message
 */

/**
 * Hook return type
 * @typedef {Object} UseValidationReturn
 * @property {any} value - Current field value
 * @property {string} error - Current error message
 * @property {boolean} isValid - Whether field is valid
 * @property {boolean} isDirty - Whether field has been modified
 * @property {boolean} isTouched - Whether field has been blurred
 * @property {Function} setValue - Set value (with optional validation)
 * @property {Function} setError - Set error manually
 * @property {Function} clearError - Clear error
 * @property {Function} reset - Reset field to initial state
 * @property {Object} inputProps - Props to spread on input element
 */

/**
 * Custom hook for validating a single form field
 *
 * @param {Object} options - Validation options
 * @param {Function} options.validator - Validation function
 * @param {any} options.initialValue - Initial value
 * @param {boolean} options.validateOnBlur - Validate on blur (default: true)
 * @param {boolean} options.validateOnChange - Validate on change (default: false)
 * @param {Function} options.onValidate - Callback when validation runs
 * @returns {UseValidationReturn} Validation state and handlers
 *
 * @example
 * const yearField = useValidation({
 *   validator: validateYear,
 *   initialValue: '',
 *   validateOnChange: true,
 * });
 *
 * <input {...yearField.inputProps} />
 * {yearField.error && <span>{yearField.error}</span>}
 */
export const useValidation = ({
  validator,
  initialValue = '',
  validateOnBlur = true,
  validateOnChange = false,
  onValidate = null,
}) => {
  const [value, setValueState] = useState(initialValue);
  const [error, setErrorState] = useState(null);
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const initialValueRef = useRef(initialValue);

  /**
   * Run validation and update state
   * @param {any} val - Value to validate
   * @returns {Object} Validation result
   */
  const validate = useCallback(
    (val) => {
      const result = validator(val);

      setErrorState(result.error || null);
      setIsValid(result.valid);

      if (onValidate) {
        onValidate(result);
      }

      return result;
    },
    [validator, onValidate]
  );

  /**
   * Set value and optionally validate
   * @param {any} newValue - New value
   * @param {boolean} shouldValidate - Whether to run validation
   */
  const setValue = useCallback(
    (newValue, shouldValidate = validateOnChange) => {
      setValueState(newValue);
      setIsDirty(true);

      if (shouldValidate) {
        validate(newValue);
      }
    },
    [validateOnChange, validate]
  );

  /**
   * Handle input change event
   * @param {Event} e - Change event
   */
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.type === 'checkbox' || e.target.type === 'radio'
        ? e.target.checked
        : e.target.value;

      setValue(newValue, validateOnChange);
    },
    [setValue, validateOnChange]
  );

  /**
   * Handle input blur event
   */
  const handleBlur = useCallback(() => {
    setIsTouched(true);

    if (validateOnBlur) {
      validate(value);
    }
  }, [value, validateOnBlur, validate]);

  /**
   * Set error manually
   * @param {string} errorMessage - Error message
   */
  const setError = useCallback((errorMessage) => {
    setErrorState(errorMessage);
    setIsValid(!errorMessage);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setErrorState(null);
    setIsValid(true);
  }, []);

  /**
   * Reset field to initial state
   */
  const reset = useCallback(() => {
    setValueState(initialValueRef.current);
    setErrorState(null);
    setIsValid(true);
    setIsDirty(false);
    setIsTouched(false);
  }, []);

  /**
   * Props to spread on input element
   */
  const inputProps = {
    value,
    onChange: handleChange,
    onBlur: handleBlur,
  };

  return {
    value,
    error,
    isValid,
    isDirty,
    isTouched,
    setValue,
    setError,
    clearError,
    reset,
    inputProps,
  };
};

/**
 * Hook for validating vehicle year
 * @param {string} initialValue - Initial year value
 * @returns {UseValidationReturn} Validation state
 */
export const useYearValidation = (initialValue = '') => {
  return useValidation({
    validator: validateYear,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for validating vehicle make
 * @param {string} initialValue - Initial make value
 * @returns {UseValidationReturn} Validation state
 */
export const useMakeValidation = (initialValue = '') => {
  return useValidation({
    validator: validateMake,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for validating vehicle model
 * @param {string} initialValue - Initial model value
 * @returns {UseValidationReturn} Validation state
 */
export const useModelValidation = (initialValue = '') => {
  return useValidation({
    validator: validateModel,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for validating VIN
 * @param {string} initialValue - Initial VIN value
 * @returns {UseValidationReturn} Validation state
 */
export const useVinValidation = (initialValue = '') => {
  return useValidation({
    validator: validateVin,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for validating latitude
 * @param {string} initialValue - Initial latitude value
 * @returns {UseValidationReturn} Validation state
 */
export const useLatitudeValidation = (initialValue = '') => {
  return useValidation({
    validator: validateLatitude,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for validating longitude
 * @param {string} initialValue - Initial longitude value
 * @returns {UseValidationReturn} Validation state
 */
export const useLongitudeValidation = (initialValue = '') => {
  return useValidation({
    validator: validateLongitude,
    initialValue,
    validateOnChange: true,
  });
};

/**
 * Hook for sanitizing and validating query
 * @param {string} initialValue - Initial query value
 * @returns {UseValidationReturn} Validation state
 */
export const useQueryValidation = (initialValue = '') => {
  return useValidation({
    validator: sanitizeQuery,
    initialValue,
    validateOnChange: true,
  });
};

export default useValidation;
