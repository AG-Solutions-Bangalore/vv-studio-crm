import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <p className="text-xs font-semibold text-slate-500">Connecting to EMWA server…</p>
      </div>
    </div>
  );
}

function MaintenanceScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 mb-2">Server Unreachable</h1>
        <p className="text-xs text-slate-500 mb-6">
          Unable to connect to the EMWA server. Please check your network connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function AppShell() {
  const { appStatus } = useAppContext();

  if (appStatus === 'loading') return <LoadingScreen />;
  if (appStatus === 'error') return <MaintenanceScreen />;

  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
