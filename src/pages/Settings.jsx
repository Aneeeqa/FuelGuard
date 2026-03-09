import { useState, useEffect } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Database, Trash2, Sparkles, Car, Info, Sun, Moon, Coins, ChevronDown, Globe, MapPin, Plus, X, Fuel, Phone, User, Shield, Cpu, HardDrive, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import VehicleSelector from '../components/VehicleSelector';
import { SUPPORTED_CURRENCIES, SUPPORTED_COUNTRIES, getDefaultCurrencyForCountry } from '../utils/currency';
import { createGeofence, isValidGeofence, getGeofenceAlert } from '../utils/geofencing';

const Settings = () => {
  const { data, storageType, updateVehicleProfile, updateVehicleProfileWithCurrencyConversion, injectDemoData, clearAllData, selectVehicle } = useFuelData();
  const { isDark } = useTheme();
  const [confirmClear, setConfirmClear] = useState(false);
  const [demoInjected, setDemoInjected] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  // Geofencing state
  const [showGeofenceForm, setShowGeofenceForm] = useState(false);
  const [newGeofence, setNewGeofence] = useState({
    name: 'Home',
    lat: '',
    lng: '',
    radius: 0.5, // 500m default
  });
  const [geofences, setGeofences] = useState(data.vehicleProfile?.geofences || []);

  // Emergency contact state
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState(
    data.vehicleProfile?.emergencyContact || { name: '', phone: '', relationship: '' }
  );

  const [vehicleForm, setVehicleForm] = useState({
    name: data.vehicleProfile?.name || '',
    expectedMileage: data.vehicleProfile?.expectedMileage || 15,
    tankCapacity: data.vehicleProfile?.tankCapacity || 50,
    currency: data.vehicleProfile?.currency || 'USD',
    country: data.vehicleProfile?.country || 'US',
    distanceUnit: data.vehicleProfile?.distanceUnit || 'km',
    fuelVolumeUnit: data.vehicleProfile?.fuelVolumeUnit || 'L',
    efficiencyUnit: data.vehicleProfile?.efficiencyUnit || 'km/L',
    theftThreshold: data.vehicleProfile?.theftThreshold ?? 0.75,
    monthlyBudget: data.vehicleProfile?.monthlyBudget ?? 200,
  });

  // Sync vehicleForm with data.vehicleProfile when it changes (e.g., from other tabs)
  useEffect(() => {
    if (data.vehicleProfile) {
      setVehicleForm({
        name: data.vehicleProfile.name || '',
        expectedMileage: data.vehicleProfile.expectedMileage || 15,
        tankCapacity: data.vehicleProfile.tankCapacity || 50,
        currency: data.vehicleProfile.currency || 'USD',
        country: data.vehicleProfile.country || 'US',
        distanceUnit: data.vehicleProfile.distanceUnit || 'km',
        fuelVolumeUnit: data.vehicleProfile.fuelVolumeUnit || 'L',
        efficiencyUnit: data.vehicleProfile.efficiencyUnit || 'km/L',
        theftThreshold: data.vehicleProfile.theftThreshold ?? 0.75,
        monthlyBudget: data.vehicleProfile.monthlyBudget ?? 200,
      });
    }
  }, [data.vehicleProfile]);

  const handleVehicleUpdate = () => {
    // Derive efficiencyUnit from fuelVolumeUnit if not explicitly set
    const derivedEfficiencyUnit = vehicleForm.fuelVolumeUnit === 'gal' ? 'mpg' : 'km/L';

    updateVehicleProfile({
      name: vehicleForm.name,
      expectedMileage: parseFloat(vehicleForm.expectedMileage) || 15,
      tankCapacity: parseFloat(vehicleForm.tankCapacity) || 50,
      currency: vehicleForm.currency,
      country: vehicleForm.country,
      distanceUnit: vehicleForm.distanceUnit,
      fuelVolumeUnit: vehicleForm.fuelVolumeUnit,
      efficiencyUnit: vehicleForm.efficiencyUnit || derivedEfficiencyUnit,
      theftThreshold: parseFloat(vehicleForm.theftThreshold) || 0.75,
      monthlyBudget: parseFloat(vehicleForm.monthlyBudget) || 200,
    });
  };

  const handleVehicleSelect = (vehicleData) => {
    // Update both local form and context with EPA data
    setVehicleForm(prev => ({
      ...prev,
      name: vehicleData.name || prev.name,
      expectedMileage: vehicleData.epaCombined || prev.expectedMileage,
      country: vehicleData.country || prev.country,
      currency: vehicleData.currency || prev.currency,
    }));

    updateVehicleProfile({
      ...vehicleData,
      expectedMileage: vehicleData.epaCombined || vehicleForm.expectedMileage,
      tankCapacity: vehicleForm.tankCapacity,
      currency: vehicleData.currency || vehicleForm.currency,
      country: vehicleData.country || vehicleForm.country,
    });

    setShowVehicleSelector(false);
  };

  const handleCurrencyChange = async (newCurrency) => {
    const oldCurrency = vehicleForm.currency;
    console.log(`Currency change: ${oldCurrency} -> ${newCurrency}`);
    setVehicleForm(prev => ({ ...prev, currency: newCurrency }));

    try {
      // Use the currency conversion function to update profile and convert all logs
      await updateVehicleProfileWithCurrencyConversion({
        ...data.vehicleProfile,
        currency: newCurrency
      });
      console.log('Currency conversion completed');
    } catch (error) {
      console.error('Currency conversion failed:', error);
      // Revert the form currency if conversion failed
      setVehicleForm(prev => ({ ...prev, currency: oldCurrency }));
    }
  };

  const handleCountryChange = async (newCountry) => {
    const defaultCurrency = getDefaultCurrencyForCountry(newCountry);
    const oldCurrency = vehicleForm.currency;

    setVehicleForm(prev => ({
      ...prev,
      country: newCountry,
      currency: defaultCurrency
    }));

    // Use currency conversion if currency is actually changing
    if (oldCurrency !== defaultCurrency) {
      await updateVehicleProfileWithCurrencyConversion({
        ...data.vehicleProfile,
        country: newCountry,
        currency: defaultCurrency
      });
    } else {
      // Just update country, no currency conversion needed
      updateVehicleProfile({
        ...data.vehicleProfile,
        country: newCountry,
      });
    }
  };

  const handleInjectDemo = () => {
    injectDemoData();
    setDemoInjected(true);
    setVehicleForm({
      name: 'Demo Vehicle',
      expectedMileage: 15,
      tankCapacity: 50,
      currency: 'USD',
      country: 'US',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      monthlyBudget: 200,
    });
    setTimeout(() => setDemoInjected(false), 2000);
  };

  const handleClearData = async () => {
    await clearAllData();
    setConfirmClear(false);
    setVehicleForm({
      name: '',
      expectedMileage: 15,
      tankCapacity: 50,
      currency: 'USD',
      country: 'US',
      distanceUnit: 'km',
      fuelVolumeUnit: 'L',
      efficiencyUnit: 'km/L',
      monthlyBudget: 200,
    });
    setGeofences([]);
  };

  // Geofencing handlers
  const handleAddGeofence = () => {
    const lat = parseFloat(newGeofence.lat);
    const lng = parseFloat(newGeofence.lng);
    const radius = parseFloat(newGeofence.radius);

    if (!isValidGeofence(lat, lng) || isNaN(radius) || radius <= 0) {
      return;
    }

    const fence = createGeofence(lat, lng, radius, newGeofence.name);
    const updatedFences = [...geofences, fence];
    setGeofences(updatedFences);
    updateVehicleProfile({ ...data.vehicleProfile, geofences: updatedFences });

    // Reset form
    setNewGeofence({ name: 'Home', lat: '', lng: '', radius: 0.5 });
    setShowGeofenceForm(false);
  };

  const handleRemoveGeofence = (index) => {
    const updatedFences = geofences.filter((_, i) => i !== index);
    setGeofences(updatedFences);
    updateVehicleProfile({ ...data.vehicleProfile, geofences: updatedFences });
  };

  const handleUseCurrentLocation = async () => {
    try {
      // Import getCurrentPosition dynamically to avoid circular dependency
      const { getCurrentPosition } = await import('../utils/geolocation');
      const position = await getCurrentPosition({ timeout: 15000, highAccuracy: true });
      setNewGeofence(prev => ({
        ...prev,
        lat: position.lat.toString(),
        lng: position.lng.toString(),
      }));
    } catch (error) {
      console.error('Failed to get current location:', error);
      alert('Could not get your location. Please enter coordinates manually.');
    }
  };

  const handleEmergencyContactUpdate = () => {
    updateVehicleProfile({
      emergencyContact: { ...emergencyContact },
    });
    setShowEmergencyForm(false);
  };

  const getStorageLabel = () => {
    switch (storageType) {
      case 'indexeddb':
        return { label: 'IndexedDB', color: 'var(--accent-success)', bg: 'color-mix(in srgb, var(--accent-success) 20%, transparent)' };
      case 'localstorage':
        return { label: 'LocalStorage', color: 'var(--accent-fuel)', bg: 'color-mix(in srgb, var(--accent-fuel) 20%, transparent)' };
      case 'memory':
        return { label: 'Memory (Temp)', color: 'var(--accent-alert)', bg: 'color-mix(in srgb, var(--accent-alert) 20%, transparent)' };
      default:
        return { label: 'Loading...', color: 'var(--text-muted)', bg: 'var(--bg-secondary)' };
    }
  };

  const storage = getStorageLabel();

  // Get current vehicle display info
  const hasEpaData = data.vehicleProfile?.vehicleId && data.vehicleProfile?.epaCombined;

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your vehicle and app</p>
      </div>

      {/* Vehicle Selector */}
      {data.vehicles && data.vehicles.length > 1 && (
        <div
          className="rounded-xl shadow-sm border p-5 mb-6"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Switch Vehicle</h2>
          </div>

          <select
            value={data.currentVehicleId || ''}
            onChange={(e) => selectVehicle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {data.vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.name} {vehicle.id === data.currentVehicleId ? '(Current)' : ''}
              </option>
            ))}
          </select>

          <a
            href="/fleet"
            className="mt-3 block text-center text-sm font-medium"
            style={{ color: 'var(--accent-blue)' }}
          >
            Manage all vehicles →
          </a>
        </div>
      )}

      {/* Quick Settings - MOVED TO TOP */}
      <div className="rounded-xl shadow-sm border p-5 mb-6 animate-fade-in-up delay-100" style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Quick Settings</h2>
        </div>

        {/* Vehicle Profile Section - MOVED TO TOP */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Vehicle Name
            </label>
            <input
              type="text"
              value={vehicleForm.name}
              onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
              onBlur={handleVehicleUpdate}
              placeholder="e.g., Toyota Corolla"
              className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors duration-300"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Expected Mileage ({vehicleForm.efficiencyUnit || 'km/L'})
                {hasEpaData && (
                  <span className="ml-2 text-xs" style={{ color: 'var(--accent-success)' }}>
                    (Database: {data.vehicleProfile.epaCombined} {vehicleForm.efficiencyUnit || 'km/L'})
                  </span>
                )}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={vehicleForm.expectedMileage}
                onChange={(e) => setVehicleForm({ ...vehicleForm, expectedMileage: e.target.value })}
                onBlur={handleVehicleUpdate}
                placeholder="e.g., 15"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tank Capacity ({vehicleForm.fuelVolumeUnit === 'gal' ? 'Gallons' : 'Liters'})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={vehicleForm.tankCapacity}
                onChange={(e) => setVehicleForm({ ...vehicleForm, tankCapacity: e.target.value })}
                onBlur={handleVehicleUpdate}
                placeholder="e.g., 50"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors duration-300"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Theft Alert Threshold
                      <span className="block text-xs font-normal mt-1" style={{ color: 'var(--text-muted)' }}>
                        Flag efficiency below this % of average
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={(vehicleForm.theftThreshold * 100).toFixed(0)}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, theftThreshold: parseFloat(e.target.value) / 100 })}
                        onBlur={handleVehicleUpdate}
                        placeholder="75"
                        min="1"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors duration-300 pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        %
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Monthly Budget
                      <span className="block text-xs font-normal mt-1" style={{ color: 'var(--text-muted)' }}>
                        Set your monthly fuel budget for this vehicle
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={vehicleForm.monthlyBudget}
                        onChange={(e) => setVehicleForm({ ...vehicleForm, monthlyBudget: parseFloat(e.target.value) || 0 })}
                        onBlur={handleVehicleUpdate}
                        placeholder="200"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors duration-300 pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        $
                      </span>
                    </div>
                  </div>
            </div>
        </div>

        {/* Currency and Unit Section - MOVED TO TOP */}
        <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--border-color)' }}>
          <div className="space-y-4">
            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Currency
              </label>
              <div className="relative">
                <select
                  value={vehicleForm.currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl appearance-none min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.code} - {curr.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>

             {/* Fuel Volume Unit Selection - MOVED TO TOP */}
             <div>
               <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                 Fuel Volume Unit
               </label>
               <div className="relative">
                   <select
                    value={vehicleForm.fuelVolumeUnit || 'L'}
                    onChange={(e) => {
                      const newFuelUnit = e.target.value;
                      const newEfficiencyUnit = newFuelUnit === 'gal' ? 'mpg' : 'km/L';
                      setVehicleForm(prev => ({
                        ...prev,
                        fuelVolumeUnit: newFuelUnit,
                        efficiencyUnit: newEfficiencyUnit
                      }));
                      updateVehicleProfile({
                        fuelVolumeUnit: newFuelUnit,
                        efficiencyUnit: newEfficiencyUnit
                      });
                    }}
                    className="w-full px-4 py-3 pr-10 rounded-xl appearance-none min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <option value="L">Liters (L)</option>
                    <option value="gal">Gallons (gal US)</option>
                  </select>
                 <ChevronDown
                   className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                   style={{ color: 'var(--text-muted)' }}
                 />
               </div>
             </div>

             {/* Distance Unit Selection - NEW */}
             <div>
               <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                 Distance Unit
               </label>
               <div className="relative">
                  <select
                    value={vehicleForm.distanceUnit || 'km'}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      setVehicleForm(prev => ({ ...prev, distanceUnit: newUnit }));
                      updateVehicleProfile({ distanceUnit: newUnit });
                    }}
                    className="w-full px-4 py-3 pr-10 rounded-xl appearance-none min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <option value="km">Kilometers (km)</option>
                    <option value="mi">Miles (mi)</option>
                  </select>
                 <ChevronDown
                   className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                   style={{ color: 'var(--text-muted)' }}
                 />
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle Section - REMAINS AT TOP (Mobile Only) */}

      {/* Theme Toggle Section - REMAINS AT TOP (Mobile Only) */}
      <div
        className="rounded-xl p-5 border transition-colors duration-300 lg:hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            ) : (
              <Sun className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
            )}
            <div>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Appearance</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isDark ? 'Night Watchman' : 'Day Shift'}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Demo Data Section */}
      <div
        className="rounded-xl p-5 border transition-colors duration-300"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, var(--bg-secondary))',
          borderColor: 'color-mix(in srgb, var(--accent-blue) 30%, transparent)'
        }}
      >
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-blue)' }} />
          <div className="flex-1">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>Demo Mode</h2>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-secondary)' }}>
              Generate random realistic data with <span style={{ color: 'var(--accent-alert)', fontWeight: '600' }}>3 alerts</span> (fuel theft scenarios). Click multiple times for different random data!
            </p>
            <button
              onClick={handleInjectDemo}
              disabled={demoInjected}
              className="w-full px-4 py-3 rounded-xl font-semibold min-h-[48px] transition-all text-white hover-lift active-scale"
              style={{
                backgroundColor: demoInjected ? 'var(--text-muted)' : 'var(--accent-blue)',
                opacity: demoInjected ? 0.6 : 1,
                cursor: demoInjected ? 'not-allowed' : 'pointer'
              }}
            >
              {demoInjected ? '✓ Data Generated!' : '🎲 Generate Random Demo Data'}
            </button>
            {demoInjected && (
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
                Dashboard has {data.logs.filter(log => log.isFlagged).length} flagged entries • Click again for new random data
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Geofencing Settings */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Geofencing Zones</h2>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Set safe zones to receive alerts when your vehicle moves outside expected areas.
        </p>

        {/* Existing Geofences List */}
        {geofences.length > 0 ? (
          <div className="space-y-3 mb-4">
            {geofences.map((fence, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 20%, transparent)' }}
                  >
                    <MapPin className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{fence.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {fence.lat.toFixed(4)}, {fence.lng.toFixed(4)} · {fence.radius}{vehicleForm.distanceUnit || 'km'} radius
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveGeofence(index)}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--accent-alert)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="mb-4 p-4 rounded-lg text-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' }}
          >
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No geofence zones set</p>
          </div>
        )}

        {/* Add New Geofence */}
        {showGeofenceForm ? (
          <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-input)' }}>
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>Add New Zone</h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Zone Name
              </label>
              <input
                type="text"
                value={newGeofence.name}
                onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                placeholder="e.g., Home, Work"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Latitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newGeofence.lat}
                  onChange={(e) => setNewGeofence({ ...newGeofence, lat: e.target.value })}
                  placeholder="e.g., 40.7128"
                  className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Longitude
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={newGeofence.lng}
                  onChange={(e) => setNewGeofence({ ...newGeofence, lng: e.target.value })}
                  placeholder="e.g., -74.0060"
                  className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>

             <div>
               <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                 Radius ({vehicleForm.distanceUnit || 'km'})
               </label>
               <input
                 type="range"
                 min="0.1"
                 max="10"
                 step="0.1"
                 value={newGeofence.radius}
                 onChange={(e) => setNewGeofence({ ...newGeofence, radius: parseFloat(e.target.value) })}
                 className="w-full"
               />
               <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                 <span>0.1{vehicleForm.distanceUnit || 'km'}</span>
                 <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{newGeofence.radius}{vehicleForm.distanceUnit || 'km'}</span>
                 <span>10{vehicleForm.distanceUnit || 'km'}</span>
               </div>
             </div>

            <div className="flex gap-3">
              <button
                onClick={handleUseCurrentLocation}
                className="flex-1 px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors flex items-center justify-center gap-2"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--accent-blue)'
                }}
              >
                <MapPin className="w-4 h-4" />
                Use Current Location
              </button>
              <button
                onClick={() => setShowGeofenceForm(false)}
                className="px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddGeofence}
                className="flex-1 px-4 py-3 rounded-xl font-medium min-h-[48px] transition-colors text-white"
                style={{ backgroundColor: 'var(--accent-blue)' }}
              >
                Add Zone
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowGeofenceForm(true)}
            className="w-full px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors flex items-center justify-center gap-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-blue) 50%, transparent)',
              color: 'var(--accent-blue)'
            }}
          >
            <Plus className="w-5 h-5" />
            Add Geofence Zone
          </button>
        )}
      </div>

      {/* Emergency Contact Settings */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Emergency Contact</h2>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Configure emergency contact for quick access in case of an emergency.
        </p>

        {/* Existing Emergency Contact */}
        {data.vehicleProfile?.emergencyContact?.name ? (
          <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent-alert) 20%, transparent)' }}
              >
                <User className="w-6 h-6" style={{ color: 'var(--accent-alert)' }} />
              </div>
              <div className="flex-1">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {data.vehicleProfile.emergencyContact.name}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {data.vehicleProfile.emergencyContact.relationship} · {data.vehicleProfile.emergencyContact.phone}
                </p>
              </div>
              <button
                onClick={() => setShowEmergencyForm(true)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--accent-blue)' }}
                aria-label="Edit emergency contact"
              >
                <span className="text-sm font-medium">Edit</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            className="mb-4 p-4 rounded-lg text-center"
            style={{ backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)' }}
          >
            <Phone className="w-12 h-12 mx-auto mb-2 opacity-30" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No emergency contact configured</p>
          </div>
        )}

        {/* Add/Edit Emergency Contact Form */}
        {showEmergencyForm && (
          <div className="space-y-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-input)' }}>
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {data.vehicleProfile?.emergencyContact?.name ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyContact.name}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={emergencyContact.phone}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                placeholder="e.g., +1 234 567 8900"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Relationship
              </label>
              <input
                type="text"
                value={emergencyContact.relationship}
                onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                placeholder="e.g., Spouse, Parent, Friend"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmergencyForm(false);
                  setEmergencyContact(data.vehicleProfile?.emergencyContact || { name: '', phone: '', relationship: '' });
                }}
                className="flex-1 px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyContactUpdate}
                disabled={!emergencyContact.name || !emergencyContact.phone}
                className="flex-1 px-4 py-3 rounded-xl font-medium min-h-[48px] transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--accent-alert)' }}
              >
                Save Contact
              </button>
            </div>
          </div>
        )}

        {!showEmergencyForm && (
          <button
            onClick={() => setShowEmergencyForm(true)}
            className="w-full px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors flex items-center justify-center gap-2"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-alert) 50%, transparent)',
              color: 'var(--accent-alert)'
            }}
          >
            <Plus className="w-5 h-5" />
            {data.vehicleProfile?.emergencyContact?.name ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
          </button>
        )}
      </div>

      {/* Storage Info */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Storage</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Storage Method</p>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{storage.label}</p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: storage.bg, color: storage.color }}
          >
            Active
          </span>
        </div>

        <div className="mt-3 pt-3 border-t transition-colors duration-300" style={{ borderColor: 'var(--border-color)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Stored Entries</p>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{data.logs?.length || 0} records</p>
        </div>
      </div>

      {/* Clear Data */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Danger Zone</h2>
        </div>

        {confirmClear ? (
          <div className="space-y-3">
            <p className="text-sm" style={{ color: 'var(--accent-alert)' }}>
              Are you sure? This will permanently delete all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors duration-300"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-3 rounded-xl text-white font-medium min-h-[48px]"
                style={{ backgroundColor: 'var(--accent-alert)' }}
              >
                Delete All
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full px-4 py-3 rounded-xl border font-medium min-h-[48px] transition-colors"
            style={{
              borderColor: 'color-mix(in srgb, var(--accent-alert) 50%, transparent)',
              color: 'var(--accent-alert)'
            }}
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* Help & Support */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <a
          href="/contact"
          className="flex items-center justify-between p-3 rounded-lg transition-colors hover-lift"
          style={{ color: 'var(--text-primary)' }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            <div>
              <p className="font-medium">Help & Support</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                FAQs and contact options
              </p>
            </div>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            →
          </div>
        </a>

        <div className="border-t mt-3 pt-3" style={{ borderColor: 'var(--border-color)' }}>
          <a
            href="/privacy"
            className="flex items-center justify-between p-3 rounded-lg transition-colors hover-lift"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="font-medium">Privacy Policy</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  How we handle your data
                </p>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              →
            </div>
          </a>

          <a
            href="/system"
            className="flex items-center justify-between p-3 rounded-lg transition-colors hover-lift"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="font-medium">System Status</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Diagnostics and health info
                </p>
              </div>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>
              →
            </div>
          </a>
        </div>
      </div>

      {/* App Info */}
      <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Info className="w-4 h-4" />
          <span>Fuel Guard</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <a
            href="/privacy"
            className="hover:underline"
            style={{ color: 'var(--accent-blue)' }}
          >
            Privacy Policy
          </a>
          <span>·</span>
          <a
            href="/contact"
            className="hover:underline"
            style={{ color: 'var(--accent-blue)' }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
