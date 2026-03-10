/**
 * Location Tracking Test & Demo Component
 *
 * Demonstrates all free location tracking features:
 * - GPS tracking (Quick & Accurate modes)
 * - Interactive maps (OpenStreetMap fallback)
 * - Geocoding (reverse and forward)
 * - Distance calculation (Haversine & OSRM routing)
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Gauge, Activity, Wifi, Zap } from 'lucide-react';
import {
  getQuickPosition,
  getAccuratePosition,
  calculateHaversineDistance,
  isGeolocationSupported,
  checkLocationPermission,
} from '../utils/geolocation';
import { getLocationName, geocode } from '../services/geocodingService';
import { calculateDrivingDistance } from '../services/mapsService';
import OSMMap from './OSMMap';
import './LocationTrackerTest.css';

const LocationTrackerTest = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [testLocation, setTestLocation] = useState(null);
  const [distanceHaversine, setDistanceHaversine] = useState(null);
  const [distanceOSRM, setDistanceOSRM] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsMode, setGpsMode] = useState('quick');
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [permission, setPermission] = useState('unknown');
  const [showMap, setShowMap] = useState(false);

  // Check geolocation support and permission on mount
  useEffect(() => {
    const checkGeolocation = async () => {
      const supported = isGeolocationSupported();
      if (supported) {
        const perm = await checkLocationPermission();
        setPermission(perm);
      } else {
        setPermission('unsupported');
      }
    };
    checkGeolocation();
  }, []);

  // Get current GPS position
  const handleGetGPS = async (mode = 'quick') => {
    setGpsLoading(true);
    setGpsMode(mode);

    try {
      const getPosition = mode === 'quick' ? getQuickPosition : getAccuratePosition;
      const location = await getPosition();
      setCurrentLocation(location);
      setLocationName('');

      // Get location name
      setGeocodingLoading(true);
      try {
        const name = await getLocationName(location.lat, location.lng);
        setLocationName(name);
      } catch (err) {
        console.error('Geocoding error:', err);
        setLocationName('Geocoding failed');
      }
      setGeocodingLoading(false);
    } catch (err) {
      console.error('GPS error:', err);
      alert(`GPS Error: ${err.message}`);
    } finally {
      setGpsLoading(false);
    }
  };

  // Set a test destination (Times Square, NYC)
  const handleSetTestDestination = () => {
    setTestLocation({ lat: 40.7580, lng: -73.9855 });
  };

  // Calculate distance using Haversine formula
  const handleCalculateHaversine = () => {
    if (!currentLocation || !testLocation) {
      alert('Please get both current location and test destination');
      return;
    }

    const dist = calculateHaversineDistance(
      currentLocation.lat,
      currentLocation.lng,
      testLocation.lat,
      testLocation.lng
    );
    setDistanceHaversine(dist);
  };

  // Calculate driving distance using OSRM
  const handleCalculateOSRM = async () => {
    if (!currentLocation || !testLocation) {
      alert('Please get both current location and test destination');
      return;
    }

    setRoutingLoading(true);
    try {
      const result = await calculateDrivingDistance(currentLocation, testLocation);
      if (result) {
        setDistanceOSRM(result);
      } else {
        alert('Failed to calculate route distance');
      }
    } catch (err) {
      console.error('Routing error:', err);
      alert(`Routing Error: ${err.message}`);
    } finally {
      setRoutingLoading(false);
    }
  };

  // Search for location (forward geocoding)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setGeocodingLoading(true);
    try {
      const results = await geocode(searchQuery);
      if (results && results.length > 0) {
        setSearchResults(results);
      } else {
        alert('No results found');
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      alert(`Search Error: ${err.message}`);
    } finally {
      setGeocodingLoading(false);
    }
  };

  return (
    <div className="location-tracker-test">
      <div className="test-header">
        <h1>📍 Free Location Tracking Test</h1>
        <p>All features work without any API key!</p>
      </div>

      {/* GPS Status */}
      <div className="card gps-status">
        <div className="card-header">
          <Navigation className="icon" />
          <h2>GPS Status</h2>
        </div>
        <div className="status-grid">
          <div className="status-item">
            <span className="label">Supported:</span>
            <span className={`value ${isGeolocationSupported() ? 'success' : 'error'}`}>
              {isGeolocationSupported() ? '✓ Yes' : '✗ No'}
            </span>
          </div>
          <div className="status-item">
            <span className="label">Permission:</span>
            <span className={`value ${permission === 'granted' ? 'success' : permission === 'denied' ? 'error' : 'warning'}`}>
              {permission}
            </span>
          </div>
        </div>
      </div>

      {/* GPS Controls */}
      <div className="card gps-controls">
        <div className="card-header">
          <MapPin className="icon" />
          <h2>Get GPS Location</h2>
        </div>
        <div className="control-buttons">
          <button
            onClick={() => handleGetGPS('quick')}
            disabled={gpsLoading}
            className="btn btn-quick"
          >
            <Zap className="btn-icon" />
            {gpsLoading && gpsMode === 'quick' ? 'Getting...' : 'Quick Mode (5s)'}
          </button>
          <button
            onClick={() => handleGetGPS('accurate')}
            disabled={gpsLoading}
            className="btn btn-accurate"
          >
            <Activity className="btn-icon" />
            {gpsLoading && gpsMode === 'accurate' ? 'Getting...' : 'Accurate Mode (12s)'}
          </button>
        </div>
        {currentLocation && (
          <div className="location-info">
            <div className="info-row">
              <span className="info-label">Latitude:</span>
              <span className="info-value">{currentLocation.lat.toFixed(6)}°</span>
            </div>
            <div className="info-row">
              <span className="info-label">Longitude:</span>
              <span className="info-value">{currentLocation.lng.toFixed(6)}°</span>
            </div>
            <div className="info-row">
              <span className="info-label">Accuracy:</span>
              <span className="info-value">±{Math.round(currentLocation.accuracy)}m</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location Name:</span>
              <span className="info-value">
                {geocodingLoading ? 'Loading...' : locationName || 'Unknown'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Timestamp:</span>
              <span className="info-value">{new Date(currentLocation.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Distance Calculation */}
      <div className="card distance-calc">
        <div className="card-header">
          <Gauge className="icon" />
          <h2>Distance Calculation</h2>
        </div>
        <div className="distance-controls">
          <button
            onClick={handleSetTestDestination}
            disabled={gpsLoading}
            className="btn btn-secondary"
          >
            Set Test Destination (Times Square, NYC)
          </button>
          {testLocation && (
            <div className="destination-info">
              <span className="dest-label">Test Destination:</span>
              <span className="dest-coords">
                {testLocation.lat.toFixed(6)}, {testLocation.lng.toFixed(6)}
              </span>
            </div>
          )}
          <div className="calc-buttons">
            <button
              onClick={handleCalculateHaversine}
              disabled={!currentLocation || !testLocation}
              className="btn btn-calc"
            >
              Calculate Haversine (Straight Line)
            </button>
            <button
              onClick={handleCalculateOSRM}
              disabled={!currentLocation || !testLocation || routingLoading}
              className="btn btn-calc"
            >
              {routingLoading ? 'Calculating...' : 'Calculate OSRM (Driving Route)'}
            </button>
          </div>
        </div>
        {(distanceHaversine || distanceOSRM) && (
          <div className="distance-results">
            {distanceHaversine && (
              <div className="result-item">
                <span className="result-label">Haversine (Straight Line):</span>
                <span className="result-value">{distanceHaversine.toFixed(2)} km</span>
              </div>
            )}
            {distanceOSRM && (
              <div className="result-item">
                <span className="result-label">
                  OSRM ({distanceOSRM.provider} - Driving):
                </span>
                <span className="result-value">{distanceOSRM.distance.toFixed(2)} km</span>
              </div>
            )}
            {distanceHaversine && distanceOSRM && (
              <div className="result-item highlight">
                <span className="result-label">Difference:</span>
                <span className="result-value">
                  {((distanceOSRM.distance - distanceHaversine) / distanceHaversine * 100).toFixed(1)}% longer
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Search */}
      <div className="card location-search">
        <div className="card-header">
          <Wifi className="icon" />
          <h2>Location Search (Geocoding)</h2>
        </div>
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter address or place name..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={geocodingLoading}
            className="btn btn-search"
          >
            {geocodingLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="result-item clickable"
                onClick={() => {
                  setTestLocation({ lat: result.lat, lng: result.lon });
                  setSearchResults([]);
                  setSearchQuery(result.formatted);
                }}
              >
                <div className="result-name">{result.formatted}</div>
                <div className="result-coords">
                  {result.lat.toFixed(6)}, {result.lon.toFixed(6)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="card map-view">
        <div className="card-header">
          <MapPin className="icon" />
          <h2>Interactive Map (OpenStreetMap - No API Key)</h2>
        </div>
        <button
          onClick={() => setShowMap(!showMap)}
          className="btn btn-toggle"
        >
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
        {showMap && (
          <div className="map-container">
            <OSMMap
              currentLocation={currentLocation}
              destination={testLocation}
              onDestinationSelect={(loc) => setTestLocation(loc)}
            />
            <div className="map-instructions">
              Click on map to set a destination point
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="footer">
        <p>
          <Clock className="inline-icon" />
          <strong>All features are FREE and work without any API key!</strong>
        </p>
        <p>
          Uses: Browser Geolocation API, OpenStreetMap, Leaflet.js, Nominatim, OSRM
        </p>
      </div>
    </div>
  );
};

export default LocationTrackerTest;
