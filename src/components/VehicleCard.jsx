import { Car, Pencil, Trash, Drop, Path, TrendUp, Calendar, Wallet, TrendDown } from '@phosphor-icons/react';
import { getCurrencySymbol } from '../utils/currency';
import { checkBudgetAlert } from '../utils/calculations';

const VehicleCard = ({
  vehicle,
  stats,
  onSelect,
  isSelected,
  onEdit,
  onDelete,
  logs = [], // Add logs prop for budget calculation
}) => {
  const getEfficiencyColor = (efficiency) => {
    if (!efficiency) return 'var(--text-muted)';
    if (efficiency >= 25) return 'var(--accent-success)';
    if (efficiency >= 15) return 'var(--accent-blue)';
    return 'var(--accent-alert)';
  };

  // Calculate current month budget usage
  const calculateBudgetUsage = () => {
    const monthlyBudget = vehicle.monthlyBudget || 200;
    const currentDate = new Date();

    // Safely handle logs - ensure it's an array
    const logsArray = logs && Array.isArray(logs) ? logs : [];

    const currentMonthExpenditure = logsArray
      .filter(log => {
        if (!log || !log.date) return false;
        const logDate = new Date(log.date);
        return logDate.getMonth() === currentDate.getMonth() &&
               logDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((sum, log) => sum + (log.price || 0), 0);

    const budgetAlert = checkBudgetAlert(currentMonthExpenditure, monthlyBudget);
    const budgetUsedPercentage = Math.min(100, (currentMonthExpenditure / monthlyBudget) * 100);

    return {
      spent: currentMonthExpenditure,
      budget: monthlyBudget,
      percentage: budgetUsedPercentage,
      alert: budgetAlert,
      currency: vehicle.currency || 'USD',
    };
  };

  const budgetUsage = calculateBudgetUsage();

  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-300 cursor-pointer ${
        isSelected ? 'ring-2 shadow-lg' : 'hover:shadow-md'
      }`}
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: isSelected ? 'var(--accent-blue)' : 'var(--border-color)',
        boxShadow: isSelected ? 'var(--shadow-glow-blue)' : 'var(--card-shadow)',
        ringColor: isSelected ? 'var(--accent-blue)' : 'transparent',
      }}
      onClick={() => onSelect(vehicle.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: isSelected
                  ? 'var(--accent-blue)'
                  : 'color-mix(in srgb, var(--accent-fuel) 15%, transparent)',
              }}
            >
              <Car
                size={24}
                weight="duotone"
                style={{ color: isSelected ? 'white' : 'var(--accent-fuel)' }}
              />
            </div>
            <div>
              <h3
                className="font-semibold text-lg"
                style={{ color: 'var(--text-primary)' }}
              >
                {vehicle.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>

          {vehicle.licensePlate && (
            <div
              className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-secondary)',
              }}
            >
              {vehicle.licensePlate}
            </div>
          )}

           <div className="flex items-center gap-2 mt-3">
             {vehicle.status === 'Active' ? (
               <span
                 className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                 style={{
                   backgroundColor: 'color-mix(in srgb, var(--accent-success) 15%, transparent)',
                   color: 'var(--accent-success)',
                 }}
               >
                 <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                 Active
               </span>
             ) : (
               <span
                 className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                 style={{
                   backgroundColor: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
                   color: 'var(--text-muted)',
                 }}
               >
                 Inactive
               </span>
             )}
             {vehicle.fuelType && (
               <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                 {vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}
               </span>
             )}
              {vehicle.theftThreshold && (
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
                    color: 'var(--accent-alert)',
                  }}
                >
                  Alert: {(vehicle.theftThreshold * 100).toFixed(0)}%
                </span>
              )}
              {vehicle.monthlyBudget && (
                <span
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{
                    backgroundColor: budgetUsage.alert.triggered
                      ? 'color-mix(in srgb, var(--accent-alert) 15%, transparent)'
                      : 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',
                    color: budgetUsage.alert.triggered ? 'var(--accent-alert)' : 'var(--accent-blue)',
                  }}
                >
                  Budget: {getCurrencySymbol(budgetUsage.currency)}{vehicle.monthlyBudget}
                </span>
              )}
            </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vehicle);
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-blue)' }}
            aria-label="Edit vehicle"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(vehicle.id);
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent-alert)' }}
            aria-label="Delete vehicle"
          >
            <Trash size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center gap-1 mb-1">
            <TrendUp size={12} weight="duotone" style={{ color: 'var(--accent-blue)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Avg Mileage
            </p>
          </div>
          <p
            className="text-lg font-bold"
            style={{ color: getEfficiencyColor(stats?.avgMileage) }}
          >
            {stats?.avgMileage?.toFixed(1) || vehicle.expectedMileage}{' '}
            {vehicle.efficiencyUnit || 'km/L'}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Wallet size={12} weight="duotone" style={{ color: budgetUsage.alert.triggered ? 'var(--accent-alert)' : 'var(--accent-blue)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Budget Used
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: budgetUsage.alert.triggered ? 'var(--accent-alert)' : 'var(--accent-blue)' }}>
            {budgetUsage.percentage.toFixed(0)}%
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {getCurrencySymbol(budgetUsage.currency)}{budgetUsage.spent.toFixed(0)} / {budgetUsage.budget}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Drop size={12} weight="duotone" style={{ color: 'var(--accent-fuel)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Total Fuel
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--accent-fuel)' }}>
            {stats?.totalFuel?.toFixed(0) || 0} {vehicle.fuelVolumeUnit || 'L'}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Path size={12} weight="regular" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Distance
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats?.totalDistance?.toFixed(0) || 0} {vehicle.distanceUnit || 'km'}
          </p>
        </div>

        <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
          <div className="flex items-center gap-1 mb-1">
            <Calendar size={12} weight="regular" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Tank Capacity
            </p>
          </div>
          <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {vehicle.tankCapacity} {vehicle.fuelVolumeUnit || 'L'}
          </p>
        </div>
      </div>

      {isSelected && (
        <div
          className="mt-3 p-2 rounded-lg text-center text-xs font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-blue) 10%, transparent)',
            color: 'var(--accent-blue)',
          }}
        >
          Currently Selected
        </div>
      )}
    </div>
  );
};

export default VehicleCard;
