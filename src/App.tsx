import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Layout } from './components/Layout';
import { GlobalStyles } from './components/GlobalStyles';
import { lightTheme, darkTheme } from './themes/theme';
import { TransactionsPage } from './pages/TransactionsPage';
import { BillsPage } from './pages/BillsPage';
import { BudgetPage } from './pages/BudgetPage';
import { SpendingPage } from './pages/SpendingPage';
import { SettingsPage } from './pages/SettingsPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';

function App() {
  const [isDarkMode, setIsDarkMode] = React.useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <GlobalStyles />
      <BrowserRouter>
        <Layout toggleTheme={toggleTheme}>
          <Routes>
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/spending" element={<SpendingPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/categories" element={<CategoryManagementPage />} />
            <Route path="/" element={<Navigate to="/transactions" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
