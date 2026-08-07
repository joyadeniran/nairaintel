import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions so a single bad component (or a malformed
 * record from Firestore) degrades to a recoverable screen instead of
 * unmounting the whole tree and leaving a blank page.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1a] p-6">
        <div className="max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <p className="text-xs font-display font-bold tracking-widest uppercase text-brand-green mb-3">
            NairaIntel
          </p>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-3">
            Something went wrong
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-sm">
            This screen hit an unexpected error. Your data is safe — reloading usually
            clears it.
          </p>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 mb-6 break-words">
            {error.message || String(error)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-display font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 rounded-xl bg-brand-green text-white font-display font-bold text-sm hover:bg-brand-green-light transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
