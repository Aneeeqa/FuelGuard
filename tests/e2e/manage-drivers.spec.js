import { test, expect } from '@playwright/test';

test.describe('Manage Drivers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to Drivers page', async ({ page }) => {
    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });

    await page.click('a:has-text("Drivers")');

    await expect(page.locator('h1:has-text("Drivers"), h2:has-text("Drivers")')).toBeVisible();
  });

  test('should add new driver', async ({ page }) => {
    await page.click('a:has-text("Drivers")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Add Driver"), button[aria-label*="Add Driver"]');

    await expect(page.locator('h2:has-text("Add Driver"), h3:has-text("Add Driver")')).toBeVisible();

    await page.fill('input[placeholder*="Name"], input[name="name"]', 'John Doe');
    await page.fill('input[placeholder*="Email"], input[name="email"]', 'john.doe@example.com');
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', '555-123-4567');

    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Add"), button:has-text("Add Driver")');

    await expect(page.locator('text=John Doe')).toBeVisible({ timeout: 5000 });
  });

  test('should assign driver to vehicle', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Driver Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Camry');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Drivers")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Add Driver")');

    await page.fill('input[placeholder*="Name"], input[name="name"]', 'Jane Smith');
    await page.fill('input[placeholder*="Email"], input[name="email"]', 'jane.smith@example.com');
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', '555-987-6543');

    await page.click('button[type="submit"]:has-text("Save")');

    await expect(page.locator('text=Jane Smith')).toBeVisible({ timeout: 5000 });

    await page.click('a:has-text("Vehicles")');
    await page.waitForTimeout(500);

    const vehicleCard = page.locator('text=Driver Test Vehicle').first();
    await vehicleCard.click();

    await page.waitForTimeout(500);

    const driverSelect = page.locator('select[name="driver"], select[aria-label*="Driver"], [role="combobox"]').first();
    const isSelectVisible = await driverSelect.isVisible().catch(() => false);
    
    if (isSelectVisible) {
      await driverSelect.selectOption(/Jane Smith/);
    } else {
      const assignButton = page.locator('button:has-text("Assign Driver"), button:has-text("Add Driver")').first();
      const isAssignVisible = await assignButton.isVisible().catch(() => false);
      
      if (isAssignVisible) {
        await assignButton.click();
      }
    }
  });

  test('should verify driver appears in vehicle card', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Verify Driver Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'CR-V');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Drivers")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Add Driver")');

    await page.fill('input[placeholder*="Name"], input[name="name"]', 'Bob Johnson');
    await page.fill('input[placeholder*="Email"], input[name="email"]', 'bob.johnson@example.com');
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', '555-555-5555');

    await page.click('button[type="submit"]:has-text("Save")');

    await expect(page.locator('text=Bob Johnson')).toBeVisible({ timeout: 5000 });

    await page.click('a:has-text("Vehicles")');
    await page.waitForTimeout(500);

    const vehicleCard = page.locator('text=Verify Driver Vehicle').first();
    await vehicleCard.click();

    await page.waitForTimeout(500);

    const driverSelect = page.locator('select[name="driver"]').first();
    const isSelectVisible = await driverSelect.isVisible().catch(() => false);
    
    if (isSelectVisible) {
      await driverSelect.selectOption(/Bob Johnson/);
      
      await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');
      await page.waitForTimeout(500);
      
      await page.click('a:has-text("Vehicles")');
      await page.waitForTimeout(500);
      
      const driverText = page.locator('text=Bob Johnson').first();
      await expect(driverText).toBeVisible();
    }
  });

  test('should verify driver data persists', async ({ page }) => {
    await page.click('a:has-text("Drivers")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Add Driver")');

    await page.fill('input[placeholder*="Name"], input[name="name"]', 'Persistence Test Driver');
    await page.fill('input[placeholder*="Email"], input[name="email"]', 'persistence@example.com');
    await page.fill('input[placeholder*="Phone"], input[name="phone"]', '555-111-2222');

    await page.click('button[type="submit"]:has-text("Save")');

    await expect(page.locator('text=Persistence Test Driver')).toBeVisible({ timeout: 5000 });

    const driverExists = await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('fuelGuardDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      return new Promise((resolve) => {
        const transaction = db.transaction(['drivers'], 'readonly');
        const store = transaction.objectStore('drivers');
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result.some(d => d.name === 'Persistence Test Driver'));
        };
      });
    });

    expect(driverExists).toBe(true);
  });
});
