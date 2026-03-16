import { useState, useMemo } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { Trash2, AlertTriangle, Filter, Download, Search, FileText, FileSpreadsheet, Calendar, Car, Droplet, Route, MapPin, TrendingUp, Activity, Clock, Flame, CloudOff } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import { formatCostPerUnit, getCurrencySymbol } from '../utils/units';
import { exportToPDF, exportToExcel } from '../utils/export';
import Badge, { PillBadge } from '../components/ui/Badge';
import Card from '../components/ui/Card';
// import TankToTankTripCard from '../components/TankToTankTripCard';
import { calculateTrips, formatTripDateRange, getTripStatusColor } from '../utils/tripCalculations';
import { calculateTankToTankStatistics } from '../utils/tankToTankCalculations';

const History = () => {
  const { data, loading, deleteLog } = useFuelData();
  const [filter, setFilter] = useState('all'); // 'all' | 'flagged'
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | vehicleId
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exporting, setExporting] = useState(null); // 'pdf' | 'excel' | null
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'trips' | 'tankToTank'
  const [tripFilter, setTripFilter] = useState('all'); // 'all' | 'normal' | 'suspicious' | 'theft'
  const [tankToTankFilter, setTankToTankFilter] = useState('all'); // 'all' | 'normal' | 'theft'
  const currencySymbol = getCurrencySymbol(data.vehicleProfile?.currency || 'USD');
  const fuelUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';
  const distanceUnit = data.vehicleProfile?.distanceUnit || 'km';

  // Get vehicle info helper
  const getVehicleInfo = useMemo(() => {
    return (vehicleId) => {
      if (!vehicleId) return null;
      return data.vehicles?.find((v) => v.id === vehicleId) || null;
    };
  }, [data.vehicles]);

  // Count logs per vehicle for filter buttons
  const vehicleCounts = useMemo(() => {
    const counts = {};
    data.logs?.forEach((log) => {
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

  // Calculate trips from logs
  const trips = useMemo(() => {
    return calculateTrips(logs || [], data.vehicleProfile || {});
  }, [logs, data.vehicleProfile]);

  // Calculate trip statistics
  const tripStats = useMemo(() => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        normalTrips: 0,
        suspiciousTrips: 0,
        theftAlertTrips: 0,
        avgTripMileage: 0,
        avgTripDistance: 0,
        totalDistance: 0,
        totalFuelConsumed: 0,
      };
    }

    const normalTrips = trips.filter((t) => t.status === 'Normal').length;
    const suspiciousTrips = trips.filter((t) => t.isSuspicious).length;
    const theftAlertTrips = trips.filter((t) => t.isTheftAlert).length;

    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const totalFuelConsumed = trips.reduce((sum, t) => sum + t.fuelConsumed, 0);
    const avgTripMileage = trips.reduce((sum, t) => sum + t.tripMileage, 0) / trips.length;
    const avgTripDistance = totalDistance / trips.length;

    return {
      totalTrips: trips.length,
      normalTrips,
      suspiciousTrips,
      theftAlertTrips,
      avgTripMileage: avgTripMileage.toFixed(1),
      avgTripDistance: avgTripDistance.toFixed(0),
      totalDistance: totalDistance.toFixed(0),
      totalFuelConsumed: totalFuelConsumed.toFixed(1),
    };
  }, [trips]);

  // Filter trips based on trip filter
  const filteredTrips = useMemo(() => {
    if (tripFilter === 'all') return trips;
    if (tripFilter === 'normal') return trips.filter((t) => t.status === 'Normal');
    if (tripFilter === 'suspicious') return trips.filter((t) => t.isSuspicious);
    if (tripFilter === 'theft') return trips.filter((t) => t.isTheftAlert);
    return trips;
  }, [trips, tripFilter]);

  // ========================================
  // Tank-to-Tank Trips
  // ========================================
  const tankToTankTrips = useMemo(() => {
    return data.vehicleProfile?.tankToTankTrips || [];
  }, [data.vehicleProfile?.tankToTankTrips]);

  // Calculate Tank-to-Tank statistics
  const tankToTankStats = useMemo(() => {
    return calculateTankToTankStatistics(tankToTankTrips);
  }, [tankToTankTrips]);

  // Filter tank-to-tank trips
  const filteredTankToTankTrips = useMemo(() => {
    if (tankToTankFilter === 'all') return tankToTankTrips;
    if (tankToTankFilter === 'normal') return tankToTankTrips.filter((t) => !t.isTheftSuspected);
    if (tankToTankFilter === 'theft') return tankToTankTrips.filter((t) => t.isTheftSuspected);
    return tankToTankTrips;
  }, [tankToTankTrips, tankToTankFilter]);

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
            {activeTab === 'entries'
              ? `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`
              : activeTab === 'trips'
              ? `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`
              : `${tankToTankTrips.length} tank-to-tank trip${tankToTankTrips.length === 1 ? '' : 's'}`
            }
          </span>
        </div>
        {activeTab === 'entries' && (
          <PillBadge variant={filter === 'flagged' ? 'danger' : 'info'}>
            {filter === 'all' ? 'All Entries' : 'Flagged Only'}
          </PillBadge>
        )}
      </div>

       {/* Search Bar - Only show for entries tab */}
       {activeTab === 'entries' && (
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
       )}

       {/* Filter and Export - Only show for entries tab */}
       {activeTab === 'entries' && (
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
         </div>
       )}

          {/* Tab Switcher */}
          <div className="flex gap-2 animate-fade-in-up delay-300">
           <button
             onClick={() => setActiveTab('entries')}
             className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all min-h-[48px] flex items-center justify-center gap-2 ${
               activeTab === 'entries' ? 'shadow-glow-blue' : ''
             }`}
             style={{
               background: activeTab === 'entries'
                 ? 'var(--gradient-primary)'
                 : 'var(--bg-secondary)',
               color: activeTab === 'entries'
                 ? 'white'
                 : 'var(--text-secondary)',
               border: activeTab === 'entries'
                 ? 'none'
                 : '1px solid var(--border-color)',
             }}
           >
             <FileText className="w-4 h-4" />
             Fuel Entries
             <Badge variant="info" size="sm">{logs.length}</Badge>
           </button>
           <button
             onClick={() => setActiveTab('trips')}
             className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all min-h-[48px] flex items-center justify-center gap-2 ${
               activeTab === 'trips' ? 'shadow-glow-blue' : ''
             }`}
             style={{
               background: activeTab === 'trips'
                 ? 'var(--gradient-primary)'
                 : 'var(--bg-secondary)',
               color: activeTab === 'trips'
                 ? 'white'
                 : 'var(--text-secondary)',
               border: activeTab === 'trips'
                 ? 'none'
                 : '1px solid var(--border-color)',
             }}
           >
             <Route className="w-4 h-4" />
             Trip Analysis
             <Badge variant="info" size="sm">{trips.length}</Badge>
           </button>
           <button
             onClick={() => setActiveTab('tankToTank')}
             className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all min-h-[48px] flex items-center justify-center gap-2 ${
               activeTab === 'tankToTank' ? 'shadow-glow-blue' : ''
             }`}
             style={{
               background: activeTab === 'tankToTank'
                 ? 'var(--gradient-primary)'
                 : 'var(--bg-secondary)',
               color: activeTab === 'tankToTank'
                 ? 'white'
                 : 'var(--text-secondary)',
               border: activeTab === 'tankToTank'
                 ? 'none'
                 : '1px solid var(--border-color)',
             }}
           >
             <Droplet className="w-4 h-4" />
             Tank-to-Tank
             <Badge variant="info" size="sm">{tankToTankTrips.length}</Badge>
           </button>
         </div>

        {/* Tab Content */}
        {activeTab === 'trips' ? (
          /* Trip Analysis */
          <div className="animate-fade-in-up delay-400 space-y-6 pb-24">
            {trips.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
                <div
                  className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-bounce"
                  style={{
                    background: 'var(--gradient-primary)',
                    boxShadow: 'var(--shadow-glow-blue)'
                  }}
                >
                  <Activity className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  No Trip Data
                </h1>
                <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                  Add at least 2 fuel entries to calculate trip statistics
                </p>
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
            ) : (
              <>
                {/* Trip Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Trips</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {tripStats.totalTrips}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Mileage</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                      {tripStats.avgTripMileage}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {distanceUnit}/{fuelUnit}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5" style={{ color: tripStats.theftAlertTrips > 0 ? 'var(--accent-alert)' : 'var(--text-muted)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Theft Alerts</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: tripStats.theftAlertTrips > 0 ? 'var(--accent-alert)' : 'var(--text-primary)' }}>
                      {tripStats.theftAlertTrips}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Normal Trips</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
                      {tripStats.normalTrips}
                    </p>
                  </Card>
                </div>

                {/* Trip Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setTripFilter('all')}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${tripFilter === 'all' ? 'shadow-glow-blue' : ''}`}
                    style={{
                      background: tripFilter === 'all' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                      color: tripFilter === 'all' ? 'white' : 'var(--text-secondary)',
                      border: tripFilter === 'all' ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    All ({trips.length})
                  </button>
                  <button
                    onClick={() => setTripFilter('normal')}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${tripFilter === 'normal' ? 'shadow-glow-blue' : ''}`}
                    style={{
                      background: tripFilter === 'normal' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                      color: tripFilter === 'normal' ? 'white' : 'var(--text-secondary)',
                      border: tripFilter === 'normal' ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    Normal ({tripStats.normalTrips})
                  </button>
                  <button
                    onClick={() => setTripFilter('suspicious')}
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${tripFilter === 'suspicious' ? 'shadow-glow-blue' : ''}`}
                    style={{
                      background: tripFilter === 'suspicious' ? 'var(--gradient-primary)' : 'var(--bg-secondary)',
                      color: tripFilter === 'suspicious' ? 'white' : 'var(--text-secondary)',
                      border: tripFilter === 'suspicious' ? 'none' : '1px solid var(--border-color)',
                    }}
                  >
                    <Clock className="w-4 h-4" />
                    Suspicious ({tripStats.suspiciousTrips})
                  </button>
                  {tripStats.theftAlertTrips > 0 && (
                    <button
                      onClick={() => setTripFilter('theft')}
                      className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${tripFilter === 'theft' ? 'shadow-glow-danger' : ''}`}
                      style={{
                        background: tripFilter === 'theft' ? 'var(--gradient-danger)' : 'var(--bg-secondary)',
                        color: tripFilter === 'theft' ? 'white' : 'var(--text-secondary)',
                        border: tripFilter === 'theft' ? 'none' : '1px solid var(--border-color)',
                      }}
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Theft Alerts ({tripStats.theftAlertTrips})
                    </button>
                  )}
                </div>

                {/* Theft Alert Warning */}
                {tripStats.theftAlertTrips > 0 && (
                  <Card className="p-4 border-l-4" style={{ borderLeftColor: 'var(--accent-alert)', backgroundColor: 'color-mix(in srgb, var(--accent-alert) 5%, transparent)' }}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-alert)' }} />
                      <div>
                        <h3 className="font-semibold mb-1" style={{ color: 'var(--accent-alert)' }}>
                          Fuel Theft Alerts Detected
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                          {tripStats.theftAlertTrips} trip(s) show significantly lower mileage than expected. This could indicate fuel siphoning, leaks, or odometer tampering. Check these trips for suspicious activity.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Trips List */}
                {filteredTrips.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                      No trips match selected filter
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredTrips.map((trip, index) => {
                      const statusColor = getTripStatusColor(trip.status);
                      const isTheftAlert = trip.status === 'Potential Theft';

                      return (
                        <Card
                          key={trip.id}
                          variant="elevated"
                          className={`p-5 transition-all hover:shadow-lg ${isTheftAlert ? 'shadow-glow-danger' : ''}`}
                          style={{
                            borderLeft: isTheftAlert ? '4px solid var(--accent-alert)' : undefined,
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {formatTripDateRange(trip.startDate, trip.endDate)}
                              </span>
                            </div>
                            <Badge
                              variant={isTheftAlert ? 'danger' : (trip.status === 'Normal' ? 'success' : 'warning')}
                              size="sm"
                            >
                              {trip.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <MapPin className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                            <div className="flex-1 flex items-center gap-2">
                              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                {trip.startOdometer.toLocaleString()}
                              </span>
                              <span style={{ color: 'var(--text-muted)' }}>➔</span>
                              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                                {trip.endOdometer.toLocaleString()}
                              </span>
                              <span className="text-sm px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                                {trip.distanceUnit}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                Distance
                              </p>
                              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {trip.distance.toFixed(0)}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {trip.distanceUnit}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                Fuel Used
                              </p>
                              <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {trip.fuelConsumed.toFixed(1)}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {trip.fuelVolumeUnit}
                              </p>
                            </div>

                            <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${statusColor} 10%, transparent)` }}>
                              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                Average
                              </p>
                              <p className="text-base font-bold" style={{ color: statusColor }}>
                                {trip.tripMileage.toFixed(1)}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {trip.efficiencyUnit}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                Expected
                              </p>
                              <p className="text-base font-semibold" style={{ color: 'var(--accent-blue)' }}>
                                {trip.expectedMileage.toFixed(1)}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {trip.efficiencyUnit}
                              </p>
                            </div>
                          </div>

                          {isTheftAlert && (
                            <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
                              border: '1px solid var(--accent-alert)'
                            }}>
                              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-alert)' }} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--accent-alert)' }}>
                                  Potential Fuel Theft Detected
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  Mileage dropped to {trip.tripMileage.toFixed(1)} {trip.efficiencyUnit} (expected: {trip.expectedMileage.toFixed(1)} {trip.efficiencyUnit}). This indicates {((1 - trip.tripMileage / trip.expectedMileage) * 100).toFixed(0)}% lower efficiency than normal. Check for fuel siphoning or leaks.
                                </p>
                              </div>
                            </div>
                          )}

                          {trip.status === 'Heavy Traffic' && (
                            <div className="mt-4 p-2 rounded-lg flex items-start gap-2" style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
                            }}>
                              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-warning)' }} />
                              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Mileage is slightly below normal. Could be due to traffic conditions or driving style.
                              </p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
           </div>
         ) : activeTab === 'tankToTank' ? (
           /* Tank-to-Tank Trips */
           <div className="animate-fade-in-up delay-400 space-y-6 pb-24">
             {tankToTankTrips.length === 0 ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fade-in">
                 <div
                   className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6 animate-bounce"
                   style={{
                     background: 'var(--gradient-primary)',
                     boxShadow: 'var(--shadow-glow-blue)'
                   }}
                 >
                   <Droplet className="w-12 h-12 text-white" />
                 </div>
                 <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                   No Tank-to-Tank Trips
                 </h1>
                 <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
                   Add at least 2 full tank fill-ups to analyze fuel consumption
                 </p>
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
             ) : (
               <>
                 {/* Tank-to-Tank Statistics Cards */}
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                   <Card className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <Route className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                       <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Trips</span>
                     </div>
                     <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                       {tankToTankStats.count}
                     </p>
                   </Card>

                   <Card className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
                       <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Mileage</span>
                     </div>
                     <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                       {tankToTankStats.avgActualMileage}
                     </p>
                     <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                       {distanceUnit}/{fuelUnit}
                     </p>
                   </Card>

                   <Card className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <AlertTriangle className="w-5 h-5" style={{ color: tankToTankStats.theftIncidents > 0 ? 'var(--accent-alert)' : 'var(--text-muted)' }} />
                       <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Theft Alerts</span>
                     </div>
                     <p className="text-2xl font-bold" style={{ color: tankToTankStats.theftIncidents > 0 ? 'var(--accent-alert)' : 'var(--text-primary)' }}>
                       {tankToTankStats.theftIncidents}
                     </p>
                   </Card>

                   <Card className="p-4">
                     <div className="flex items-center gap-2 mb-2">
                       <Flame className="w-5 h-5" style={{ color: tankToTankStats.totalTheftAmount > 0 ? 'var(--accent-alert)' : 'var(--accent-success)' }} />
                       <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Stolen</span>
                     </div>
                     <p className="text-2xl font-bold" style={{ color: tankToTankStats.totalTheftAmount > 0 ? 'var(--accent-alert)' : 'var(--accent-success)' }}>
                       {tankToTankStats.totalTheftAmount.toFixed(1)}
                     </p>
                     <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                       {fuelUnit}
                     </p>
                   </Card>
                 </div>

                 {/* Tank-to-Tank Filter Buttons */}
                 <div className="flex flex-wrap gap-2">
                   <button
                     onClick={() => setTankToTankFilter('all')}
                     className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                       tankToTankFilter === 'all' ? 'shadow-glow-blue' : ''
                     }`}
                     style={{
                       background: tankToTankFilter === 'all'
                         ? 'var(--gradient-primary)'
                         : 'var(--bg-secondary)',
                       color: tankToTankFilter === 'all'
                         ? 'white'
                         : 'var(--text-secondary)',
                       border: tankToTankFilter === 'all'
                         ? 'none'
                         : '1px solid var(--border-color)',
                     }}
                   >
                     <Filter className="w-4 h-4" />
                     All ({tankToTankTrips.length})
                   </button>
                   <button
                     onClick={() => setTankToTankFilter('normal')}
                     className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                       tankToTankFilter === 'normal' ? 'shadow-glow-blue' : ''
                     }`}
                     style={{
                       background: tankToTankFilter === 'normal'
                         ? 'var(--gradient-primary)'
                         : 'var(--bg-secondary)',
                       color: tankToTankFilter === 'normal'
                         ? 'white'
                         : 'var(--text-secondary)',
                       border: tankToTankFilter === 'normal'
                         ? 'none'
                         : '1px solid var(--border-color)',
                     }}
                   >
                     <Route className="w-4 h-4" />
                     Normal ({tankToTankTrips.filter((t) => !t.isTheftSuspected).length})
                   </button>
                   {tankToTankStats.theftIncidents > 0 && (
                     <button
                       onClick={() => setTankToTankFilter('theft')}
                       className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px] flex items-center gap-2 ${
                         tankToTankFilter === 'theft' ? 'shadow-glow-danger' : ''
                       }`}
                       style={{
                         background: tankToTankFilter === 'theft'
                           ? 'var(--gradient-danger)'
                           : 'var(--bg-secondary)',
                         color: tankToTankFilter === 'theft'
                           ? 'white'
                           : 'var(--text-secondary)',
                         border: tankToTankFilter === 'theft'
                           ? 'none'
                           : '1px solid var(--border-color)',
                       }}
                     >
                       <AlertTriangle className="w-4 h-4" />
                       Theft Alerts ({tankToTankStats.theftIncidents})
                     </button>
                   )}
                 </div>

                 {/* Theft Alert Warning */}
                 {tankToTankStats.theftIncidents > 0 && (
                   <Card className="p-4 border-l-4" style={{ borderLeftColor: 'var(--accent-alert)', backgroundColor: 'color-mix(in srgb, var(--accent-alert) 5%, transparent)' }}>
                     <div className="flex items-start gap-3">
                       <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-alert)' }} />
                       <div>
                         <h3 className="font-semibold mb-1" style={{ color: 'var(--accent-alert)' }}>
                           Fuel Theft Alerts Detected
                         </h3>
                         <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                           {tankToTankStats.theftIncidents} tank(s) show significantly higher fuel consumption than expected. This could indicate fuel siphoning, leaks, or incorrect tank capacity settings. Check these trips for suspicious activity.
                           {tankToTankStats.totalTheftAmount > 0 && (
                             <span className="block mt-2 font-medium" style={{ color: 'var(--accent-alert)' }}>
                               Total fuel stolen: {tankToTankStats.totalTheftAmount.toFixed(1)} {fuelUnit}
                             </span>
                           )}
                         </p>
                       </div>
                     </div>
                   </Card>
                 )}

                  {/* Tank-to-Tank Trips List */}
                  {filteredTankToTankTrips.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Filter className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
                      <p className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>
                        No trips match selected filter
                      </p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredTankToTankTrips.map((trip, index) => {
                        // Calculate price per liter for theft cost
                        // Use last log's price or average price
                        const pricePerLiter = data.logs?.[0]?.price / data.logs?.[0]?.liters || 0;
                        
                        // Display simplified card
                        return (
                          <Card
                            key={trip.currentLogId}
                            variant="elevated"
                            className={`p-5 transition-all hover:shadow-lg ${trip.isTheftSuspected ? 'shadow-glow-danger' : ''}`}
                            style={{
                              borderLeft: trip.isTheftSuspected ? '4px solid var(--accent-alert)' : undefined,
                              animationDelay: `${index * 50}ms`
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                                </span>
                              </div>
                              <Badge
                                variant={trip.isTheftSuspected ? 'danger' : 'success'}
                                size="sm"
                              >
                                {trip.isTheftSuspected ? 'Theft Detected' : 'Normal'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Distance
                                </p>
                                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {trip.distance.toFixed(0)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {distanceUnit}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Fuel Added
                                </p>
                                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {trip.actualFuelConsumed.toFixed(1)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {fuelUnit}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Actual Mileage
                                </p>
                                <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {trip.actualMileage.toFixed(1)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {distanceUnit}/{fuelUnit}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                                  Expected
                                </p>
                                <p className="text-base font-semibold" style={{ color: 'var(--accent-blue)' }}>
                                  {trip.expectedFuelConsumed.toFixed(1)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {fuelUnit}
                                </p>
                              </div>
                            </div>

                            {trip.isTheftSuspected && (
                              <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
                                backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
                                border: '1px solid var(--accent-alert)'
                              }}>
                                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-alert)' }} />
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: 'var(--accent-alert)' }}>
                                    Fuel Theft Detected
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {trip.theftAmount.toFixed(1)} {fuelUnit} unaccounted for ({trip.theftPercentage.toFixed(0)}% deviation)
                                  </p>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
               </>
             )}
           </div>
         ) : (
           /* Entries List - Grid on desktop */
           <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 animate-fade-in-up delay-400">
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
                     {log.pendingSync && (
                       <Badge variant="warning" icon={CloudOff} size="sm">
                         Pending sync
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
        )}
     </div>
   );
 };

export default History;
