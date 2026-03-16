import { storage } from './storage';

export const exportIndexedDBData = async () => {
  const data = await storage.get('fuelGuardDB');
  return data;
};
