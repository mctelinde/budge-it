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
import { calculateCumulativeBudget, calculateElapsedPeriods, calculateInstallmentSpent, calculateRecurringChargeTotal } from '../utils/budgetCalculations';
import { budgetService, transactionService, installmentPlanService, recurringChargeService } from '../services/database';

export const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false);
  const [allocatingBudget, setAllocatingBudget] = useState<Budget | undefined>(undefined);
  const [showAllocatedFilter, setShowAllocatedFilter] = useState(false);
  const [draggedBudgetId, setDraggedBudgetId] = useState<string | null>(null);

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

  // Refresh budgets from database, keeping allocatingBudget in sync if dialog is open
  const refreshBudgets = async () => {
    const loadedBudgets = await budgetService.getAll();
    setBudgets(loadedBudgets);
    setAllocatingBudget((prev) => {
      if (!prev) return prev;
      return loadedBudgets.find((b) => b.id === prev.id) ?? prev;
    });
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

  // Calculate net spent for each budget: expenses minus credits, with installment plans
  // spreading a transaction's cost across multiple rollover periods, and recurring charges
  // replacing matched transactions with period-based counts.
  const getBudgetSpent = (budget: Budget): number => {
    if (!budget.transactionIds || budget.transactionIds.length === 0) {
      return 0;
    }

    // Transactions on installment plans are excluded from direct counting
    const installmentTxnIds = new Set(
      (budget.installmentPlans || []).map((p) => p.transactionId)
    );

    const recurringCharges = budget.recurringCharges || [];

    const isMatchedByRecurringCharge = (t: Transaction): boolean =>
      recurringCharges.some(
        (c) =>
          c.description.toLowerCase() === t.description.toLowerCase() &&
          c.amount === t.amount
      );

    const directTransactions = transactions.filter(
      (t) =>
        budget.transactionIds?.includes(t.id) &&
        !installmentTxnIds.has(t.id) &&
        !isMatchedByRecurringCharge(t)
    );

    const expenses = directTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const credits = directTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const installmentSpent = (budget.installmentPlans || []).reduce(
      (sum, plan) => sum + calculateInstallmentSpent(plan, budget.period, budget.rolloverDay),
      0
    );

    const recurringTotal = recurringCharges.reduce(
      (sum, charge) => sum + calculateRecurringChargeTotal(charge, budget.period, budget.rolloverDay),
      0
    );

    return expenses - credits + installmentSpent + recurringTotal;
  };

  const handleInstallmentSave = async (
    transactionId: string,
    numInstallments: number,
    amountPerInstallment: number,
    startPeriodDate: string
  ) => {
    if (!allocatingBudget) return;
    try {
      await installmentPlanService.create({
        budgetId: allocatingBudget.id,
        transactionId,
        numInstallments,
        amountPerInstallment,
        startPeriodDate,
      });
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to save installment plan:', error);
    }
  };

  const handleInstallmentRemove = async (planId: string) => {
    try {
      await installmentPlanService.remove(planId);
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to remove installment plan:', error);
    }
  };

  const handleRecurringChargeSave = async (
    budgetId: string,
    description: string,
    amount: number,
    startPeriodDate: string,
    endPeriodDate?: string
  ) => {
    try {
      await recurringChargeService.create({ budgetId, description, amount, startPeriodDate, endPeriodDate });
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to create recurring charge:', error);
    }
  };

  const handleRecurringChargeUpdate = async (
    chargeId: string,
    updates: { amount?: number; endPeriodDate?: string | null }
  ) => {
    try {
      await recurringChargeService.update(chargeId, updates);
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to update recurring charge:', error);
    }
  };

  const handleRecurringChargeRemove = async (chargeId: string) => {
    try {
      await recurringChargeService.remove(chargeId);
      await refreshBudgets();
    } catch (error) {
      console.error('Failed to remove recurring charge:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (budgetId: string) => {
    setDraggedBudgetId(budgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetBudgetId: string) => {
    if (!draggedBudgetId || draggedBudgetId === targetBudgetId) {
      setDraggedBudgetId(null);
      return;
    }

    try {
      // Get current order - initialize display order based on current array position if not set
      const sortedBudgets = [...budgets].sort((a, b) => {
        const orderA = a.displayOrder ?? budgets.indexOf(a);
        const orderB = b.displayOrder ?? budgets.indexOf(b);
        return orderA - orderB;
      });

      const draggedIndex = sortedBudgets.findIndex(b => b.id === draggedBudgetId);
      const targetIndex = sortedBudgets.findIndex(b => b.id === targetBudgetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder array
      const reorderedBudgets = [...sortedBudgets];
      const [draggedBudget] = reorderedBudgets.splice(draggedIndex, 1);
      reorderedBudgets.splice(targetIndex, 0, draggedBudget);

      // Update display order for all budgets with new values
      const updatedBudgets = reorderedBudgets.map((budget, index) => ({
        ...budget,
        displayOrder: index
      }));

      // Optimistically update UI
      setBudgets(updatedBudgets);

      // Update in database
      const updatePromises = updatedBudgets.map((budget) =>
        budgetService.update(budget.id, { displayOrder: budget.displayOrder })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Failed to reorder budgets:', error);
      // Refresh from database on error
      await refreshBudgets();
    } finally {
      setDraggedBudgetId(null);
    }
  };

  // Sort budgets by display order (use array index as fallback)
  const sortedBudgets = [...budgets].sort((a, b) => {
    const orderA = a.displayOrder ?? budgets.indexOf(a);
    const orderB = b.displayOrder ?? budgets.indexOf(b);
    return orderA - orderB;
  });

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
          {sortedBudgets.map((budget) => {
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
              <Box
                key={budget.id}
                draggable
                onDragStart={() => handleDragStart(budget.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(budget.id)}
                sx={{
                  cursor: 'grab',
                  opacity: draggedBudgetId === budget.id ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                  '&:active': {
                    cursor: 'grabbing',
                  },
                }}
              >
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
                  rolloverDay={budget.rolloverDay}
                  installmentPlans={budget.installmentPlans}
                  recurringCharges={budget.recurringCharges}
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
          installmentPlans={allocatingBudget.installmentPlans}
          onInstallmentSave={handleInstallmentSave}
          onInstallmentRemove={handleInstallmentRemove}
          recurringCharges={allocatingBudget.recurringCharges}
          onRecurringChargeSave={(desc, amount, startPeriodDate, endPeriodDate) =>
            handleRecurringChargeSave(allocatingBudget.id, desc, amount, startPeriodDate, endPeriodDate)
          }
          onRecurringChargeUpdate={handleRecurringChargeUpdate}
          onRecurringChargeRemove={handleRecurringChargeRemove}
        />
      )}
    </Box>
  );
};