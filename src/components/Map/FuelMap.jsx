import React, { useState, useCallback, memo } from 'react';
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

const FuelMap = ({ currentLocation, destination, onDestinationSelect }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState(null);

    const onLoad = useCallback(function callback(map) {
        // If we have a current location, center on it
        if (currentLocation) {
            const bounds = new window.google.maps.LatLngBounds(currentLocation);
            if (destination) {
                bounds.extend(destination);
            }
            map.fitBounds(bounds);

            // If just one point, zoom in closer after bounds set (bounds set zoom too far out for single point)
            if (!destination) {
                // A little timeout to ensure bounds fit happened, though usually setZoom after fitBounds works directly if checked
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

    if (!isLoaded) {
        return <Skeleton className="w-full h-full rounded-xl" />;
    }

    // Center: priority to current location, else default
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
