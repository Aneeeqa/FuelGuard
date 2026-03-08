import { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Trash2, AlertTriangle, Filter, Download, Search, FileText, FileSpreadsheet, Calendar, Car, Droplet } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import { formatCostPerUnit, getCurrencySymbol } from '../utils/units';
import { exportToPDF, exportToExcel } from '../utils/export';
import Badge, { PillBadge } from '../components/ui/Badge';

const History = () => {
  const { data, loading, deleteLog } = useFuelData();
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged'
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | vehicleId
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null
  const [showExportMenu, setShowExportMenu] = useState(false);
  const currencySymbol = getCurrencySymbol(data.vehicleProfile?.currency || 'USD');
  const fuelUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';
  const distanceUnit = data.vehicleProfile?.distanceUnit || 'km';

  // Get vehicle info helper
  const getVehicleInfo = useMemo(() => {
    return (vehicleId) => {
      if (!vehicleId) return null;
      return data.vehicles?.find(v => v.id === vehicleId) || null;
    };
  }, [data.vehicles]);

  // Count logs per vehicle for filter buttons
  const vehicleCounts = useMemo(() => {
    const counts = {};
    data.logs?.forEach(log => {
      const vehicleId = log.vehicleId || data.currentVehicleId;
      if (vehicleId) {
        counts[vehicleId] = (counts[vehicleId] || 0) + 1;
      }
    });
    return counts;
  }, [data.logs, data.currentVehicleId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  const { logs } = data;

  // Apply both filter (all/flagged), vehicle filter, and search query
  let filteredLogs = logs;

  // Apply flagged filter
  if (filter === 'flagged') {
    filteredLogs = filteredLogs.filter((log) => log.isFlagged);
  }

  // Apply vehicle filter
  if (vehicleFilter !== 'all') {
    filteredLogs = filteredLogs.filter((log) => {
      const logVehicleId = log.vehicleId || data.currentVehicleId;
      return logVehicleId === vehicleFilter;
    });
  }

  // Apply search filter
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filteredLogs = filteredLogs.filter((log) => {
      const dateStr = new Date(log.date).toLocaleDateString().toLowerCase();
      const odometerStr = log.odometer.toString();
      const litersStr = log.liters.toString();
      const priceStr = log.price ? log.price.toString() : '';

      // Also search in vehicle name
      const vehicleInfo = getVehicleInfo(log.vehicleId || data.currentVehicleId);
      const vehicleNameStr = vehicleInfo?.name?.toLowerCase() || '';

      return (
        dateStr.includes(query) ||
        odometerStr.includes(query) ||
        litersStr.includes(query) ||
        priceStr.includes(query) ||
        vehicleNameStr.includes(query)
      );
    });
  }


  const handleDelete = (logId) => {
    deleteLog(logId);
    setConfirmDelete(null);
  };

  // Empty state
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-bounce"
          style={{ 
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Filter className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Entries Yet</h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Start tracking your fuel consumption.</p>
        <a
          href="/add"
          className="inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-xl min-h-[56px] transition-all duration-300 hover-lift active-scale"
          style={{ 
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          Add Entry
        </a>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            History
          </h1>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <PillBadge variant={filter === 'flagged' ? 'danger' : 'info'}>
          {filter === 'all' ? 'All Entries' : 'Flagged Only'}
        </PillBadge>
      </div>

       {/* Search Bar */}
       <div className="relative animate-fade-in-up delay-100">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors" style={{ color: 'var(--text-muted)' }} />
         <input
           type="text"
           placeholder="Search by date, odometer, or amount..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full pl-12 pr-4 py-3 rounded-xl min-h-[52px] focus:outline-none transition-all duration-200"
           style={{
             backgroundColor: 'var(--bg-input)',
             color: 'var(--text-primary)',
             border: '2px solid var(--border-color)',
           }}
         />
       </div>

       {/* Filter and Export */}
       <div className="space-y-3 animate-fade-in-up delay-200">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'all'
                  ? 'shadow-glow-blue'
                  : ''
                }`}
              style={{
                background: filter === 'all'
                  ? 'var(--gradient-primary)'
                  : 'var(--bg-secondary)',
                color: filter === 'all'
                  ? 'white'
                  : 'var(--text-secondary)',
                border: filter === 'all'
                  ? 'none'
                  : '1px solid var(--border-color)',
              }}
            >
              <Calendar className="w-4 h-4" />
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${filter === 'flagged'
                  ? 'shadow-glow-danger'
                  : ''
                }`}
              style={{
                background: filter === 'flagged'
                  ? 'var(--gradient-danger)'
                  : 'var(--bg-secondary)',
                color: filter === 'flagged'
                  ? 'white'
                  : 'var(--text-secondary)',
                border: filter === 'flagged'
                  ? 'none'
                  : '1px solid var(--border-color)',
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              Flagged ({logs.filter((l) => l.isFlagged).length})
            </button>
          </div>

          {/* Vehicle Filter - Only show if there are multiple vehicles */}
          {data.vehicles && data.vehicles.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => setVehicleFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 min-h-[36px] flex items-center gap-1.5 ${
                  vehicleFilter === 'all' ? 'shadow-glow-blue' : ''
                }`}
                style={{
                  background: vehicleFilter === 'all'
                    ? 'var(--gradient-primary)'
                    : 'var(--bg-secondary)',
                  color: vehicleFilter === 'all' ? 'white' : 'var(--text-secondary)',
                  border: vehicleFilter === 'all' ? 'none' : '1px solid var(--border-color)',
                }}
              >
                <Car className="w-3.5 h-3.5" />
                All Vehicles
              </button>
              {data.vehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => setVehicleFilter(vehicle.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 min-h-[36px] flex items-center gap-1.5 ${
                    vehicleFilter === vehicle.id ? 'shadow-glow-blue' : ''
                  }`}
                  style={{
                    background: vehicleFilter === vehicle.id
                      ? 'var(--gradient-primary)'
                      : 'var(--bg-secondary)',
                    color: vehicleFilter === vehicle.id ? 'white' : 'var(--text-secondary)',
                    border: vehicleFilter === vehicle.id ? 'none' : '1px solid var(--border-color)',
                  }}
                >
                  <Car className="w-3.5 h-3.5" />
                  {vehicle.year && vehicle.year + ' '}
                  {vehicle.make && vehicle.make + ' '}
                  {vehicle.model && vehicle.model}
                  {vehicleCounts[vehicle.id] ? ` (${vehicleCounts[vehicle.id]})` : ''}
                </button>
              ))}
             </div>
          )}
        </div>

       {/* Export Menu */}
       <div className="flex justify-end animate-fade-in-up delay-200">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px]"
              style={{
                background: showExportMenu
                  ? 'var(--gradient-primary)'
                  : 'var(--bg-secondary)',
                color: showExportMenu
                  ? 'white'
                  : 'var(--text-primary)',
                border: showExportMenu
                  ? 'none'
                  : '1px solid var(--border-color)',
              }}
            >
              {exporting ? (
                <Download className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export
                </>
              )}
            </button>

            {/* Export Dropdown */}
            {showExportMenu && (
              <div className="absolute right-0 top-14 z-50 w-52 rounded-xl shadow-xl overflow-hidden animate-fade-in-up"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                 <button
                   onClick={() => {
                     setExporting('pdf');
                     const success = exportToPDF(filteredLogs, data.vehicleProfile, currencySymbol);
                     if (!success) {
                       setExporting(null);
                       return;
                     }
                     setTimeout(() => {
                       setExporting(null);
                       setShowExportMenu(false);
                     }, 2000);
                   }}
                   disabled={exporting === 'pdf'}
                   className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[var(--bg-primary)] transition-colors active-scale"
                   style={{ color: 'var(--text-primary)' }}
                 >
                   <FileText className="w-4 h-4" />
                   <span className="font-medium">Export as PDF</span>
                 </button>
                 <button
                   onClick={() => {
                     setExporting('excel');
                     const success = exportToExcel(filteredLogs, data.vehicleProfile, currencySymbol);
                     if (!success) {
                       setExporting(null);
                       return;
                     }
                     setTimeout(() => {
                       setExporting(null);
                       setShowExportMenu(false);
                     }, 2000);
                   }}
                   disabled={exporting === 'excel'}
                   className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-[var(--bg-primary)] transition-colors border-t active-scale"
                   style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                 >
                   <FileSpreadsheet className="w-4 h-4" />
                   <span className="font-medium">Export as Excel</span>
                 </button>
              </div>
            )}
          </div>
        </div>

      {/* Entries List - Grid on desktop */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 animate-fade-in-up delay-300">
        {filteredLogs.length === 0 ? (
          <div className="col-span-2 text-center py-12 glass rounded-xl">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
              No entries found
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={log.id}
              className={`rounded-xl shadow-md overflow-hidden transition-all duration-300 hover-lift animate-fade-in-up ${log.isFlagged ? 'shadow-glow-danger' : ''
                }`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: `1px solid ${log.isFlagged ? 'var(--accent-alert)' : 'var(--border-color)'}`,
                borderLeftWidth: log.isFlagged ? '4px' : '1px',
                borderLeftColor: log.isFlagged ? 'var(--accent-alert)' : undefined,
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {log.liters}{fuelUnit}
                    </span>
                    {log.isFlagged && (
                      <Badge variant="danger" icon={AlertTriangle} size="sm">
                        Theft Alert
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold"
                      style={{ 
                        color: log.isFlagged 
                          ? 'var(--accent-alert)' 
                          : 'var(--accent-blue)' 
                      }}
                    >
                      {log.mileage.toFixed(1)}
                     </p>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {distanceUnit}/{fuelUnit}
                    </p>
                   </div>
                </div>

                 <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex flex-col gap-1 mb-3">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {new Date(log.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <div className="flex flex-col gap-1">
                       <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                         {log.odometer.toLocaleString()} {distanceUnit}
                       </p>
                      {log.pumpName && (
                        <p className="text-sm flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Droplet className="w-3 h-3" />
                          {log.pumpName}
                        </p>
                      )}
                    </div>
                  </div>
                 </div>

                 {/* Vehicle Info - Show when viewing all vehicles */}
                 {vehicleFilter === 'all' && (
                   <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
                     <Car className="w-3.5 h-3.5" style={{ color: 'var(--accent-fuel)' }} />
                     <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                       {(() => {
                         const vehicleInfo = getVehicleInfo(log.vehicleId || data.currentVehicleId);
                         if (vehicleInfo) {
                           const parts = [vehicleInfo.year, vehicleInfo.make, vehicleInfo.model, vehicleInfo.variant].filter(Boolean);
                           return parts.join(' ');
                         }
                         return 'Unknown Vehicle';
                       })()}
                     </p>
                   </div>
                 )}

                {log.costPerKm && (
                  <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'var(--bg-primary)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Cost per {distanceUnit}
                        </p>
                        <p className="text-lg font-bold" style={{ color: 'var(--accent-blue)' }}>
                          {currencySymbol}{log.costPerKm.toFixed(3)}
                        </p>
                      </div>
                      {log.costPerMile && (
                        <div className="text-right">
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            ≈ {currencySymbol}{log.costPerMile.toFixed(3)}/mi
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                 {/* Delete Button */}
                 {confirmDelete === log.id ? (
                   <div
                     className="flex gap-2 mt-2"
                   >
                     <button
                       onClick={() => setConfirmDelete(null)}
                       className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors active-scale"
                       style={{ 
                         backgroundColor: 'var(--bg-input)',
                         color: 'var(--text-secondary)' 
                       }}
                     >
                       Cancel
                     </button>
                     <button
                       onClick={() => handleDelete(log.id)}
                       className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors active-scale text-white"
                       style={{ 
                         background: 'var(--gradient-danger)',
                         boxShadow: 'var(--shadow-glow-danger)' 
                       }}
                     >
                       Delete
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-2">
                     {/* Additional Info */}
                     {(log.note || log.pumpName) && (
                       <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                         {log.note && (
                           <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
                             <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                             <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                               {log.note}
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                     <button
                       onClick={() => setConfirmDelete(log.id)}
                       className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 active-scale"
                       style={{
                         backgroundColor: 'var(--bg-input)',
                         color: 'var(--text-muted)',
                         border: '1px solid var(--border-color)',
                       }}
                     >
                       <Trash2 className="w-4 h-4" />
                       <span>Delete Entry</span>
                     </button>
                   </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
