import { useState } from 'react';
import { Phone, MapPin, PhoneCall, Share2, X } from 'lucide-react';
import { useFuelData } from '../hooks/useFuelData';
import Button from './ui/Button';
import Modal from './ui/Modal';

const EmergencyContact = ({ onClose }) => {
  const { data } = useFuelData();
  const emergencyContact = data.vehicleProfile?.emergencyContact || {};
  const [showLocationMessage, setShowLocationMessage] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  const handleCall = () => {
    if (emergencyContact.phone) {
      window.location.href = `tel:${emergencyContact.phone}`;
    }
  };

  const handleShareLocation = async () => {
    try {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setCurrentLocation(location);
      setShowLocationMessage(true);

      const vehicleName = data.vehicleProfile?.name || 'My Vehicle';
      const message = `🚨 EMERGENCY ALERT 🚨\n\nVehicle: ${vehicleName}\nLocation: https://maps.google.com/?q=${location.lat},${location.lng}\nTime: ${new Date().toLocaleString()}\n\nContact: ${emergencyContact.name} (${emergencyContact.relationship})`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Emergency Location Share',
            text: message,
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
          }
        }
      } else {
        navigator.clipboard.writeText(message);
        alert('Location copied to clipboard!\n\n' + message);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Failed to get your location. Please ensure location services are enabled.');
    }
  };

  if (!emergencyContact.name || !emergencyContact.phone) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Emergency Contact">
        <div className="text-center py-8">
          <Phone className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--accent-alert)' }} />
          <p className="text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
            No Emergency Contact Configured
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Please set up an emergency contact in Settings to use this feature.
          </p>
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title="Emergency Contact">
      <div className="space-y-6">
        <div className="text-center py-4">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)',
            }}
          >
            <Phone className="w-8 h-8" style={{ color: 'var(--accent-alert)' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {emergencyContact.name}
          </h3>
          <p className="text-base mb-1" style={{ color: 'var(--text-secondary)' }}>
            {emergencyContact.relationship}
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--accent-blue)' }}>
            {emergencyContact.phone}
          </p>
        </div>

        {showLocationMessage && currentLocation && (
          <div
            className="p-4 rounded-lg text-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-success) 15%, transparent)',
              border: '1px solid var(--accent-success)',
            }}
          >
            <MapPin className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--accent-success)' }} />
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Location Shared Successfully!
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleCall}
            className="w-full flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--accent-alert)',
              color: 'white',
              minHeight: '56px',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            <PhoneCall className="w-6 h-6" />
            Emergency Call
          </Button>

          <Button
            onClick={handleShareLocation}
            className="w-full flex items-center justify-center gap-2"
            variant="secondary"
            style={{
              minHeight: '56px',
              fontSize: '16px',
            }}
          >
            <Share2 className="w-5 h-5" />
            Share Location
          </Button>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default EmergencyContact;
