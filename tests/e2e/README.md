# E2E Tests for Fuel Guard

This directory contains Playwright end-to-end tests for the Fuel Guard application, focusing on critical user journeys.

## Test Files

### Critical User Journeys

1. **add-vehicle-and-log-fuel-entry.spec.js** (8 tests)
   - Tests adding new vehicles
   - Tests form validation
   - Tests fuel log entry creation
   - Verifies IndexedDB persistence
   - Verifies dashboard statistics update

2. **view-theft-alerts.spec.js** (6 tests)
   - Creates fuel logs with abnormal consumption
   - Verifies theft alert badge appears
   - Tests theft details modal
   - Verifies theft amount calculations

3. **switch-between-vehicles.spec.js** (5 tests)
   - Tests adding multiple vehicles
   - Tests vehicle selection
   - Verifies dashboard updates per vehicle
   - Verifies fuel log filtering by vehicle

4. **export-reports.spec.js** (4 tests)
   - Tests navigating to History page
   - Tests clicking export button
   - Tests selecting PDF format
   - Verifies download initiation

5. **manage-drivers.spec.js** (4 tests)
   - Tests adding new drivers
   - Tests assigning drivers to vehicles
   - Verifies driver appears in vehicle card
   - Verifies driver data persistence

### Critical Tests

6. **offline-mode.spec.js** (7 tests) - **CRITICAL**
   - Verifies application loads online
   - Verifies service worker installation
   - Tests network disconnection simulation
   - Tests adding fuel entry while offline
   - Verifies IndexedDB storage while offline
   - Tests network reconnection
   - Verifies background sync after reconnection

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run E2E tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Debug E2E tests
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test tests/e2e/offline-mode.spec.js
```

### Run tests for a specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Configuration

The E2E tests are configured in `playwright.config.js`:
- **Base URL**: http://localhost:5173
- **Browsers**: Chromium, Firefox, WebKit
- **Parallel execution**: Enabled
- **Retries**: 2 in CI, 0 locally
- **Screenshots**: Only on failure
- **Trace**: On first retry

## Test Helpers

The `helpers.js` file provides reusable utility functions:
- `addVehicle()` - Add a vehicle with specified details
- `addFuelLog()` - Add a fuel log entry
- `addDriver()` - Add a new driver
- `selectVehicle()` - Select a vehicle
- `navigateTo()` - Navigate to a page
- `getIndexedData()` - Retrieve data from IndexedDB
- `clearIndexedDB()` - Clear all IndexedDB data
- `isServiceWorkerActive()` - Check service worker status
- `isOnline()` - Check online/offline status

## Best Practices Used

1. **User-facing locators**: Tests use text, aria-label, and roles instead of brittle CSS selectors
2. **Isolated contexts**: Each test uses a fresh browser context
3. **Wait strategies**: Proper waits for network idle and element visibility
4. **Timeouts**: Appropriate timeouts for network operations
5. **Retry logic**: Built-in retry mechanism in CI
6. **Screenshot on failure**: Automatic screenshots for debugging

## Critical Path Coverage

The E2E tests cover the "money paths" - critical user journeys that involve:
- Financial transactions (fuel entry, cost calculations)
- Theft detection (alerts, abnormal consumption)
- Data persistence (IndexedDB, offline mode)
- PWA functionality (service workers, background sync)

## Notes

- Tests assume the development server is running (handled by webServer config)
- IndexedDB is accessed directly to verify data persistence
- Offline mode tests use `context.setOffline(true)` to simulate network conditions
- Tests are designed to run sequentially or in parallel without state pollution
