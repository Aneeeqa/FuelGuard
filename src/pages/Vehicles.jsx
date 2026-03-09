import { useState, useEffect } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Car, Plus, Edit, Search, Database, Check, Info } from 'lucide-react';
import VehicleCard from '../components/VehicleCard';
import VehicleSelector from '../components/VehicleSelector';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Vehicles = () => {
  const { data, addVehicle, updateVehicle, deleteVehicle, selectVehicle, logs } = useFuelData();
  const vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
  const currentVehicleId = data?.currentVehicleId;
  const vehicle = data?.vehicleProfile;

  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [modalTab, setModalTab] = useState('search'); // 'search' or 'manual'
  const [selectedVehicleFromDb, setSelectedVehicleFromDb] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'gasoline',
    tankCapacity: 50,
    expectedMileage: 15,
    theftThreshold: 0.75,
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

  const handleOpenEditVehicleModal = (vehicle) => {
    if (!vehicle?.id) {
      return;
    }
    setEditingVehicle(vehicle);
    setModalTab('manual'); // Always use manual tab for editing
    setSelectedVehicleFromDb(null);
    setFormData({
      name: vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'gasoline',
      tankCapacity: vehicle.tankCapacity || 50,
      tankCapacitySource: vehicle.tankCapacitySource || 'user-provided',
      tankCapacityConfidence: vehicle.tankCapacityConfidence || 'high',
      tankCapacityDescription: vehicle.tankCapacityDescription || 'Previously saved value',
      expectedMileage: vehicle.expectedMileage || 15,
      theftThreshold: vehicle.theftThreshold ?? 0.75,
      licensePlate: vehicle.licensePlate || '',
      status: vehicle.status || 'Active',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (vehicle) => {
    if (!vehicle || !vehicle.id) {
    return;
  }

  setEditingVehicle(vehicle);
  setModalTab('manual'); // Always use manual tab for editing
  setSelectedVehicleFromDb(null);
  setFormData({
      name: vehicle.name || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      fuelType: vehicle.fuelType || 'gasoline',
      tankCapacity: vehicle.tankCapacity || 50,
      tankCapacitySource: vehicle.tankCapacitySource || 'user-provided',
      tankCapacityConfidence: vehicle.tankCapacityConfidence || 'high',
      tankCapacityDescription: vehicle.tankCapacityDescription || 'Previously saved value',
      expectedMileage: vehicle.expectedMileage || 15,
      theftThreshold: vehicle.theftThreshold ?? 0.75,
      licensePlate: vehicle.licensePlate || '',
      status: vehicle.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name) return;

    if (editingVehicle) {
      updateVehicle(editingVehicle.id, formData);
    } else {
      addVehicle(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (vehicleId) => {
    if (!vehicles || vehicles.length <= 1) {
      alert('Cannot delete last vehicle. Please add another vehicle first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      deleteVehicle(vehicleId);
    }
  };

  const handleSelect = (vehicleId) => {
    selectVehicle(vehicleId);
  };

  const handleEdit = (vehicle) => {
    handleOpenEditModal(vehicle);
  };

  const handleVehicleFromDbSelect = (vehicleData) => {
    // Auto-fill tank capacity from EPA database with source info
  const tankCapacity = vehicleData.tankCapacity || 50;
  const tankCapacitySource = vehicleData.tankCapacitySource || 'estimated';
  const tankCapacityConfidence = vehicleData.tankCapacityConfidence || 'medium';
  const tankCapacityDescription = vehicleData.tankCapacityDescription || 'Estimated from vehicle data';

  setSelectedVehicleFromDb(vehicleData);
    setFormData(prev => ({
      ...prev,
      name: vehicleData.name || '',
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      year: vehicleData.year || new Date().getFullYear(),
      fuelType: vehicleData.fuelType === 'Electric' ? 'electric' :
                vehicleData.fuelType === 'Diesel' ? 'diesel' :
                vehicleData.fuelType === 'Hybrid' ? 'hybrid' : 'gasoline',
      tankCapacity: tankCapacity,
      tankCapacitySource: tankCapacitySource,
      tankCapacityConfidence: tankCapacityConfidence,
      tankCapacityDescription: tankCapacityDescription,
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
            Vehicles
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage your fleet and vehicle profiles
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2"
          style={{ minHeight: '48px' }}
        >
          <Car className="w-5 h-5" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Edit className="w-4 h-4" style={{ color: 'var(--accent-success)' }} />
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
            <Plus className="w-4 h-4" style={{ color: 'var(--accent-fuel)' }} />
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
            <Car className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Inactive
            </p>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-muted)' }}>
            {(vehicles || []).filter(v => v.status !== 'Active').length}
          </p>
        </div>
      </div>

      {/* Vehicles List */}
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
          <Button onClick={handleOpenAddModal}>
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
              isSelected={currentVehicleId === vehicle.id}
              onSelect={handleSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
         </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
          size="lg"
        >
          {/* Tab Switcher - Only show for new vehicles, not editing */}
          {!editingVehicle && (
            <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <button
                onClick={() => setModalTab('search')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  modalTab === 'search' ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: modalTab === 'search' ? 'var(--accent-blue)' : 'transparent',
                  color: modalTab === 'search' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <Database className="w-4 h-4" />
                Search Database
              </button>
              <button
                onClick={() => setModalTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all min-h-[48px] ${
                  modalTab === 'manual' ? 'shadow-md' : ''
                }`}
                style={{
                  backgroundColor: modalTab === 'manual' ? 'var(--accent-fuel)' : 'transparent',
                  color: modalTab === 'manual' ? 'white' : 'var(--text-secondary)',
                }}
              >
                <Edit className="w-4 h-4" />
                Manual Entry
              </button>
            </div>
          )}

          {/* Search Database Tab */}
          {modalTab === 'search' && !editingVehicle && (
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
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Data Source:</span>{' '}
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: formData.tankCapacityConfidence === 'high'
                                ? 'var(--accent-success)'
                                : formData.tankCapacityConfidence === 'medium'
                                  ? 'var(--accent-warning)'
                                  : 'var(--accent-alert)',
                              color: 'white'
                            }}
                          >
                            {formData.tankCapacityConfidence === 'high' ? '✓ High' :
                             formData.tankCapacityConfidence === 'medium' ? '~ Medium' : '! Low'}
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      License Plate
                    </label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
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
                      <div className="flex items-center justify-between">
                        <span>Tank Capacity (L)</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: formData.tankCapacityConfidence === 'high'
                              ? 'var(--accent-success)'
                              : formData.tankCapacityConfidence === 'medium'
                                ? 'var(--accent-warning)'
                                : 'var(--accent-alert)',
                            color: 'white'
                          }}
                        >
                          {formData.tankCapacityConfidence === 'high' ? '✓ Verified' :
                           formData.tankCapacityConfidence === 'medium' ? '~ Estimated' : '! Default'}
                        </span>
                      </div>
                      <span className="block text-xs font-normal mt-1" style={{ color: 'var(--accent-blue)' }}>
                        <Info className="w-3 h-3 inline mr-1" />
                        Auto-filled from {formData.tankCapacityDescription || 'vehicle database'} - Edit if incorrect
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.tankCapacity}
                        onChange={(e) => setFormData({ ...formData, tankCapacity: parseFloat(e.target.value) || 0 })}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-3 rounded-xl border min-h-[48px] focus:outline-none focus:ring-2 transition-colors pr-12"
                        style={{
                          backgroundColor: 'var(--bg-input)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
                          fontWeight: '500'
                        }}
                      />
                      <span
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        L
                      </span>
                    </div>
                    {/* Source info */}
                    <div
                      className="mt-2 p-2 rounded-lg text-xs"
                      style={{
                        backgroundColor: formData.tankCapacityConfidence === 'high'
                          ? 'color-mix(in srgb, var(--accent-success) 10%, var(--bg-secondary))'
                          : formData.tankCapacityConfidence === 'medium'
                            ? 'color-mix(in srgb, var(--accent-warning) 10%, var(--bg-secondary))'
                            : 'color-mix(in srgb, var(--accent-alert) 10%, var(--bg-secondary))',
                        color: formData.tankCapacityConfidence === 'high'
                          ? 'var(--accent-success)'
                          : formData.tankCapacityConfidence === 'medium'
                            ? 'var(--accent-warning)'
                            : 'var(--accent-alert)'
                      }}
                    >
                      <Info className="w-3 h-3 inline mr-1" />
                      Source: {formData.tankCapacitySource || 'vehicle database'} | You can edit this value
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
          {modalTab === 'manual' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Vehicle Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
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
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
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
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
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
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
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
                     {formData.tankCapacitySource && formData.tankCapacitySource !== 'user-provided' && (
                       <span className="block text-xs font-normal mt-1" style={{ color: 'var(--accent-blue)' }}>
                         <Info className="w-3 h-3 inline mr-1" />
                         {formData.tankCapacityDescription || 'Auto-filled value'}
                       </span>
                     )}
                   </label>
                   <input
                     type="number"
                     step="0.1"
                     min="0"
                     value={formData.tankCapacity}
                     onChange={(e) => setFormData({ ...formData, tankCapacity: parseFloat(e.target.value) || 0 })}
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
                    value={formData.expectedMileage}
                    onChange={(e) => setFormData({ ...formData, expectedMileage: parseFloat(e.target.value) })}
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
                      value={(formData.theftThreshold * 100).toFixed(0)}
                      onChange={(e) => setFormData({ ...formData, theftThreshold: parseFloat(e.target.value) / 100 })}
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name}
              style={{
                opacity: !formData.name ? 0.5 : 1,
                cursor: !formData.name ? 'not-allowed' : 'pointer',
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

export default Vehicles;
