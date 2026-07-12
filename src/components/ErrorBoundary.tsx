import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("KushCloud Error:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-center">
          <div className="text-6xl" aria-hidden="true">&#x1F33F;</div>
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-400">
            The game encountered an unexpected error. Your progress is saved locally and should be safe.
          </p>
          <p className="break-all font-mono text-xs text-slate-600">
            {this.state.error?.message}
          </p>
          <button
            onClick={this.handleRetry}
            className="rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 px-6 py-3 text-sm font-bold uppercase text-white shadow-lg"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-slate-400 underline"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
