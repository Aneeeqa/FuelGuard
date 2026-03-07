import { useState, useMemo, useEffect } from 'react';
import { useFuelData } from '../hooks/useFuelData';
import { MapPin, Route, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import FuelMap from '../components/Map/FuelMap';
import { getCurrencySymbol } from '../utils/currency';
import { calculateHaversineDistance } from '../utils/geolocation';
import { getLocationName } from '../services/geocodingService';
import Skeleton from '../components/ui/Skeleton';
import Card from '../components/ui/Card';
import { formatDistance } from '../utils/formatters';

const Trips = () => {
  const { data } = useFuelData();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [locationNames, setLocationNames] = useState({});
  const [tripFilter, setTripFilter] = useState('all'); // 'all' | 'city' | 'highway' | 'mixed'
  const currencySymbol = getCurrencySymbol(data.vehicleProfile?.currency || 'USD');

  // Sort logs by date (newest first for list)
  const sortedLogs = useMemo(() => {
    return [...data.logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.logs]);

  // Calculate trips (pairs of consecutive logs with locations)
  const trips = useMemo(() => {
    const tripList = [];
    
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const currentLog = sortedLogs[i];
      const nextLog = sortedLogs[i + 1];
      
      // We need startLocation from nextLog (since it's earlier) and endLocation from currentLog
      const startLocation = nextLog.endLocation || nextLog.startLocation;
      const endLocation = currentLog.endLocation || currentLog.startLocation;
      
      if (!startLocation || !endLocation) continue;
      
      // Calculate distances
      const odometerDistance = currentLog.odometer - nextLog.odometer;
      const gpsDistance = calculateHaversineDistance(
        startLocation.lat,
        startLocation.lng,
        endLocation.lat,
        endLocation.lng
      );
      
      // Calculate discrepancy
      const discrepancy = odometerDistance > 0 
        ? Math.abs(gpsDistance - odometerDistance) / odometerDistance 
        : 0;
      
      // Flag as suspicious if discrepancy > 20%
      const isSuspicious = discrepancy > 0.2;
      
      tripList.push({
        id: `trip-${currentLog.id}-${nextLog.id}`,
        startDate: nextLog.date,
        endDate: currentLog.date,
        startLocation,
        endLocation,
        odometerDistance,
        gpsDistance,
        discrepancy,
        isSuspicious,
        logs: [nextLog, currentLog],
      });
    }
    
    return tripList;
  }, [sortedLogs]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    if (trips.length === 0) {
      return { totalTrips: 0, suspiciousTrips: 0, avgDiscrepancy: 0 };
    }
    
    const suspiciousCount = trips.filter(t => t.isSuspicious).length;
    const avgDiscrepancy = trips.reduce((sum, t) => sum + t.discrepancy, 0) / trips.length;
    
    return {
      totalTrips: trips.length,
      suspiciousTrips: suspiciousCount,
      avgDiscrepancy: (avgDiscrepancy * 100).toFixed(1),
    };
  }, [trips]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

   const formatDistance = (km) => {
    if (km === null || km === undefined) return 'N/A';

    // Check if user prefers miles
    const distanceUnit = data.vehicleProfile?.distanceUnit || 'km';
    if (distanceUnit === 'mi') {
      const miles = km * 0.621371;
      return `${miles.toFixed(1)} mi`;
    }

    return `${km.toFixed(1)} km`;
  };

  const formatFuelVolume = (liters) => {
    if (liters === null || liters === undefined) return 'N/A';

    const fuelVolumeUnit = data.vehicleProfile?.fuelVolumeUnit || 'L';
    if (fuelVolumeUnit === 'gal') {
      const gallons = liters * 0.264172;
      return `${gallons.toFixed(1)} gal`;
    }

    return `${liters.toFixed(1)} L`;
  };

  const getDiscrepancyColor = (discrepancy) => {
    if (discrepancy > 0.2) return 'var(--accent-alert)';
    if (discrepancy > 0.1) return 'var(--accent-warning)';
    return 'var(--accent-success)';
  };

  const getDiscrepancyLabel = (discrepancy) => {
    if (discrepancy > 0.2) return 'Suspicious';
    if (discrepancy > 0.1) return 'Elevated';
    return 'Normal';
  };

  if (data.loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Get all trip locations for map
  const mapLocations = selectedTrip
    ? [selectedTrip.startLocation, selectedTrip.endLocation]
    : trips.flatMap(trip => [trip.startLocation, trip.endLocation]);

  // Load location names for all trips
  useEffect(() => {
    const loadLocationNames = async () => {
      const names = {};

      for (const trip of trips) {
        if (trip.startLocation) {
          const startKey = `${trip.startLocation.lat},${trip.startLocation.lng}`;
          if (!names[startKey]) {
            names[startKey] = await getLocationName(trip.startLocation.lat, trip.startLocation.lng);
          }
        }

        if (trip.endLocation) {
          const endKey = `${trip.endLocation.lat},${trip.endLocation.lng}`;
          if (!names[endKey]) {
            names[endKey] = await getLocationName(trip.endLocation.lat, trip.endLocation.lng);
          }
        }
      }

      setLocationNames(names);
    };

    if (trips.length > 0) {
      loadLocationNames();
    }
  }, [trips]);

  return (
    <div className="p-4 lg:p-8 pb-24 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Trip Tracking
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Monitor your driving patterns and detect odometer discrepancies
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Route className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Trips</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.totalTrips}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Suspicious</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: stats.suspiciousTrips > 0 ? 'var(--accent-alert)' : 'var(--text-primary)' }}>
            {stats.suspiciousTrips}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-warning)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Avg Discrepancy</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {stats.avgDiscrepancy}%
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5" style={{ color: 'var(--accent-success)' }} />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>GPS Coverage</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {trips.length > 0 ? '100%' : '0%'}
          </p>
        </Card>
      </div>

      {/* Map Section */}
      {trips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedTrip ? 'Trip Route' : 'All Trip Routes'}
            </h2>
            {selectedTrip && (
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-sm px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              >
                Show All
              </button>
            )}
          </div>

          <div className="h-[350px] lg:h-[450px] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
            <FuelMap
              currentLocation={selectedTrip ? selectedTrip.startLocation : (trips[0]?.startLocation || null)}
              destination={selectedTrip ? selectedTrip.endLocation : null}
              onDestinationSelect={null}
            />
          </div>

          {selectedTrip && (
            <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Odometer Distance</span>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatDistance(selectedTrip.odometerDistance, data.vehicleProfile)}
                  </p>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>GPS Distance</span>
                  <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {formatDistance(selectedTrip.gpsDistance, data.vehicleProfile)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

       {/* Trips List */}
       <div>
         {/* Trip Type Filter */}
         <div className="flex flex-wrap items-center gap-2 mb-4">
           <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
             Trip History
           </h2>
           <div className="flex gap-2 ml-4">
             <button
               onClick={() => setTripFilter('all')}
               className={`px-4 py-2 rounded-lg font-medium transition-all ${
                 tripFilter === 'all' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)]'
               }`}
             >
               All
             </button>
             <button
               onClick={() => setTripFilter('city')}
               className={`px-4 py-2 rounded-lg font-medium transition-all ${
                 tripFilter === 'city' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)]'
               }`}
             >
               🏙️ City
             </button>
             <button
               onClick={() => setTripFilter('highway')}
               className={`px-4 py-2 rounded-lg font-medium transition-all ${
                 tripFilter === 'highway' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)]'
               }`}
             >
               🛣️ Highway
             </button>
             <button
               onClick={() => setTripFilter('mixed')}
               className={`px-4 py-2 rounded-lg font-medium transition-all ${
                 tripFilter === 'mixed' ? 'bg-[var(--accent-blue)] text-white' : 'text-[var(--text-secondary)]'
               }`}
             >
               🔄 Mixed
             </button>
           </div>
         </div>

         {trips.length === 0 ? (
          <Card className="p-8 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No GPS Trips Found
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Add fuel entries with location tracking to see trip data
            </p>
          </Card>
         ) : (
           <div className="space-y-3">
             {trips
               .filter(trip => {
                 if (tripFilter === 'all') return true;
                 // For now, show all trips since trip type is not stored in logs
                 // In future, implement trip.type field and filter here
                 return true;
               })
               .map((trip) => (
               <Card
                 key={trip.id}
                 className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                   selectedTrip?.id === trip.id ? 'ring-2' : ''
                 }`}
                 style={{
                   ringColor: selectedTrip?.id === trip.id ? 'var(--accent-blue)' : 'transparent'
                 }}
                 onClick={() => setSelectedTrip(trip)}
               >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(trip.startDate)} → {formatDate(trip.endDate)}
                      </span>
                      {/* Trip Type Badge (randomly assigned for demo since not stored in logs yet) */}
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{
                        backgroundColor: 'var(--accent-blue, #3b82f6)',
                        color: 'white'
                      }}>
                        🏙️ City
                      </span>
                    </div>
                    {trip.isSuspicious && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--accent-alert)', color: 'white' }}>
                        {getDiscrepancyLabel(trip.discrepancy)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {trip.logs[0].odometer} {data.vehicleProfile?.distanceUnit || 'km'} → {trip.logs[1].odometer} {data.vehicleProfile?.distanceUnit || 'km'}
                    </p>
                    {trip.startLocation && (
                      <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <MapPin className="w-3 h-3" />
                        {locationNames[`${trip.startLocation.lat},${trip.startLocation.lng}`] || `${trip.startLocation.lat.toFixed(4)}, ${trip.startLocation.lng.toFixed(4)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${getDiscrepancyColor(trip.discrepancy)} 15%, transparent)`,
                        color: getDiscrepancyColor(trip.discrepancy),
                      }}
                    >
                      {(trip.discrepancy * 100).toFixed(1)}% diff
                    </div>
                  </div>

                   <div className="grid grid-cols-3 gap-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Odometer</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDistance(trip.odometerDistance, data.vehicleProfile)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>GPS</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatDistance(trip.gpsDistance, data.vehicleProfile)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs block" style={{ color: 'var(--text-secondary)' }}>Fuel Used</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {formatFuelVolume(trip.logs[1].liters)}
                      </span>
                    </div>
                  </div>

                  {trip.isSuspicious && (
                    <div className="mt-3 p-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)' }}>
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-alert)' }} />
                      <p className="text-xs" style={{ color: 'var(--accent-alert)' }}>
                        Large discrepancy between odometer and GPS readings detected. Possible odometer tampering or GPS error.
                      </p>
                    </div>
                  )}
               </Card>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      {trips.length > 0 && stats.suspiciousTrips > 0 && (
        <Card className="p-4 border-l-4" style={{ borderLeftColor: 'var(--accent-warning)', backgroundColor: 'color-mix(in srgb, var(--accent-warning) 5%, transparent)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--accent-warning)' }} />
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Discrepancy Detected
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Some trips show significant differences between odometer and GPS readings. This could indicate odometer tampering, GPS inaccuracy, or actual route variations.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Trips;
