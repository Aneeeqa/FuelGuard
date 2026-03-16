import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { skipWaiting, clientsClaim } from 'workbox-core';

// Take control of all open clients immediately on activation.
// This means users get the latest SW without needing to close every tab.
skipWaiting();
clientsClaim();

// ─── Precaching ────────────────────────────────────────────────────────────────
// Vite-plugin-pwa injects the precache manifest (all build artefacts) here.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ─── Runtime cache names (used in activate cleanup) ───────────────────────────
const RUNTIME_CACHES = [
  'navigation-cache',
  'static-assets-cache',
  'image-cache',
  'google-fonts-cache',
  'gstatic-fonts-cache',
  'firebase-api-cache',
];

// ─── Activate: delete stale runtime caches from old SW versions ───────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => {
            // Keep Workbox precache caches and current runtime caches
            const isWorkboxPrecache = name.startsWith('workbox-precache');
            const isCurrentRuntime = RUNTIME_CACHES.includes(name);
            return !isWorkboxPrecache && !isCurrentRuntime;
          })
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
});

// ─── Message handler ───────────────────────────────────────────────────────────
// Allows the UI to trigger a SW update via: sw.postMessage({ type: 'SKIP_WAITING' })
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Navigation (SPA): NetworkFirst → offline falls back to precached index ───
// Handles all document navigations (page loads, history.pushState, etc.).
// Falls through to the precached /index.html if the network request fails,
// so the app shell is always available offline.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'navigation-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [0, 200] }),
        new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 }),
      ],
    })
  )
);

// ─── Firebase / Firestore APIs: NetworkFirst (auth data must be fresh) ─────────
// We still serve from cache when offline so the user can see the last-known data.
registerRoute(
  ({ url }) =>
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('firebase.googleapis.com') ||
    url.origin.includes('identitytoolkit.googleapis.com') ||
    url.origin.includes('securetoken.googleapis.com'),
  new NetworkFirst({
    cacheName: 'firebase-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Static JS / CSS chunks: StaleWhileRevalidate ─────────────────────────────
// Serve instantly from cache; refresh in the background so next visit is fresh.
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-assets-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Images: CacheFirst (icons, map tiles, logos rarely change) ───────────────
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Google Fonts CSS: StaleWhileRevalidate ────────────────────────────────────
// The CSS descriptor changes rarely; serve from cache, revalidate in background.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Google Fonts binary files (gstatic): CacheFirst ─────────────────────────
// Actual .woff2/.ttf files are content-addressed and never change.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

// ─── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title ?? 'Fuel Guard';
  const options = {
    body: data.body ?? 'You have a new notification.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { path: data.path ?? '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const path = event.notification.data?.path ?? '/';
  event.waitUntil(clients.openWindow(self.location.origin + path));
});

// ─── Background Sync ───────────────────────────────────────────────────────────
// Fires whenever connectivity is restored after an offline period.
// Strategy:
//   • If the app is open in any window → tell it to flush the offline queue.
//   • If no window is open → open the app so it initialises and runs its
//     own mount-time flush (the window won't open without a user gesture in
//     some browsers, so the next app launch will always catch any remainder).
self.addEventListener('sync', (event) => {
  if (event.tag === 'fuel-data-sync') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((openClients) => {
          if (openClients.length > 0) {
            // App is open — ask it to flush the IndexedDB queue.
            openClients.forEach((client) =>
              client.postMessage({ type: 'SYNC_COMPLETE' })
            );
          } else {
            // No open window — try to bring the app to the foreground.
            // When the app loads it will run the mount-time flush in FuelContext.
            return self.clients.openWindow('/').catch(() => {
              // openWindow may be blocked without a user gesture; that is
              // acceptable — the next manual app launch will flush the queue.
              console.log('[Service Worker] openWindow blocked; queue will sync on next app launch.');
            });
          }
        })
    );
  }
});

// ─── Periodic Background Sync ─────────────────────────────────────────────────
// Fires at the registered interval (once a day by default).
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'fuel-data-refresh') {
    event.waitUntil(
      self.clients.matchAll().then((openClients) =>
        openClients.forEach((client) =>
          client.postMessage({ type: 'PERIODIC_SYNC' })
        )
      )
    );
  }
});
