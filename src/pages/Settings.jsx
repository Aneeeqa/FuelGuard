import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Database, Trash2, Sparkles, Car, Info } from 'lucide-react';

const Settings = () => {
  const { data, storageType, updateVehicleProfile, injectDemoData, clearAllData } = useFuelData();
  const [confirmClear, setConfirmClear] = useState(false);
  const [demoInjected, setDemoInjected] = useState(false);

  const [vehicleForm, setVehicleForm] = useState({
    name: data.vehicleProfile?.name || '',
    expectedMileage: data.vehicleProfile?.expectedMileage || 15,
    tankCapacity: data.vehicleProfile?.tankCapacity || 50,
  });

  const handleVehicleUpdate = () => {
    updateVehicleProfile({
      name: vehicleForm.name,
      expectedMileage: parseFloat(vehicleForm.expectedMileage) || 15,
      tankCapacity: parseFloat(vehicleForm.tankCapacity) || 50,
    });
  };

  const handleInjectDemo = () => {
    injectDemoData();
    setDemoInjected(true);
    setTimeout(() => setDemoInjected(false), 2000);
  };

  const handleClearData = async () => {
    await clearAllData();
    setConfirmClear(false);
    setVehicleForm({ name: '', expectedMileage: 15, tankCapacity: 50 });
  };

  const getStorageLabel = () => {
    switch (storageType) {
      case 'indexeddb':
        return { label: 'IndexedDB', color: 'text-success-500', bg: 'bg-success-600/20' };
      case 'localstorage':
        return { label: 'LocalStorage', color: 'text-warning-500', bg: 'bg-warning-500/20' };
      case 'memory':
        return { label: 'Memory (Temp)', color: 'text-danger-500', bg: 'bg-danger-600/20' };
      default:
        return { label: 'Loading...', color: 'text-gray-400', bg: 'bg-gray-700' };
    }
  };

  const storage = getStorageLabel();

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[#F3F4F6]">Settings</h1>
        <p className="text-[#9CA3AF]">Configure your vehicle and app</p>
      </div>

      {/* Demo Data Section */}
      <div className="bg-primary-600/20 rounded-xl p-5 border border-primary-600/30">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 flex-shrink-0 mt-0.5 text-primary-500" />
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-[#F3F4F6]">Demo Mode</h2>
            <p className="text-[#D1D5DB] text-sm mt-1 mb-4">
              Load sample data with theft detection scenarios for demonstration
            </p>
            <button
              onClick={handleInjectDemo}
              disabled={demoInjected}
              className={`w-full px-4 py-3 rounded-xl font-semibold min-h-[48px] transition-all ${
                demoInjected
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
              }`}
            >
              {demoInjected ? '✓ Demo Data Loaded!' : 'Load Demo Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Profile */}
      <div className="bg-[#1E293B] rounded-xl shadow-sm border border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-5 h-5 text-warning-500" />
          <h2 className="font-semibold text-[#F3F4F6]">Vehicle Profile</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Vehicle Name
            </label>
            <input
              type="text"
              value={vehicleForm.name}
              onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
              onBlur={handleVehicleUpdate}
              placeholder="e.g., Toyota Corolla"
              className="w-full px-4 py-3 rounded-xl border border-gray-600 bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Expected Mileage (km/L)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={vehicleForm.expectedMileage}
              onChange={(e) => setVehicleForm({ ...vehicleForm, expectedMileage: e.target.value })}
              onBlur={handleVehicleUpdate}
              placeholder="e.g., 15"
              className="w-full px-4 py-3 rounded-xl border border-gray-600 bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Tank Capacity (Liters)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={vehicleForm.tankCapacity}
              onChange={(e) => setVehicleForm({ ...vehicleForm, tankCapacity: e.target.value })}
              onBlur={handleVehicleUpdate}
              placeholder="e.g., 50"
              className="w-full px-4 py-3 rounded-xl border border-gray-600 bg-[#0f172a] text-[#F3F4F6] placeholder-[#9CA3AF] min-h-[48px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-[#1E293B] rounded-xl shadow-sm border border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-[#9CA3AF]" />
          <h2 className="font-semibold text-[#F3F4F6]">Storage</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#9CA3AF]">Storage Method</p>
            <p className="font-medium text-[#F3F4F6]">{storage.label}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${storage.bg} ${storage.color}`}>
            Active
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-[#9CA3AF]">Stored Entries</p>
          <p className="font-medium text-[#F3F4F6]">{data.logs?.length || 0} records</p>
        </div>
      </div>

      {/* Clear Data */}
      <div className="bg-[#1E293B] rounded-xl shadow-sm border border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-5 h-5 text-danger-500" />
          <h2 className="font-semibold text-[#F3F4F6]">Danger Zone</h2>
        </div>

        {confirmClear ? (
          <div className="space-y-3">
            <p className="text-sm text-danger-400">
              Are you sure? This will permanently delete all your data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-600 text-[#D1D5DB] font-medium min-h-[48px] hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-3 rounded-xl bg-danger-600 text-white font-medium min-h-[48px] hover:bg-danger-700"
              >
                Delete All
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full px-4 py-3 rounded-xl border border-danger-600/50 text-danger-500 font-medium min-h-[48px] hover:bg-danger-600/20 transition-colors"
          >
            Clear All Data
          </button>
        )}
      </div>

      {/* App Info */}
      <div className="text-center py-4 text-[#9CA3AF] text-sm">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Info className="w-4 h-4" />
          <span>Fuel Guard</span>
        </div>
        <p>Fuel Theft Detection System</p>
      </div>
    </div>
  );
};

export default Settings;

