/**
 * History Page with Tank-to-Tank Tab - Demo Component
 *
 * This file demonstrates the updated History page with the new Tank-to-Tank trips tab.
 * Shows how the tab system, filtering, and statistics work together.
 */

import React, { useState } from 'react';

/**
 * Demo of the three-tab system in History page
 */
const HistoryTabDemo = () => {
  const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'trips' | 'tankToTank'
  const [tankToTankFilter, setTankToTankFilter] = useState('all'); // 'all' | 'normal' | 'theft'

  // Mock data for demonstration
  const mockData = {
    logs: [
      { id: 1, date: 'TBD-01-20', odometer: 15000, liters: 36 },
      { id: 2, date: 'TBD-01-22', odometer: 15050, liters: 8 },
      { id: 3, date: 'TBD-01-24', odometer: 15200, liters: 10 },
    ],
    trips: [
      { id: 'trip-1', status: 'Normal', distance: 200, fuelConsumed: 15 },
      { id: 'trip-2', status: 'Potential Theft', distance: 150, fuelConsumed: 25 },
    ],
    tankToTankTrips: [
      {
        isValid: true,
        isTheftSuspected: false,
        distance: 300,
        actualFuelConsumed: 20,
        expectedFuelConsumed: 20,
        theftAmount: 0,
        theftPercentage: 0,
        mileageEfficiency: 100,
        startDate: 'TBD-01-15T10:00:00Z',
        endDate: 'TBD-01-20T14:30:00Z',
        startOdometer: 15000,
        endOdometer: 15300,
        durationDays: 5,
        currentLogId: 'log-2'
      },
      {
        isValid: true,
        isTheftSuspected: true,
        distance: 200,
        actualFuelConsumed: 36,
        expectedFuelConsumed: 13.33,
        theftAmount: 22.67,
        theftPercentage: 63,
        mileageEfficiency: 37,
        startDate: 'TBD-01-20T10:00:00Z',
        endDate: 'TBD-01-24T14:30:00Z',
        startOdometer: 15300,
        endOdometer: 15500,
        durationDays: 4,
        currentLogId: 'log-3'
      }
    ],
    vehicleProfile: {
      tankCapacity: 100,
      expectedMileage: 15,
      theftThreshold: 25,
      tankToTankTheftThreshold: 25,
      minimumFillPercentage: 80,
      currency: 'USD'
    }
  };

  // Calculate statistics
  const tankToTankStats = {
    count: mockData.tankToTankTrips.length,
    avgActualMileage: 11.78,
    theftIncidents: 1,
    totalTheftAmount: 22.7
  };

  const filteredTankToTankTrips = mockData.tankToTankTrips.filter(trip => {
    if (tankToTankFilter === 'all') return true;
    if (tankToTankFilter === 'normal') return !trip.isTheftSuspected;
    if (tankToTankFilter === 'theft') return trip.isTheftSuspected;
    return true;
  });

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            History
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {activeTab === 'entries'
              ? `${mockData.logs.length} entries`
              : activeTab === 'trips'
              ? `${mockData.trips.length} trips`
              : `${mockData.tankToTankTrips.length} tank-to-tank trips`
            }
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14 2H6a2 2 0 0 0 0-2 2v16a2 2 0 0 0 0 2 2h12a2 2 0 0 0 0 2-2V8z" />
            <path d="M2 6h2" />
            <path d="M22 6h-2" />
          </svg>
          Fuel Entries
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
            {mockData.logs.length}
          </span>
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 12h18" />
            <path d="M12 3v18" />
          </svg>
          Trip Analysis
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
            {mockData.trips.length}
          </span>
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
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0-3.5 3.5v5h5a2 2 0 0 1 2 2v5a2 2 0 0 1-2-2z" />
          </svg>
          Tank-to-Tank
          <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
            {mockData.tankToTankTrips.length}
          </span>
        </button>
      </div>

      {/* Tank-to-Tank Tab Content */}
      {activeTab === 'tankToTank' && (
        <div className="animate-fade-in-up space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 12h18" />
                  <path d="M12 3v18" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Trips</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {tankToTankStats.count}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13 7h8m0 0v9m0-9l-3 3m3-3l3 3M2 7h3m0 0v5m0-5l-3 3m3-3l3 3" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Mileage</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                {tankToTankStats.avgActualMileage.toFixed(1)}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>km/L</p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 1-1.71 3.71l12 12a2 2 0 0 1 3.71 3.71l1.71-3.71a1 1 0 0 0-1.42-1.71L6.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9.17l3.12-3.71a1 1 0 0 0-.7-.29" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Theft Alerts</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--accent-alert)' }}>
                {tankToTankStats.theftIncidents}
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 2v20M2 12h20" />
                </svg>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Stolen</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: tankToTankStats.totalTheftAmount > 0 ? 'var(--accent-alert)' : 'var(--accent-success)' }}>
                {tankToTankStats.totalTheftAmount.toFixed(1)} L
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
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
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M22 3H2l8 9 3 9-8" />
              </svg>
              All ({mockData.tankToTankTrips.length})
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
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 12h18" />
                <path d="M12 3v18" />
              </svg>
              Normal ({mockData.tankToTankTrips.filter(t => !t.isTheftSuspected).length})
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
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 1-1.71 3.71l12 12a2 2 0 0 1 3.71 3.71l1.71-3.71a1 1 0 0 0-.7-.29L6.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9.17l3.12-3.71a1 1 0 0 0-.7-.29" />
                </svg>
                Theft Alerts ({tankToTankStats.theftIncidents})
              </button>
            )}
          </div>

          {/* Theft Alert Warning */}
          {tankToTankStats.theftIncidents > 0 && (
            <div className="p-4 rounded-xl border-l-4" style={{
              borderLeftColor: 'var(--accent-alert)',
              backgroundColor: 'color-mix(in srgb, var(--accent-alert) 5%, transparent)'
            }}>
              <div className="flex items-start gap-3">
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent-alert)' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 1-1.71 3.71l12 12a2 2 0 0 1 3.71 3.71l1.71-3.71a1 1 0 0 0-.7-.29L6.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9.17l3.12-3.71a1 1 0 0 0-.7-.29" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: 'var(--accent-alert)' }}>
                    Fuel Theft Alerts Detected
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {tankToTankStats.theftIncidents} trip(s) show significantly higher fuel consumption than expected. This could indicate fuel siphoning, leaks, or incorrect tank capacity settings. Check these trips for suspicious activity.
                    {tankToTankStats.totalTheftAmount > 0 && (
                      <span className="block mt-2 font-medium" style={{ color: 'var(--accent-alert)' }}>
                        Total fuel stolen: {tankToTankStats.totalTheftAmount.toFixed(1)} L
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trips List */}
          <div className="space-y-4">
            {filteredTankToTankTrips.map((trip, index) => (
              <div
                key={trip.currentLogId}
                className="p-5 rounded-xl transition-all hover:shadow-lg animate-fade-in-up"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderLeftWidth: '4px',
                  borderLeftColor: trip.isTheftSuspected ? 'var(--accent-alert)' : 'var(--accent-success)',
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {(() => {
                        const start = new Date(trip.startDate);
                        const end = new Date(trip.endDate);
                        const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
                        if (days === 0) return 'Same day';
                        if (days === 1) return '1 day';
                        return `${days} days`;
                      })()}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trip.isTheftSuspected
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {trip.isTheftSuspected ? '⚠️ Theft Detected' : '✓ Normal'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Distance
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {trip.distance.toFixed(0)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>km</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Fuel Added
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {trip.actualFuelConsumed.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>L</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Mileage
                    </p>
                    <p className="text-base font-bold" style={{ color: trip.isTheftSuspected ? 'var(--accent-alert)' : 'var(--accent-blue)' }}>
                      {trip.mileageEfficiency.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                      Expected
                    </p>
                    <p className="text-base font-semibold" style={{ color: 'var(--accent-blue)' }}>
                      {trip.expectedFuelConsumed.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>L</p>
                  </div>
                </div>

                {trip.isTheftSuspected && (
                  <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)',
                    border: '1px solid var(--accent-alert)'
                  }}>
                    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--accent-alert)' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 1-1.71 3.71l12 12a2 2 0 0 1 3.71 3.71l1.71-3.71a1 1 0 0 0-.7-.29L6.17 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9.17l3.12-3.71a1 1 0 0 0-.7-.29" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--accent-alert)' }}>
                        Potential Fuel Theft Detected
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Mileage efficiency is {trip.mileageEfficiency.toFixed(0)}% (expected: 100%). Fuel consumed is {trip.actualFuelConsumed.toFixed(1)}L vs. expected {trip.expectedFuelConsumed.toFixed(1)}L.
                        {trip.theftAmount > 0 && (
                          <span className="block mt-1 font-medium">
                            Theft: {trip.theftAmount.toFixed(1)}L ({trip.theftPercentage.toFixed(0)}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions for other tabs */}
      {activeTab !== 'tankToTank' && (
        <div className="p-8 text-center rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Tank-to-Tank Tab Demo
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Click on the "Tank-to-Tank" tab above to see the new tank-to-tank trips functionality with:
          </p>
          <ul className="text-left space-y-2" style={{ color: 'var(--text-secondary)' }}>
            <li>✅ Statistics cards showing total trips, average mileage, theft alerts, and total stolen fuel</li>
            <li>✅ Filter buttons for All, Normal, and Theft Alert trips</li>
            <li>✅ Detailed trip cards with theft detection and mileage efficiency</li>
            <li>✅ Responsive design that works on mobile and desktop</li>
            <li>✅ Empty states with helpful messages</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HistoryTabDemo;
