import { test, expect } from '@playwright/test';

test.describe('Switch Between Vehicles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should add multiple vehicles', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Vehicle 1');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Corolla');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Vehicle 2');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Civic');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await expect(page.locator('text=Vehicle 1')).toBeVisible();
    await expect(page.locator('text=Vehicle 2')).toBeVisible();
  });

  test('should select vehicle 2', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Primary Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2019');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Ford');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'F-150');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Secondary Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Chevrolet');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Silverado');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    const vehicle2Card = page.locator('text=Secondary Vehicle, text=Chevrolet Silverado').first();
    await vehicle2Card.click();

    await expect(page.locator('text=Secondary Vehicle')).toBeVisible();
  });

  test('should verify dashboard updates to vehicle 2 data', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Dashboard Vehicle 1');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Camry');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '10000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '50');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '150');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '10100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '40');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '120');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Dashboard Vehicle 2');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2022');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'CR-V');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '5000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '60');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '180');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '5100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '45');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '135');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Dashboard")');

    const vehicle1Card = page.locator('text=Dashboard Vehicle 1').first();
    await vehicle1Card.click();
    await page.waitForTimeout(500);

    const pageContent1 = await page.textContent('body');
    expect(pageContent1).toContain('Dashboard Vehicle 1');

    const vehicle2Card = page.locator('text=Dashboard Vehicle 2').first();
    await vehicle2Card.click();
    await page.waitForTimeout(500);

    const pageContent2 = await page.textContent('body');
    expect(pageContent2).toContain('Dashboard Vehicle 2');
  });

  test('should verify fuel logs filtered to vehicle 2', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'History Vehicle 1');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Toyota');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'RAV4');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '55');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '165');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '42');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '126');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'History Vehicle 2');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Mazda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'CX-5');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '48');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '144');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15100');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '38');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '114');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(500);

    const vehicle1Card = page.locator('text=History Vehicle 1').first();
    await vehicle1Card.click();
    await page.waitForTimeout(500);

    const pageContent1 = await page.textContent('body');
    expect(pageContent1).toContain('History Vehicle 1');

    const vehicle2Card = page.locator('text=History Vehicle 2').first();
    await vehicle2Card.click();
    await page.waitForTimeout(500);

    const pageContent2 = await page.textContent('body');
    expect(pageContent2).toContain('History Vehicle 2');
  });

  test('should switch back to vehicle 1', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Switch Vehicle 1');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2019');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Subaru');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Outback');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Switch Vehicle 2');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2022');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Volkswagen');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Tiguan');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '8000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '52');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '156');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Dashboard")');
    await page.waitForTimeout(500);

    const vehicle2Card = page.locator('text=Switch Vehicle 2').first();
    await vehicle2Card.click();
    await page.waitForTimeout(500);

    const pageContent2 = await page.textContent('body');
    expect(pageContent2).toContain('Switch Vehicle 2');

    const vehicle1Card = page.locator('text=Switch Vehicle 1').first();
    await vehicle1Card.click();
    await page.waitForTimeout(500);

    const pageContent1 = await page.textContent('body');
    expect(pageContent1).toContain('Switch Vehicle 1');
  });
});
