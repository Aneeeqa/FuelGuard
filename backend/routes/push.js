/**
 * Push Notification Routes
 * Handles browser push subscription storage and sending notifications
 */

import webpush from 'web-push';
import express from 'express';
import { db } from '../services/firestore.js';

const router = express.Router();

// Configure VAPID details (keys loaded from env)
webpush.setVapidDetails(
  process.env.VAPID_CONTACT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/push/vapid-public-key
 * Returns the public VAPID key so the frontend can subscribe
 */
router.get('/vapid-public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

/**
 * POST /api/push/subscribe
 * Saves a browser push subscription (keyed by user ID in Authorization header)
 */
router.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    if (db) {
      // Persist in Firestore — keyed by endpoint to prevent duplicates
      const key = Buffer.from(subscription.endpoint).toString('base64').slice(0, 60);
      await db.collection('push_subscriptions').doc(key).set({
        subscription,
        createdAt: new Date().toISOString(),
      });
    } else {
      // In-memory fallback (lost on restart — fine for dev)
      inMemorySubscriptions.push(subscription);
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Failed to save subscription:', err);
    res.status(500).json({ error: 'Could not save subscription' });
  }
});

/**
 * POST /api/push/send
 * Sends a push notification to all stored subscriptions.
 * Body: { title, body, path }
 * In production, protect this route with an internal API key.
 */
router.post('/send', async (req, res) => {
  const { title, body, path } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  // Basic internal key check — set PUSH_INTERNAL_KEY in .env
  const internalKey = process.env.PUSH_INTERNAL_KEY;
  if (internalKey && req.headers['x-internal-key'] !== internalKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = JSON.stringify({ title, body, path: path || '/' });

  try {
    const subs = await getAllSubscriptions();
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.json({ ok: true, sent, failed });
  } catch (err) {
    console.error('Failed to send push:', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

// In-memory fallback for dev when Firestore isn't configured
const inMemorySubscriptions = [];

async function getAllSubscriptions() {
  if (!db) return inMemorySubscriptions;

  try {
    const snapshot = await db.collection('push_subscriptions').get();
    return snapshot.docs.map(doc => doc.data().subscription);
  } catch {
    return inMemorySubscriptions;
  }
}

export default router;
