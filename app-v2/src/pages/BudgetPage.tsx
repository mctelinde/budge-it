import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BudgetDialog } from '@/components/BudgetDialog';
import { BudgetCard } from '@/components/BudgetCard';
import { TransactionAllocationDialog } from '@/components/TransactionAllocationDialog';
import {
  budgetService,
  transactionService,
  installmentPlanService,
  recurringChargeService,
} from '@/services/database';
import {
  calculateCumulativeBudget,
  calculateElapsedPeriods,
  calculateInstallmentSpent,
  calculateRecurringChargeTotal,
} from '@shared/utils/budgetCalculations';
import type { Budget, Transaction } from '@shared/types/transaction';

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

  useEffect(() => {
    (async () => {
      try {
        const [loadedBudgets, loadedTransactions] = await Promise.all([
          budgetService.getAll(),
          transactionService.getAll(),
        ]);
        setBudgets(loadedBudgets);
        setTransactions(loadedTransactions as Transaction[]);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshBudgets = async () => {
    const loaded = await budgetService.getAll();
    setBudgets(loaded);
    setAllocatingBudget((prev) => {
      if (!prev) return prev;
      return loaded.find((b) => b.id === prev.id) ?? prev;
    });
  };

  const refreshTransactions = async () => {
    setTransactions((await transactionService.getAll()) as Transaction[]);
  };

  const handleCreateBudget = async (data: Omit<Budget, 'id' | 'createdAt'>) => {
    await budgetService.create(data);
    await refreshBudgets();
  };

  const handleUpdateBudget = async (data: Omit<Budget, 'id' | 'createdAt'>) => {
    if (!editingBudget) return;
    await budgetService.update(editingBudget.id, data);
    await refreshBudgets();
    setEditingBudget(undefined);
  };

  const handleDeleteBudget = async (id: string) => {
    await budgetService.delete(id);
    await refreshBudgets();
    await refreshTransactions();
  };

  const handleManageTransactions = (budget: Budget, showFilterAllocated = false) => {
    setAllocatingBudget(budget);
    setShowAllocatedFilter(showFilterAllocated);
    setAllocationDialogOpen(true);
  };

  const handleSaveAllocation = async (budgetId: string, transactionIds: string[]) => {
    await budgetService.allocateTransactions(budgetId, transactionIds);
    await refreshBudgets();
    await refreshTransactions();
  };

  const handleInstallmentSave = async (txnId: string, num: number, amount: number, startPeriodDate: string) => {
    if (!allocatingBudget) return;
    await installmentPlanService.create({ budgetId: allocatingBudget.id, transactionId: txnId, numInstallments: num, amountPerInstallment: amount, startPeriodDate });
    await refreshBudgets();
  };

  const handleInstallmentRemove = async (planId: string) => {
    await installmentPlanService.remove(planId);
    await refreshBudgets();
  };

  const handleRecurringChargeSave = async (desc: string, amount: number, startPeriodDate: string, endPeriodDate?: string) => {
    if (!allocatingBudget) return;
    await recurringChargeService.create({ budgetId: allocatingBudget.id, description: desc, amount, startPeriodDate, endPeriodDate });
    await refreshBudgets();
  };

  const handleRecurringChargeUpdate = async (chargeId: string, updates: { amount?: number; endPeriodDate?: string | null }) => {
    await recurringChargeService.update(chargeId, updates);
    await refreshBudgets();
  };

  const handleRecurringChargeRemove = async (chargeId: string) => {
    await recurringChargeService.remove(chargeId);
    await refreshBudgets();
  };

  // Drag-to-reorder
  const handleDragStart = (budgetId: string) => setDraggedBudgetId(budgetId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetId: string) => {
    if (!draggedBudgetId || draggedBudgetId === targetId) { setDraggedBudgetId(null); return; }
    try {
      const sorted = [...budgets].sort((a, b) => (a.displayOrder ?? budgets.indexOf(a)) - (b.displayOrder ?? budgets.indexOf(b)));
      const fromIdx = sorted.findIndex((b) => b.id === draggedBudgetId);
      const toIdx = sorted.findIndex((b) => b.id === targetId);
      const reordered = [...sorted];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      const updated = reordered.map((b, i) => ({ ...b, displayOrder: i }));
      setBudgets(updated);
      await Promise.all(updated.map((b) => budgetService.update(b.id, { displayOrder: b.displayOrder })));
    } catch (err) {
      console.error('Failed to reorder:', err);
      await refreshBudgets();
    } finally {
      setDraggedBudgetId(null);
    }
  };

  // Spending calculation per budget
  const getBudgetSpent = (budget: Budget): number => {
    if (!budget.transactionIds?.length) return 0;
    const installmentTxnIds = new Set((budget.installmentPlans ?? []).map((p) => p.transactionId));
    const rcs = budget.recurringCharges ?? [];
    const isMatchedByRC = (t: Transaction) =>
      rcs.some((c) => c.description.toLowerCase() === t.description.toLowerCase() && c.amount === t.amount);
    const direct = transactions.filter(
      (t) => budget.transactionIds?.includes(t.id) && !installmentTxnIds.has(t.id) && !isMatchedByRC(t)
    );
    const expenses = direct.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const credits = direct.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const installmentSpent = (budget.installmentPlans ?? []).reduce(
      (s, p) => s + calculateInstallmentSpent(p, budget.period, budget.rolloverDay), 0
    );
    const recurringTotal = rcs.reduce(
      (s, c) => s + calculateRecurringChargeTotal(c, budget.period, budget.rolloverDay), 0
    );
    return expenses - credits + installmentSpent + recurringTotal;
  };

  const sortedBudgets = [...budgets].sort(
    (a, b) => (a.displayOrder ?? budgets.indexOf(a)) - (b.displayOrder ?? budgets.indexOf(b))
  );

  if (loading) {
    return (
      <div className="flex justify-center mt-16">
        <div className="size-8 rounded-full border-2 border-[#14959c] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-20">
      {budgets.length === 0 ? (
        <div className="p-10 text-center border-2 border-dashed rounded-xl">
          <h3 className="text-base font-semibold text-muted-foreground mb-1">No budgets yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first budget to start tracking your spending.
          </p>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            style={{ borderColor: '#14959c', color: '#14959c' }}
          >
            <Plus className="size-4 mr-1.5" /> Create Budget
          </Button>
        </div>
      ) : (
        <div className="space-y-0">
          {sortedBudgets.map((budget) => {
            const spent = getBudgetSpent(budget);
            const txnCount = budget.transactionIds?.length ?? 0;
            const cumulativeBudget = calculateCumulativeBudget(budget);
            const elapsedPeriods = calculateElapsedPeriods(budget.startDate, budget.period, budget.rolloverDay);
            const allocatedTxns = transactions.filter((t) => budget.transactionIds?.includes(t.id));
            const expensesByCategory = allocatedTxns
              .filter((t) => t.type === 'expense')
              .reduce((acc, t) => { acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc; }, {} as Record<string, number>);
            const topCategories = Object.entries(expensesByCategory)
              .map(([category, amount]) => ({ category, amount, percentage: spent > 0 ? (amount / spent) * 100 : 0 }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);

            return (
              <div
                key={budget.id}
                draggable
                onDragStart={() => handleDragStart(budget.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(budget.id)}
                className="cursor-grab active:cursor-grabbing transition-opacity"
                style={{ opacity: draggedBudgetId === budget.id ? 0.5 : 1 }}
              >
                <BudgetCard
                  title={budget.title}
                  period={budget.period}
                  budgetTotal={budget.amount}
                  spent={spent}
                  topCategories={topCategories}
                  transactionCount={txnCount}
                  startingBalance={budget.startingBalance}
                  startDate={budget.startDate}
                  cumulativeBudget={cumulativeBudget}
                  elapsedPeriods={elapsedPeriods}
                  allocatedTransactions={allocatedTxns}
                  rolloverDay={budget.rolloverDay}
                  installmentPlans={budget.installmentPlans}
                  recurringCharges={budget.recurringCharges}
                  onEdit={() => { setEditingBudget(budget); setDialogOpen(true); }}
                  onDelete={() => handleDeleteBudget(budget.id)}
                  onManageTransactions={() => handleManageTransactions(budget)}
                  onTransactionCountClick={() => handleManageTransactions(budget, true)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={() => { setEditingBudget(undefined); setDialogOpen(true); }}
        aria-label="Add budget"
        className="fixed bottom-6 right-6 h-10 px-4 text-white shadow-lg gap-1.5"
        style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
      >
        <Plus className="size-4" />
        Add Budget
      </Button>

      <BudgetDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingBudget(undefined); }}
        onSave={editingBudget ? handleUpdateBudget : handleCreateBudget}
        budget={editingBudget}
      />

      {allocatingBudget && (
        <TransactionAllocationDialog
          open={allocationDialogOpen}
          onClose={() => { setAllocationDialogOpen(false); setAllocatingBudget(undefined); setShowAllocatedFilter(false); }}
          budget={allocatingBudget}
          allTransactions={transactions}
          onSave={handleSaveAllocation}
          initialFilterAllocated={showAllocatedFilter}
          installmentPlans={allocatingBudget.installmentPlans}
          onInstallmentSave={handleInstallmentSave}
          onInstallmentRemove={handleInstallmentRemove}
          recurringCharges={allocatingBudget.recurringCharges}
          onRecurringChargeSave={(desc, amount, startPeriodDate, endPeriodDate) =>
            handleRecurringChargeSave(desc, amount, startPeriodDate, endPeriodDate)
          }
          onRecurringChargeUpdate={handleRecurringChargeUpdate}
          onRecurringChargeRemove={handleRecurringChargeRemove}
        />
      )}
    </div>
  );
};
