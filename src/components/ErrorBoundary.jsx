import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    if (!error) {
      return { hasError: false };
    }
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('===== Error Boundary caught an error =====');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error Stack:', errorInfo.componentStack);
    console.error('========================================');

    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (!this.state.hasError || !this.state.error) {
      return this.props.children;
    }

    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        role="alert"
        aria-live="assertive"
        aria-labelledby="error-heading"
      >
        <div
          className="text-center max-w-md w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'color-mix(in srgb, var(--accent-alert) 10%, transparent)' }}
          role="img"
          aria-label="Error icon"
        >
          <span className="text-4xl">⚠️</span>
        </div>

        <h1
          id="error-heading"
          className="text-2xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {this.state.error?.name || 'Unknown Error'}
        </h1>

        <p
          id="error-message"
          className="text-base mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {this.state.error?.message || 'Something went wrong! We\'ve been notified and logged this for debugging.'}
        </p>

        {this.state.errorInfo && (
          <details className="mt-6">
            <summary
              className="cursor-pointer text-sm font-semibold mb-3"
              style={{ color: 'var(--accent-blue)', cursor: 'pointer' }}
            >
              Show Error Details
            </summary>
            <div className="space-y-3 text-left">
              <div className="mb-2">
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>Error Name:</strong>
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all" style={{ color: 'var(--text-muted)' }}>
                  {this.state.error.name || 'Unknown'}
                </pre>
              </div>
              <div className="mb-2">
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>Error Message:</strong>
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all" style={{ color: 'var(--text-muted)' }}>
                  {this.state.error.message || 'No error message'}
                </pre>
              </div>
              <div className="mb-2">
                <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>Component:</strong>
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all" style={{ color: 'var(--text-muted)' }}>
                  {this.state.errorInfo?.componentStack || 'No stack trace available'}
                </pre>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <button
                ref={el => { this.reloadButtonRef = el }}
                onClick={() => this.handleReload()}
                className="w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff' }}
                aria-label="Reload application"
                title="Reload page"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 mt-3"
                style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                aria-label="Clear all data and reload"
                title="Clear data and reload app"
              >
                Clear Data & Reload
              </button>
            </div>
          </details>
        )}

        <div
          className="text-center mb-6 mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          <p className="text-base">
            <span className="text-lg">👋</span> The application is running correctly.
          </p>
          <p className="text-sm mt-2">
            You can continue using app. The error was caught by our error boundary and logged for debugging.
          </p>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
