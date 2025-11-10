import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { Layout } from './components/Layout';
import { GlobalStyles } from './components/GlobalStyles';
import { lightTheme, darkTheme } from './themes/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BillsPage } from './pages/BillsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SpendingPage } from './pages/SpendingPage';
import { SettingsPage } from './pages/SettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', String(newMode));
      return newMode;
    });
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <GlobalStyles />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/app/transactions"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <TransactionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/bills"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <BillsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/budget"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <BudgetPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/spending"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <SpendingPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/settings/categories"
            element={
              <ProtectedRoute>
                <Layout toggleTheme={toggleTheme}>
                  <CategoryManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/app" element={<Navigate to="/app/transactions" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
