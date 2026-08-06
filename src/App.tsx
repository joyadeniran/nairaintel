import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';

function SetupRequired({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-6">
      <div className="max-w-lg w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-xl">
        <p className="text-xs font-semibold tracking-widest uppercase text-emerald-600 mb-3">
          NairaIntel
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Configuration required
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          {message}
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 mb-6">
          <li>Open Vercel → Project → Settings → Environment Variables</li>
          <li>
            Add all <code className="px-1 rounded bg-slate-100 dark:bg-slate-900">VITE_FIREBASE_*</code> values from Firebase Console
          </li>
          <li>Add <code className="px-1 rounded bg-slate-100 dark:bg-slate-900">FIREBASE_SERVICE_ACCOUNT_KEY</code> for the API</li>
          <li>Redeploy the project</li>
        </ol>
        <a
          href="https://github.com/joyadeniran/nairaintel/blob/master/DEPLOY.md"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition"
        >
          Open deploy guide
        </a>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, loading, configError } = useAuth();

  if (configError) {
    return <SetupRequired message={configError} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
