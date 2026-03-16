import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFuelData } from '../hooks/useFuelData';
import { Fuel, CheckCircle, MapPin, Loader2, SignalHigh, SignalLow, SignalZero, Map as MapIcon, ChevronDown, ChevronUp, FileText, Droplet } from 'lucide-react';
import { getCurrencySymbol } from '../utils/currency';
import {
  isGeolocationSupported,
  checkLocationPermission,
  requestLocationPermission,
  calculateDistanceFromSaved,
  calculateHaversineDistance,
  watchPosition,
  clearWatch
} from '../utils/geolocation';
import LocationPermissionModal from '../components/LocationPermissionModal';
import FuelMap from '../components/Map/FuelMap';
import { getLocationName } from '../services/geocodingService';
import { formatFuelVolume, litersToGallons, gallonsToLiters, getCurrencySymbol as getCurrencySymbolFromCode } from '../utils/units';

// Tank-to-Tank UI Components
import FullTankToggle from '../components/FullTankToggle';
import TankVisualIndicator from '../components/TankVisualIndicator';
import GaugeReadingSelector from '../components/GaugeReadingSelector';
import TankCapacityDisplay from '../components/TankCapacityDisplay';

const LogEntry = () => {
  const navigate = useNavigate();
  const { addLog, data, updateVehicleProfile, loading } = useFuelData();
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // GPS state
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsPermission, setGpsPermission] = useState('prompt');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [locationNameLoading, setLocationNameLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [isRealTimeUpdating, setIsRealTimeUpdating] = useState(false);

  // Map State
  const [showMap, setShowMap] = useState(false);
  const [destination, setDestination] = useState(null);
  const [showManualCoordinates, setShowManualCoordinates] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // Additional info state
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const currency = data.vehicleProfile?.currency || 'USD';
  const currencySymbol = getCurrencySymbolFromCode(currency);
  const fuelUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    liters: '',
    pricePerLiter: '',
    price: '',
    distance: '',
    driverId: '',
    note: '',
    pumpName: '',
  });

  const [displayFuelValue, setDisplayFuelValue] = useState('');
  const [userHasTyped, setUserHasTyped] = useState(false);

  // ========================================
  // Tank-to-Tank Form State
  // ========================================
  const [isFullTank, setIsFullTank] = useState(false);
  const [fuelLevelBeforeFill, setFuelLevelBeforeFill] = useState(0);
  const [gaugeReading, setGaugeReading] = useState('');
  const [showTankCapacityEdit, setShowTankCapacityEdit] = useState(false);
  const [manualTankCapacity, setManualTankCapacity] = useState('');

  useEffect(() => {
    if (formData.liters && !userHasTyped) {
      const value = fuelUnit === 'gal' ? litersToGallons(parseFloat(formData.liters)) : formData.liters;
      setDisplayFuelValue(value.toString());
    } else if (!formData.liters && !userHasTyped) {
      setDisplayFuelValue('');
    }
  }, [formData.liters, fuelUnit, userHasTyped]);

  const setDisplayFuelAmount = (value) => {
    setDisplayFuelValue(value);
    setUserHasTyped(true);
  };

  const handleFuelAmountBlur = () => {
    const numValue = parseFloat(displayFuelValue);
    // Allow 0 for tracking entries, but reject negative or NaN
    if (isNaN(numValue) || numValue < 0) {
      return;
    }
    const liters = fuelUnit === 'gal' ? gallonsToLiters(numValue) : numValue;
    setFormData(prev => ({ ...prev, liters: parseFloat(liters.toFixed(3)).toString() }));
    setUserHasTyped(false);
  };

  useEffect(() => {
    const checkGps = async () => {
      if (isGeolocationSupported()) {
        const permission = await checkLocationPermission();
        setGpsPermission(permission);
      }
    };
    checkGps();
  }, []);

  useEffect(() => {
    if (formData.liters && !userHasTyped) {
      const value = fuelUnit === 'gal' ? litersToGallons(parseFloat(formData.liters)) : formData.liters;
      setDisplayFuelValue(value.toString());
    } else if (!formData.liters && !userHasTyped) {
      setDisplayFuelValue('');
    }
  }, [fuelUnit]);

  useEffect(() => {
    // Clean up GPS watch when component unmounts
    return () => {
      if (watchId !== null) {
        clearWatch(watchId);
        setWatchId(null);
      }
    };
  }, [watchId]);

  // Bidirectional auto-calculation
  useEffect(() => {
    const liters = parseFloat(formData.liters);
    const pricePerLiter = parseFloat(formData.pricePerLiter);
    const total = parseFloat(formData.price);

    if (!isNaN(liters) && !isNaN(pricePerLiter)) {
      setFormData(prev => ({ ...prev, price: (liters * pricePerLiter).toFixed(2) }));
    } else if (!isNaN(liters) && !isNaN(total) && liters > 0) {
      // Only calculate price per liter if we have actual fuel amount (not 0)
      setFormData(prev => ({ ...prev, pricePerLiter: (total / liters).toFixed(2) }));
    }
  }, [formData.liters, formData.pricePerLiter, formData.price, fuelUnit]);

  // ========================================
  // Tank-to-Tank Auto-calculation
  // ========================================
  // Auto-calculate estimated fuel level before fill based on tank capacity and fuel amount
  useEffect(() => {
    if (isFullTank && formData.liters && data.vehicleProfile?.tankCapacity && parseFloat(formData.liters) > 0) {
      const tankCapacity = data.vehicleProfile.tankCapacity;
      const liters = parseFloat(formData.liters);
      const estimatedRemaining = Math.max(0, tankCapacity - liters);
      const estimatedPercentage = (estimatedRemaining / tankCapacity) * 100;

      // Update fuel level state (but don't override if user manually adjusted)
      setFuelLevelBeforeFill(estimatedRemaining);
    }
  }, [formData.liters, isFullTank, data.vehicleProfile?.tankCapacity]);

  const calculateGpsDistance = () => {
    setGpsLoading(true);
    setLocationNameLoading(true);
    setErrors(prev => ({ ...prev, gps: null }));

    // Clear any existing watch
    if (watchId !== null) {
      clearWatch(watchId);
      setWatchId(null);
    }

    // Start watching GPS for real-time updates
    const newWatchId = watchPosition(
      // On success - called every time GPS updates
      (pos) => {
        setGpsLoading(false);
        setIsRealTimeUpdating(true);
        setCurrentLocation(pos);
        setGpsAccuracy(pos.accuracy);

        // Get location name in real-time (debounce to avoid too many API calls)
        setLocationNameLoading(true);
        getLocationName(pos.lat, pos.lng).then(name => {
          setCurrentLocationName(name);
          setLocationNameLoading(false);
        });

        // Calculate distance if we have a saved location
        if (data.lastLocation) {
          const distance = calculateHaversineDistance(
            data.lastLocation.lat,
            data.lastLocation.lng,
            pos.lat,
            pos.lng
          );
          setCalculatedDistance(Math.round(distance * 10) / 10);
          setFormData(prev => ({ ...prev, distance: (Math.round(distance * 10) / 10).toString() }));
        }

        // Update last location for next time
        // Note: This only saves the first location, subsequent updates are for distance
        if (!data.lastLocation) {
          // Save this as the start location for future distance calculations
          // This would be done in context when submitting the form
        }
      },
      // On error
      (err) => {
        console.error('GPS Watch Error:', err);

        let errorMessage = '';
        let suggestion = '';

        // Handle specific error types
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied.';
            suggestion = 'Please allow location access in your browser settings.';
            break;

          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'GPS signal unavailable.';
            suggestion = 'Try moving closer to a window, going outdoors, or enable Wi-Fi.';
            break;

          case 3: // TIMEOUT
            errorMessage = 'GPS acquisition timed out.';
            suggestion = 'Try moving to a location with better signal or use manual entry.';
            break;

          default:
            errorMessage = 'Could not get GPS fix.';
            suggestion = 'Try moving to a location with better signal or use manual entry.';
        }

        setErrors(prev => ({
          ...prev,
          gps: `${errorMessage} ${suggestion}`
        }));
        setGpsEnabled(false);
        setIsRealTimeUpdating(false);
        setCurrentLocationName('');
        setLocationNameLoading(false);
        setGpsLoading(false);
      }
    );

    setWatchId(newWatchId);
    setGpsEnabled(true);
    setIsRealTimeUpdating(true);
  };

  const handleManualCoordinateEntry = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      setErrors(prev => ({ ...prev, gps: 'Please enter valid latitude and longitude values.' }));
      return;
    }

    if (lat < -90 || lat > 90) {
      setErrors(prev => ({ ...prev, gps: 'Latitude must be between -90 and 90.' }));
      return;
    }

    if (lng < -180 || lng > 180) {
      setErrors(prev => ({ ...prev, gps: 'Longitude must be between -180 and 180.' }));
      return;
    }

    // Set current location manually
    const manualLocation = { lat, lng, accuracy: 0, timestamp: Date.now() };
    setCurrentLocation(manualLocation);
    setGpsAccuracy(0);
    setGpsEnabled(true);
    setShowManualCoordinates(false);
    setErrors(prev => ({ ...prev, gps: null }));

    // Get location name
    getLocationName(lat, lng).then(name => {
      setCurrentLocationName(name);
    });

    // Calculate distance if we have a saved location
    if (data.lastLocation) {
      const distance = calculateHaversineDistance(
        data.lastLocation.lat,
        data.lastLocation.lng,
        lat,
        lng
      );
      setCalculatedDistance(distance);
      setFormData(prev => ({ ...prev, distance: distance.toString() }));
    }
  };

  const initiateGpsRequest = () => {
    if (gpsEnabled) {
      // Stop real-time GPS updates
      if (watchId !== null) {
        clearWatch(watchId);
        setWatchId(null);
      }
      setGpsEnabled(false);
      setIsRealTimeUpdating(false);
      // Keep the last calculated distance for manual editing
      // Don't reset it so user can adjust it
      setGpsAccuracy(null);
      setErrors(prev => ({ ...prev, gps: null }));
      return;
    }

    if (gpsPermission === 'prompt') {
      setShowPermissionModal(true);
    } else if (gpsPermission === 'granted') {
      calculateGpsDistance();
    } else {
      setErrors(prev => ({ ...prev, gps: 'Location permission previously denied. Please enable in site settings.' }));
    }
  };

  const enableGpsDirectly = async () => {
    // This function is now replaced by calculateGpsDistance which uses watchPosition
    calculateGpsDistance();
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.odometer || parseFloat(formData.odometer) <= 0) {
      newErrors.odometer = 'Please enter a valid odometer reading';
    }

    // Allow 0 fuel for tracking entries (trips without refueling)
    // Only validate if fuel is provided and negative
    if (formData.liters !== '' && parseFloat(formData.liters) < 0) {
      newErrors.liters = 'Fuel amount cannot be negative';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [offlineSaved, setOfflineSaved] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const fuelAmountLiters = formData.liters !== '' ? parseFloat(formData.liters) : 0;
    const distance = formData.distance ? parseFloat(formData.distance) : null;
    const price = formData.price ? parseFloat(formData.price) : null;

    let costPerKm = null;
    let costPerMile = null;

    // Only calculate cost per distance if we have both price and distance
    if (price && distance && distance > 0) {
      costPerKm = price / distance;
      costPerMile = price / (distance * 0.621371);
    }

    const newLog = {
      date: new Date(formData.date).toISOString(),
      odometer: parseFloat(formData.odometer),
      liters: fuelAmountLiters,
      price: price,
      pricePerLiter: formData.pricePerLiter ? parseFloat(formData.pricePerLiter) : null,
      distance: distance,
      distanceSource: gpsEnabled ? 'gps' : (formData.distance ? 'manual' : 'odometer'),
      startLocation: data.lastLocation || null,
      endLocation: currentLocation || null,
      destination: destination || null,
      costPerKm,
      costPerMile,
      driverId: formData.driverId || null,
      vehicleId: data.currentVehicleId,
      note: formData.note || null,
      pumpName: formData.pumpName || null,

      // ========================================
      // Tank-to-Tank Fields
      // ========================================
      // For 0 fuel entries, these should be null
      isFullTank: fuelAmountLiters > 0 ? isFullTank : false,
      fuelLevelBeforeFill: fuelAmountLiters > 0 && isFullTank ? fuelLevelBeforeFill : null,
      fuelLevelAfterFill: fuelAmountLiters > 0 && isFullTank ? data.vehicleProfile?.tankCapacity : null,
      tankCapacity: fuelAmountLiters > 0 ? data.vehicleProfile?.tankCapacity : null,
      gaugeReading: fuelAmountLiters > 0 ? gaugeReading : null,
    };

    try {
      setSubmitting(true);
      setErrors(prev => ({ ...prev, submit: null }));
      await addLog(newLog);
      setSuccess(true);
      setTimeout(() => {
        navigate('/history');
      }, 1500);
    } catch (error) {
      // Entry was saved locally while offline — treat it as a success
      if (error?.offlineSaved) {
        setOfflineSaved(true);
        setTimeout(() => {
          navigate('/history');
        }, 2000);
        return;
      }
      console.error('Failed to save entry:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to save entry. Please check your connection and try again.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  // ========================================
  // Handle Tank Capacity Edit
  // ========================================
  const handleSaveTankCapacity = () => {
    const newCapacity = parseFloat(manualTankCapacity);
    if (isNaN(newCapacity) || newCapacity <= 0) {
      setErrors(prev => ({ ...prev, tankCapacity: 'Please enter a valid tank capacity' }));
      return;
    }
    updateVehicleProfile({ tankCapacity: newCapacity });
    setShowTankCapacityEdit(false);
    setManualTankCapacity('');
    setErrors(prev => ({ ...prev, tankCapacity: null }));
  };

  if (offlineSaved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-bounce"
          style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 20%, transparent)' }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: '#f59e0b' }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Saved Offline</h1>
        <p className="mb-1" style={{ color: 'var(--text-muted)' }}>
          Entry saved to your device.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          It will sync to the cloud automatically when you&apos;re back online.
        </p>
      </div>
    );
  }

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
        <p style={{ color: 'var(--text-muted)' }}>Redirecting to history...</p>
      </div>
    );
  }

  if (!loading && !data.currentVehicleId) {
    const hasVehicles = data.vehicles && data.vehicles.length > 0;
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)' }}
        >
          <Fuel className="w-10 h-10" style={{ color: 'var(--accent-blue)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          {hasVehicles ? 'No Vehicle Selected' : 'No Vehicle Added Yet'}
        </h1>
        <p className="text-base mb-8 max-w-sm" style={{ color: 'var(--text-muted)' }}>
          {hasVehicles
            ? 'Please go to your Fleet and select a vehicle before logging a fuel entry.'
            : 'You need to add a vehicle before you can log a fuel entry. Head over to the Fleet page to add your first vehicle.'}
        </p>
        <button
          onClick={() => navigate('/fleet')}
          className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover-lift active-scale"
          style={{ backgroundColor: 'var(--accent-blue)' }}
        >
          {hasVehicles ? 'Go to Fleet' : 'Add a Vehicle'}
        </button>
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

      {/* ======================================== */}
      {/* Tank Capacity Edit Modal */}
      {/* ======================================== */}
      {showTankCapacityEdit && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTankCapacityEdit(false)}
        >
          <div
            className="rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in duration-200"
            style={{ backgroundColor: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Edit Tank Capacity
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="tankCapacity"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Tank Capacity ({fuelUnit})
                </label>
                <input
                  type="number"
                  id="tankCapacity"
                  min="1"
                  step="1"
                  value={manualTankCapacity || data.vehicleProfile?.tankCapacity || ''}
                  onChange={(e) => setManualTankCapacity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: `1px solid ${errors.tankCapacity ? 'var(--accent-alert)' : 'var(--border-color)'}`,
                  }}
                />
                {errors.tankCapacity && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--accent-alert)' }}>
                    {errors.tankCapacity}
                  </p>
                )}
                <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Enter the total fuel capacity of your vehicle's fuel tank. You can find this
                  information in your vehicle's owner's manual or on the manufacturer's
                  website.
                </p>
              </div>

              {/* Common Tank Capacities */}
              <div>
                <label
                  className="block text-xs font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Common tank capacities:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[35, 40, 45, 50, 55, 60, 70, 80, 100].map((capacity) => (
                    <button
                      key={capacity}
                      type="button"
                      onClick={() => setManualTankCapacity(capacity.toString())}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                      style={{
                        backgroundColor: (manualTankCapacity || data.vehicleProfile?.tankCapacity) === capacity
                          ? 'var(--accent-blue)'
                          : 'var(--bg-tertiary)',
                        color: (manualTankCapacity || data.vehicleProfile?.tankCapacity) === capacity
                          ? 'white'
                          : 'var(--text-primary)',
                        borderColor: (manualTankCapacity || data.vehicleProfile?.tankCapacity) === capacity
                          ? 'var(--accent-blue)'
                          : 'var(--border-color)'
                      }}
                    >
                      {capacity} {fuelUnit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTankCapacityEdit(false);
                    setManualTankCapacity('');
                    setErrors(prev => ({ ...prev, tankCapacity: null }));
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTankCapacity}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-colors"
                  style={{
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    {isRealTimeUpdating && (
                      <span className="ml-2 inline-flex items-center gap-1" style={{ color: 'var(--accent-success)' }}>
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-success)' }}></span>
                        <span>Live</span>
                      </span>
                    )}
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
                    <>
                      <MapPin className="w-3 h-3" />
                      {isRealTimeUpdating && <span className="ml-1 text-xs font-normal">Updating...</span>}
                    </>
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
            <>
              <p className="mt-1 text-sm animate-in fade-in" style={{ color: 'var(--accent-alert)' }}>{errors.gps}</p>

              {/* GPS Tips */}
              <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)', border: '1px solid var(--accent-warning)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-warning)' }}>
                  💡 Tips for Better GPS Signal:
                </p>
                <ul className="text-xs space-y-1 ml-4" style={{ color: 'var(--text-muted)' }}>
                  <li>Move closer to a window or go outdoors</li>
                  <li>Enable Wi-Fi (helps with triangulation)</li>
                  <li>Wait 10-20 seconds between retries</li>
                  <li>Use manual entry if GPS is unavailable</li>
                </ul>
              </div>

              {/* Fallback Options */}
              <div className="mt-2">
                {/* Manual Coordinate Entry */}
                <button
                  type="button"
                  onClick={() => setShowManualCoordinates(!showManualCoordinates)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <strong>📍 Enter Coordinates Manually</strong>
                  <br />
                  <span className="opacity-75">Enter your GPS coordinates directly if location services are unavailable</span>
                </button>

                {/* Manual Entry Form */}
                {showManualCoordinates && (
                  <div className="p-3 rounded-lg space-y-3" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Latitude (-90 to 90)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., 40.7128"
                        value={manualLat}
                        onChange={(e) => setManualLat(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                        Longitude (-180 to 180)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., -74.0060"
                        value={manualLng}
                        onChange={(e) => setManualLng(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)'
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleManualCoordinateEntry}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: 'var(--accent-success)',
                          color: 'white'
                        }}
                      >
                        Use These Coordinates
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowManualCoordinates(false)}
                        className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          {gpsEnabled && currentLocationName && (
            <div className="mt-1 flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)' }}>
              {locationNameLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--accent-success)' }} />
                  <span className="text-xs" style={{ color: 'var(--accent-success)' }}>Getting location name...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" style={{ color: 'var(--accent-success)' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-success)' }}>
                    {currentLocationName}
                  </span>
                  {isRealTimeUpdating && (
                    <span className="ml-1 text-xs" style={{ color: 'var(--accent-success)', opacity: 0.8 }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block mr-1" style={{ backgroundColor: 'var(--accent-success)' }}></span>
                      Updating...
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {!gpsEnabled && calculatedDistance && (
            <p className="mt-1 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)', color: 'var(--accent-warning)' }}>
              ⚠️ GPS tracking stopped. You can edit the distance manually if needed.
            </p>
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
                  }}
                />
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

        {/* Fuel Amount */}
        <div>
          <label
            htmlFor="liters"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Fuel Amount ({fuelUnit === 'L' ? 'Liters' : 'Gallons'}) <span style={{ color: 'var(--text-muted)' }}>(Optional - Enter 0 for tracking only)</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="liters"
            placeholder={`e.g., ${fuelUnit === 'L' ? '35' : '9.2'} or 0 for trip tracking`}
            value={displayFuelValue}
            onChange={(e) => setDisplayFuelAmount(e.target.value)}
            onBlur={handleFuelAmountBlur}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: displayFuelValue === '0' || formData.liters === '0'
                ? '2px solid var(--accent-blue)'
                : `1px solid ${errors.liters ? 'var(--accent-alert)' : 'var(--border-color)'}`,
            }}
          />
          {errors.liters && (
            <p className="mt-1 text-sm" style={{ color: 'var(--accent-alert)' }}>{errors.liters}</p>
          )}
          {displayFuelValue === '0' || formData.liters === '0' ? (
            <p className="mt-1 text-xs px-2 py-1.5 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, transparent)', color: 'var(--accent-blue)' }}>
              📊 Tracking Mode: This entry will track distance and odometer readings without fuel consumption calculations.
            </p>
          ) : (formData.liters === '' || displayFuelValue === '') ? (
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              💡 Enter 0 fuel to track trips and distance without refueling. This helps monitor mileage between fill-ups.
            </p>
          ) : null}
        </div>

        {/* ======================================== */}
        {/* Tank Fill Information */}
        {/* ======================================== */}
        <div className="space-y-4">
          {/* Full Tank Toggle */}
          <FullTankToggle
            checked={isFullTank}
            onChange={setIsFullTank}
            tankCapacity={data.vehicleProfile?.tankCapacity}
            showLearnMore={true}
          />

          {/* Expanded Options (show when toggle ON) */}
          {isFullTank && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Tank Visual Indicator */}
              <TankVisualIndicator
                currentLevel={fuelLevelBeforeFill}
                tankCapacity={data.vehicleProfile?.tankCapacity || 50}
                editable={true}
                onChange={setFuelLevelBeforeFill}
                units={fuelUnit}
              />

              {/* Gauge Reading Selector */}
              <GaugeReadingSelector
                value={(fuelLevelBeforeFill / (data.vehicleProfile?.tankCapacity || 50)) * 100}
                onChange={(percentage) => {
                  const newLevel = (percentage / 100) * (data.vehicleProfile?.tankCapacity || 50);
                  setFuelLevelBeforeFill(newLevel);
                }}
                tankCapacity={data.vehicleProfile?.tankCapacity || 50}
                allowManual={true}
                units={fuelUnit}
              />

              {/* Tank Capacity Display */}
              <TankCapacityDisplay
                capacity={data.vehicleProfile?.tankCapacity || 50}
                confidence={data.vehicleProfile?.tankCapacity ? 'high' : 'medium'}
                source={data.vehicleProfile?.make && data.vehicleProfile?.model
                  ? `${data.vehicleProfile.year} ${data.vehicleProfile.make} ${data.vehicleProfile.model}`
                  : 'Vehicle Database'
                }
                onEdit={() => setShowTankCapacityEdit(true)}
                units={fuelUnit}
              />
            </div>
          )}
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {formData.liters && formData.pricePerLiter && parseFloat(formData.liters) > 0 && (
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Auto-calculated: {formData.liters} {fuelUnit} × {currencySymbol}{formData.pricePerLiter} = {currencySymbol}{formData.price}
                </p>
              )}
              {formData.liters && parseFloat(formData.liters) === 0 && formData.pricePerLiter && (
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Note: Price calculations skipped for 0 fuel entries
                </p>
              )}
          </div>
        </div>

        {/* Additional Information Dropdown */}
        <div
          className="rounded-xl border"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <button
            type="button"
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="w-full flex items-center justify-between px-4 py-3 font-medium transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              Additional Information <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
            </span>
            {showAdditionalInfo ? (
              <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>

          {showAdditionalInfo && (
            <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              {/* Driver Selection */}
              {data.drivers && data.drivers.length > 0 && (
                <div>
                  <label
                    htmlFor="driver"
                    className="block text-sm font-medium mb-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Select Driver <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                  </label>
                  <select
                    id="driver"
                    value={formData.driverId || ''}
                    onChange={(e) => handleChange('driverId', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors appearance-none cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <option value="">Select Driver</option>
                    {data.drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>
                )}
 
              {/* Note */}
              <div>
                <label
                  htmlFor="note"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Note <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <textarea
                  id="note"
                  placeholder="Add any notes about this entry..."
                  value={formData.note}
                  onChange={(e) => handleChange('note', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>

              {/* Petrol Pump Name */}
              <div>
                <label
                  htmlFor="pumpName"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Petrol Pump Name <span style={{ color: 'var(--text-muted)' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  id="pumpName"
                  placeholder="e.g., Shell, BP, Indian Oil"
                  value={formData.pumpName}
                  onChange={(e) => handleChange('pumpName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-3 rounded-xl text-sm font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)', color: 'var(--accent-alert)', border: '1px solid color-mix(in srgb, var(--accent-alert) 30%, transparent)' }}>
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white font-semibold rounded-xl transition-colors min-h-[56px] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-blue)' }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Fuel className="w-5 h-5" />
                Save Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogEntry;
