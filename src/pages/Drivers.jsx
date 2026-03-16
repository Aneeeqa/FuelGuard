import { useState } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { User, Plus, Car, Edit, X, ChevronDown, UserPlus } from 'lucide-react';
import DriverCard from '../components/DriverCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Drivers = () => {
  const { data, addDriver, updateDriver, deleteDriver, logs } = useFuelData();
  const drivers = Array.isArray(data?.drivers) ? data.drivers : [];
  const vehicle = data?.vehicleProfile;

  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    assignedVehicleId: vehicle?.vehicleId || '',
  });

  const handleOpenAddModal = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      assignedVehicleId: vehicle?.vehicleId || '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      assignedVehicleId: driver.assignedVehicleId || '',
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name) return;

    if (editingDriver) {
      updateDriver(editingDriver.id, formData);
    } else {
      addDriver(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      deleteDriver(driverId);
    }
  };

  const handleEdit = (driver) => {
    handleOpenEditModal(driver);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Drivers
          </h1>
          <p className="text-base mt-1" style={{ color: 'var(--text-muted)' }}>
            Manage driver assignments and performance
          </p>
        </div>
        <Button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2"
          style={{ minHeight: '48px' }}
        >
          <UserPlus className="w-5 h-5" />
          Add Driver
        </Button>
      </div>

      {/* Stats Summary */}
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

      {/* Drivers List */}
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
          <Button onClick={handleOpenAddModal}>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Driver Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sample User"
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                value={formData.assignedVehicleId}
                onChange={(e) => setFormData({ ...formData, assignedVehicleId: e.target.value })}
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
              {editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Drivers;
