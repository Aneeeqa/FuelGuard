import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Database, Trash2, Sparkles, Car, Info, Sun, Moon, Coins, ChevronDown, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import VehicleSelector from '../components/VehicleSelector';
import { SUPPORTED_CURRENCIES, SUPPORTED_COUNTRIES, getDefaultCurrencyForCountry } from '../utils/currency';

const Settings = () => {
  const { data, storageType, updateVehicleProfile, injectDemoData, clearAllData } = useFuelData();
  const { isDark } = useTheme();
  const [confirmClear, setConfirmClear] = useState(false);
  const [demoInjected, setDemoInjected] = useState(false);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    name: data.vehicleProfile?.name || '',
    expectedMileage: data.vehicleProfile?.expectedMileage || 15,
    tankCapacity: data.vehicleProfile?.tankCapacity || 50,
    currency: data.vehicleProfile?.currency || 'INR',
    country: data.vehicleProfile?.country || 'US',
  });

  const handleVehicleUpdate = () => {
    updateVehicleProfile({
      name: vehicleForm.name,
      expectedMileage: parseFloat(vehicleForm.expectedMileage) || 15,
      tankCapacity: parseFloat(vehicleForm.tankCapacity) || 50,
      currency: vehicleForm.currency,
      country: vehicleForm.country,
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

  const handleCurrencyChange = (newCurrency) => {
    setVehicleForm(prev => ({ ...prev, currency: newCurrency }));
    updateVehicleProfile({
      ...data.vehicleProfile,
      currency: newCurrency
    });
  };

  const handleCountryChange = (newCountry) => {
    const defaultCurrency = getDefaultCurrencyForCountry(newCountry);
    setVehicleForm(prev => ({
      ...prev,
      country: newCountry,
      currency: defaultCurrency
    }));
    updateVehicleProfile({
      ...data.vehicleProfile,
      country: newCountry,
      currency: defaultCurrency
    });
  };

  const handleInjectDemo = () => {
    injectDemoData();
    setDemoInjected(true);
    setVehicleForm({
      name: 'Sample Vehicle',
      expectedMileage: 15,
      tankCapacity: 50,
      currency: 'USD',
      country: 'US',
    });
    setTimeout(() => setDemoInjected(false), 2000);
  };

  const handleClearData = async () => {
    await clearAllData();
    setConfirmClear(false);
    setVehicleForm({ name: '', expectedMileage: 15, tankCapacity: 50, currency: 'INR', country: 'US' });
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

      {/* Theme Toggle Section - Mobile Only (Desktop has it in sidebar) */}
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
              Load sample data with theft detection scenarios for demonstration
            </p>
            <button
              onClick={handleInjectDemo}
              disabled={demoInjected}
              className="w-full px-4 py-3 rounded-xl font-semibold min-h-[48px] transition-all text-white"
              style={{
                backgroundColor: demoInjected ? 'var(--text-muted)' : 'var(--accent-blue)',
                opacity: demoInjected ? 0.6 : 1,
                cursor: demoInjected ? 'not-allowed' : 'pointer'
              }}
            >
              {demoInjected ? '✓ Demo Data Loaded!' : 'Load Demo Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Regional Settings</h2>
        </div>

        <div className="space-y-4">
          {/* Country Selection */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Country
            </label>
            <div className="relative">
              <select
                value={vehicleForm.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl appearance-none min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                {SUPPORTED_COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              Determines vehicle database source and default currency.
            </p>
          </div>

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
        </div>
      </div>

      {/* Vehicle Profile */}
      <div
        className="rounded-xl shadow-sm border p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Vehicle Profile</h2>
          </div>
          <button
            onClick={() => setShowVehicleSelector(!showVehicleSelector)}
            className="text-sm px-3 py-1 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--accent-blue)'
            }}
          >
            {showVehicleSelector ? 'Cancel' : 'Search Database'}
          </button>
        </div>

        {/* EPA Data Preview (if selected from database) */}
        {hasEpaData && !showVehicleSelector && (
          <div
            className="mb-4 p-3 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, transparent)',
              border: '1px solid var(--accent-success)'
            }}
          >
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              {data.vehicleProfile.year} {data.vehicleProfile.make} {data.vehicleProfile.model}
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>
                City: <strong style={{ color: 'var(--accent-blue)' }}>{data.vehicleProfile.epaCity} km/L</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Highway: <strong style={{ color: 'var(--accent-blue)' }}>{data.vehicleProfile.epaHighway} km/L</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Combined: <strong style={{ color: 'var(--accent-success)' }}>{data.vehicleProfile.epaCombined} km/L</strong>
              </span>
            </div>
            {data.vehicleProfile.country === 'PK' && (
              <p className="mt-1 text-xs text-right" style={{ color: 'var(--text-muted)' }}>
                Source: Local Database (PK)
              </p>
            )}
          </div>
        )}

        {/* Vehicle Selector (expandable) */}
        {showVehicleSelector && (
          <div className="mb-4">
            <VehicleSelector
              value={data.vehicleProfile}
              onVehicleSelect={handleVehicleSelect}
            />
          </div>
        )}

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

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Expected Mileage (km/L)
              {hasEpaData && (
                <span className="ml-2 text-xs" style={{ color: 'var(--accent-success)' }}>
                  (Database: {data.vehicleProfile.epaCombined} km/L)
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
              Tank Capacity (Liters)
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
        </div>
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

      {/* App Info */}
      <div className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Info className="w-4 h-4" />
          <span>Fuel Guard</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;
