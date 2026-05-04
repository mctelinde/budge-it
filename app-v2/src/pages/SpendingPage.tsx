import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Landmark,
  CreditCard,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { transactionService, accountService } from '@/services/database';
import type { Transaction, Account } from '@shared/types/transaction';

// ── helpers ────────────────────────────────────────────────────────────────

function getMonthBounds(year: number, month: number) {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59),
  };
}

function formatMonth(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function filterTransactionsForMonth(transactions: Transaction[], year: number, month: number) {
  const { start, end } = getMonthBounds(year, month);
  return transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d >= start && d <= end;
  });
}

function netAmount(t: Transaction) {
  return t.type === 'expense' ? t.amount : -t.amount;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── AccountCard ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: Account;
  monthTransactions: Transaction[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, monthTransactions, onEdit, onDelete }) => {
  const accountTxns = monthTransactions.filter(
    (t) => t.account.toLowerCase() === account.name.toLowerCase()
  );
  const monthNet = accountTxns.reduce((sum, t) => sum + netAmount(t), 0);
  const isCredit = account.type === 'credit_card';

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isCredit
            ? <CreditCard className="size-4 text-muted-foreground" />
            : <Landmark className="size-4 text-muted-foreground" />
          }
          <span className="font-semibold truncate max-w-[160px]">{account.name}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="size-7" onClick={() => onEdit(account)}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => onDelete(account)}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <Badge variant="outline" className={`w-fit text-xs ${isCredit ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-sky-500 text-sky-600 dark:text-sky-400'}`}>
        {isCredit ? 'Credit Card' : 'Bank Account'}
      </Badge>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-2 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">{isCredit ? 'Balance Owed' : 'Balance'}</p>
          <p className={`text-sm font-semibold ${isCredit && account.currentBalance > 0 ? 'text-amber-500' : ''}`}>
            ${fmt(account.currentBalance)}
          </p>
        </div>
        <div className="rounded-lg border p-2 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">This Month</p>
          <p className={`text-sm font-semibold ${monthNet > 0 ? 'text-red-500' : monthNet < 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
            {monthNet > 0 ? '+' : ''}${fmt(monthNet)}
          </p>
        </div>
      </div>

      {account.notes && (
        <p className="text-xs text-muted-foreground">{account.notes}</p>
      )}
    </div>
  );
};

// ── Combobox (freeSolo) ──────────────────────────────────────────────────────

interface FreeSoloComboboxProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FreeSoloCombobox: React.FC<FreeSoloComboboxProps> = ({ options, value, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep local input in sync when parent value changes (e.g. dialog reset)
  useEffect(() => { setInputValue(value); }, [value]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val);
    if (!open) setOpen(true);
  };

  const handleSelect = (selected: string) => {
    setInputValue(selected);
    onChange(selected);
    setOpen(false);
  };

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-8"
          />
          <ChevronsUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </PopoverTrigger>
      {filtered.length > 0 && (
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                {filtered.map((option) => (
                  <CommandItem key={option} value={option} onSelect={handleSelect}>
                    <Check className={`mr-2 size-4 ${value === option ? 'opacity-100' : 'opacity-0'}`} />
                    {option}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
};

// ── AccountDialog ────────────────────────────────────────────────────────────

interface AccountDialogProps {
  open: boolean;
  initial?: Account | null;
  existingAccountNames: string[];
  onSave: (values: { name: string; type: 'bank' | 'credit_card'; currentBalance: number; notes?: string }) => void;
  onClose: () => void;
}

const AccountDialog: React.FC<AccountDialogProps> = ({ open, initial, existingAccountNames, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'bank' | 'credit_card'>('bank');
  const [balanceStr, setBalanceStr] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setType(initial?.type ?? 'bank');
      setBalanceStr(initial ? initial.currentBalance.toFixed(2) : '');
      setNotes(initial?.notes ?? '');
    }
  }, [open, initial]);

  const isValid = name.trim() && balanceStr && !isNaN(parseFloat(balanceStr.replace(/,/g, '')));

  const handleSave = () => {
    const bal = parseFloat(balanceStr.replace(/,/g, ''));
    if (!name.trim() || isNaN(bal)) return;
    onSave({ name: name.trim(), type, currentBalance: bal, notes: notes.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Account' : 'Add Account'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Account Name</Label>
            <FreeSoloCombobox
              options={existingAccountNames}
              value={name}
              onChange={setName}
              placeholder="Pick existing or type a new name"
            />
            <p className="text-xs text-muted-foreground">
              Pick an existing name from your transactions or enter a new one.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'bank' | 'credit_card')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Account</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acct-balance">
              {type === 'credit_card' ? 'Current Balance Owed' : 'Current Balance'}
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="acct-balance"
                type="number"
                step="0.01"
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter your current balance snapshot.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acct-notes">Notes (optional)</Label>
            <Textarea
              id="acct-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
            className="text-white"
          >
            {initial ? 'Update' : 'Add Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── SpendingPage ─────────────────────────────────────────────────────────────

export const SpendingPage: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [txns, accts] = await Promise.all([
        transactionService.getAll(),
        accountService.getAll(),
      ]);
      setTransactions(txns);
      setAccounts(accts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const existingAccountNames = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.account))).sort(),
    [transactions]
  );

  const monthTxns = useMemo(
    () => filterTransactionsForMonth(transactions, viewYear, viewMonth),
    [transactions, viewYear, viewMonth]
  );

  const totalIn = useMemo(
    () => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const totalOut = useMemo(
    () => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const netFlow = totalIn - totalOut;


  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.forEach((t) => { map[t.category] = (map[t.category] ?? 0) + netAmount(t); });
    return Object.entries(map)
      .map(([category, net]) => ({ category, net }))
      .sort((a, b) => b.net - a.net);
  }, [monthTxns]);

  const maxCategoryNet = Math.max(...categoryBreakdown.map((c) => Math.abs(c.net)), 1);

  const trendData = useMemo(() => {
    const { end } = getMonthBounds(viewYear, viewMonth);
    const today = new Date();
    const dayCount = Math.min(end.getDate(), today >= end ? end.getDate() : today.getDate());
    let cumulative = 0;
    return Array.from({ length: dayCount }, (_, i) => {
      const d = i + 1;
      const dayStr = new Date(viewYear, viewMonth, d).toISOString().split('T')[0];
      const dayNet = monthTxns.filter((t) => t.date === dayStr).reduce((s, t) => s + netAmount(t), 0);
      cumulative += dayNet;
      return { day: d, cumulative: parseFloat(cumulative.toFixed(2)) };
    });
  }, [monthTxns, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const handleAccountSave = async (values: { name: string; type: 'bank' | 'credit_card'; currentBalance: number; notes?: string }) => {
    if (editingAccount) {
      await accountService.update(editingAccount.id, values);
    } else {
      await accountService.create({ ...values, displayOrder: accounts.length });
    }
    setDialogOpen(false);
    setEditingAccount(null);
    await loadData();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await accountService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    }
  };

  return (
    <div className="pb-8">
      {/* Month Navigator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-lg font-semibold min-w-[180px] text-center">
          {formatMonth(viewYear, viewMonth)}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Loading bar */}
      {loading && <Progress value={undefined} className="mb-4 animate-pulse" />}

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { label: 'Total In', value: `+$${fmt(totalIn)}`, cls: 'text-green-600 dark:text-green-400' },
          { label: 'Total Out', value: `-$${fmt(totalOut)}`, cls: 'text-red-500' },
          { label: 'Net Cash Flow', value: `${netFlow >= 0 ? '+' : ''}$${fmt(netFlow)}`, cls: netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-xl border bg-card px-4 py-2 min-w-[130px]">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-base font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Accounts section */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Accounts</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#14959c] hover:text-[#14959c]"
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
        >
          <Plus className="size-4 mr-1" /> Add Account
        </Button>
      </div>

      {accounts.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground mb-4">
          No accounts yet. Add one to track balances alongside your spending.
        </p>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {accounts.map((acct) => (
          <div key={acct.id} className="flex-[1_1_280px] max-w-sm">
            <AccountCard
              account={acct}
              monthTransactions={monthTxns}
              onEdit={(a) => { setEditingAccount(a); setDialogOpen(true); }}
              onDelete={(a) => setDeleteTarget(a)}
            />
          </div>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Category breakdown + Trend */}
      <div className="flex flex-wrap gap-6">
        {/* Category breakdown */}
        <div className="flex-[1_1_260px] min-w-[220px]">
          <h2 className="text-base font-semibold mb-3">Spending by Category</h2>
          {categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions this month.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {categoryBreakdown.map(({ category, net }) => {
                const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
                return (
                  <button
                    key={category}
                    onClick={() => navigate(`/app/transactions?category=${encodeURIComponent(category)}&month=${monthStr}`)}
                    className="w-full text-left rounded p-1.5 -mx-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between mb-1">
                      <span className="text-sm truncate max-w-[55%]">{category}</span>
                      <span className={`text-sm font-semibold ${net > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {net > 0 ? '+' : ''}${fmt(net)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${net > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${(Math.abs(net) / maxCategoryNet) * 100}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Spending trend chart */}
        <div className="flex-[2_1_340px] min-w-[260px]">
          <h2 className="text-base font-semibold mb-3">Daily Net Spending Trend</h2>
          {trendData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240} debounce={50}>
              <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Day', position: 'insideBottom', offset: -8, fontSize: 11 }}
                  height={40}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={60} />
                <RechartsTooltip
                  formatter={(val) => [`$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Cumulative Net']}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#14959c"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Add/Edit Account dialog */}
      <AccountDialog
        open={dialogOpen}
        initial={editingAccount}
        existingAccountNames={existingAccountNames}
        onSave={handleAccountSave}
        onClose={() => { setDialogOpen(false); setEditingAccount(null); }}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Remove Account</DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            Remove <strong>{deleteTarget?.name}</strong>? This won't delete any transactions.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
