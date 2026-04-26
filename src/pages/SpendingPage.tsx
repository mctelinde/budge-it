import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Button,
  ButtonBase,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  LinearProgress,
  Tooltip,
  useTheme,
  Autocomplete,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { transactionService, accountService } from '../services/database';
import { Transaction, Account } from '../types/transaction';

// ── helpers ────────────────────────────────────────────────────────────────

function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59),
  };
}

function formatMonth(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function filterTransactionsForMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  const { start, end } = getMonthBounds(year, month);
  return transactions.filter((t) => {
    const d = new Date(t.date + 'T00:00:00');
    return d >= start && d <= end;
  });
}

function netAmount(t: Transaction): number {
  return t.type === 'expense' ? t.amount : -t.amount;
}

// ── AccountCard ─────────────────────────────────────────────────────────────

interface AccountCardProps {
  account: Account;
  monthTransactions: Transaction[];
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, monthTransactions, onEdit, onDelete }) => {
  const theme = useTheme();
  const accountTxns = monthTransactions.filter(
    (t) => t.account.toLowerCase() === account.name.toLowerCase()
  );
  const monthNet = accountTxns.reduce((sum, t) => sum + netAmount(t), 0);
  const isCredit = account.type === 'credit_card';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: 2,
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isCredit ? <CreditCardIcon fontSize="small" color="action" /> : <BankIcon fontSize="small" color="action" />}
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {account.name}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => onEdit(account)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => onDelete(account)} color="error"><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      </Box>

      <Chip
        label={isCredit ? 'Credit Card' : 'Bank Account'}
        size="small"
        variant="outlined"
        color={isCredit ? 'warning' : 'info'}
        sx={{ mb: 1.5, fontSize: '0.7rem' }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Box sx={{
          flex: 1,
          p: 1,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderRadius: 1.5,
          textAlign: 'center',
        }}>
          <Typography variant="caption" color="text.secondary" display="block">
            {isCredit ? 'Balance Owed' : 'Balance'}
          </Typography>
          <Typography variant="body2" fontWeight={600} color={isCredit && account.currentBalance > 0 ? 'warning.main' : 'text.primary'}>
            ${account.currentBalance.toFixed(2)}
          </Typography>
        </Box>
        <Box sx={{
          flex: 1,
          p: 1,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          borderRadius: 1.5,
          textAlign: 'center',
        }}>
          <Typography variant="caption" color="text.secondary" display="block">
            This Month
          </Typography>
          <Typography variant="body2" fontWeight={600} color={monthNet > 0 ? 'error.main' : monthNet < 0 ? 'success.main' : 'text.secondary'}>
            {monthNet > 0 ? '+' : ''}{monthNet.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {account.notes && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {account.notes}
        </Typography>
      )}
    </Paper>
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
  const theme = useTheme();
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

  const handleSave = () => {
    const bal = parseFloat(balanceStr.replace(/,/g, ''));
    if (!name.trim() || isNaN(bal)) return;
    onSave({ name: name.trim(), type, currentBalance: bal, notes: notes.trim() || undefined });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Edit Account' : 'Add Account'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Autocomplete
          freeSolo
          options={existingAccountNames}
          value={name}
          onInputChange={(_, val) => setName(val)}
          renderInput={(params) => (
            <TextField {...params} label="Account name" required helperText="Pick an existing name from your transactions or enter a new one" />
          )}
        />
        <FormControl fullWidth>
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={(e) => setType(e.target.value as 'bank' | 'credit_card')}>
            <MenuItem value="bank">Bank Account</MenuItem>
            <MenuItem value="credit_card">Credit Card</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={type === 'credit_card' ? 'Current balance owed' : 'Current balance'}
          value={balanceStr}
          onChange={(e) => setBalanceStr(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          helperText="Enter your current balance snapshot"
        />
        <TextField
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || !balanceStr || isNaN(parseFloat(balanceStr.replace(/,/g, '')))}
          sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
              : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)',
            color: '#ffffff',
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0a5c5f 0%, #107a80 100%)'
                : 'linear-gradient(135deg, #107a80 0%, #1aa3a9 100%)',
            },
          }}
        >
          {initial ? 'Update' : 'Add Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── SpendingPage ─────────────────────────────────────────────────────────────

export const SpendingPage: React.FC = () => {
  const theme = useTheme();
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

  // Distinct account names already in transactions (for autocomplete)
  const existingAccountNames = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.account))).sort(),
    [transactions]
  );

  const monthTxns = useMemo(
    () => filterTransactionsForMonth(transactions, viewYear, viewMonth),
    [transactions, viewYear, viewMonth]
  );

  // Summary stats
  const totalIn = useMemo(
    () => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const totalOut = useMemo(
    () => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTxns]
  );
  const netFlow = totalIn - totalOut;

  // Category breakdown (net per category, expenses positive, income negative)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthTxns.forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + netAmount(t);
    });
    return Object.entries(map)
      .map(([cat, net]) => ({ category: cat, net }))
      .sort((a, b) => b.net - a.net);
  }, [monthTxns]);

  const maxCategoryNet = Math.max(...categoryBreakdown.map((c) => Math.abs(c.net)), 1);

  // Spending trend (cumulative daily net spend, only expenses > income = positive net)
  const trendData = useMemo(() => {
    const { end } = getMonthBounds(viewYear, viewMonth);
    const days: { day: number; cumulative: number }[] = [];
    let cumulative = 0;
    const today = new Date();
    const dayCount = Math.min(end.getDate(), today >= end ? end.getDate() : today.getDate());
    for (let d = 1; d <= dayCount; d++) {
      const dayDate = new Date(viewYear, viewMonth, d);
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayNet = monthTxns
        .filter((t) => t.date === dayStr)
        .reduce((s, t) => s + netAmount(t), 0);
      cumulative += dayNet;
      days.push({ day: d, cumulative: parseFloat(cumulative.toFixed(2)) });
    }
    return days;
  }, [monthTxns, viewYear, viewMonth]);

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  // Account CRUD
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
    <Box>
      {/* Month Navigator */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2, mb: 3 }}>
        <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
        <Typography variant="h6" sx={{ minWidth: 160, textAlign: 'center', fontWeight: 600 }}>
          {formatMonth(viewYear, viewMonth)}
        </Typography>
        <IconButton onClick={nextMonth} size="small" disabled={isCurrentMonth}><ChevronRight /></IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
        {[
          { label: 'Total In', value: `+$${totalIn.toFixed(2)}`, color: 'success.main' },
          { label: 'Total Out', value: `-$${totalOut.toFixed(2)}`, color: 'error.main' },
          { label: 'Net Cash Flow', value: `${netFlow >= 0 ? '+' : ''}$${netFlow.toFixed(2)}`, color: netFlow >= 0 ? 'success.main' : 'error.main' },
        ].map(({ label, value, color }) => (
          <Paper
            key={label}
            elevation={0}
            sx={{
              px: 2,
              py: 1.5,
              border: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: 2,
              minWidth: 130,
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
            <Typography variant="body1" fontWeight={700} color={color}>{value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Accounts section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Accounts</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setEditingAccount(null); setDialogOpen(true); }}
          sx={{ color: '#14959c' }}
        >
          Add Account
        </Button>
      </Box>

      {accounts.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          No accounts yet. Add one to track balances alongside your spending.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {accounts.map((acct) => (
          <Box key={acct.id} sx={{ flex: '1 1 280px', maxWidth: 360 }}>
            <AccountCard
              account={acct}
              monthTransactions={monthTxns}
              onEdit={(a) => { setEditingAccount(a); setDialogOpen(true); }}
              onDelete={(a) => setDeleteTarget(a)}
            />
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Category breakdown + Trend side by side on wide screens */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Category breakdown */}
        <Box sx={{ flex: '1 1 280px', minWidth: 240 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Spending by Category</Typography>
          {categoryBreakdown.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No transactions this month.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {categoryBreakdown.map(({ category, net }) => {
                const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
                return (
                  <ButtonBase
                    key={category}
                    onClick={() => navigate(`/app/transactions?category=${encodeURIComponent(category)}&month=${monthStr}`)}
                    sx={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      borderRadius: 1,
                      p: 0.5,
                      mx: -0.5,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>{category}</Typography>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color={net > 0 ? 'error.main' : 'success.main'}
                      >
                        {net > 0 ? '+' : ''}${net.toFixed(2)}
                      </Typography>
                    </Box>
                    <Tooltip title={`${category}: $${Math.abs(net).toFixed(2)}`}>
                      <LinearProgress
                        variant="determinate"
                        value={(Math.abs(net) / maxCategoryNet) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: net > 0 ? theme.palette.error.main : theme.palette.success.main,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Tooltip>
                  </ButtonBase>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Spending trend */}
        <Box sx={{ flex: '2 1 360px', minWidth: 280 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Daily Net Spending Trend</Typography>
          {trendData.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No data for this month yet.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={240} debounce={50}>
              <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} label={{ value: 'Day', position: 'insideBottom', offset: -8, fontSize: 11 }} height={40} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={60} />
                <RechartsTooltip
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Cumulative Net']}
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
        </Box>
      </Box>

      {/* Add/Edit Account dialog */}
      <AccountDialog
        open={dialogOpen}
        initial={editingAccount}
        existingAccountNames={existingAccountNames}
        onSave={handleAccountSave}
        onClose={() => { setDialogOpen(false); setEditingAccount(null); }}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Account</DialogTitle>
        <DialogContent>
          <Typography>
            Remove <strong>{deleteTarget?.name}</strong>? This won't delete any transactions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
