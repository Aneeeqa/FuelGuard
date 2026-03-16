import { Timestamp } from 'firebase/firestore';

export const transformToFirestoreFormat = (indexedDBData, userId) => {
  const transformed = {
    user: {
      name: indexedDBData.vehicleProfile?.name || '',
      email: '',
      photoURL: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    vehicles: [],
    drivers: [],
    logs: [],
  };

  if (indexedDBData.vehicles?.length > 0) {
    transformed.vehicles = indexedDBData.vehicles.map(vehicle => ({
      ...vehicle,
      createdAt: vehicle.createdAt ? Timestamp.fromDate(new Date(vehicle.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
  }

  if (indexedDBData.drivers?.length > 0) {
    transformed.drivers = indexedDBData.drivers.map(driver => ({
      ...driver,
      createdAt: driver.createdAt ? Timestamp.fromDate(new Date(driver.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
  }

  if (indexedDBData.logs?.length > 0) {
    transformed.logs = indexedDBData.logs.map(log => ({
      ...log,
      date: Timestamp.fromDate(new Date(log.date)),
      createdAt: log.createdAt ? Timestamp.fromDate(new Date(log.createdAt)) : Timestamp.now(),
      updatedAt: Timestamp.now(),
    }));
  }

  return transformed;
};
