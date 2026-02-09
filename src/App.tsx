import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthForm } from './components/AuthForm';
import { DashboardLayout } from './components/DashboardLayout';
import { WPCredentials } from './types';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  const [creds, setCreds] = useState<WPCredentials | null>(null);

  useEffect(() => {
    // Check local storage for persistent auth (simple implementation)
    const stored = localStorage.getItem('rf_creds');
    if (stored) {
      try {
        setCreds(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem('rf_creds');
      }
    }
  }, []);

  const handleLogin = (newCreds: WPCredentials) => {
    setCreds(newCreds);
    localStorage.setItem('rf_creds', JSON.stringify(newCreds));
  };

  const handleLogout = () => {
    setCreds(null);
    localStorage.removeItem('rf_creds');
    queryClient.clear();
  };

  return (
    <QueryClientProvider client={queryClient}>
      {creds ? (
        <DashboardLayout creds={creds} onLogout={handleLogout} />
      ) : (
        <AuthForm onLogin={handleLogin} />
      )}
    </QueryClientProvider>
  );
};

export default App;