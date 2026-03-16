/**
 * Validation Form Demo
 *
 * Demonstrates how to use validation hooks and components
 * Shows real-time validation with error messages
 *
 * @module components/ValidationFormDemo
 */

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import {
  useYearValidation,
  useMakeValidation,
  useModelValidation,
  useVinValidation,
  useLatitudeValidation,
  useLongitudeValidation,
  useQueryValidation,
} from '../hooks/useValidation';
import ValidatedInput from './ui/ValidatedInput';

/**
 * ValidationFormDemo component
 * Shows various validation scenarios
 */
const ValidationFormDemo = () => {
  // Vehicle validation
  const yearField = useYearValidation('');
  const makeField = useMakeValidation('');
  const modelField = useModelValidation('');
  const vinField = useVinValidation('');

  // Coordinate validation
  const latField = useLatitudeValidation('');
  const lonField = useLongitudeValidation('');

  // Query validation
  const queryField = useQueryValidation('');

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  /**
   * Check if all fields are valid
   */
  const isFormValid =
    yearField.isValid &&
    makeField.isValid &&
    modelField.isValid &&
    vinField.isValid &&
    latField.isValid &&
    lonField.isValid &&
    queryField.isValid;

  /**
   * Check if any field is touched
   */
  const hasTouchedFields =
    yearField.isTouched ||
    makeField.isTouched ||
    modelField.isTouched ||
    vinField.isTouched ||
    latField.isTouched ||
    lonField.isTouched ||
    queryField.isTouched;

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    // Validate all fields
    yearField.validate();
    makeField.validate();
    modelField.validate();
    vinField.validate();
    latField.validate();
    lonField.validate();
    queryField.validate();

    // Check if form is valid
    if (
      !yearField.isValid ||
      !makeField.isValid ||
      !modelField.isValid ||
      !vinField.isValid ||
      !latField.isValid ||
      !lonField.isValid ||
      !queryField.isValid
    ) {
      setSubmitError('Please fix the validation errors before submitting.');
      setSubmitting(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Form submitted:', {
        year: yearField.value,
        make: makeField.value,
        model: modelField.value,
        vin: vinField.value,
        latitude: latField.value,
        longitude: lonField.value,
        query: queryField.value,
      });

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setSubmitError('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Reset all fields
   */
  const handleReset = () => {
    yearField.reset();
    makeField.reset();
    modelField.reset();
    vinField.reset();
    latField.reset();
    lonField.reset();
    queryField.reset();
    setSubmitted(false);
    setSubmitError(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Input Validation Demo
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Demonstrates real-time validation with user-friendly error messages
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vehicle Section */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Vehicle Information
          </h2>

          <div className="space-y-4">
            <ValidatedInput
              label="Vehicle Year"
              placeholder="e.g., TBD"
              helperText="Enter a year between TBD and TBD"
              {...yearField.inputProps}
              error={yearField.error}
              isValid={yearField.isValid}
              isTouched={yearField.isTouched}
              isDirty={yearField.isDirty}
              showSuccess
              type="number"
              name="year"
              id="year"
              required
            />

            <ValidatedInput
              label="Vehicle Make"
              placeholder="e.g., Toyota"
              helperText="3-50 characters, letters, spaces, and hyphens only"
              {...makeField.inputProps}
              error={makeField.error}
              isValid={makeField.isValid}
              isTouched={makeField.isTouched}
              isDirty={makeField.isDirty}
              showSuccess
              name="make"
              id="make"
              required
            />

            <ValidatedInput
              label="Vehicle Model"
              placeholder="e.g., Camry"
              helperText="2-40 characters, letters, numbers, spaces, and hyphens"
              {...modelField.inputProps}
              error={modelField.error}
              isValid={modelField.isValid}
              isTouched={modelField.isTouched}
              isDirty={modelField.isDirty}
              showSuccess
              name="model"
              id="model"
              required
            />

            <ValidatedInput
              label="Vehicle VIN"
              placeholder="e.g., 1HGCM82633A123456"
              helperText="Exactly 17 alphanumeric characters (no I, O, Q)"
              {...vinField.inputProps}
              error={vinField.error}
              isValid={vinField.isValid}
              isTouched={vinField.isTouched}
              isDirty={vinField.isDirty}
              showSuccess
              name="vin"
              id="vin"
              required
            />
          </div>
        </div>

        {/* Coordinates Section */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Coordinates
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Latitude"
              placeholder="e.g., 37.7749"
              helperText="-90 to 90 degrees, max 7 decimals"
              {...latField.inputProps}
              error={latField.error}
              isValid={latField.isValid}
              isTouched={latField.isTouched}
              isDirty={latField.isDirty}
              showSuccess
              type="number"
              step="0.0000001"
              name="latitude"
              id="latitude"
              required
            />

            <ValidatedInput
              label="Longitude"
              placeholder="e.g., -122.4194"
              helperText="-180 to 180 degrees, max 7 decimals"
              {...lonField.inputProps}
              error={lonField.error}
              isValid={lonField.isValid}
              isTouched={lonField.isTouched}
              isDirty={lonField.isDirty}
              showSuccess
              type="number"
              step="0.0000001"
              name="longitude"
              id="longitude"
              required
            />
          </div>
        </div>

        {/* Query Section */}
        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Search Query
          </h2>

          <ValidatedInput
            label="Location Search"
            placeholder="e.g., 1600 Amphitheatre Parkway"
            helperText="1-500 characters, special characters will be removed"
            {...queryField.inputProps}
            error={queryField.error}
            isValid={queryField.isValid}
            isTouched={queryField.isTouched}
            isDirty={queryField.isDirty}
            showSuccess
            name="query"
            id="query"
            required
          />
        </div>

        {/* Form Status */}
        {submitted && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-success) 20%, transparent)',
              color: 'var(--accent-success)',
              border: '1px solid var(--accent-success)',
            }}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Form submitted successfully!</span>
          </div>
        )}

        {submitError && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-alert) 20%, transparent)',
              color: 'var(--accent-alert)',
              border: '1px solid var(--accent-alert)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isFormValid ? 'var(--accent-blue)' : 'var(--text-muted)',
              color: 'white',
            }}
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Form
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={submitting || !hasTouchedFields}
            className="px-6 py-3 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            Reset
          </button>
        </div>

        {/* Validation Status */}
        {!isFormValid && hasTouchedFields && (
          <div
            className="flex items-start gap-2 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
              color: 'var(--accent-alert)',
            }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Please fix the validation errors</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                All fields must be valid before submitting.
              </p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ValidationFormDemo;
