import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isChunkLoadError = this.state.error?.message?.includes('Failed to fetch dynamically imported module') || 
                               this.state.error?.message?.includes('Importing a module script failed');

      if (isChunkLoadError) {
        return (
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 flex flex-col items-start gap-4">
            <div>
              <h2 className="text-lg font-bold">Update Available</h2>
              <p className="text-sm">A new version of the application is available.</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        );
      }

      return this.props.fallback || (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-900 flex flex-col items-start gap-4">
          <div>
            <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
            <p className="text-sm font-mono whitespace-pre-wrap">{this.state.error?.message}</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-md shadow-sm hover:bg-red-50 transition-colors"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
