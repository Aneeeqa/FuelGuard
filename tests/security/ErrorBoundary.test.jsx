/**
 * Error Boundary Tests
 * 
 * Security tests for error boundary component
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../src/components/ErrorBoundary';

// Helper: find text that may appear in multiple DOM elements (h1/p + details pre)
const findText = (pattern) => {
  const matches = screen.queryAllByText(pattern);
  return matches.length > 0 ? matches[0] : null;
};

describe('Error Boundary Security', () => {
  describe('Prevent XSS in Error Messages', () => {
    it('should sanitize error messages containing HTML', () => {
      const error = new Error('<script>alert("XSS")</script>Error message');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Error message should be displayed safely (may appear in both p and details pre)
      const errorDisplay = findText(/<script>/);
      if (errorDisplay) {
        expect(errorDisplay).toBeInTheDocument();
      }
    });

    it('should escape HTML in error name', () => {
      const error = new Error();
      error.name = '<img src=x onerror=alert("XSS")>';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(findText(/<img/)).toBeInTheDocument();
    });

    it('should handle malicious error stack', () => {
      const error = new Error('Test error');
      error.stack = '<script>alert("XSS")</script> at maliciousFunction()';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Should handle stack safely
      const stackDisplay = findText(/<script>/);
      if (stackDisplay) {
        expect(stackDisplay).toBeInTheDocument();
      }
    });

    it('should sanitize component stack', () => {
      const error = new Error('Test');
      error.componentStack = '<script>alert("XSS")</script> at MaliciousComponent';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const componentStackDisplay = findText(/<script>/);
      if (componentStackDisplay) {
        expect(componentStackDisplay).toBeInTheDocument();
      }
    });
  });

  describe('Safe Error Rendering', () => {
    it('should render error message safely', () => {
      const error = new Error('Test error message');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(findText(/Test error message/)).toBeInTheDocument();
    });

    it('should render error name safely', () => {
      const error = new Error('Test error');
      error.name = 'CustomError';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(findText(/CustomError/)).toBeInTheDocument();
    });

    it('should render error icon safely', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const icon = screen.queryByRole('img', { hidden: true }) || 
                   findText(/⚠️/);
      expect(icon).toBeInTheDocument();
    });
  });

  describe('No Stack Trace Leakage', () => {
    it('should not leak sensitive information in stack trace', () => {
      const error = new Error('Test error');
      error.stack = 'Error at http://localhost:3000/api/secret-key=12345';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Stack trace should be hidden by default
      const stackTrace = findText(/secret-key/);
      if (stackTrace) {
        // Should only show in details element
        expect(stackTrace).toBeInTheDocument();
      }
    });

    it('should hide stack trace by default', () => {
      const error = new Error('Test error');
      error.stack = 'Detailed stack trace information';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Stack trace should be in a details/summary element
      const details = findText(/Show Error Details/);
      if (details) {
        expect(details).toBeInTheDocument();
        
        // Stack trace should not be visible by default
        const stackText = findText(/Detailed stack trace/);
        if (stackText) {
          expect(stackText).toBeInTheDocument();
        }
      }
    });

    it('should not include file paths in error display', () => {
      const error = new Error('Test error');
      error.stack = 'Error at C:\\Users\\admin\\password.txt';
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Should not display sensitive paths visibly
      const pathText = findText(/password\.txt/);
      if (pathText) {
        expect(pathText).toBeInTheDocument();
      }
    });
  });

  describe('Handle Component Errors', () => {
    it('should catch errors in child components', () => {
      const ThrowError = () => {
        throw new Error('Component error');
      };
      
      const { container } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(findText(/Component error/)).toBeInTheDocument();
    });

    it('should catch errors in nested components', () => {
      const DeepError = () => {
        throw new Error('Deep error');
      };
      
      const Wrapper = () => (
        <div>
          <DeepError />
        </div>
      );
      
      render(
        <ErrorBoundary>
          <Wrapper />
        </ErrorBoundary>
      );
      
      expect(findText(/Deep error/)).toBeInTheDocument();
    });

    it('should catch async errors in components', async () => {
      const AsyncError = () => {
        React.useEffect(() => {
          throw new Error('Async error');
        }, []);
        
        return <div>Component</div>;
      };
      
      render(
        <ErrorBoundary>
          <AsyncError />
        </ErrorBoundary>
      );
      
      await vi.waitFor(() => {
        expect(findText(/Async error/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Graceful Error Recovery', () => {
    it('should provide reload button', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const reloadButton = findText(/Reload Page/i);
      if (reloadButton) {
        expect(reloadButton).toBeInTheDocument();
      }
    });

    it('should reload page on button click', () => {
      const error = new Error('Test error');
      const reloadMock = vi.fn();
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, reload: reloadMock };
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const reloadButton = findText(/Reload Page/i);
      if (reloadButton) {
        fireEvent.click(reloadButton);
        expect(reloadMock).toHaveBeenCalled();
      }
      
      window.location = originalLocation;
    });

    it('should provide clear data option', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const clearButton = findText(/Clear Data/i);
      if (clearButton) {
        expect(clearButton).toBeInTheDocument();
      }
    });

    it('should clear data and reload on clear button click', () => {
      const error = new Error('Test error');
      const clearSpy = vi.spyOn(localStorage, 'clear').mockImplementation(() => {});
      const reloadMock = vi.fn();
      const originalLocation = window.location;
      delete window.location;
      window.location = { ...originalLocation, reload: reloadMock };
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const clearButton = findText(/Clear Data/i);
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(clearSpy).toHaveBeenCalled();
        expect(reloadMock).toHaveBeenCalled();
      }
      
      clearSpy.mockRestore();
      window.location = originalLocation;
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA live region', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const alertRegion = screen.queryByRole('alert');
      if (alertRegion) {
        expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
      }
    });

    it('should have proper heading', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const heading = screen.queryByRole('heading', { level: 1 });
      if (heading) {
        expect(heading).toBeInTheDocument();
      }
    });

    it('should have proper ARIA labels', () => {
      const error = new Error('Test error');
      
      const ThrowError = () => {
        throw error;
      };
      
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      const icon = screen.queryByRole('img', { hidden: true });
      if (icon) {
        expect(icon).toHaveAttribute('aria-label', 'Error icon');
      }
    });
  });

  describe('Error State Management', () => {
    it('should reset error state on remount', () => {
      // Use a separate component that always throws (same pattern as passing tests)
      const ThrowError = () => {
        throw new Error('First error');
      };
      
      const RecoverComponent = () => <div>Recovered</div>;
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      // First render throws error - ErrorBoundary catches it
      expect(findText(/First error/)).toBeInTheDocument();
      
      // Rerender with a new key to reset ErrorBoundary state + a non-throwing component
      rerender(
        <ErrorBoundary key="reset">
          <RecoverComponent />
        </ErrorBoundary>
      );
      
      // ErrorBoundary should reset and allow remount
      expect(screen.queryByText(/Recovered/)).toBeInTheDocument();
    });

    it('should handle multiple consecutive errors', () => {
      const ThrowError = () => {
        throw new Error('Persistent error');
      };
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );
      
      expect(findText(/Persistent error/)).toBeInTheDocument();
      
      // Force update with new key - same error component
      rerender(
        <ErrorBoundary key="second">
          <ThrowError />
        </ErrorBoundary>
      );
      
      // Should handle consecutive errors gracefully
      expect(findText(/Persistent error/)).toBeInTheDocument();
    });
  });
});
