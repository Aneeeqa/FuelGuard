import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

const STORAGE_KEY = 'fuelGuardDB';

let storageType = 'indexeddb';
let useLocalStorage = false;
let useInMemory = false;
const inMemoryStore = new Map();

const detectStorage = async () => {
  try {
    const testKey = '__idb_test__';
    await idbSet(testKey, 'test');
    await idbDel(testKey);
    storageType = 'indexeddb';
    return;
  } catch {
  }

  try {
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    useLocalStorage = true;
    storageType = 'localstorage';
    return;
  } catch {
  }

  useInMemory = true;
  storageType = 'memory';
};

const storageReady = detectStorage();

export const storage = {
  async get(key = STORAGE_KEY) {
    await storageReady;

    if (useInMemory) {
      return inMemoryStore.get(key) || null;
    }

    if (useLocalStorage) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    }

    try {
      return await idbGet(key);
    } catch (error) {
      useLocalStorage = true;
      storageType = 'localstorage';
      return this.get(key);
    }
  },

  async set(key = STORAGE_KEY, value) {
    await storageReady;

    if (useInMemory) {
      inMemoryStore.set(key, value);
      return true;
    }

    if (useLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        useInMemory = true;
        storageType = 'memory';
        return this.set(key, value);
      }
    }

    try {
      await idbSet(key, value);
      return true;
      } catch (error) {
        useLocalStorage = true;
        storageType = 'localstorage';
        return this.set(key, value);
      }
  },

  async clear(key = STORAGE_KEY) {
    await storageReady;

    if (useInMemory) {
      inMemoryStore.delete(key);
      return;
    }

    if (useLocalStorage) {
      localStorage.removeItem(key);
      return;
    }

    try {
      await idbDel(key);
    } catch {
      localStorage.removeItem(key);
    }
  },

  getStorageType() {
    return storageType;
  },
};
