import React, { useState, useCallback, memo, useEffect, Suspense, lazy } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import Skeleton from '../ui/Skeleton';

// Lazy load OSMMap to avoid issues when Google Maps is available
const OSMMap = lazy(() => import('./OSMMap'));

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.75rem',
};

const defaultCenter = {
  lat: 0,
  lng: 0
};

// 2-second timeout for Google Maps loading (reduced for faster fallback)
const GOOGLE_MAPS_TIMEOUT = 2000;

const FuelMap = ({ currentLocation, destination, onDestinationSelect, showFallback }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const [map, setMap] = useState(null);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [useOSMFallback, setUseOSMFallback] = useState(false);

  // Check if API key is configured
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const configured = apiKey && apiKey !== '' && apiKey !== 'your_google_maps_api_key_here';
    setHasApiKey(configured);

    // If no API key or load error, use OSM fallback immediately
    if (!configured) {
      setUseOSMFallback(true);
      setIsTimedOut(true);
    }
  }, []);

  // 2-second timeout for Google Maps loading
  useEffect(() => {
    if (hasApiKey && !isLoaded && !loadError && !useOSMFallback) {
      const timeout = setTimeout(() => {
        setIsTimedOut(true);
        setUseOSMFallback(true);
      }, GOOGLE_MAPS_TIMEOUT);

      return () => clearTimeout(timeout);
    }

    // Clear timeout if loaded or error occurs
    if (isLoaded) {
      setIsTimedOut(false);
    }

    // On load error, use OSM fallback
    if (loadError) {
      setUseOSMFallback(true);
    }
  }, [hasApiKey, isLoaded, loadError, useOSMFallback]);

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

  // Loading state for Google Maps
  if (!isLoaded && !isTimedOut && !loadError && !useOSMFallback) {
    return <Skeleton className="w-full h-full rounded-xl" />;
  }

  // Use OpenStreetMap fallback (Free, No API Key Required)
  if (useOSMFallback || !hasApiKey || isTimedOut || loadError) {
    return (
      <Suspense
        fallback={
          <div className="w-full h-full rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full animate-spin border-2 border-t-transparent" style={{ borderColor: 'var(--accent-fuel)', borderTopColor: 'transparent' }}></div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading free map...</p>
            </div>
          </div>
        }
      >
        <OSMMap
          currentLocation={currentLocation}
          destination={destination}
          onDestinationSelect={onDestinationSelect}
        />
      </Suspense>
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
