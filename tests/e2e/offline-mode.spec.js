import { test, expect } from '@playwright/test';

test.describe('Offline Mode - CRITICAL TESTS', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load application online', async ({ page }) => {
    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });
    
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });

  test('should verify service worker installed', async ({ page }) => {
    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });

    const serviceWorkerRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== null && registration.active !== null;
      }
      return false;
    });

    expect(serviceWorkerRegistered).toBe(true);
  });

  test('should simulate network disconnection', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await context.setOffline(true);

    const isOffline = await page.evaluate(() => navigator.onLine);
    expect(isOffline).toBe(false);

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('text=Fuel Guard, text=Offline Mode')).toBeVisible({ timeout: 10000 });
  });

  test('should add fuel entry while offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Offline Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await context.setOffline(true);

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '40');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '120');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Fuel entry saved, text=Entry added')).toBeVisible({ timeout: 10000 });
  });

  test('should verify entry saved to IndexedDB while offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'IndexedDB Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Civic');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await context.setOffline(true);

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '50');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '150');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Fuel entry saved')).toBeVisible({ timeout: 10000 });

    const data = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve) => {
        const transaction = db.transaction(['logs'], 'readonly');
        const store = transaction.objectStore('logs');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    });

    expect(data.length).toBeGreaterThan(0);
    const offlineEntry = data.find(log => log.odometer === 20000);
    expect(offlineEntry).toBeDefined();
    expect(offlineEntry.liters).toBe(50);
    expect(offlineEntry.price).toBe(150);
  });

  test('should reconnect network', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Reconnect Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2022');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Nissan');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Altima');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await context.setOffline(true);

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '25000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '45');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '135');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Fuel entry saved')).toBeVisible({ timeout: 10000 });

    await context.setOffline(false);

    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBe(true);
  });

  test('should verify background sync completes after reconnection', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Sync Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Ford');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Mustang');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '12');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await context.setOffline(true);

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '30000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '55');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '165');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Fuel entry saved')).toBeVisible({ timeout: 10000 });

    const dataBeforeSync = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve) => {
        const transaction = db.transaction(['logs'], 'readonly');
        const store = transaction.objectStore('logs');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    });

    expect(dataBeforeSync.length).toBeGreaterThan(0);
    expect(dataBeforeSync[0].odometer).toBe(30000);

    await context.setOffline(false);

    await page.reload({ waitUntil: 'networkidle' });

    await page.waitForTimeout(2000);

    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });

    const dataAfterSync = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve) => {
        const transaction = db.transaction(['logs'], 'readonly');
        const store = transaction.objectStore('logs');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    });

    expect(dataAfterSync.length).toBe(dataBeforeSync.length);
    expect(dataAfterSync.find(log => log.odometer === 30000)).toBeDefined();

    await page.click('a:has-text("Dashboard")');
    await page.waitForTimeout(500);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('$165');
  });
});
