import React, { useState, useCallback, memo, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Skeleton from '../ui/Skeleton';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

// 3-second timeout for Google Maps loading
const GOOGLE_MAPS_TIMEOUT = 3000;

const FuelMap = ({ currentLocation, destination, onDestinationSelect, showFallback }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check if API key is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const configured = apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
    setHasApiKey(configured);

    // If no API key, immediately show fallback
    if (!configured) {
      setIsTimedOut(true);
    }
  }, []);

  // 3-second timeout for Google Maps loading
  useEffect(() => {
    if (hasApiKey && !isLoaded && !loadError) {
      const timeout = setTimeout(() => {
        setIsTimedOut(true);
      }, GOOGLE_MAPS_TIMEOUT);

      return () => clearTimeout(timeout);
    }

    // Clear timeout if loaded or error occurs
    if (isLoaded || loadError) {
      setIsTimedOut(false);
    }
  }, [hasApiKey, isLoaded, loadError]);

  const onLoad = useCallback(function callback(map) {
    if (currentLocation) {
      const bounds = new window.google.maps.LatLngBounds(currentLocation);
      if (destination) {
        bounds.extend(destination);
      }
      map.fitBounds(bounds);

      if (!destination) {
        const listener = google.maps.event.addListener(map, "idle", function () {
          if (map.getZoom() > 16) map.setZoom(16);
          google.maps.event.removeListener(listener);
        });
      }
    } else {
      map.setZoom(2);
      map.setCenter(defaultCenter);
    }
    setMap(map);
  }, [currentLocation, destination]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleMapClick = useCallback((e) => {
    if (onDestinationSelect) {
      onDestinationSelect({
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      });
    }
  }, [onDestinationSelect]);

  // Loading state
  if (!isLoaded && !isTimedOut && !loadError) {
    return <Skeleton className="w-full h-full rounded-xl" />;
  }

  // Fallback: No API key, timeout, or load error
  if (!hasApiKey || isTimedOut || loadError) {
    return (
      <div
        className="w-full h-full rounded-xl flex flex-col items-center justify-center p-6 text-center"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '2px dashed var(--border-color)',
        }}
      >
        <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-fuel) 20%, transparent)' }}>
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--accent-fuel)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {loadError ? 'Map Unavailable' : 'Map Loading Timeout'}
        </h3>

        <p className="text-sm mb-4 max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {loadError
            ? 'Google Maps failed to load. Using location coordinates instead.'
            : 'Map took longer than 3 seconds to load. Showing location data instead.'}
        </p>

        {currentLocation && (
          <div className="space-y-2 w-full max-w-xs">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Current Location</p>
              <p className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </p>
            </div>

            {destination && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Destination</p>
                <p className="font-mono text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        )}

        {!hasApiKey && !loadError && (
          <div className="mt-4 p-3 rounded-lg text-xs" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)' }}>
            <p className="font-medium" style={{ color: 'var(--accent-warning)' }}>
              No Google Maps API Key
            </p>
            <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
              Add VITE_GOOGLE_MAPS_API_KEY to .env.local for full map functionality.
            </p>
          </div>
        )}

        {isTimedOut && onDestinationSelect && (
          <button
            onClick={() => {
              if (currentLocation && destination) {
                // Both locations are already set
                return;
              }
              // Allow user to manually enter coordinates
              const lat = prompt('Enter latitude:', currentLocation?.lat || '');
              const lon = prompt('Enter longitude:', currentLocation?.lng || '');
              if (lat && lon) {
                onDestinationSelect({ lat: parseFloat(lat), lng: parseFloat(lon) });
              }
            }}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
            }}
          >
            Enter Coordinates Manually
          </button>
        )}
      </div>
    );
  }

  // Google Maps loaded successfully
  const center = currentLocation || defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      }}
    >
      {/* Current Location Marker (Blue) */}
      {currentLocation && (
        <Marker
          position={currentLocation}
          title="Current Location"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#3b82f6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          }}
        />
      )}

      {/* Destination Marker (Red) */}
      {destination && (
        <Marker
          position={destination}
          title="Destination"
          animation={window.google.maps.Animation.DROP}
        />
      )}
    </GoogleMap>
  );
}

export default memo(FuelMap);
