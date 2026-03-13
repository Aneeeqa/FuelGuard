/**
 * Storage Abstraction Layer
 * Provides resilient async storage with IndexedDB primary and localStorage fallback
 * Solves Safari Private Mode issues where IndexedDB is unavailable
 */

import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { safeJsonParse, Schemas } from './safeJson';
import {
  safeLocalStorageSet,
  safeLocalStorageGet,
  safeLocalStorageRemove,
  validateStorageKey,
} from './secureStorage';

const STORAGE_KEY = 'fuelGuardDB';

// Storage type detection
let storageType = 'indexeddb';
let useLocalStorage = false;
let useInMemory = false;
const inMemoryStore = new Map();

// Feature detection on module load
const detectStorage = async () => {
  // Test IndexedDB availability
  try {
    const testKey = '__idb_test__';
    await idbSet(testKey, 'test');
    await idbDel(testKey);
    storageType = 'indexeddb';
    return;
  } catch {
    // IndexedDB failed, try localStorage
  }

  // Test localStorage availability
  try {
    const testKey = '__ls_test__';

    // Validate test key
    const keyValidation = validateStorageKey(testKey);
    if (keyValidation.valid) {
      safeLocalStorageSet(testKey, 'test');
      safeLocalStorageRemove(testKey);
      useLocalStorage = true;
      storageType = 'localstorage';
      return;
    }
  } catch {
    // localStorage failed, use in-memory
  }

  // Fallback to in-memory storage
  useInMemory = true;
  storageType = 'memory';
};

// Initialize storage detection
const storageReady = detectStorage();

export const storage = {
  /**
   * Get data from storage with safe JSON parsing
   * @param {string} key - Storage key (defaults to STORAGE_KEY)
   * @param {Object} schema - Optional schema for validation
   * @returns {Promise<any>} Stored data or null
   */
  async get(key = STORAGE_KEY, schema = null) {
    await storageReady;

    if (useInMemory) {
      return inMemoryStore.get(key) || null;
    }

    if (useLocalStorage) {
      try {
        const data = safeLocalStorageGet(key, { parseJson: false });
        if (!data) return null;

        // Use safe JSON parser with schema validation
        return safeJsonParse(data, { schema });
      } catch (error) {
        console.error('localStorage read failed:', error);
        return null;
      }
    }

    // IndexedDB (default)
    try {
      const data = await idbGet(key);
      if (!data) return null;

      // If data from IndexedDB is a string, parse it safely
      if (typeof data === 'string') {
        return safeJsonParse(data, { schema });
      }

      // If it's already an object, validate it
      if (schema && typeof data === 'object') {
        const result = safeJsonParse(JSON.stringify(data), { schema });
        return result !== null ? result : data;
      }

      return data;
    } catch (error) {
      // Fallback to localStorage on failure
      console.warn('IndexedDB get failed, falling back to localStorage:', error);
      useLocalStorage = true;
      storageType = 'localstorage';
      return this.get(key, schema);
    }
  },

  /**
   * Set data in storage
   * @param {string} key - Storage key (defaults to STORAGE_KEY)
   * @param {any} value - Data to store
   * @returns {Promise<boolean>} Success status
   */
  async set(key = STORAGE_KEY, value) {
    await storageReady;

    if (useInMemory) {
      inMemoryStore.set(key, value);
      return true;
    }

    if (useLocalStorage) {
      try {
        const success = safeLocalStorageSet(key, value);

        if (success) {
          return true;
        }

        // Safe storage failed, fall back to in-memory
        console.warn('Safe localStorage set failed, falling back to in-memory');
        useInMemory = true;
        storageType = 'memory';
        return this.set(key, value);
      } catch (error) {
        console.warn('localStorage set failed:', error);
        useInMemory = true;
        storageType = 'memory';
        return this.set(key, value);
      }
    }

    // IndexedDB (default)
    try {
      await idbSet(key, value);
      return true;
    } catch (error) {
      console.warn('IndexedDB set failed, falling back to localStorage:', error);
      useLocalStorage = true;
      storageType = 'localstorage';
      return this.set(key, value);
    }
  },

  /**
   * Clear data from storage
   * @param {string} key - Storage key (defaults to STORAGE_KEY)
   */
  async clear(key = STORAGE_KEY) {
    await storageReady;

    if (useInMemory) {
      inMemoryStore.delete(key);
      return;
    }

    if (useLocalStorage) {
      safeLocalStorageRemove(key);
      return;
    }

    // IndexedDB (default)
    try {
      await idbDel(key);
    } catch {
      safeLocalStorageRemove(key);
    }
  },

  /**
   * Get the current storage type being used
   * @returns {string} 'indexeddb' | 'localstorage' | 'memory'
   */
  getStorageType() {
    return storageType;
  },
};

