import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { decodeHtmlEntities } from '@shared/utils/textUtils';
import type { Transaction, Budget, InstallmentPlan, RecurringCharge } from '@shared/types/transaction';

interface TransactionAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  budget: Budget;
  allTransactions: Transaction[];
  onSave: (budgetId: string, transactionIds: string[]) => void;
  initialFilterAllocated?: boolean;
  installmentPlans?: InstallmentPlan[];
  onInstallmentSave?: (transactionId: string, numInstallments: number, amountPerInstallment: number, startPeriodDate: string) => void;
  onInstallmentRemove?: (planId: string) => void;
  recurringCharges?: RecurringCharge[];
  onRecurringChargeSave?: (description: string, amount: number, startPeriodDate: string, endPeriodDate?: string) => void;
  onRecurringChargeUpdate?: (chargeId: string, updates: { amount?: number; endPeriodDate?: string | null }) => void;
  onRecurringChargeRemove?: (chargeId: string) => void;
}

export const TransactionAllocationDialog: React.FC<TransactionAllocationDialogProps> = ({
  open,
  onClose,
  budget,
  allTransactions,
  onSave,
  initialFilterAllocated = false,
  installmentPlans = [],
  onInstallmentSave,
  onInstallmentRemove,
  recurringCharges = [],
  onRecurringChargeSave,
  onRecurringChargeUpdate,
  onRecurringChargeRemove,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(budget.transactionIds ?? []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAllocated, setShowOnlyAllocated] = useState(initialFilterAllocated);

  const [expandedInstallmentTxnId, setExpandedInstallmentTxnId] = useState<string | null>(null);
  const [installmentNumPayments, setInstallmentNumPayments] = useState(6);
  const [installmentAmountStr, setInstallmentAmountStr] = useState('');

  const [expandedRecurringTxnId, setExpandedRecurringTxnId] = useState<string | null>(null);
  const [recurringAmountStr, setRecurringAmountStr] = useState('');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  React.useEffect(() => {
    if (open) {
      setSelectedIds(budget.transactionIds ?? []);
      setShowOnlyAllocated(initialFilterAllocated);
      setExpandedInstallmentTxnId(null);
      setExpandedRecurringTxnId(null);
      setSearchQuery('');
    }
  }, [open, initialFilterAllocated, budget.transactionIds]);

  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;
    if (showOnlyAllocated) filtered = filtered.filter((t) => selectedIds.includes(t.id));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }
    return filtered;
  }, [allTransactions, searchQuery, showOnlyAllocated, selectedIds]);

  const selectedExpenses = useMemo(
    () => allTransactions.filter((t) => selectedIds.includes(t.id) && t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [allTransactions, selectedIds]
  );
  const selectedCredits = useMemo(
    () => allTransactions.filter((t) => selectedIds.includes(t.id) && t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [allTransactions, selectedIds]
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === filteredTransactions.length ? [] : filteredTransactions.map((t) => t.id)
    );
  };

  const handleSave = () => { onSave(budget.id, selectedIds); onClose(); };

  const handleClose = () => {
    setSelectedIds(budget.transactionIds ?? []);
    setSearchQuery('');
    setShowOnlyAllocated(false);
    setExpandedInstallmentTxnId(null);
    setExpandedRecurringTxnId(null);
    onClose();
  };

  const computeStartPeriodDate = (transactionDate: string): string => {
    const rolloverDay = budget.rolloverDay ?? 1;
    const [y, m, d] = transactionDate.split('-').map(Number);
    const txnDate = new Date(y, m - 1, d);
    const thisMonthRollover = new Date(txnDate.getFullYear(), txnDate.getMonth(), rolloverDay);
    if (txnDate >= thisMonthRollover) {
      return `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}-${String(rolloverDay).padStart(2, '0')}`;
    }
    const prev = new Date(txnDate.getFullYear(), txnDate.getMonth() - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(rolloverDay).padStart(2, '0')}`;
  };

  const getExistingPlan = (txnId: string) => installmentPlans.find((p) => p.transactionId === txnId);
  const getExistingRecurringCharge = (t: Transaction) =>
    recurringCharges.find((c) => c.description.toLowerCase() === t.description.toLowerCase() && c.amount === t.amount);

  const handleToggleInstallmentPanel = (t: Transaction) => {
    if (expandedInstallmentTxnId === t.id) { setExpandedInstallmentTxnId(null); return; }
    const existing = getExistingPlan(t.id);
    setInstallmentNumPayments(existing?.numInstallments ?? 6);
    setInstallmentAmountStr(existing ? existing.amountPerInstallment.toFixed(2) : (t.amount / 6).toFixed(2));
    setExpandedInstallmentTxnId(t.id);
  };

  const handleInstallmentNumChange = (value: number, t: Transaction) => {
    const clamped = Math.max(2, value || 2);
    setInstallmentNumPayments(clamped);
    setInstallmentAmountStr((t.amount / clamped).toFixed(2));
  };

  const handleInstallmentSave = (t: Transaction) => {
    const amount = parseFloat(installmentAmountStr);
    if (!amount || amount <= 0 || installmentNumPayments < 2) return;
    onInstallmentSave?.(t.id, installmentNumPayments, amount, computeStartPeriodDate(t.date));
    setExpandedInstallmentTxnId(null);
  };

  const handleInstallmentRemove = (t: Transaction) => {
    const plan = getExistingPlan(t.id);
    if (plan) onInstallmentRemove?.(plan.id);
    setExpandedInstallmentTxnId(null);
  };

  const handleToggleRecurringPanel = (t: Transaction) => {
    if (expandedRecurringTxnId === t.id) { setExpandedRecurringTxnId(null); return; }
    setExpandedInstallmentTxnId(null);
    const existing = getExistingRecurringCharge(t);
    setRecurringAmountStr(existing ? existing.amount.toFixed(2) : t.amount.toFixed(2));
    setRecurringEndDate(existing?.endPeriodDate ?? '');
    setExpandedRecurringTxnId(t.id);
  };

  const handleRecurringChargeSave = (t: Transaction) => {
    const amount = parseFloat(recurringAmountStr);
    if (!amount || amount <= 0) return;
    const existing = getExistingRecurringCharge(t);
    if (existing) {
      onRecurringChargeUpdate?.(existing.id, { amount, endPeriodDate: recurringEndDate || null });
    } else {
      onRecurringChargeSave?.(t.description, amount, computeStartPeriodDate(t.date), recurringEndDate || undefined);
    }
    setExpandedRecurringTxnId(null);
  };

  const handleRecurringChargeRemove = (t: Transaction) => {
    const charge = getExistingRecurringCharge(t);
    if (charge) onRecurringChargeRemove?.(charge.id);
    setExpandedRecurringTxnId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="!max-w-2xl max-h-[90vh]"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <DialogHeader>
          <DialogTitle>Allocate Transactions to Budget</DialogTitle>
          <p className="text-sm text-muted-foreground">{budget.title}</p>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter + summary */}
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <ToggleGroup
            type="single"
            value={showOnlyAllocated ? 'allocated' : 'all'}
            onValueChange={(v) => v && setShowOnlyAllocated(v === 'allocated')}
          >
            <ToggleGroupItem value="all" className="text-xs">All Transactions</ToggleGroupItem>
            <ToggleGroupItem value="allocated" className="text-xs">Allocated Only</ToggleGroupItem>
          </ToggleGroup>

          <div className="flex gap-1.5 ml-auto items-center flex-wrap">
            <Badge style={{ background: '#14959c' }} className="text-white">
              {selectedIds.length} selected
            </Badge>
            <Badge variant="outline">
              Net: ${(selectedExpenses - selectedCredits).toFixed(2)}
            </Badge>
            {selectedCredits > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Credits: -${selectedCredits.toFixed(2)}
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="text-xs text-[#14959c]" onClick={handleSelectAll}>
              {selectedIds.length === filteredTransactions.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Transaction list */}
        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No transactions match your search.' : 'No transactions available.'}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-4 px-4">
            <div className="space-y-0.5 pr-1">
              {filteredTransactions.map((t) => {
                const existingPlan = getExistingPlan(t.id);
                const existingRecurring = getExistingRecurringCharge(t);
                const isAllocated = selectedIds.includes(t.id);
                const isInstExpanded = expandedInstallmentTxnId === t.id;
                const isRecExpanded = expandedRecurringTxnId === t.id;

                return (
                  <React.Fragment key={t.id}>
                    <div className="flex items-start gap-2 py-2 px-1 rounded hover:bg-muted/40 transition-colors">
                      <Checkbox
                        id={`txn-${t.id}`}
                        checked={isAllocated}
                        onCheckedChange={() => handleToggle(t.id)}
                        className="mt-0.5 shrink-0"
                        style={{ accentColor: '#14959c' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <label htmlFor={`txn-${t.id}`} className="text-sm font-medium cursor-pointer truncate">
                            {decodeHtmlEntities(t.description)}
                          </label>
                          <span className={`text-sm font-semibold shrink-0 ${t.type === 'income' ? 'text-green-600' : 'text-orange-600'}`}>
                            {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-0.5 items-center flex-wrap">
                          <Badge variant="outline" className="text-xs py-0 px-1.5">{t.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(t.date + 'T00:00:00').toLocaleDateString()}
                          </span>
                          {existingPlan && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 text-sky-600 border-sky-400">
                              {existingPlan.numInstallments}×${existingPlan.amountPerInstallment.toFixed(2)}/mo
                            </Badge>
                          )}
                          {existingRecurring && (
                            <Badge variant="outline" className="text-xs py-0 px-1.5 text-green-600 border-green-500">
                              {existingRecurring.endPeriodDate
                                ? `$${existingRecurring.amount.toFixed(2)}/mo until ${new Date(existingRecurring.endPeriodDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                : `$${existingRecurring.amount.toFixed(2)}/mo ∞`}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Action buttons for allocated transactions */}
                      {isAllocated && (onInstallmentSave || onRecurringChargeSave) && (
                        <div className="flex gap-1 shrink-0">
                          {onInstallmentSave && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-7 ${existingPlan ? 'text-sky-600' : 'text-muted-foreground'}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleInstallmentPanel(t); }}
                              title={existingPlan ? 'Edit payment schedule' : 'Set up payment schedule'}
                            >
                              <Calendar className="size-3.5" />
                            </Button>
                          )}
                          {onRecurringChargeSave && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`size-7 ${existingRecurring ? 'text-green-600' : 'text-muted-foreground'}`}
                              onClick={(e) => { e.stopPropagation(); handleToggleRecurringPanel(t); }}
                              title={existingRecurring ? 'Edit recurring charge' : 'Set as recurring monthly charge'}
                            >
                              <RefreshCw className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline installment form */}
                    {isInstExpanded && (
                      <div className="mx-2 mb-2 p-3 rounded-lg border border-sky-400/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-sky-700 dark:text-sky-400">Payment Schedule</span>
                          <Button variant="ghost" size="icon" className="size-6" onClick={() => setExpandedInstallmentTxnId(null)}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <div className="space-y-1">
                            <Label className="text-xs">Number of payments</Label>
                            <Input
                              type="number"
                              min="2"
                              max="120"
                              value={installmentNumPayments}
                              onChange={(e) => handleInstallmentNumChange(Number(e.target.value), t)}
                              className="w-36 h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Amount per payment</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                              <Input
                                value={installmentAmountStr}
                                onChange={(e) => setInstallmentAmountStr(e.target.value)}
                                className="w-36 h-8 text-sm pl-6"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">First payment period</p>
                            <p className="text-sm font-medium">
                              {new Date(computeStartPeriodDate(t.date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        {installmentNumPayments >= 2 && parseFloat(installmentAmountStr) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Total: ${(installmentNumPayments * parseFloat(installmentAmountStr)).toFixed(2)} over {installmentNumPayments} payments
                            {Math.abs(installmentNumPayments * parseFloat(installmentAmountStr) - t.amount) > 0.01 && (
                              <span className="ml-2">(original: ${t.amount.toFixed(2)})</span>
                            )}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-sky-600 hover:bg-sky-700 text-white h-7 text-xs"
                            onClick={() => handleInstallmentSave(t)}
                            disabled={!installmentAmountStr || parseFloat(installmentAmountStr) <= 0 || installmentNumPayments < 2}
                          >
                            Save Schedule
                          </Button>
                          {existingPlan && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive" onClick={() => handleInstallmentRemove(t)}>
                              Remove Schedule
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline recurring charge form */}
                    {isRecExpanded && (
                      <div className="mx-2 mb-2 p-3 rounded-lg border border-green-500/50 bg-green-50/50 dark:bg-green-950/20 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-700 dark:text-green-400">Recurring Monthly Charge</span>
                          <Button variant="ghost" size="icon" className="size-6" onClick={() => setExpandedRecurringTxnId(null)}>
                            <X className="size-3.5" />
                          </Button>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Description (matched)</p>
                            <p className="text-sm font-medium">{t.description}</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Amount per period</Label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                              <Input
                                value={recurringAmountStr}
                                onChange={(e) => setRecurringAmountStr(e.target.value)}
                                className="w-36 h-8 text-sm pl-6"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">End date (optional)</Label>
                            <Input
                              type="month"
                              value={recurringEndDate}
                              onChange={(e) => setRecurringEndDate(e.target.value)}
                              className="w-40 h-8 text-sm"
                            />
                            <p className="text-xs text-muted-foreground">Leave blank for indefinite</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Starts from period</p>
                            <p className="text-sm font-medium">
                              {new Date(computeStartPeriodDate(t.date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                            onClick={() => handleRecurringChargeSave(t)}
                            disabled={!recurringAmountStr || parseFloat(recurringAmountStr) <= 0}
                          >
                            {existingRecurring ? 'Update Charge' : 'Activate Recurring Charge'}
                          </Button>
                          {existingRecurring && (
                            <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive" onClick={() => handleRecurringChargeRemove(t)}>
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
            className="text-white"
          >
            Save Allocation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
