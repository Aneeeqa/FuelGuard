// Vercel Serverless Function: POST /api/push/subscribe
// Saves a browser push subscription to Firestore.
import { initFirestore } from '../../_lib/firestore.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const subscription = req.body;
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    const db = await initFirestore();

    if (db) {
      const key = Buffer.from(subscription.endpoint).toString('base64').slice(0, 60);
      await db.collection('push_subscriptions').doc(key).set({
        subscription,
        createdAt: new Date().toISOString(),
      });
    }
    // If Firestore not configured, silently accept (push won't work until configured)

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe]', err);
    res.status(500).json({ error: 'Could not save subscription' });
  }
}
