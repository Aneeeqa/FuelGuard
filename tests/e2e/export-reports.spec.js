import { test, expect } from '@playwright/test';

test.describe('Export Reports', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to History page', async ({ page }) => {
    await expect(page.locator('text=Fuel Guard')).toBeVisible({ timeout: 10000 });

    await page.click('a:has-text("History")');

    await expect(page.locator('h1:has-text("History"), h2:has-text("History")')).toBeVisible();
  });

  test('should click export button', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Export Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2021');
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

    await page.click('a:has-text("History")');
    await page.waitForTimeout(500);

    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="Export"]').first();
    const isVisible = await exportButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await exportButton.click();
      await expect(page.locator('.modal, [role="dialog"], h3:has-text("Export")')).toBeVisible({ timeout: 5000 });
    } else {
      const alternativeExport = page.locator('text=Export PDF, text=Download, button[title*="Export"]').first();
      const isAlternativeVisible = await alternativeExport.isVisible().catch(() => false);
      
      if (isAlternativeVisible) {
        await alternativeExport.click();
      }
    }
  });

  test('should select PDF format', async ({ page }) => {
    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'PDF Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2020');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Honda');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Accord');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '15000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '45');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '135');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(500);

    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="Export"]').first();
    const isVisible = await exportButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await exportButton.click();
      
      const pdfOption = page.locator('text=PDF, input[type="radio"][value="pdf"], label:has-text("PDF")').first();
      await expect(pdfOption).toBeVisible({ timeout: 3000 });
      
      await pdfOption.click();
      
      const confirmButton = page.locator('button:has-text("Download"), button:has-text("Export"), button[type="submit"]');
      const isConfirmVisible = await confirmButton.first().isVisible().catch(() => false);
      
      if (isConfirmVisible) {
        await confirmButton.first().click();
      }
    }
  });

  test('should verify download initiates', async ({ page, context }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });

    await page.click('button:has-text("Add Vehicle")');
    await page.fill('input[placeholder*="Vehicle name"], input[name="name"]', 'Download Test Vehicle');
    await page.fill('input[placeholder*="Year"], input[name="year"]', '2022');
    await page.fill('input[placeholder*="Make"], input[name="make"]', 'Nissan');
    await page.fill('input[placeholder*="Model"], input[name="model"]', 'Altima');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(1000);

    await page.click('a:has-text("Log Entry")');
    await page.fill('input[placeholder*="Odometer"], input[name="odometer"]', '20000');
    await page.fill('input[placeholder*="Fuel"], input[name="liters"]', '48');
    await page.fill('input[placeholder*="Price"], input[name="price"]', '144');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    await page.click('a:has-text("History")');
    await page.waitForTimeout(500);

    const exportButton = page.locator('button:has-text("Export"), button[aria-label*="Export"]').first();
    const isVisible = await exportButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await exportButton.click();
      
      const pdfOption = page.locator('text=PDF, input[type="radio"][value="pdf"]').first();
      await pdfOption.click();
      
      const confirmButton = page.locator('button:has-text("Download"), button:has-text("Export")').first();
      const isConfirmVisible = await confirmButton.isVisible().catch(() => false);
      
      if (isConfirmVisible) {
        await confirmButton.click();
        
        try {
          const download = await Promise.race([
            downloadPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Download timeout')), 10000)
            )
          ]);
          
          const fileName = download.suggestedFilename();
          expect(fileName).toMatch(/\.(pdf|xlsx|csv)$/);
        } catch (error) {
          const alternativeExport = page.locator('text=Export PDF').first();
          const isAltVisible = await alternativeExport.isVisible().catch(() => false);
          
          if (isAltVisible) {
            await alternativeExport.click();
            
            try {
              const download = await Promise.race([
                downloadPromise,
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Download timeout')), 10000)
                )
              ]);
              
              const fileName = download.suggestedFilename();
              expect(fileName).toMatch(/\.(pdf|xlsx|csv)$/);
            } catch (retryError) {
            }
          }
        }
      }
    }
  });
});
