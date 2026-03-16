// Vercel Serverless Function: POST /api/push/send
// Sends a push notification to all stored subscriptions.
import webpush from 'web-push';
import { initFirestore } from '../../_lib/firestore.js';

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Protect with an optional internal key
  const internalKey = process.env.PUSH_INTERNAL_KEY;
  if (internalKey && req.headers['x-internal-key'] !== internalKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, path } = req.body ?? {};
  if (!title || !body) {
    return res.status(400).json({ error: 'title and body are required' });
  }

  const payload = JSON.stringify({ title, body, path: path || '/' });

  try {
    const db = await initFirestore();
    let subscriptions = [];

    if (db) {
      const snapshot = await db.collection('push_subscriptions').get();
      subscriptions = snapshot.docs.map(doc => doc.data().subscription);
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub => webpush.sendNotification(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    res.status(200).json({ ok: true, sent, failed });
  } catch (err) {
    console.error('[push/send]', err);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
}
