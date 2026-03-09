import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OSMMap = memo(({ currentLocation, destination, onDestinationSelect }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(isDark);
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Map is ready after initial render
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Tile layer URL based on theme
  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  const attribution = darkMode
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const center = currentLocation || { lat: 0, lng: 0 };
  const zoom = currentLocation ? 16 : 2;

  return (
    <div className="w-full h-full">
      {!isMapReady ? (
        <div className="w-full h-full flex items-center justify-center rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 rounded-full animate-spin border-2 border-t-transparent" style={{ borderColor: 'var(--accent-fuel)', borderTopColor: 'transparent' }}></div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading map...</p>
          </div>
        </div>
      ) : (
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={zoom}
          style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
          zoomControl={true}
          scrollWheelZoom={false}
          doubleClickZoom={true}
          touchZoom={true}
        >
          <TileLayer
            url={tileUrl}
            attribution={attribution}
            maxZoom={19}
          />

          <MapBounds currentLocation={currentLocation} destination={destination} />

          {onDestinationSelect && (
            <MapClickHandler onDestinationSelect={onDestinationSelect} />
          )}

          {/* Current Location Marker (Blue) */}
          {currentLocation && (
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={currentLocationIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-blue-600">Current Location</strong>
                  <br />
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker (Red) */}
          {destination && (
            <Marker
              position={[destination.lat, destination.lng]}
              icon={destinationIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-red-600">Destination</strong>
                  <br />
                  {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}
    </div>
  );
});

OSMMap.displayName = 'OSMMap';

export default OSMMap;
