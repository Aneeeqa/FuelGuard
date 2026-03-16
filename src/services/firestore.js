import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Firestore Service Layer
 * Provides helper functions for CRUD operations on Firestore
 */

// ========================================
// USER OPERATIONS
// ========================================

/**
 * Get user document
 */
export const getUser = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Create or update user document
 */
export const upsertUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        ...userData,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return await getUser(userId);
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
};

// ========================================
// VEHICLE OPERATIONS
// ========================================

/**
 * Get all vehicles for a user
 */
export const getUserVehicles = async (userId) => {
  try {
    const vehiclesRef = collection(db, 'users', userId, 'vehicles');
    const snapshot = await getDocs(vehiclesRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

/**
 * Get a specific vehicle
 */
export const getVehicle = async (userId, vehicleId) => {
  try {
    const vehicleDoc = await getDoc(doc(db, 'users', userId, 'vehicles', vehicleId));
    if (!vehicleDoc.exists()) {
      return null;
    }
    return { id: vehicleDoc.id, ...vehicleDoc.data() };
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    throw error;
  }
};

/**
 * Create a new vehicle
 */
export const createVehicle = async (userId, vehicleData) => {
  try {
    const vehicleRef = doc(collection(db, 'users', userId, 'vehicles'));
    const { id, ...vehicleDataWithoutId } = vehicleData;
    const vehicle = {
      ...vehicleDataWithoutId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(vehicleRef, vehicle);

    return {
      id: vehicleRef.id,
      ...vehicle,
    };
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw error;
  }
};

/**
 * Update a vehicle
 */
export const updateVehicle = async (userId, vehicleId, updates) => {
  try {
    const vehicleRef = doc(db, 'users', userId, 'vehicles', vehicleId);
    await updateDoc(vehicleRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return await getVehicle(userId, vehicleId);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    throw error;
  }
};

/**
 * Delete a vehicle
 * Note: Firestore batches have a 500-operation limit
 */
export const deleteVehicle = async (userId, vehicleId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'vehicles', vehicleId));

    const logsRef = collection(db, 'users', userId, 'vehicles', vehicleId, 'logs');
    const logsSnapshot = await getDocs(logsRef);
    
    const batches = [];
    let batch = writeBatch(db);
    let operations = 0;

    logsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
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

    return true;
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    throw error;
  }
};

/**
 * Subscribe to vehicle changes (real-time)
 */
export const subscribeToVehicles = (userId, callback) => {
  const vehiclesRef = collection(db, 'users', userId, 'vehicles');
  const q = query(vehiclesRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const vehicles = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(vehicles);
  }, (error) => {
    console.error('Error in vehicles subscription:', error);
    callback([]);
  });
};

// ========================================
// DRIVER OPERATIONS
// ========================================

/**
 * Get all drivers for a user
 */
export const getUserDrivers = async (userId) => {
  try {
    const driversRef = collection(db, 'users', userId, 'drivers');
    const snapshot = await getDocs(driversRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
};

/**
 * Create a new driver
 */
export const createDriver = async (userId, driverData) => {
  try {
    const driverRef = doc(collection(db, 'users', userId, 'drivers'));
    const { id, ...driverDataWithoutId } = driverData;
    const driver = {
      ...driverDataWithoutId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(driverRef, driver);

    return {
      id: driverRef.id,
      ...driver,
    };
  } catch (error) {
    console.error('Error creating driver:', error);
    throw error;
  }
};

/**
 * Update a driver
 */
export const updateDriver = async (userId, driverId, updates) => {
  try {
    const driverRef = doc(db, 'users', userId, 'drivers', driverId);
    await updateDoc(driverRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return await getDoc(driverRef).then(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error updating driver:', error);
    throw error;
  }
};

/**
 * Delete a driver
 */
export const deleteDriver = async (userId, driverId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'drivers', driverId));
    return true;
  } catch (error) {
    console.error('Error deleting driver:', error);
    throw error;
  }
};

/**
 * Subscribe to driver changes (real-time)
 */
export const subscribeToDrivers = (userId, callback) => {
  const driversRef = collection(db, 'users', userId, 'drivers');
  const q = query(driversRef, orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const drivers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(drivers);
  }, (error) => {
    console.error('Error in drivers subscription:', error);
    callback([]);
  });
};

// ========================================
// FUEL LOG OPERATIONS
// ========================================

/**
 * Get all logs for a vehicle
 */
export const getVehicleLogs = async (userId, vehicleId) => {
  try {
    const logsRef = collection(db, 'users', userId, 'vehicles', vehicleId, 'logs');
    const q = query(logsRef, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};

/**
 * Get all logs for a user (all vehicles)
 */
export const getUserLogs = async (userId) => {
  try {
    const allLogs = [];

    const vehicles = await getUserVehicles(userId);

    for (const vehicle of vehicles) {
      const vehicleLogs = await getVehicleLogs(userId, vehicle.id);
      allLogs.push(...vehicleLogs.map(log => ({
        ...log,
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
      })));
    }

    return allLogs.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error fetching all logs:', error);
    throw error;
  }
};

/**
 * Create a new fuel log
 */
export const createFuelLog = async (userId, vehicleId, logData) => {
  try {
    const logRef = doc(collection(db, 'users', userId, 'vehicles', vehicleId, 'logs'));
    const { id, ...logDataWithoutId } = logData;
    const log = {
      ...logDataWithoutId,
      vehicleId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(logRef, log);

    return {
      id: logRef.id,
      ...log,
    };
  } catch (error) {
    console.error('Error creating fuel log:', error);
    throw error;
  }
};

/**
 * Update a fuel log
 */
export const updateFuelLog = async (userId, vehicleId, logId, updates) => {
  try {
    const logRef = doc(db, 'users', userId, 'vehicles', vehicleId, 'logs', logId);
    await updateDoc(logRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return await getDoc(logRef).then(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error updating fuel log:', error);
    throw error;
  }
};

/**
 * Delete a fuel log
 */
export const deleteFuelLog = async (userId, vehicleId, logId) => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'vehicles', vehicleId, 'logs', logId));
    return true;
  } catch (error) {
    console.error('Error deleting fuel log:', error);
    throw error;
  }
};

/**
 * Subscribe to vehicle logs changes (real-time)
 */
export const subscribeToVehicleLogs = (userId, vehicleId, callback) => {
  const logsRef = collection(db, 'users', userId, 'vehicles', vehicleId, 'logs');
  const q = query(logsRef, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(logs);
  }, (error) => {
    console.error('Error in logs subscription:', error);
    // Do NOT wipe existing logs – just leave the current state as-is
  });
};

// ========================================
// BATCH OPERATIONS
// ========================================

/**
 * Create multiple fuel logs in a single batch
 */
export const createMultipleFuelLogs = async (userId, vehicleId, logs) => {
  try {
    const batch = writeBatch(db);
    const createdLogs = [];

    logs.forEach(logData => {
      const logRef = doc(collection(db, 'users', userId, 'vehicles', vehicleId, 'logs'));
      const log = {
        ...logData,
        vehicleId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(logRef, log);
      createdLogs.push({
        id: logRef.id,
        ...log,
      });
    });

    await batch.commit();
    return createdLogs;
  } catch (error) {
    console.error('Error creating multiple fuel logs:', error);
    throw error;
  }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Check if user has any data
 */
export const hasUserData = async (userId) => {
  try {
    const vehicles = await getUserVehicles(userId);
    return vehicles.length > 0;
  } catch (error) {
    console.error('Error checking user data:', error);
    return false;
  }
};

/**
 * Delete all user data (use with caution)
 * Note: Firestore batches have a 500-operation limit, so we split into multiple batches
 */
export const deleteAllUserData = async (userId) => {
  try {
    const vehicles = await getUserVehicles(userId);
    const batches = [];

    let batch = writeBatch(db);
    let operations = 0;

    for (const vehicle of vehicles) {
      const logsRef = collection(db, 'users', userId, 'vehicles', vehicle.id, 'logs');
      const logsSnapshot = await getDocs(logsRef);

      logsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        operations++;

        if (operations >= 450) {
          batches.push(batch);
          batch = writeBatch(db);
          operations = 0;
        }
      });

      batch.delete(doc(db, 'users', userId, 'vehicles', vehicle.id));
      operations++;

      if (operations >= 450) {
        batches.push(batch);
        batch = writeBatch(db);
        operations = 0;
      }
    }

    if (operations > 0) {
      batches.push(batch);
    }

    const driversRef = collection(db, 'users', userId, 'drivers');
    const driversSnapshot = await getDocs(driversRef);
    batch = writeBatch(db);
    operations = 0;

    driversSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
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

    await deleteDoc(doc(db, 'users', userId));

    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
};
