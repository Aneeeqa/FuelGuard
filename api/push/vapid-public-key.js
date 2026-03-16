// Vercel Serverless Function: GET /api/push/vapid-public-key
export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }

  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
