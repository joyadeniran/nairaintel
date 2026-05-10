import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import { Dashboard } from './pages/Dashboard';

function MainApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-naira-green/20 border-t-naira-green rounded-full animate-spin" />
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
