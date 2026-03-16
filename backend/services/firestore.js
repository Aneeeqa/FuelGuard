/**
 * Firestore client for backend
 * Only initialised when Firebase credentials are present in env.
 * Exports `db` — will be null if not configured (dev without Firebase).
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (projectId && clientEmail && privateKey) {
  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  db = getFirestore();
}

export { db };
