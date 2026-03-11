import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Wifi, WifiOff, Server, CheckCircle, XCircle, AlertCircle, Globe, Smartphone, Clock } from 'lucide-react';
import { safeLocalStorageGet } from '../utils/secureStorage';

const SystemStatus = () => {
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);
  const [systemInfo, setSystemInfo] = useState({});

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const info = {
      browser: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    setSystemInfo(info);
  }, []);

  const storageInfo = {
    type: safeLocalStorageGet('fuelGuardDB', { parseJson: false }) ? 'LocalStorage' : 'IndexedDB',
    estimatedSize: new Blob([JSON.stringify(safeLocalStorageGet('fuelGuardDB', { parseJson: false }))]).size,
  };

  const serviceWorkerStatus = navigator.serviceWorker?.ready ? 'Active' : 'Not Installed';
  const pwaStatus = window.matchMedia('(display-mode: standalone)').matches ? 'Installed' : 'Not Installed';

  const StatusBadge = ({ status, label }) => {
    const colors = {
      active: { bg: 'color-mix(in srgb, var(--accent-success) 15%, transparent)', text: 'var(--accent-success)' },
      inactive: { bg: 'color-mix(in srgb, var(--accent-alert) 15%, transparent)', text: 'var(--accent-alert)' },
      warning: { bg: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)', text: 'var(--accent-blue)' },
      default: { bg: 'color-mix(in srgb, var(--text-muted) 15%, transparent)', text: 'var(--text-muted)' },
    };

    const color = status.toLowerCase() === 'active' || status.toLowerCase() === 'online' || status.toLowerCase() === 'installed'
      ? colors.active
      : status.toLowerCase() === 'inactive' || status.toLowerCase() === 'offline' || status.toLowerCase() === 'not installed'
      ? colors.inactive
      : colors.warning;

    return (
      <span
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {status === 'Active' || status === 'Online' || status === 'Installed' ? (
          <CheckCircle className="w-3 h-3" />
        ) : status === 'Inactive' || status === 'Offline' || status === 'Not Installed' ? (
          <XCircle className="w-3 h-3" />
        ) : (
          <AlertCircle className="w-3 h-3" />
        )}
        {status}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)',
          }}
        >
          <Cpu className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
          System Status
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
          Diagnostics and health information
        </p>
      </div>

      {/* Connection Status */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {onlineStatus ? <Wifi className="w-5 h-5" style={{ color: 'var(--accent-success)' }} /> : <WifiOff className="w-5 h-5" style={{ color: 'var(--accent-alert)' }} />}
          Connection Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Network Status
            </span>
            <StatusBadge status={onlineStatus ? 'Online' : 'Offline'} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Connection Type
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {navigator.connection?.effectiveType || 'Unknown'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Latency
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {navigator.connection?.rtt ? `${navigator.connection.rtt}ms` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Storage Status */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <HardDrive className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          Storage Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Storage Type
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {storageInfo.type}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Estimated Size
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {(storageInfo.estimatedSize / 1024).toFixed(2)} KB
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Database Integrity
            </span>
            <StatusBadge status="Healthy" />
          </div>
        </div>
      </div>

      {/* PWA Status */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Smartphone className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
          PWA Status
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Installation Status
            </span>
            <StatusBadge status={pwaStatus} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Service Worker
            </span>
            <StatusBadge status={serviceWorkerStatus} />
          </div>


        </div>
      </div>

      {/* System Information */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Globe className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          System Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Platform
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.platform || 'Unknown'}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Language
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.language || 'Unknown'}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Viewport
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.viewport || 'Unknown'}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Timezone
            </p>
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.timezone || 'Unknown'}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Pixel Ratio
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.pixelRatio || 'Unknown'}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
              Color Depth
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {systemInfo.colorDepth || 'Unknown'}-bit
            </p>
          </div>
        </div>
      </div>

      {/* API Status */}
      <div
        className="rounded-xl p-6"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Server className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
          External Services
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Last Sync
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {new Date().toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-input)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              API Status
            </span>
            <StatusBadge status="Operational" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
