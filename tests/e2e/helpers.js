import { test as base } from '@playwright/test';

export const expect = base.expect;

export class TestHelper {
  constructor(page) {
    this.page = page;
  }

  async addVehicle({ name, year, make, model, tankCapacity, expectedMileage } = {}) {
    await this.page.click('button:has-text("Add Vehicle")');
    await this.page.fill('input[placeholder*="Vehicle name"], input[name="name"]', name);
    await this.page.fill('input[placeholder*="Year"], input[name="year"]', year.toString());
    await this.page.fill('input[placeholder*="Make"], input[name="make"]', make);
    await this.page.fill('input[placeholder*="Model"], input[name="model"]', model);
    
    if (tankCapacity) {
      await this.page.fill('input[placeholder*="Tank capacity"], input[name="tankCapacity"]', tankCapacity.toString());
    }
    
    if (expectedMileage) {
      await this.page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', expectedMileage.toString());
    }
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000);
  }

  async addFuelLog({ odometer, liters, price } = {}) {
    await this.page.click('a:has-text("Log Entry")');
    await this.page.fill('input[placeholder*="Odometer"], input[name="odometer"]', odometer.toString());
    await this.page.fill('input[placeholder*="Fuel"], input[name="liters"]', liters.toString());
    await this.page.fill('input[placeholder*="Price"], input[name="price"]', price.toString());
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(500);
  }

  async addDriver({ name, email, phone } = {}) {
    await this.page.click('a:has-text("Drivers")');
    await this.page.waitForTimeout(500);
    await this.page.click('button:has-text("Add Driver")');
    await this.page.fill('input[placeholder*="Name"], input[name="name"]', name);
    await this.page.fill('input[placeholder*="Email"], input[name="email"]', email);
    await this.page.fill('input[placeholder*="Phone"], input[name="phone"]', phone);
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(500);
  }

  async selectVehicle(vehicleName) {
    const vehicleCard = this.page.locator(`text=${vehicleName}`).first();
    await vehicleCard.click();
    await this.page.waitForTimeout(500);
  }

  async navigateTo(pageName) {
    await this.page.click(`a:has-text("${pageName}")`);
    await this.page.waitForTimeout(500);
  }

  async waitForElement(selector, options = {}) {
    return this.page.waitForSelector(selector, { timeout: 10000, ...options });
  }

  async assertElementVisible(selector) {
    await expect(this.page.locator(selector)).toBeVisible({ timeout: 10000 });
  }

  async assertElementTextContains(selector, text) {
    await expect(this.page.locator(selector)).toContainText(text, { timeout: 10000 });
  }

  async getIndexedData(storeName) {
    return this.page.evaluate(async (store) => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([store], 'readonly');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }, storeName);
  }

  async clearIndexedDB() {
    return this.page.evaluate(async () => {
      const databases = await indexedDB.databases();
      for (const dbInfo of databases) {
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase(dbInfo.name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    });
  }

  async isServiceWorkerActive() {
    return this.page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== null && registration.active !== null;
      }
      return false;
    });
  }

  async isOnline() {
    return this.page.evaluate(() => navigator.onLine);
  }
}

export const test = base.extend({
  helper: async ({ page }, use) => {
    const helper = new TestHelper(page);
    await use(helper);
  }
});
