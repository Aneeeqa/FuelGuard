/**
 * Offline Queue
 *
 * Persists fuel-log writes that fail because the device is offline.
 * Each item in the queue is stored in IndexedDB via idb-keyval under a
 * dedicated key ('fuelGuard_offlineQueue').
 *
 * Shape of a queue item:
 * {
 *   id:        string  — temporary local ID (prefixed "offline-")
 *   userId:    string
 *   vehicleId: string
 *   logEntry:  object  — the full log payload ready for createFuelLog()
 *   queuedAt:  string  — ISO timestamp
 * }
 */

import { get as idbGet, set as idbSet } from 'idb-keyval';

const QUEUE_KEY = 'fuelGuard_offlineQueue';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function readQueue() {
  try {
    return (await idbGet(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
}

async function writeQueue(items) {
  try {
    await idbSet(QUEUE_KEY, items);
  } catch (err) {
    console.warn('[OfflineQueue] Could not persist queue:', err);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a log entry to the offline queue and return a temporary ID
 * that can be used to optimistically show the entry in the UI.
 */
export async function enqueue({ userId, vehicleId, logEntry }) {
  const tempId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    id: tempId,
    userId,
    vehicleId,
    logEntry: { ...logEntry, id: tempId, pendingSync: true },
    queuedAt: new Date().toISOString(),
  };

  const queue = await readQueue();
  queue.push(item);
  await writeQueue(queue);

  // Register Background Sync so the service worker will trigger a flush as soon
  // as connectivity is restored — even if the app window is not in the foreground.
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('fuel-data-sync');
    } catch (err) {
      // Background Sync unavailable (e.g. non-Chromium browser) — the
      // app:online / mount-time flush in FuelContext will cover this case.
      console.warn('[OfflineQueue] Background Sync registration failed:', err);
    }
  }

  return item.logEntry; // return the entry with the temp ID so caller can use it
}

/**
 * Return all queued items without removing them.
 */
export async function peekQueue() {
  return readQueue();
}

/**
 * Remove a specific item from the queue after it has been synced.
 */
export async function dequeue(tempId) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== tempId));
}

/**
 * Flush the entire queue by calling `syncFn` for each item.
 * `syncFn` receives `{ userId, vehicleId, logEntry }` and must return
 * the Firestore-created log (with a real `id`).
 *
 * Returns an array of `{ tempId, syncedLog }` for all successfully synced items.
 */
export async function flushQueue(syncFn) {
  const queue = await readQueue();
  if (queue.length === 0) return [];

  const results = [];

  for (const item of queue) {
    try {
      const { pendingSync: _removed, id: _tempId, ...logPayload } = item.logEntry;
      const syncedLog = await syncFn({
        userId: item.userId,
        vehicleId: item.vehicleId,
        logEntry: logPayload,
      });
      await dequeue(item.id);
      results.push({ tempId: item.id, syncedLog });
      console.log('[OfflineQueue] Synced entry:', item.id, '→', syncedLog.id);
    } catch (err) {
      // Keep the item in the queue; it will be retried on the next online event.
      console.warn('[OfflineQueue] Sync failed for', item.id, '— will retry:', err);
    }
  }

  return results;
}

/**
 * Return the number of items waiting to be synced.
 */
export async function queueLength() {
  const q = await readQueue();
  return q.length;
}

/**
 * Convenience: true if there are pending items in the queue.
 */
export async function hasPendingItems() {
  const q = await readQueue();
  return q.length > 0;
}
