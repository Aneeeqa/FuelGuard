import { test, expect } from '@playwright/test';

test.describe('Add Vehicle and Log Fuel Entry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should add vehicle successfully', async ({ page }) => {
    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Add Vehicle")');
    await expect(page.locator('h2:has-text("Add Vehicle")')).toBeVisible();

    await page.fill('input[placeholder*="Vehicle name"], input[name="name"], input[aria-label*="Vehicle name"]', 'Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Add"), button:has-text("Save Vehicle")');

    await expect(page.locator('text=Test Vehicle')).toBeVisible({ timeout: 5000 });
  });

  test('should fill vehicle form and submit', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'My Truck');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2018');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Ford');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'F-150');
    await page.fill('input[placeholder*="Tank capacity"], input[name="tankCapacity"]', '136');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '12');

    await page.click('button[type="submit"]:has-text("Save")');

    await expect(page.locator('text=My Truck')).toBeVisible();
    await expect(page.locator('text=2018 Ford F-150')).toBeVisible();
  });

  test('should verify vehicle persists to storage', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Storage Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2022');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Civic');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Storage Test Vehicle')).toBeVisible();

    const vehicleExists = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve) => {
        const transaction = db.transaction(['vehicles'], 'readonly');
        const store = transaction.objectStore('vehicles');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result.some(v => v.name === 'Storage Test Vehicle'));
        };
      });
    });

    expect(vehicleExists).toBe(true);
  });

  test('should navigate to fuel log entry', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Log Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Nissan');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Altima');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);
    
    await page.click('a:has-text("Log Entry"), button:has-text("Add Fuel Entry"), a:has-text("Log")');
    await expect(page.locator('h1:has-text("Log Fuel Entry"), h2:has-text("Add Entry")')).toBeVisible();
  });

  test('should fill log form and submit', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Fuel Log Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"], input[aria-label*="Odometer"]', '15000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"], input[aria-label*="Fuel"]', '45.5');
    await page.fill('input[placeholder*="Price"], input[name="price"], input[aria-label*="Price"]', '120.00');
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Add Entry")');

    await expect(page.locator('text=Fuel entry saved, text=Entry added, text=Successfully saved')).toBeVisible({ timeout: 5000 });
  });

  test('should verify statistics update after log entry', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Stats Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2019');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Chevrolet');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Malibu');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '40');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '100');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Dashboard"), button:has-text("Dashboard")');
    
    await expect(page.locator('text=$100, text=Total Spent')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=40 L, text=40 liters')).toBeVisible();
  });

  test('should verify dashboard reflects data', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Dashboard Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Kia');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Seltos');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '25000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '50');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '150');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Dashboard")');
    
    await expect(page.locator('text=Dashboard Vehicle')).toBeVisible();
    await expect(page.locator('text=Total Spent')).toBeVisible();
    await expect(page.locator('text=Average Mileage')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Validation Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Add Entry")');

    await expect(page.locator('text=required, text=Required, text=must be filled')).toBeVisible({ timeout: 5000 });
  });
});
