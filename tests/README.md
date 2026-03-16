# Phase 3: UI & User Journeys Tests

This directory contains comprehensive React component tests for Phase 3 as outlined in `test.md`.

## Test Coverage

### Dashboard & Layout Components (25 tests)
- `StatCard.test.jsx` - Dashboard statistics card with animated waves
- `MileageChart.test.jsx` - Mileage trend chart using Recharts
- `CarbonChart.test.jsx` - CO2 emissions bar chart
- `BudgetCard.test.jsx` - Monthly budget tracking card
- `Sidebar.test.jsx` - Navigation sidebar with mobile/desktop support

### Core UI Components (40 tests)
- `Button.test.jsx` - Mobile-optimized button with variants
- `Input.test.jsx` - Form input with floating labels
- `Modal.test.jsx` - Dialog component with backdrop blur
- `Toast.test.jsx` - Notification toast system
- `Card.test.jsx` - Generic card component
- `Alert.test.jsx` - Alert component with variants
- `Skeleton.test.jsx` - Loading skeleton component
- `Badge.test.jsx` - Badge component with count
- `ThemeToggle.test.jsx` - Dark/light mode toggle

### Feature Components (50 tests)
- `VehicleSelector.test.jsx` - Multi-step vehicle selection
- `FullTankToggle.test.jsx` - Tank-to-tank tracking toggle
- `GaugeReadingSelector.test.jsx` - Fuel gauge selector

### Page Components (45 tests)
- `Dashboard.test.jsx` - Main dashboard page
- `LogEntry.test.jsx` - Fuel log entry form
- `History.test.jsx` - Fuel log history page

### Frontend Security (15 tests)
- `ComponentXSS.test.jsx` - XSS prevention in components
- `localStorageSecurity.test.js` - localStorage data security
- `ErrorBoundary.test.jsx` - Error boundary security

## Running the Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only component tests
npm run test -- tests/components

# Run only page tests
npm run test -- tests/pages

# Run only security tests
npm run test -- tests/security
```

## Test Structure

Each test file follows this structure:
1. **Rendering Tests** - Basic component rendering
2. **Interaction Tests** - User interactions and events
3. **State Tests** - Loading, error, and empty states
4. **Accessibility Tests** - ARIA attributes and keyboard navigation
5. **Edge Cases** - Boundary conditions and error handling

## Mocked Dependencies

All external dependencies are mocked to ensure tests run in isolation:
- React Router (`useNavigate`)
- Context APIs (`useFuelData`)
- Recharts (Chart components)
- Leaflet/Maps (Map components)
- Geolocation API
- IndexedDB

## Test Guidelines

1. **Use userEvent for interactions** - Prefer `@testing-library/user-event` over `fireEvent`
2. **Test behavior, not implementation** - Focus on what users see and do
3. **Mock external dependencies** - Isolate component logic
4. **Test all states** - Loading, error, empty, and success states
5. **Include accessibility** - Test ARIA attributes and keyboard navigation

## Coverage Targets

- **Dashboard Components**: 75%+ coverage
- **Layout Components**: 80%+ coverage
- **UI Components**: 75%+ coverage
- **Feature Components**: 70%+ coverage
- **Page Components**: 70%+ coverage
- **Security Tests**: 100% coverage

## Security Tests Coverage

✅ React JSX escapes dynamic content
✅ No dangerous innerHTML usage
✅ Sanitize user input in text fields
✅ Prevent stored XSS in comments
✅ Prevent reflected XSS in search
✅ No sensitive data in localStorage
✅ Validate data on read
✅ Clear data on logout
✅ Encrypt sensitive fields
✅ Handle localStorage quota exceeded
✅ Prevent XSS in error messages
✅ Safe error rendering
✅ No stack trace leakage
✅ Handle component errors
✅ Graceful error recovery

## Implementation Notes

- Tests use **Vitest** as the test runner
- **React Testing Library** for component testing
- **@testing-library/user-event** for simulating user interactions
- All mocks are configured in each test file to avoid cross-contamination
- Tests are organized by domain for easy navigation and maintenance

## Known Limitations

1. Some chart tests mock Recharts components due to JSDOM limitations
2. Map components are mocked as Leaflet requires DOM manipulation
3. Geolocation tests use mock implementations
4. IndexedDB is mocked as it's not available in test environment

## Next Steps

1. Run tests: `npm run test`
2. Check coverage: `npm run test:coverage`
3. Fix any failing tests
4. Add missing component tests as needed
5. Improve coverage for complex components
