import { Mail, Phone, Car, Edit, Trash2, Calendar } from 'lucide-react';

const DriverCard = ({
  driver,
  vehicle,
  vehicleLogs,
  stats,
  onEdit,
  onDelete,
}) => {
  const getDriverStats = () => {
    const safeVehicleLogs = Array.isArray(vehicleLogs) ? vehicleLogs : [];
    const driverLogs = safeVehicleLogs.filter(log => log.driverId === driver.id);
    if (driverLogs.length === 0) {
      return {
        totalFuel: 0,
        totalDistance: 0,
        avgMileage: 0,
        totalEntries: 0,
      };
    }

    const totalFuel = driverLogs.reduce((sum, log) => sum + (log.liters || 0), 0);
    const avgMileage = driverLogs.reduce((sum, log) => sum + log.mileage, 0) / driverLogs.length;
    const totalDistance = driverLogs.reduce((sum, log) => sum + (log.distance || 0), 0);

    return {
      totalFuel,
      totalDistance,
      avgMileage,
      totalEntries: driverLogs.length,
    };
  };

  const driverStats = getDriverStats();

  return (
    <div
      className="rounded-xl border p-5 transition-all duration-300 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: 'var(--accent-blue)' }}
            >
              {driver.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                {driver.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {driver.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm mt-3">
            {driver.phone && (
              <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                <Phone className="w-4 h-4" />
                <span>{driver.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="w-4 h-4" />
              <span>{new Date(driver.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(driver)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-blue)' }}
            aria-label="Edit driver"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(driver.id)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-alert)' }}
            aria-label="Delete driver"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        className="flex items-center gap-2 p-3 rounded-lg mb-4"
        style={{ backgroundColor: 'var(--bg-input)' }}
      >
        <Car className="w-4 h-4" style={{ color: 'var(--accent-fuel)' }} />
        <div className="flex-1">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Assigned Vehicle
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {vehicle?.name || 'Not Assigned'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Total Entries
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {driverStats.totalEntries}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Avg Mileage
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--accent-blue)' }}>
            {driverStats.avgMileage.toFixed(1)}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Total Fuel
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--accent-fuel)' }}>
            {driverStats.totalFuel.toFixed(0)} L
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            Total Distance
          </p>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {driverStats.totalDistance.toFixed(0)} km
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverCard;
