import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Layout } from './components/Layout';
import { GlobalStyles } from './components/GlobalStyles';
import { lightTheme, darkTheme } from './themes/theme';
import { LandingPage } from './pages/LandingPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { BillsPage } from './pages/BillsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SpendingPage } from './pages/SpendingPage';
import { SettingsPage } from './pages/SettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';

function App() {
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/app/transactions" element={<Layout toggleTheme={toggleTheme}><TransactionsPage /></Layout>} />
          <Route path="/app/bills" element={<Layout toggleTheme={toggleTheme}><BillsPage /></Layout>} />
          <Route path="/app/budget" element={<Layout toggleTheme={toggleTheme}><BudgetPage /></Layout>} />
          <Route path="/app/spending" element={<Layout toggleTheme={toggleTheme}><SpendingPage /></Layout>} />
          <Route path="/app/settings" element={<Layout toggleTheme={toggleTheme}><SettingsPage /></Layout>} />
          <Route path="/app/settings/categories" element={<Layout toggleTheme={toggleTheme}><CategoryManagementPage /></Layout>} />
          <Route path="/app" element={<Navigate to="/app/transactions" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
