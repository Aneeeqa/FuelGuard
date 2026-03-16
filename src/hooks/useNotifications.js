import { useState, useEffect, useCallback } from 'react';

// Fetch the VAPID public key from the backend (cached in module scope)
let cachedVapidKey = null;
async function getVapidPublicKey() {
  if (cachedVapidKey) return cachedVapidKey;
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return null;
    const { publicKey } = await res.json();
    cachedVapidKey = publicKey;
    return publicKey;
  } catch {
    return null;
  }
}

// Convert a VAPID base64 string to the Uint8Array that pushManager.subscribe needs
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function useNotifications() {
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState(
    supported ? Notification.permission : 'unsupported'
  );

  // Keep state in sync if the user changes permission in browser settings
  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission);
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return 'unsupported';

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== 'granted') return result;

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;

        // ── Background Sync ──────────────────────────────────────
        if ('SyncManager' in window) {
          await registration.sync.register('fuel-data-sync');
        }

        // ── Periodic Background Sync ─────────────────────────────
        if ('periodicSync' in registration) {
          const periodicPerm = await navigator.permissions.query({
            name: 'periodic-background-sync',
          });
          if (periodicPerm.state === 'granted') {
            await registration.periodicSync.register('fuel-data-refresh', {
              minInterval: 24 * 60 * 60 * 1000,
            });
          }
        }

        // ── Push Subscription ────────────────────────────────────
        const vapidKey = await getVapidPublicKey();
        if (vapidKey && 'PushManager' in window) {
          const existingSub = await registration.pushManager.getSubscription();
          const sub = existingSub ?? await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });

          // Send (or re-send) subscription to backend
          await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub),
          });
        }
      } catch (err) {
        // Feature not available in this browser — non-fatal
        console.warn('[useNotifications] setup error:', err);
      }
    }

    return result;
  }, [supported]);

  return { permission, requestPermission, supported };
}
