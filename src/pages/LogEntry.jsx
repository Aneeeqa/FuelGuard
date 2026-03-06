import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuelData } from '../hooks/useFuelData';
import { Fuel, CheckCircle, MapPin, Loader2, SignalHigh, SignalLow, SignalZero, Map as MapIcon } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import {
  isGeolocationSupported,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentPosition,
  calculateDistanceFromSaved
} from '../utils/geolocation';
import LocationPermissionModal from '../components/LocationPermissionModal';
import FuelMap from '../components/Map/FuelMap';

const LogEntry = () => {
  const navigate = useNavigate();
  const { addLog, data } = useFuelData();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // GPS state
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsPermission, setGpsPermission] = useState('prompt');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [destination, setDestination] = useState(null);

  const currencySymbol = getCurrencySymbol(data.vehicleProfile?.currency || 'INR');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    liters: '',
    pricePerLiter: '',
    price: '',
    distance: '',
  });

  // Check GPS permission on mount
  useEffect(() => {
    const checkGps = async () => {
      if (isGeolocationSupported()) {
        const permission = await checkLocationPermission();
        setGpsPermission(permission);
        // Dont auto-enable, let user choose on mobile to save battery
      }
    };
    checkGps();
  }, []);

  // Calculate distance when GPS is enabled and we have a last location
  useEffect(() => {
    if (gpsEnabled && data.lastLocation) {
      calculateGpsDistance();
    }
  }, [gpsEnabled, data.lastLocation]);

  const calculateGpsDistance = async () => {
    setGpsLoading(true);
    setErrors(prev => ({ ...prev, gps: null }));

    try {
      if (!data.lastLocation) {
        // Just get current position to save for next time
        const pos = await getCurrentPosition();
        setCurrentLocation(pos);
        setGpsAccuracy(pos.accuracy);
      } else {
        const result = await calculateDistanceFromSaved(data.lastLocation);
        if (result) {
          setCalculatedDistance(result.distance);
          setCurrentLocation(result.currentLocation);
          setGpsAccuracy(result.currentLocation.accuracy);
          setFormData(prev => ({ ...prev, distance: result.distance.toString() }));
        }
      }
    } catch (err) {
      // Handle known GPS errors
      console.error(err);
      setErrors(prev => ({ ...prev, gps: "Could not get GPS fix. Try moving outdoors." }));
      setGpsEnabled(false);
    } finally {
      setGpsLoading(false);
    }
  };

  const initiateGpsRequest = () => {
    if (gpsEnabled) {
      setGpsEnabled(false);
      setCalculatedDistance(null);
      setGpsAccuracy(null);
      return;
    }

    // If permission not determined or prompt, show friendly modal
    if (gpsPermission === 'prompt') {
      setShowPermissionModal(true);
    } else if (gpsPermission === 'granted') {
      enableGpsDirectly();
    } else {
      // Denied
      setErrors(prev => ({ ...prev, gps: 'Location permission previously denied. Please enable in site settings.' }));
    }
  };

  const handlePermissionConfirm = async () => {
    setShowPermissionModal(false);
    const result = await requestLocationPermission();

    if (result.success) {
      setGpsPermission('granted');
      enableGpsDirectly();
    } else {
      if (result.permission === 'denied') {
        setGpsPermission('denied');
        setErrors(prev => ({ ...prev, gps: 'Permission denied. Please enter distance manually.' }));
      } else {
        setErrors(prev => ({ ...prev, gps: result.error || 'Failed to get location' }));
      }
    }
  };

  const enableGpsDirectly = async () => {
    setGpsLoading(true);
    try {
      // Quick check to warm up GPS
      await getCurrentPosition({ timeout: 5000, highAccuracy: false });
      setGpsEnabled(true);
      // specific calculation happens in useEffect
    } catch (err) {
      setErrors(prev => ({ ...prev, gps: 'Failed to acquire signal. Try again outdoors.' }));
      setGpsLoading(false);
    }
  };

  // Auto-calculate total price when liters and pricePerLiter change
  useEffect(() => {
    if (formData.liters && formData.pricePerLiter) {
      const liters = parseFloat(formData.liters);
      const ppl = parseFloat(formData.pricePerLiter);
      if (!isNaN(liters) && !isNaN(ppl)) {
        const total = liters * ppl;
        setFormData(prev => ({ ...prev, price: total.toFixed(2) }));
      }
    }
  }, [formData.liters, formData.pricePerLiter]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.odometer || parseFloat(formData.odometer) <= 0) {
      newErrors.odometer = 'Please enter a valid odometer reading';
    }

    if (!formData.liters || parseFloat(formData.liters) <= 0) {
      newErrors.liters = 'Please enter a valid fuel amount';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const newLog = {
      date: new Date(formData.date).toISOString(),
      odometer: parseFloat(formData.odometer),
      liters: parseFloat(formData.liters),
      price: formData.price ? parseFloat(formData.price) : null,
      pricePerLiter: formData.pricePerLiter ? parseFloat(formData.pricePerLiter) : null,
      distance: formData.distance ? parseFloat(formData.distance) : null,
      distanceSource: gpsEnabled ? 'gps' : (formData.distance ? 'manual' : 'odometer'),
      startLocation: data.lastLocation || null,
      endLocation: currentLocation || null,
      destination: destination || null,
    };

    addLog(newLog);
    setSuccess(true);

    // Navigate after brief success feedback
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const getAccuracyIcon = (accuracy) => {
    if (!accuracy) return null;
    if (accuracy <= 20) return <SignalHigh className="w-3 h-3 text-green-500" />;
    if (accuracy <= 100) return <SignalLow className="w-3 h-3 text-yellow-500" />;
    return <SignalZero className="w-3 h-3 text-red-500" />;
  };

  const getAccuracyLabel = (accuracy) => {
    if (!accuracy) return "";
    if (accuracy <= 20) return "Strong Signal";
    if (accuracy <= 100) return "Weak Signal";
    return "Poor Signal";
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-bounce"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-success) 20%, transparent)' }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: 'var(--accent-success)' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Entry Added!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-8 max-w-2xl mx-auto">
      <LocationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onConfirm={handlePermissionConfirm}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Add Entry</h1>
        <p style={{ color: 'var(--text-muted)' }}>Log your fuel fill-up</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: `1px solid ${errors.date ? 'var(--accent-alert)' : 'var(--border-color)'}`,
            }}
          />
          {errors.date && (
            <p className="mt-1 text-sm" style={{ color: 'var(--accent-alert)' }}>{errors.date}</p>
          )}
        </div>

        {/* Odometer */}
        <div>
          <label
            htmlFor="odometer"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Odometer Reading (km)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="odometer"
            placeholder="e.g., 15000"
            value={formData.odometer}
            onChange={(e) => handleChange('odometer', e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: `1px solid ${errors.odometer ? 'var(--accent-alert)' : 'var(--border-color)'}`,
            }}
          />
          {errors.odometer && (
            <p className="mt-1 text-sm" style={{ color: 'var(--accent-alert)' }}>{errors.odometer}</p>
          )}
        </div>

        {/* Distance with GPS Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="distance"
              className="block text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Distance Traveled (km) <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            {isGeolocationSupported() && (
              <div className="flex items-center gap-2">
                {gpsEnabled && gpsAccuracy && (
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {getAccuracyIcon(gpsAccuracy)}
                    <span>{getAccuracyLabel(gpsAccuracy)} (±{Math.round(gpsAccuracy)}m)</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={initiateGpsRequest}
                  disabled={gpsLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
                  style={{
                    backgroundColor: gpsEnabled
                      ? 'color-mix(in srgb, var(--accent-success) 20%, transparent)'
                      : 'var(--bg-input)',
                    color: gpsEnabled ? 'var(--accent-success)' : 'var(--text-primary)',
                    border: gpsEnabled ? '1px solid transparent' : '1px solid var(--border-color)'
                  }}
                >
                  {gpsLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  {gpsEnabled ? 'GPS Active' : 'Use GPS'}
                </button>
              </div>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            id="distance"
            placeholder={
              gpsLoading
                ? "Acquiring satellite lock..."
                : (calculatedDistance ? `GPS: ${calculatedDistance} km` : "e.g., 450")
            }
            value={formData.distance}
            onChange={(e) => handleChange('distance', e.target.value)}
            disabled={gpsEnabled && gpsLoading}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors disabled:opacity-70 disabled:cursor-wait"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
          {errors.gps && (
            <p className="mt-1 text-sm animate-in fade-in" style={{ color: 'var(--accent-alert)' }}>{errors.gps}</p>
          )}
          {gpsEnabled && !data.lastLocation && !gpsLoading && (
            <p className="mt-1 text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-500">
              Location saved! Distance will be calculated on your next visit.
            </p>
          )}
          {gpsEnabled && data.lastLocation && !gpsLoading && calculatedDistance === null && (
            <p className="mt-1 text-xs text-yellow-500">
              Could not calculate distance from previous point.
            </p>
          )}
        </div>

        {/* Map Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Location & Destination <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: showMap ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: showMap ? '#fff' : 'var(--text-primary)',
                border: '1px solid var(--border-color)'
              }}
            >
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {showMap && (
            <div className="space-y-3 animation-fade-in">
              <div className="w-full h-[300px] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 relative">
                <FuelMap
                  currentLocation={currentLocation}
                  destination={destination}
                  onDestinationSelect={(loc) => {
                    setDestination(loc);
                    // Optional: Calculate distance from current location to destination
                    // This would require another util or Maps API service call
                  }}
                />
                {/* Overlay hint if no destination set */}
                {!destination && (
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs p-2 rounded-lg text-center pointer-events-none">
                    Tap map to set destination
                  </div>
                )}
              </div>

              {destination && (
                <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                      {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDestination(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Liters */}
        <div>
          <label
            htmlFor="liters"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fuel Amount (Liters)
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="liters"
            placeholder="e.g., 35"
            value={formData.liters}
            onChange={(e) => handleChange('liters', e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: `1px solid ${errors.liters ? 'var(--accent-alert)' : 'var(--border-color)'}`,
            }}
          />
          {errors.liters && (
            <p className="mt-1 text-sm" style={{ color: 'var(--accent-alert)' }}>{errors.liters}</p>
          )}
        </div>

        {/* Price per Liter */}
        <div>
          <label
            htmlFor="pricePerLiter"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Price per Liter ({currencySymbol}) <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="pricePerLiter"
            placeholder="e.g., 100"
            value={formData.pricePerLiter}
            onChange={(e) => handleChange('pricePerLiter', e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
        </div>

        {/* Total Cost */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Total Cost ({currencySymbol}) <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="price"
            placeholder="e.g., 3500"
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          />
          {formData.liters && formData.pricePerLiter && (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Auto-calculated: {formData.liters} L × {currencySymbol}{formData.pricePerLiter} = {currencySymbol}{formData.price}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl transition-colors min-h-[56px] shadow-lg"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            <Fuel className="w-5 h-5" />
            Save Entry
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogEntry;
