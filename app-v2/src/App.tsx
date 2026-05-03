import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Layout } from '@/components/Layout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/pages/AuthPage';
import { ForecastsPage } from '@/pages/ForecastsPage';
import { SpendingPage } from '@/pages/SpendingPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { BudgetPage } from '@/pages/BudgetPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CategoryManagementPage } from '@/pages/CategoryManagementPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  };

  const protectedPage = (page: React.ReactNode) => (
    <ProtectedRoute>
      <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
        {page}
      </Layout>
    </ProtectedRoute>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app/budget" element={protectedPage(<BudgetPage />)} />
        <Route path="/app/forecasts" element={protectedPage(<ForecastsPage />)} />
        <Route path="/app/spending" element={protectedPage(<SpendingPage />)} />
        <Route path="/app/transactions" element={protectedPage(<TransactionsPage />)} />
        <Route path="/app/settings" element={protectedPage(<SettingsPage />)} />
        <Route path="/app/settings/categories" element={protectedPage(<CategoryManagementPage />)} />
        <Route path="/app" element={<Navigate to="/app/budget" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;

