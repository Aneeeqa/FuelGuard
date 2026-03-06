import { MapPin, ShieldCheck, X } from 'lucide-react';

/**
 * Friendly modal to explain why location is needed before requesting browser permission.
 * This increases the likelihood that users will accept the permission request.
 * 
 * @param {boolean} isOpen 
 * @param {function} onClose 
 * @param {function} onConfirm 
 */
const LocationPermissionModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100/10 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center space-y-4">
                    <div
                        className="p-4 rounded-full"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-fuel) 10%, transparent)' }}
                    >
                        <MapPin className="w-8 h-8" style={{ color: 'var(--accent-fuel)' }} />
                    </div>

                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Enable Location Services?
                    </h3>

                    <p style={{ color: 'var(--text-secondary)' }}>
                        FuelGuard uses your location to automatically calculate the distance traveled since your last fill-up.
                    </p>

                    <div
                        className="w-full text-left p-3 rounded-xl text-sm space-y-2"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                    >
                        <div className="flex gap-2">
                            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-success)' }} />
                            <span style={{ color: 'var(--text-muted)' }}>
                                Your location data is stored only on your device and never shared.
                            </span>
                        </div>
                    </div>

                    <div className="w-full space-y-3 pt-2">
                        <button
                            onClick={onConfirm}
                            className="w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg transition-transform active:scale-95"
                            style={{ backgroundColor: 'var(--accent-blue)' }}
                        >
                            Continue & Allow Access
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 rounded-xl font-medium transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            No, enter distance manually
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationPermissionModal;
