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
  validateStorageValue,
} from './secureStorage';

const STORAGE_KEY = 'fuelGuardDB';

/**
 * Helper function to validate storage value
 * Used for IndexedDB path which doesn't go through safeLocalStorageSet
 */
const validateBeforeStore = async (value) => {
  if (typeof value === 'object' && value !== null) {
    // Check for dangerous keys in the object's own enumerable properties
    const keys = Object.keys(value);
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    const hasDangerousKey = keys.some(key =>
      dangerousKeys.some(dangerous => key.toLowerCase() === dangerous.toLowerCase())
    );

    if (hasDangerousKey) {
      console.warn('Storage validation failed: Object contains dangerous properties');
      return false;
    }

    // Check for prototype pollution using hasOwnProperty (additional safeguard for non-arrays)
    if (!Array.isArray(value) &&
        (Object.prototype.hasOwnProperty.call(value, '__proto__') ||
         Object.prototype.hasOwnProperty.call(value, 'constructor') ||
         Object.prototype.hasOwnProperty.call(value, 'prototype'))) {
      console.warn('Storage validation failed: Object contains dangerous properties via hasOwnProperty');
      return false;
    }

    // Detect prototype chain pollution: plain data objects should have Object.prototype
    // as their prototype. If {__proto__: malicious} was used, the actual prototype is changed.
    if (!Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof Map) &&
        !(value instanceof Set) &&
        Object.getPrototypeOf(value) !== Object.prototype) {
      console.warn('Storage validation failed: Object prototype has been tampered (prototype chain pollution)');
      return false;
    }
  }
  return true;
};

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
      // Validate even for in-memory storage to block proto pollution
      const isValid = await validateBeforeStore(value);
      if (!isValid) {
        console.log('STORAGE VALIDATION: Blocked malicious data for key:', key);
        return false;
      }
      inMemoryStore.set(key, value);
      return true;
    }

    if (useLocalStorage) {
      try {
        // Validate before storing (same security check as IndexedDB path)
        const isValid = await validateBeforeStore(value);
        if (!isValid) {
          console.log('STORAGE VALIDATION: Blocked malicious data for key:', key);
          return false;
        }

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
      // Validate the value before storing (security check)
      const isValid = await validateBeforeStore(value);
      if (!isValid) {
        console.log('STORAGE VALIDATION: Blocked malicious data for key:', key);
        return false;
      }
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
   * Clear all data from storage
   */
  async clearAll() {
    await storageReady;

    if (useInMemory) {
      inMemoryStore.clear();
      return;
    }

    if (useLocalStorage) {
      global.localStorage.clear();
      return;
    }

    // IndexedDB (default)
    try {
      const keys = await idbGet.keys ? idbGet.keys() : [];
      for (const key of keys) {
        await idbDel(key);
      }
    } catch {
      global.localStorage.clear();
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

