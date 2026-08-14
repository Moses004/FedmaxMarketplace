import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check, ShieldAlert } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught application error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
  };

  private handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  private copyErrorToClipboard = () => {
    const errorText = `Error: ${this.state.error?.message || 'Unknown error'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shadow-inner relative group">
                <AlertTriangle className="w-8 h-8 transition-transform group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                  <ShieldAlert className="w-2.5 h-2.5 text-white" />
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Something unexpected happened
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                We encountered a temporary interface issue. Click <strong className="text-slate-800 dark:text-slate-200 font-bold">Retry</strong> to recover safely without losing your session.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Primary Retry Button */}
              <button
                type="button"
                id="error-boundary-retry-btn"
                onClick={this.handleRetry}
                className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Application</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload Page</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Go to Home</span>
                </button>
              </div>
            </div>

            {/* Technical Error Details Drawer */}
            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                <span>Technical details & logs</span>
                {this.state.showDetails ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 bg-slate-900 text-slate-100 rounded-2xl p-4 text-left border border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-rose-400">
                      Exception Message
                    </span>
                    <button
                      type="button"
                      onClick={this.copyErrorToClipboard}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      {this.state.copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Log</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] font-mono text-rose-300 break-words font-medium">
                    {this.state.error?.message || 'No explicit error message provided.'}
                  </p>

                  {this.state.error?.stack && (
                    <div className="max-h-36 overflow-y-auto custom-scrollbar text-[10px] font-mono text-slate-400 space-y-1 whitespace-pre-wrap leading-relaxed pt-1">
                      {this.state.error.stack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

