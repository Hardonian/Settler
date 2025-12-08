/**
 * ErrorBoundary Component
 * Enterprise-grade error boundary with telemetry
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorTelemetry } from '@settler/protocol';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  telemetryProvider?: {
    trackError: (error: ErrorTelemetry) => void;
  };
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });

    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Track error in telemetry
    if (this.props.telemetryProvider) {
      this.props.telemetryProvider.trackError({
        error,
        component: 'ErrorBoundary',
        context: {
          componentStack: errorInfo.componentStack
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo!);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '2rem',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            backgroundColor: '#fff5f5'
          }}
        >
          <h2 style={{ color: '#c53030', marginTop: 0 }}>Something went wrong</h2>
          <p style={{ color: '#742a2a' }}>
            {this.state.error.message || 'An unexpected error occurred'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Error Details
              </summary>
              <pre
                style={{
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#f7f7f7',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}
              >
                {this.state.error.stack}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
