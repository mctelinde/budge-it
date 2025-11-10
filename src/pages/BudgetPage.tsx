import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';
import { Budget, Transaction } from '../types/transaction';
import { BudgetDialog } from '../components/BudgetDialog';
import { BudgetCard } from '../components/BudgetCard';
import { TransactionAllocationDialog } from '../components/TransactionAllocationDialog';
import { budgetService, transactionService } from '../services/database';
import { calculateCumulativeBudget, calculateElapsedPeriods } from '../utils/budgetCalculations';

export const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [allocatingBudget, setAllocatingBudget] = useState<Budget | undefined>(undefined);
  const [showAllocatedFilter, setShowAllocatedFilter] = useState(false);

  // Load data from Supabase on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedBudgets, loadedTransactions] = await Promise.all([
          budgetService.getAll(),
          transactionService.getAll(),
        ]);
        setBudgets(loadedBudgets);
        setTransactions(loadedTransactions);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Refresh budgets from database
  const refreshBudgets = async () => {
    const loadedBudgets = await budgetService.getAll();
    setBudgets(loadedBudgets);
  };

  // Refresh transactions from database
  const refreshTransactions = async () => {
    const loadedTransactions = await transactionService.getAll();
    setTransactions(loadedTransactions);
  };

  const handleCreateBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt'>) => {
    try {
      await budgetService.create(budgetData);
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleUpdateBudget = async (budgetData: Omit<Budget, 'id' | 'createdAt'>) => {
    if (editingBudget) {
      try {
        await budgetService.update(editingBudget.id, budgetData);
        await refreshBudgets();
        setEditingBudget(undefined);
      } catch (error) {
        console.error('Failed to update budget:', error);
      }
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await budgetService.delete(id);
      await refreshBudgets();
      await refreshTransactions(); // Refresh to update unlinked transactions
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleEditClick = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBudget(undefined);
  };

  const handleManageTransactions = (budget: Budget, showFilterAllocated: boolean = false) => {
    setAllocatingBudget(budget);
    setShowAllocatedFilter(showFilterAllocated);
    setAllocationDialogOpen(true);
  };

  const handleAllocationDialogClose = () => {
    setAllocationDialogOpen(false);
    setAllocatingBudget(undefined);
    setShowAllocatedFilter(false);
  };

  const handleSaveAllocation = async (budgetId: string, transactionIds: string[]) => {
    try {
      await budgetService.allocateTransactions(budgetId, transactionIds);
      await refreshBudgets();
      await refreshTransactions();
    } catch (error) {
      console.error('Failed to allocate transactions:', error);
    }
  };

  // Calculate spent amount for each budget based on allocated transactions
  const getBudgetSpent = (budget: Budget): number => {
    if (!budget.transactionIds || budget.transactionIds.length === 0) {
      return 0;
    }
    return transactions
      .filter((t) => budget.transactionIds?.includes(t.id) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#14959c' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 3, pb: 10 }}>
      {budgets.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'transparent',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No budgets yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first budget to start tracking your spending
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderColor: '#14959c',
              color: '#14959c',
              '&:hover': {
                borderColor: '#0d7378',
                backgroundColor: 'rgba(20, 149, 156, 0.08)',
              },
            }}
          >
            Create Budget
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {budgets.map((budget) => {
            const spent = getBudgetSpent(budget);
            const transactionCount = budget.transactionIds?.length || 0;
            const cumulativeBudget = calculateCumulativeBudget(budget);
            const elapsedPeriods = calculateElapsedPeriods(budget.startDate, budget.period, budget.rolloverDay);
            const allocatedTxns = transactions.filter(t => budget.transactionIds?.includes(t.id));

            // Calculate top expense categories
            const expensesByCategory = allocatedTxns
              .filter(t => t.type === 'expense')
              .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
              }, {} as Record<string, number>);

            const topCategories = Object.entries(expensesByCategory)
              .map(([category, amount]) => ({
                category,
                amount,
                percentage: spent > 0 ? (amount / spent) * 100 : 0,
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);

            return (
              <Box key={budget.id}>
                <BudgetCard
                  title={budget.title}
                  period={budget.period}
                  budgetTotal={budget.amount}
                  spent={spent}
                  topCategories={topCategories}
                  transactionCount={transactionCount}
                  startingBalance={budget.startingBalance}
                  startDate={budget.startDate}
                  cumulativeBudget={cumulativeBudget}
                  elapsedPeriods={elapsedPeriods}
                  allocatedTransactions={allocatedTxns}
                  onEdit={() => handleEditClick(budget)}
                  onDelete={() => handleDeleteBudget(budget.id)}
                  onManageTransactions={() => handleManageTransactions(budget)}
                  onTransactionCountClick={() => handleManageTransactions(budget, true)}
                />
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add budget"
        onClick={() => setDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          backgroundColor: '#14959c',
          '&:hover': {
            backgroundColor: '#0d7378',
          },
        }}
      >
        <AddIcon />
      </Fab>

      <BudgetDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={editingBudget ? handleUpdateBudget : handleCreateBudget}
        budget={editingBudget}
      />

      {allocatingBudget && (
        <TransactionAllocationDialog
          open={allocationDialogOpen}
          onClose={handleAllocationDialogClose}
          budget={allocatingBudget}
          allTransactions={transactions}
          onSave={handleSaveAllocation}
          initialFilterAllocated={showAllocatedFilter}
        />
      )}
    </Box>
  );
};