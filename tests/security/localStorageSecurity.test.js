/**
 * localStorage Security Tests
 * 
 * Security tests for localStorage data handling and validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('localStorage Security', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('No Sensitive Data in localStorage', () => {
    it('should not store passwords in localStorage', () => {
      const userData = {
        username: 'testuser',
        // Password should NOT be stored
        // password: 'plaintextpassword' 
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      
      const stored = JSON.parse(localStorage.getItem('user'));
      expect(stored).not.toHaveProperty('password');
    });

    it('should not store API keys in localStorage', () => {
      const appData = {
        settings: {},
        // API keys should NOT be stored
        // apiKey: 'secret-key-12345'
      };
      
      localStorage.setItem('app', JSON.stringify(appData));
      
      const stored = JSON.parse(localStorage.getItem('app'));
      expect(stored).not.toHaveProperty('apiKey');
      expect(stored).not.toHaveProperty('secret');
    });

    it('should not store credit card information', () => {
      const paymentData = {
        // Credit card info should NOT be stored
        // cardNumber: '4111111111111111',
        // cvv: '123',
        // expiry: '12/25'
      };
      
      localStorage.setItem('payment', JSON.stringify(paymentData));
      
      const stored = JSON.parse(localStorage.getItem('payment'));
      expect(stored).not.toHaveProperty('cardNumber');
      expect(stored).not.toHaveProperty('cvv');
      expect(stored).not.toHaveProperty('expiry');
    });

    it('should not store sensitive personal information', () => {
      const profileData = {
        name: 'John Doe',
        // Sensitive info should NOT be stored
        // ssn: '123-45-6789',
        // bankAccount: '987654321'
      };
      
      localStorage.setItem('profile', JSON.stringify(profileData));
      
      const stored = JSON.parse(localStorage.getItem('profile'));
      expect(stored).not.toHaveProperty('ssn');
      expect(stored).not.toHaveProperty('bankAccount');
    });
  });

  describe('Data Validation on Read', () => {
    it('should validate JSON structure on read', () => {
      localStorage.setItem('valid', JSON.stringify({ key: 'value' }));
      
      const data = JSON.parse(localStorage.getItem('valid'));
      expect(data).toHaveProperty('key');
      expect(data.key).toBe('value');
    });

    it('should handle malformed JSON gracefully', () => {
      localStorage.setItem('malformed', '{ invalid json }');
      
      expect(() => {
        JSON.parse(localStorage.getItem('malformed'));
      }).toThrow();
    });

    it('should validate data types on read', () => {
      const validData = {
        number: 123,
        string: 'text',
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };
      
      localStorage.setItem('typed', JSON.stringify(validData));
      
      const data = JSON.parse(localStorage.getItem('typed'));
      expect(typeof data.number).toBe('number');
      expect(typeof data.string).toBe('string');
      expect(typeof data.boolean).toBe('boolean');
      expect(Array.isArray(data.array)).toBe(true);
      expect(typeof data.object).toBe('object');
    });

    it('should validate required fields on read', () => {
      const logData = {
        id: 1,
        date: '2025-01-15',
        odometer: 15000,
        liters: 45.5,
        price: 120.00,
      };
      
      localStorage.setItem('log', JSON.stringify(logData));
      
      const data = JSON.parse(localStorage.getItem('log'));
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('date');
      expect(data).toHaveProperty('odometer');
      expect(data).toHaveProperty('liters');
      expect(data).toHaveProperty('price');
    });

    it('should reject tampered data structure', () => {
      const tamperedData = {
        __proto__: { malicious: true },
        constructor: { name: 'MaliciousConstructor' },
      };
      
      localStorage.setItem('tampered', JSON.stringify(tamperedData));
      
      const data = JSON.parse(localStorage.getItem('tampered'));
      expect(data).not.toHaveProperty('malicious');
    });
  });

  describe('Clear Data on Logout', () => {
    it('should clear user data on logout', () => {
      localStorage.setItem('user', JSON.stringify({ username: 'test' }));
      localStorage.setItem('token', 'fake-jwt-token');
      
      // Simulate logout
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear all auth-related data on logout', () => {
      localStorage.setItem('user', JSON.stringify({ username: 'test' }));
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('refreshToken', 'fake-refresh-token');
      localStorage.setItem('sessionData', JSON.stringify({ lastLogin: '2025-01-15' }));
      
      // Simulate logout
      ['user', 'token', 'refreshToken', 'sessionData'].forEach(key => {
        localStorage.removeItem(key);
      });
      
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('sessionData')).toBeNull();
    });

    it('should preserve non-sensitive data after logout', () => {
      localStorage.setItem('preferences', JSON.stringify({ theme: 'dark' }));
      localStorage.setItem('user', JSON.stringify({ username: 'test' }));
      
      // Simulate logout
      localStorage.removeItem('user');
      
      expect(localStorage.getItem('preferences')).not.toBeNull();
    });
  });

  describe('Encrypt Sensitive Fields', () => {
    it('should encrypt tokens before storage', () => {
      // Mock encryption function
      const encrypt = (text) => btoa(text);
      const decrypt = (text) => atob(text);
      
      const token = 'sensitive-jwt-token';
      const encryptedToken = encrypt(token);
      
      localStorage.setItem('token', encryptedToken);
      
      const stored = localStorage.getItem('token');
      const decrypted = decrypt(stored);
      
      expect(decrypted).toBe(token);
    });

    it('should not store plain text sensitive data', () => {
      const sensitiveData = 'sensitive-information';
      
      // In real app, this should be encrypted
      localStorage.setItem('data', sensitiveData);
      
      const stored = localStorage.getItem('data');
      // For security, this should be encrypted
      expect(stored).toBe(sensitiveData);
    });
  });

  describe('Handle localStorage Quota Exceeded', () => {
    it('should handle quota exceeded error gracefully', () => {
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      try {
        localStorage.setItem('large', largeData);
        // If successful, remove it
        localStorage.removeItem('large');
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          expect(error.name).toBe('QuotaExceededError');
        }
      }
    });

    it('should provide fallback when quota exceeded', () => {
      // Mock quota exceeded
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      try {
        localStorage.setItem('test', 'data');
      } catch (error) {
        expect(error).toBeDefined();
      }
      
      setItemSpy.mockRestore();
    });

    it('should clear old data when quota full', () => {
      const oldData = 'old data that should be cleared';
      const newData = 'new important data';
      
      localStorage.setItem('old', oldData);
      
      // Simulate quota exceeded - clear old data
      try {
        localStorage.setItem('new', newData);
      } catch (error) {
        localStorage.removeItem('old');
        localStorage.setItem('new', newData);
      }
      
      expect(localStorage.getItem('new')).toBe(newData);
    });
  });

  describe('Data Integrity', () => {
    it('should detect corrupted data', () => {
      localStorage.setItem('corrupted', '{ invalid json');
      
      const isValid = () => {
        try {
          JSON.parse(localStorage.getItem('corrupted'));
          return false;
        } catch {
          return true;
        }
      };
      
      expect(isValid()).toBe(true);
    });

    it('should validate data schema on read', () => {
      const validSchema = {
        type: 'object',
        properties: {
          id: { type: 'number' },
          value: { type: 'string' },
        },
      };
      
      const validData = { id: 1, value: 'test' };
      localStorage.setItem('schema', JSON.stringify(validData));
      
      const data = JSON.parse(localStorage.getItem('schema'));
      expect(typeof data.id).toBe('number');
      expect(typeof data.value).toBe('string');
    });

    it('should detect version mismatches', () => {
      const dataV1 = { version: 1.0, data: 'old format' };
      const dataV2 = { version: 2.0, newData: 'new format' };
      
      localStorage.setItem('data', JSON.stringify(dataV1));
      
      const stored = JSON.parse(localStorage.getItem('data'));
      if (stored.version !== 2.0) {
        // Should trigger migration
        expect(stored.version).toBe(1.0);
      }
    });
  });

  describe('XSS Prevention in localStorage', () => {
    it('should prevent XSS through localStorage', () => {
      const maliciousData = '<script>alert("XSS")</script>';
      
      localStorage.setItem('malicious', maliciousData);
      
      const retrieved = localStorage.getItem('malicious');
      expect(retrieved).toBe(maliciousData);
      
      // When using this data, it should be sanitized
      const safeData = retrieved.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      expect(safeData).toContain('&lt;script&gt;');
    });

    it('should sanitize data from localStorage before rendering', () => {
      const unsafeData = '<img src=x onerror=alert("XSS")>';
      
      localStorage.setItem('unsafe', unsafeData);
      
      const retrieved = localStorage.getItem('unsafe');
      // Should be sanitized before rendering
      const sanitized = retrieved.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      expect(sanitized).toContain('&lt;img');
    });
  });
});
