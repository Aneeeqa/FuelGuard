import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { User, Plus, Car, Edit, X, Car as CarIcon, User as UserIcon, UserPlus, Zap, Database, Check, Wallet, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import DriverCard from '../components/DriverCard';
import VehicleCard from '../components/VehicleCard';
import VehicleSelector from '../components/VehicleSelector';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { getCurrencySymbol } from '../utils/currency';

const Fleet = () => {
  const { data, addDriver, updateDriver, deleteDriver, addVehicle, updateVehicle, deleteVehicle, selectVehicle, logs } = useFuelData();
  const drivers = Array.isArray(data?.drivers) ? data.drivers : [];
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  const currentVehicleId = data?.currentVehicleId;
  const vehicle = data?.vehicleProfile;

  const [activeTab, setActiveTab] = useState('vehicles');

  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleModalTab, setVehicleModalTab] = useState('search'); // 'search' or 'manual'
  const [selectedVehicleFromDb, setSelectedVehicleFromDb] = useState(null);

  const [driverFormData, setDriverFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assignedVehicleId: vehicle?.vehicleId || '',
  });

  const [vehicleFormData, setVehicleFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'gasoline',
    tankCapacity: 50,
    expectedMileage: 15,
    theftThreshold: 0.75,
    monthlyBudget: 200,
    licensePlate: '',
    status: 'Active',
  });

  const getVehicleStats = (vehicleId) => {
    if (!logs || !Array.isArray(logs)) {
      return {
        totalFuel: 0,
        totalDistance: 0,
        avgMileage: 0,
        totalEntries: 0,
      };
    }

    const vehicleLogs = logs.filter(log => log.vehicleId === vehicleId);
    if (vehicleLogs.length === 0) {
      return {
        totalFuel: 0,
        totalDistance: 0,
        avgMileage: 0,
        totalEntries: 0,
      };
    }

    const totalFuel = vehicleLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const avgMileage = vehicleLogs.reduce((sum, log) => sum + log.mileage, 0) / vehicleLogs.length;
    const totalDistance = vehicleLogs.reduce((sum, log) => sum + (log.distance || 0), 0);

    return {
      totalFuel,
      totalDistance,
      avgMileage,
      totalEntries: vehicleLogs.length,
    };
  };

  // Calculate fleet-wide budget statistics
  const getFleetBudgetStats = () => {
    if (!vehicles || !Array.isArray(vehicles) || !logs || !Array.isArray(logs)) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        vehiclesOverBudget: 0,
        budgetUsedPercentage: 0,
      };
    }

    const currentDate = new Date();

    const totalBudget = vehicles.reduce((sum, vehicle) => sum + (vehicle.monthlyBudget || 200), 0);

    let totalSpent = 0;
    let vehiclesOverBudget = 0;

    vehicles.forEach(vehicle => {
      const vehicleLogs = logs.filter(log => log.vehicleId === vehicle.id);
      const currentMonthExpenditure = vehicleLogs
        .filter(log => {
          const logDate = new Date(log.date);
          return logDate.getMonth() === currentDate.getMonth() &&
                 logDate.getFullYear() === currentDate.getFullYear();
        })
        .reduce((sum, log) => sum + (log.price || 0), 0);

      totalSpent += currentMonthExpenditure;

      if (currentMonthExpenditure > (vehicle.monthlyBudget || 200)) {
        vehiclesOverBudget++;
      }
    });

    return {
      totalBudget,
      totalSpent,
      vehiclesOverBudget,
      budgetUsedPercentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  };

  const fleetBudgetStats = getFleetBudgetStats();

  const handleOpenAddDriverModal = () => {
    setEditingDriver(null);
    setDriverFormData({
      name: '',
      email: '',
      phone: '',
      assignedVehicleId: vehicle?.vehicleId || '',
    });
    setShowDriverModal(true);
  };

  const handleOpenEditDriverModal = (driver) => {
    setEditingDriver(driver);
    setDriverFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      assignedVehicleId: driver.assignedVehicleId || '',
    });
    setShowDriverModal(true);
  };

  const handleSaveDriver = () => {
    if (!driverFormData.name) return;

    if (editingDriver) {
      updateDriver(editingDriver.id, driverFormData);
    } else {
      addDriver(driverFormData);
    }
    setShowDriverModal(false);
  };

  const handleDeleteDriver = (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      deleteDriver(driverId);
    }
  };

  const handleEditDriver = (driver) => {
    handleOpenEditDriverModal(driver);
  };

  const handleOpenAddVehicleModal = () => {
    setEditingVehicle(null);
    setVehicleModalTab('search');
    setSelectedVehicleFromDb(null);
    setVehicleFormData({
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuelType: 'gasoline',
      tankCapacity: 50,
      expectedMileage: 15,
      theftThreshold: 0.75,
      monthlyBudget: 200,
      licensePlate: '',
      status: 'Active',
    });
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicleModal = (vehicle) => {
    if (!vehicle || !vehicle.id) {
      console.warn('handleOpenEditVehicleModal called with invalid vehicle:', vehicle);
      return;
    }

    setEditingVehicle(vehicle);
    setVehicleModalTab('manual'); // Always use manual tab for editing
    setSelectedVehicleFromDb(null);
    setVehicleFormData({
      name: vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'gasoline',
      tankCapacity: vehicle.tankCapacity || 50,
      expectedMileage: vehicle.expectedMileage || 15,
      theftThreshold: vehicle.theftThreshold ?? 0.75,
      monthlyBudget: vehicle.monthlyBudget ?? 200,
      licensePlate: vehicle.licensePlate || '',
      status: vehicle.status || 'Active',
    });
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = () => {
    if (!vehicleFormData.name) return;

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, vehicleFormData);
    } else {
      addVehicle(vehicleFormData);
    }
    setShowVehicleModal(false);
  };

  const handleDeleteVehicle = (vehicleId) => {
    if (!vehicles || vehicles.length <= 1) {
      alert('Cannot delete last vehicle. Please add another vehicle first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(vehicleId);
    }
  };

  const handleSelectVehicle = (vehicleId) => {
    selectVehicle(vehicleId);
  };

  const handleEditVehicle = (vehicle) => {
    handleOpenEditVehicleModal(vehicle);
  };

  const handleVehicleFromDbSelect = (vehicleData) => {
    // Auto-fill tank capacity from EPA database
    const tankCapacity = vehicleData.tankCapacity || 50;

    console.log('Vehicle selected from database:', vehicleData);
    console.log('Auto-filled tank capacity:', tankCapacity, 'liters');

    setSelectedVehicleFromDb(vehicleData);
    setVehicleFormData(prev => ({
      ...prev,
      name: vehicleData.name || '',
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      year: vehicleData.year || new Date().getFullYear(),
      fuelType: vehicleData.fuelType === 'Electric' ? 'electric' :
                vehicleData.fuelType === 'Diesel' ? 'diesel' :
                vehicleData.fuelType === 'Hybrid' ? 'hybrid' : 'gasoline',
      tankCapacity: tankCapacity,
      expectedMileage: vehicleData.epaCombined || vehicleData.expectedMileage || 15,
      theftThreshold: prev.theftThreshold || 0.75,
    }));
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Fleet
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage your vehicles and drivers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors min-h-[48px] ${
            activeTab === 'vehicles' ? 'border-b-2' : ''
          }`}
          style={{
            borderColor: activeTab === 'vehicles' ? 'var(--accent-fuel)' : 'transparent',
            color: activeTab === 'vehicles' ? 'var(--accent-fuel)' : 'var(--text-muted)',
          }}
        >
          <CarIcon className="w-4 h-4" />
          Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors min-h-[48px] ${
            activeTab === 'drivers' ? 'border-b-2' : ''
          }`}
          style={{
            borderColor: activeTab === 'drivers' ? 'var(--accent-blue)' : 'transparent',
            color: activeTab === 'drivers' ? 'var(--accent-blue)' : 'var(--text-muted)',
          }}
        >
          <UserIcon className="w-4 h-4" />
          Drivers ({drivers.length})
        </button>
      </div>

      {/* Vehicles Tab Content */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <p style={{ color: 'var(--text-muted)' }}>
              Manage your vehicle fleet
            </p>
            <Button
              onClick={handleOpenAddVehicleModal}
              className="flex items-center gap-2"
              style={{ minHeight: '44px' }}
            >
              <Car className="w-4 h-4" />
              Add Vehicle
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Vehicles
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {vehicles.length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Active
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
                {(vehicles || []).filter(v => v.status === 'Active').length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-4 h-4" style={{ color: 'var(--accent-fuel)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Logs
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {(logs || []).length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Fleet Budget Used
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                {fleetBudgetStats.budgetUsedPercentage.toFixed(0)}%
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {getCurrencySymbol(data?.vehicleProfile?.currency || 'USD')}{fleetBudgetStats.totalSpent.toFixed(0)} / {fleetBudgetStats.totalBudget.toFixed(0)}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: fleetBudgetStats.vehiclesOverBudget > 0 ? 'var(--accent-alert)' : 'var(--accent-success)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Over Budget
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: fleetBudgetStats.vehiclesOverBudget > 0 ? 'var(--accent-alert)' : 'var(--accent-success)' }}>
                {fleetBudgetStats.vehiclesOverBudget}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {fleetBudgetStats.vehiclesOverBudget > 0 ? 'vehicles exceeded' : 'All on track'}
              </p>
            </div>
          </div>

          {(!vehicles || vehicles.length === 0) ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <Car className="w-24 h-24 mb-4 opacity-30" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No Vehicles Yet
              </h2>
              <p className="mb-6">
                Add your first vehicle to start tracking fuel consumption
              </p>
              <Button onClick={handleOpenAddVehicleModal}>
                Add Your First Vehicle
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {vehicles.filter(v => v && v.id).map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  stats={getVehicleStats(vehicle.id)}
                  logs={logs && Array.isArray(logs) ? logs.filter(log => log.vehicleId === vehicle.id) : []}
                  isSelected={currentVehicleId === vehicle.id}
                  onSelect={handleSelectVehicle}
                  onEdit={handleEditVehicle}
                  onDelete={handleDeleteVehicle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drivers Tab Content */}
      {activeTab === 'drivers' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <p style={{ color: 'var(--text-muted)' }}>
              Manage driver assignments and performance
            </p>
            <Button
              onClick={handleOpenAddDriverModal}
              className="flex items-center gap-2"
              style={{ minHeight: '44px' }}
            >
              <UserPlus className="w-4 h-4" />
              Add Driver
            </Button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Drivers
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {drivers.length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4" style={{ color: 'var(--accent-fuel)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Assigned
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-fuel)' }}>
                {drivers.filter(d => d.assignedVehicleId).length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Available
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
                {drivers.filter(d => !d.assignedVehicleId).length}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Edit className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Logs
                </p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {(logs || []).length}
              </p>
            </div>
          </div>

          {drivers.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              <User className="w-24 h-24 mb-4 opacity-30" />
              <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                No Drivers Yet
              </h2>
              <p className="mb-6">
                Add drivers to track their performance and vehicle assignments
              </p>
              <Button onClick={handleOpenAddDriverModal}>
                Add Your First Driver
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {drivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  vehicle={driver.assignedVehicleId === data?.vehicleProfile?.vehicleId ? data.vehicleProfile : null}
                  vehicleLogs={(logs || []).filter(log => log.driverId === driver.id)}
                  stats={data?.stats || {}}
                  onEdit={handleEditDriver}
                  onDelete={handleDeleteDriver}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Driver Modal */}
      {showDriverModal && (
        <Modal
          isOpen={showDriverModal}
          onClose={() => setShowDriverModal(false)}
          title={editingDriver ? 'Edit Driver' : 'Add New Driver'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Name *
              </label>
              <input
                type="text"
                value={driverFormData.name}
                onChange={(e) => setDriverFormData({ ...driverFormData, name: e.target.value })}
                placeholder="e.g., John Smith"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                value={driverFormData.email}
                onChange={(e) => setDriverFormData({ ...driverFormData, email: e.target.value })}
                placeholder="e.g., john.smith@example.com"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Phone
              </label>
              <input
                type="tel"
                value={driverFormData.phone}
                onChange={(e) => setDriverFormData({ ...driverFormData, phone: e.target.value })}
                placeholder="e.g., +1 234 567 8900"
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Assign Vehicle
              </label>
              <select
                value={driverFormData.assignedVehicleId}
                onChange={(e) => setDriverFormData({ ...driverFormData, assignedVehicleId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Not Assigned</option>
                <option value={vehicle?.vehicleId}>{vehicle?.name}</option>
              </select>
            </div>
          </div>

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDriverModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDriver}
              disabled={!driverFormData.name}
              style={{
                opacity: !driverFormData.name ? 0.5 : 1,
                cursor: !driverFormData.name ? 'not-allowed' : 'pointer',
              }}
            >
              {editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Vehicle Modal */}
      {showVehicleModal && (
        <Modal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          size="lg"
        >
          {/* Tab Switcher - Only show for new vehicles, not editing */}
          {!editingVehicle && (
            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <button
                onClick={() => setVehicleModalTab('search')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  vehicleModalTab === 'search' ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: vehicleModalTab === 'search' ? 'var(--accent-blue)' : 'transparent',
                  color: vehicleModalTab === 'search' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <Database className="w-4 h-4" />
                Search Database
              </button>
              <button
                onClick={() => setVehicleModalTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  vehicleModalTab === 'manual' ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: vehicleModalTab === 'manual' ? 'var(--accent-fuel)' : 'transparent',
                  color: vehicleModalTab === 'manual' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <Edit className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
          )}

          {/* Search Database Tab */}
          {vehicleModalTab === 'search' && !editingVehicle && (
            <div className="space-y-4">
              <VehicleSelector
                value={selectedVehicleFromDb}
                onVehicleSelect={handleVehicleFromDbSelect}
              />

              {/* Selected Vehicle Confirmation */}
              {selectedVehicleFromDb && (
                <div
                  className="p-4 rounded-xl border-2 animate-in fade-in slide-in-from-top-2"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-success) 10%, var(--bg-secondary))',
                    borderColor: 'var(--accent-success)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: 'var(--accent-success)' }}
                    >
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                        Vehicle Selected
                      </h4>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {selectedVehicleFromDb.name}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Fuel Type:</span>{' '}
                          <span style={{ color: 'var(--text-primary)' }}>
                            {selectedVehicleFromDb.fuelType}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Tank Capacity:</span>{' '}
                          <div className="flex items-center gap-1">
                            <span style={{ color: 'var(--text-primary)' }}>
                              {selectedVehicleFromDb.tankCapacity} L
                            </span>
                            <Info className="w-3 h-3" style={{ color: 'var(--accent-blue)' }} title="Auto-filled from vehicle database" />
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Est. Mileage:</span>{' '}
                          <span style={{ color: 'var(--text-primary)' }}>
                            {selectedVehicleFromDb.epaCombined} km/L
                          </span>
                        </div>
                      </div>

                      {/* Info banner */}
                      <div
                        className="mt-3 p-2 rounded-lg text-xs text-center"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, var(--bg-secondary))',
                          color: 'var(--accent-blue)',
                        }}
                      >
                        <Info className="w-3 h-3 inline mr-1" />
                        Tank capacity auto-filled from vehicle database. You can edit it below if needed.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Form Fields (Optional) */}
              {selectedVehicleFromDb && (
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Vehicle Name (Editable)
                    </label>
                    <input
                      type="text"
                      value={vehicleFormData.name}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                      placeholder="e.g., My Car, Work Truck"
                      className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
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
                        value={vehicleFormData.monthlyBudget}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                        placeholder="200"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
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

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      License Plate
                    </label>
                    <input
                      type="text"
                      value={vehicleFormData.licensePlate}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, licensePlate: e.target.value })}
                      placeholder="e.g., ABC 123"
                      className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Tank Capacity (L)
                      <span className="block text-xs font-normal mt-1" style={{ color: 'var(--accent-blue)' }}>
                        <Info className="w-3 h-3 inline mr-1" />
                        Auto-filled from vehicle database - Edit if incorrect
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={vehicleFormData.tankCapacity}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, tankCapacity: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
                        }}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        L
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <select
                      value={vehicleFormData.status}
                      onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manual Entry Tab / Edit Mode */}
          {vehicleModalTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Vehicle Name *
                </label>
                <input
                  type="text"
                  value={vehicleFormData.name}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, name: e.target.value })}
                  placeholder="e.g., My Car, Work Truck"
                  className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Make
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.make}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, make: e.target.value })}
                    placeholder="e.g., Toyota"
                    className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.model}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, model: e.target.value })}
                    placeholder="e.g., Corolla"
                    className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={vehicleFormData.year}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, year: parseInt(e.target.value) })}
                    placeholder="e.g., 2020"
                    className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    License Plate
                  </label>
                  <input
                    type="text"
                    value={vehicleFormData.licensePlate}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, licensePlate: e.target.value })}
                    placeholder="e.g., ABC 123"
                    className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Fuel Type
                </label>
                <select
                  value={vehicleFormData.fuelType}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, fuelType: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="gasoline">Gasoline</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                     Tank Capacity (L)
                   </label>
                   <input
                     type="number"
                     value={vehicleFormData.tankCapacity}
                     onChange={(e) => setVehicleFormData({ ...vehicleFormData, tankCapacity: parseFloat(e.target.value) })}
                     placeholder="e.g., 50"
                     className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                     style={{
                       backgroundColor: 'var(--bg-input)',
                       borderColor: 'var(--border-color)',
                       color: 'var(--text-primary)',
                     }}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                     Expected Mileage (km/L)
                   </label>
                   <input
                     type="number"
                     step="0.1"
                     value={vehicleFormData.expectedMileage}
                     onChange={(e) => setVehicleFormData({ ...vehicleFormData, expectedMileage: parseFloat(e.target.value) })}
                     placeholder="e.g., 15"
                     className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                     style={{
                       backgroundColor: 'var(--bg-input)',
                       borderColor: 'var(--border-color)',
                       color: 'var(--text-primary)',
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
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        value={(vehicleFormData.theftThreshold * 100).toFixed(0)}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, theftThreshold: parseFloat(e.target.value) / 100 })}
                        placeholder="75"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
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
                        value={vehicleFormData.monthlyBudget}
                        onChange={(e) => setVehicleFormData({ ...vehicleFormData, monthlyBudget: parseFloat(e.target.value) || 0 })}
                        placeholder="200"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
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

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={vehicleFormData.status}
                  onChange={(e) => setVehicleFormData({ ...vehicleFormData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowVehicleModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveVehicle}
              disabled={!vehicleFormData.name}
              style={{
                opacity: !vehicleFormData.name ? 0.5 : 1,
                cursor: !vehicleFormData.name ? 'not-allowed' : 'pointer',
              }}
            >
              {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Fleet;
