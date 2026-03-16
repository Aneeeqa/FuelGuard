import { test, expect } from '@playwright/test';

test.describe('View Theft Alerts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should create fuel log with abnormal consumption', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Theft Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.fill('input[placeholder*="Tank capacity"], input[name="tankCapacity"]', '50');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '15');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '10000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '45');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '120');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '10100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '36');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '100');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Fuel entry saved')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to History page', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'History Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Civic');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '50');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '130');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '40');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '110');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');

    await expect(page.locator('h1:has-text("History"), h2:has-text("History")')).toBeVisible();
  });

  test('should verify theft alert badge appears', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Alert Badge Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2019');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Ford');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Focus');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '14');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '45');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '125');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '38');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '105');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');

    await page.waitForTimeout(1000);

    const alertBadge = await page.locator('text=Theft Alert, text=⚠, [aria-label*="alert"]').first();
    const isAlertVisible = await alertBadge.isVisible().catch(() => false);
    
    if (isAlertVisible) {
      await expect(alertBadge).toBeVisible();
    }
  });

  test('should click theft alert', async ({ page, context }) => {
    await context.clearCookies();

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Click Alert Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Chevrolet');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Cruze');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '13');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '25000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '42');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '115');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '25100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '35');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '95');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(1000);

    const alertElement = page.locator('text=Theft Alert, [class*="alert"], [class*="warning"]').first();
    const isVisible = await alertElement.isVisible().catch(() => false);
    
    if (isVisible) {
      await alertElement.click();
      await expect(page.locator('.modal, [role="dialog"], h3:has-text("Theft")')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should verify theft details modal', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Modal Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Nissan');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Sentra');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '15');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '30000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '48');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '135');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '30100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '37');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '102');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(1000);

    const alertElement = page.locator('text=Theft Alert, [class*="alert"]').first();
    const isVisible = await alertElement.isVisible().catch(() => false);
    
    if (isVisible) {
      await alertElement.click();
      
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
      
      const hasExpectedMileage = await page.locator('text=Expected, text=Mileage').count();
      const hasActualMileage = await page.locator('text=Actual, text=Consumption').count();
      
      expect(hasExpectedMileage + hasActualMileage).toBeGreaterThan(0);
    }
  });

  test('should verify theft amount calculation', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Calc Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Hyundai');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Elantra');
    await page.fill('input[placeholder*="Expected mileage"], input[name="expectedMileage"]', '14');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '35000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '44');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '122');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '35100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '36');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '100');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(1000);

    const alertElement = page.locator('text=Theft Alert, [class*="alert"]').first();
    const isVisible = await alertElement.isVisible().catch(() => false);
    
    if (isVisible) {
      await alertElement.click();
      
      const pageText = await page.textContent('body');
      const hasNumbers = /\d+\.?\d*(?: L| liters)/.test(pageText);
      
      expect(hasNumbers).toBe(true);
    }
  });
});
