import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  useTheme,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  PostAdd as PostAddIcon,
  Upload as UploadIcon,
  AddCircleOutline as AddCircleOutlineIcon
} from '@mui/icons-material';
import { TransactionDialog } from '../components/TransactionDialog';
import { TransactionTable } from '../components/TransactionTable';
import { BudgetCard } from '../components/BudgetCard';
import { TransactionImportDialog } from '../components/TransactionImportDialog';
import { BudgetDialog } from '../components/BudgetDialog';
import { Transaction, Budget } from '../types/transaction';
import { transactionService, budgetService } from '../db/services';
import { calculateCumulativeBudget, calculateElapsedPeriods } from '../utils/budgetCalculations';

export const TransactionsPage: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  // Load transactions and budgets from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedTransactions, loadedBudgets] = await Promise.all([
          transactionService.getAll(),
          budgetService.getAll(),
        ]);
        setTransactions(loadedTransactions);
        setBudgets(loadedBudgets);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Refresh data from database
  const refreshData = async () => {
    const [loadedTransactions, loadedBudgets] = await Promise.all([
      transactionService.getAll(),
      budgetService.getAll(),
    ]);
    setTransactions(loadedTransactions);
    setBudgets(loadedBudgets);
  };

  // Get the first budget (could be enhanced to let user select which budget)
  const activeBudget = budgets.length > 0 ? budgets[0] : null;

  // Calculate budget metrics from the active budget
  const getBudgetTransactions = () => {
    if (!activeBudget || !activeBudget.transactionIds) return [];
    return transactions.filter(t => activeBudget.transactionIds?.includes(t.id));
  };

  const budgetTransactions = getBudgetTransactions();
  const totalExpenses = budgetTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = budgetTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate top expense categories from budget transactions
  const expensesByCategory = budgetTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.category.toLowerCase().includes(searchLower) ||
      transaction.account.toLowerCase().includes(searchLower) ||
      (transaction.notes?.toLowerCase().includes(searchLower))
    );
  });

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSaveTransaction = async (transactionData: Partial<Transaction>) => {
    try {
      if (editingTransaction) {
        // Update existing transaction
        await transactionService.update(editingTransaction.id, transactionData);
      } else {
        // Add new transaction
        await transactionService.create({
          date: transactionData.date || new Date().toISOString().split('T')[0],
          description: transactionData.description || '',
          amount: transactionData.amount || 0,
          type: transactionData.type || 'expense',
          category: transactionData.category || '',
          account: transactionData.account || '',
          notes: transactionData.notes,
        });
      }
      await refreshData();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleImportTransactions = async (importedTransactions: Transaction[]) => {
    try {
      await transactionService.bulkCreate(importedTransactions);
      await refreshData();
    } catch (error) {
      console.error('Failed to import transactions:', error);
      throw error;
    }
  };

  const handleSaveBudget = async (budgetData: Partial<Budget>) => {
    try {
      await budgetService.create({
        title: budgetData.title || '',
        amount: budgetData.amount || 0,
        spent: 0,
        period: budgetData.period || 'monthly',
        categories: budgetData.categories || [],
        transactionIds: [],
      });
      await refreshData();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#14959c' }} />
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        backgroundColor: 'transparent',
      }}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: '56px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              transition: theme.transitions.create(['background-color', 'box-shadow']),
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              },
              '&.Mui-focused': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          color="primary"
          onClick={() => setImportDialogOpen(true)}
          sx={{
            minWidth: '56px',
            width: '56px',
            height: '56px',
            p: 0,
            borderRadius: 2,
            borderColor: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
            color: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
            transition: theme.transitions.create(['background', 'transform', 'border-color'], {
              duration: theme.transitions.duration.short,
            }),
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#1fb5bc' : '#14959c',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 149, 156, 0.08)'
                : 'rgba(13, 115, 119, 0.04)',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            }
          }}
        >
          <UploadIcon sx={{
            fontSize: 28,
            color: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
          }} />
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddTransaction}
          sx={{
            minWidth: '56px',
            width: '56px',
            height: '56px',
            p: 0,
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
              : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)',
            transition: theme.transitions.create(['background', 'transform', 'box-shadow'], {
              duration: theme.transitions.duration.short,
            }),
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0a5c5f 0%, #107a80 100%)'
                : 'linear-gradient(135deg, #107a80 0%, #1aa3a9 100%)',
              transform: 'scale(1.05)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 16px rgba(13, 115, 119, 0.4)'
                : '0 8px 16px rgba(20, 149, 156, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            }
          }}
        >
          <PostAddIcon sx={{
            fontSize: 28,
            color: '#ffffff',
          }} />
        </Button>
      </Stack>

      {activeBudget ? (
        <BudgetCard
          budgetTotal={activeBudget.amount}
          spent={totalExpenses}
          topCategories={topCategories}
          startingBalance={activeBudget.startingBalance}
          startDate={activeBudget.startDate}
          cumulativeBudget={calculateCumulativeBudget(activeBudget)}
          elapsedPeriods={calculateElapsedPeriods(activeBudget.startDate, activeBudget.period, activeBudget.rolloverDay)}
        />
      ) : (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            textAlign: 'center',
          }}
        >
          <Box sx={{ mb: 2 }}>
            <AddCircleOutlineIcon
              sx={{
                fontSize: 60,
                color: theme.palette.text.secondary,
                opacity: 0.5,
              }}
            />
          </Box>
          <Box sx={{ mb: 2, color: theme.palette.text.secondary }}>
            No budget configured. Create a budget to track your spending.
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setBudgetDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
                : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)',
            }}
          >
            Create Budget
          </Button>
        </Paper>
      )}

      <TransactionTable
        transactions={filteredTransactions}
        onEditTransaction={handleEditTransaction}
      />

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        transaction={editingTransaction}
        isEditing={!!editingTransaction}
      />

      <TransactionImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleImportTransactions}
        existingTransactions={transactions}
      />

      <BudgetDialog
        open={budgetDialogOpen}
        onClose={() => setBudgetDialogOpen(false)}
        onSave={handleSaveBudget}
      />
    </Paper>
  );
};