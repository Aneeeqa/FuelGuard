import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { exportIndexedDBData } from '../src/utils/exportIndexedDB.js';
import { transformToFirestoreFormat } from '../src/utils/transformDataForFirestore.js';

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const migrateToFirestore = async (userId) => {
  console.log('Starting migration...');

  console.log('Step 1: Exporting IndexedDB data...');
  const indexedDBData = await exportIndexedDBData();
  console.log('Exported data:', indexedDBData);

  console.log('Step 2: Transforming data...');
  const firestoreData = transformToFirestoreFormat(indexedDBData, userId);
  console.log('Transformed data:', firestoreData);

  console.log('Step 3: Uploading to Firestore...');
  
  const batches = [];
  let batch = writeBatch(db);
  let operations = 0;

  const userDocRef = doc(db, 'users', userId);
  batch.set(userDocRef, firestoreData.user);
  operations++;

  firestoreData.vehicles.forEach(vehicle => {
    const vehicleRef = doc(db, 'users', userId, 'vehicles', vehicle.id);
    batch.set(vehicleRef, vehicle);
    operations++;

    if (operations >= 450) {
      batches.push(batch);
      batch = writeBatch(db);
      operations = 0;
    }
  });

  firestoreData.drivers.forEach(driver => {
    const driverRef = doc(db, 'users', userId, 'drivers', driver.id);
    batch.set(driverRef, driver);
    operations++;

    if (operations >= 450) {
      batches.push(batch);
      batch = writeBatch(db);
      operations = 0;
    }
  });

  firestoreData.logs.forEach(log => {
    const logRef = doc(db, 'users', userId, 'vehicles', log.vehicleId || 'default', 'logs', log.id);
    batch.set(logRef, log);
    operations++;

    if (operations >= 450) {
      batches.push(batch);
      batch = writeBatch(db);
      operations = 0;
    }
  });

  if (operations > 0) {
    batches.push(batch);
  }

  for (const b of batches) {
    await b.commit();
  }

  console.log('Migration completed successfully!');
  console.log('Migrated:', {
    vehicles: firestoreData.vehicles.length,
    drivers: firestoreData.drivers.length,
    logs: firestoreData.logs.length,
  });
};

const userId = process.argv[2];
if (!userId) {
  console.error('Error: User ID is required');
  console.log('Usage: node scripts/migrateToFirestore.js <userId>');
  process.exit(1);
}

migrateToFirestore(userId).catch(console.error);
