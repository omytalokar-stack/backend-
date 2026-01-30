import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error Boundary caught:', error);
    console.error('📋 Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!) || (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <h2>⚠️ Something went wrong</h2>
            <p style={{ fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '200px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
              {this.state.error?.message}
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#FFB7C5', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🔄 Reload Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
