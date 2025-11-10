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
  Typography,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  PostAdd as PostAddIcon,
  Upload as UploadIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { TransactionDialog } from '../components/TransactionDialog';
import { TransactionTable } from '../components/TransactionTable';
import { BudgetCard } from '../components/BudgetCard';
import { TransactionImportDialog } from '../components/TransactionImportDialog';
import { BudgetDialog } from '../components/BudgetDialog';
import { BudgetCardCondensed } from '../components/BudgetCardCondensed';
import { Transaction, Budget } from '../types/transaction';
import { transactionService, budgetService } from '../services/database';
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
  const [budgetsExpanded, setBudgetsExpanded] = useState(false);

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

  const handlePinToggle = async (budgetId: string, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    try {
      // Optimistically update the UI
      setBudgets(prevBudgets =>
        prevBudgets.map(b =>
          b.id === budgetId ? { ...b, pinned: !currentPinned } : b
        )
      );

      // Update in database
      await budgetService.update(budgetId, { pinned: !currentPinned });

      // Refresh from database to ensure sync
      await refreshData();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      // Revert optimistic update on error
      await refreshData();
    }
  };

  // Sort budgets: pinned first, then unpinned
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // Get pinned and unpinned budgets
  const pinnedBudgets = sortedBudgets.filter(b => b.pinned);
  const unpinnedBudgets = sortedBudgets.filter(b => !b.pinned);

  // Budgets to display: pinned always, unpinned only when expanded
  const displayedBudgets = budgetsExpanded ? sortedBudgets : pinnedBudgets;

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
      {/* Budgets Section */}
      {budgets.length > 0 && (
        <Box sx={{ mb: 2, mt: 4 }}>
          <Box
            onClick={() => unpinnedBudgets.length > 0 && setBudgetsExpanded(!budgetsExpanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              cursor: unpinnedBudgets.length > 0 ? 'pointer' : 'default',
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.08)' : 'rgba(20, 149, 156, 0.05)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.2)' : 'rgba(20, 149, 156, 0.15)'}`,
              transition: 'all 0.2s ease',
              '&:hover': unpinnedBudgets.length > 0 ? {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.12)' : 'rgba(20, 149, 156, 0.08)',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.3)' : 'rgba(20, 149, 156, 0.25)',
              } : {},
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#14959c' }}>
              {!budgetsExpanded && pinnedBudgets.length > 0 ? `Pinned Budgets (${pinnedBudgets.length})` : 'Budgets'}
            </Typography>
            {unpinnedBudgets.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                  {budgetsExpanded ? 'Show less' : `Show ${unpinnedBudgets.length} more`}
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    transform: budgetsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s',
                    color: '#14959c',
                  }}
                />
              </Box>
            )}
          </Box>
          {displayedBudgets.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: displayedBudgets.length === 1 ? '1fr' : displayedBudgets.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                },
                gap: 2,
                mt: 2,
                transition: 'grid-template-columns 0.3s ease-in-out',
                '& > *': {
                  transition: 'all 0.3s ease-in-out',
                },
              }}
            >
              {displayedBudgets.map((budget) => {
              const budgetTxns = transactions.filter(t => budget.transactionIds?.includes(t.id));
              const spent = budgetTxns
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
              const cumulativeBudget = calculateCumulativeBudget(budget);
              const totalAvailable = (budget.startingBalance || 0) + cumulativeBudget;
              const remaining = totalAvailable - spent;
              const percentageUsed = totalAvailable > 0 ? (spent / totalAvailable) * 100 : 0;

              return (
                <Box
                  key={budget.id}
                  sx={{
                    animation: 'fadeIn 0.3s ease-in-out',
                    '@keyframes fadeIn': {
                      from: {
                        opacity: 0,
                        transform: 'scale(0.95)',
                      },
                      to: {
                        opacity: 1,
                        transform: 'scale(1)',
                      },
                    },
                  }}
                >
                  <BudgetCardCondensed
                    title={budget.title}
                    period={budget.period}
                    budgetTotal={budget.amount}
                    spent={spent}
                    remaining={remaining}
                    percentageUsed={percentageUsed}
                    transactionCount={budget.transactionIds?.length || 0}
                    pinned={budget.pinned}
                    onPinToggle={(e) => handlePinToggle(budget.id, budget.pinned || false, e)}
                  />
                </Box>
              );
            })}
            </Box>
          )}
        </Box>
      )}

      {/* No Budgets Message */}
      {budgets.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 4,
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

      {/* Search and Action Buttons */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
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