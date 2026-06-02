import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Upload, Plus, ChevronDown, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TransactionDialog } from '@/components/TransactionDialog';
import { TransactionTable } from '@/components/TransactionTable';
import { TransactionImportDialog } from '@/components/TransactionImportDialog';
import { BudgetCardCondensed } from '@/components/BudgetCardCondensed';
import { transactionService, budgetService } from '@/services/database';
import { calculateCumulativeBudget, calculateInstallmentSpent } from '@shared/utils/budgetCalculations';
import type { Transaction, Budget } from '@shared/types/transaction';

export const TransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [budgetsExpanded, setBudgetsExpanded] = useState(false);

  // Initialize filters from URL params (set by Spending page)
  useEffect(() => {
    const cat = searchParams.get('category');
    const month = searchParams.get('month');
    if (cat) setSearchQuery(cat);
    if (month) setMonthFilter(month);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearSpendingFilter = () => {
    setSearchQuery('');
    setMonthFilter(null);
    setSearchParams({});
  };

  useEffect(() => {
    (async () => {
      try {
        const [txns, buds] = await Promise.all([
          transactionService.getAll(),
          budgetService.getAll(),
        ]);
        setTransactions(txns as Transaction[]);
        setBudgets(buds);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshData = async () => {
    const [txns, buds] = await Promise.all([
      transactionService.getAll(),
      budgetService.getAll(),
    ]);
    setTransactions(txns as Transaction[]);
    setBudgets(buds);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.account.toLowerCase().includes(q) ||
      (t.notes?.toLowerCase().includes(q) ?? false);
    const matchesMonth = !monthFilter || t.date.startsWith(monthFilter);
    return matchesSearch && matchesMonth;
  });

  // CRUD handlers
  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    try {
      if (editingTransaction) {
        await transactionService.update(editingTransaction.id, data);
      } else {
        await transactionService.create({
          date: data.date || new Date().toISOString().split('T')[0],
          description: data.description || '',
          amount: data.amount || 0,
          type: data.type || 'expense',
          category: data.category || '',
          account: data.account || '',
          notes: data.notes,
        });
      }
      await refreshData();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      await refreshData();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleImportTransactions = async (imported: Transaction[]) => {
    await transactionService.bulkCreate(imported);
    await refreshData();
  };

  const handleEditTransaction = (t: Transaction) => {
    setEditingTransaction(t);
    setDialogOpen(true);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setDialogOpen(true);
  };

  // Budget section
  const sortedBudgets = [...budgets].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  const pinnedBudgets = sortedBudgets.filter((b) => b.pinned);
  const unpinnedBudgets = sortedBudgets.filter((b) => !b.pinned);
  const displayedBudgets = budgetsExpanded ? sortedBudgets : pinnedBudgets;

  const getBudgetSpentSimple = (budget: Budget) => {
    if (!budget.transactionIds?.length) return { spent: 0, remaining: 0, pct: 0 };
    const installmentIds = new Set((budget.installmentPlans ?? []).map((p) => p.transactionId));
    const txns = transactions.filter((t) => budget.transactionIds?.includes(t.id) && !installmentIds.has(t.id));
    const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const credits = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const installmentSpent = (budget.installmentPlans ?? []).reduce(
      (s, p) => s + calculateInstallmentSpent(p, budget.period, budget.rolloverDay),
      0
    );
    const spent = expenses - credits + installmentSpent;
    const cumulative = calculateCumulativeBudget(budget);
    const total = (budget.startingBalance ?? 0) + cumulative;
    return { spent, remaining: total - spent, pct: total > 0 ? (spent / total) * 100 : 0 };
  };

  const hasActiveFilter = !!(searchParams.get('category') || searchParams.get('month'));

  if (loading) {
    return (
      <div className="flex justify-center mt-16">
        <div className="size-8 rounded-full border-2 border-[#14959c] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pinned Budgets section */}
      {budgets.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[#14959c] border border-[#14959c]/20 bg-[#14959c]/5 hover:bg-[#14959c]/8 transition-colors"
            onClick={() => unpinnedBudgets.length > 0 && setBudgetsExpanded((x) => !x)}
          >
            <span>
              {!budgetsExpanded && pinnedBudgets.length > 0
                ? `Pinned Budgets (${pinnedBudgets.length})`
                : 'Budgets'}
            </span>
            {unpinnedBudgets.length > 0 && (
              <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                {budgetsExpanded ? 'Show less' : `Show ${unpinnedBudgets.length} more`}
                <ChevronDown
                  className="size-4 transition-transform"
                  style={{ transform: budgetsExpanded ? 'rotate(180deg)' : 'rotate(0)' }}
                />
              </span>
            )}
          </button>

          {displayedBudgets.length > 0 && (
            <div
              className="grid gap-3 mt-3"
              style={{
                gridTemplateColumns:
                  displayedBudgets.length === 1
                    ? '1fr'
                    : displayedBudgets.length === 2
                    ? 'repeat(2,1fr)'
                    : 'repeat(auto-fill,minmax(220px,1fr))',
              }}
            >
              {displayedBudgets.map((budget) => {
                const { spent, remaining, pct } = getBudgetSpentSimple(budget);
                return (
                  <BudgetCardCondensed
                    key={budget.id}
                    title={budget.title}
                    period={budget.period}
                    budgetTotal={budget.amount}
                    spent={spent}
                    remaining={remaining}
                    percentageUsed={pct}
                    transactionCount={budget.transactionIds?.length ?? 0}
                    pinned={budget.pinned}
                    onPinToggle={async (e) => {
                      e.stopPropagation();
                      await budgetService.update(budget.id, { pinned: !budget.pinned });
                      await refreshData();
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active filter chip */}
      {hasActiveFilter && (
        <div>
          <Badge
            variant="outline"
            className="gap-1.5 text-[#14959c] border-[#14959c]/40 bg-[#14959c]/5 cursor-pointer"
            onClick={clearSpendingFilter}
          >
            <Filter className="size-3" />
            {[
              searchParams.get('category') ? `Category: ${searchParams.get('category')}` : null,
              searchParams.get('month') ? `Month: ${searchParams.get('month')}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
            <X className="size-3" />
          </Badge>
        </div>
      )}

      {/* Search + action toolbar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search transactions…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          title="Import CSV"
          onClick={() => setImportDialogOpen(true)}
          style={{ borderColor: '#14959c', color: '#14959c' }}
        >
          <Upload className="size-4" />
        </Button>
        <Button
          size="icon"
          title="New transaction"
          onClick={handleAddTransaction}
          style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)', color: '#fff' }}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {/* Table */}
      <TransactionTable
        transactions={filteredTransactions}
        onEditTransaction={handleEditTransaction}
      />

      <TransactionDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingTransaction(undefined); }}
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
    </div>
  );
};
