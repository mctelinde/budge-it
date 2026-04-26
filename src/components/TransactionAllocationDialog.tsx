import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  CalendarMonth as CalendarMonthIcon,
  Close as CloseIcon,
  Autorenew as AutorenewIcon,
} from '@mui/icons-material';
import { Transaction, Budget, InstallmentPlan, RecurringCharge } from '../types/transaction';
import { decodeHtmlEntities } from '../utils/textUtils';

interface TransactionAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  budget: Budget;
  allTransactions: Transaction[];
  onSave: (budgetId: string, transactionIds: string[]) => void;
  initialFilterAllocated?: boolean;
  installmentPlans?: InstallmentPlan[];
  onInstallmentSave?: (
    transactionId: string,
    numInstallments: number,
    amountPerInstallment: number,
    startPeriodDate: string
  ) => void;
  onInstallmentRemove?: (planId: string) => void;
  recurringCharges?: RecurringCharge[];
  onRecurringChargeSave?: (
    description: string,
    amount: number,
    startPeriodDate: string,
    endPeriodDate?: string
  ) => void;
  onRecurringChargeUpdate?: (
    chargeId: string,
    updates: { amount?: number; endPeriodDate?: string | null }
  ) => void;
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
  const theme = useTheme();
  const [selectedIds, setSelectedIds] = useState<string[]>(budget.transactionIds || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAllocated, setShowOnlyAllocated] = useState(initialFilterAllocated);

  // Installment plan editing state
  const [expandedInstallmentTxnId, setExpandedInstallmentTxnId] = useState<string | null>(null);
  const [installmentNumPayments, setInstallmentNumPayments] = useState<number>(6);
  const [installmentAmountStr, setInstallmentAmountStr] = useState<string>('');

  // Recurring charge editing state
  const [expandedRecurringTxnId, setExpandedRecurringTxnId] = useState<string | null>(null);
  const [recurringAmountStr, setRecurringAmountStr] = useState<string>('');
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setShowOnlyAllocated(initialFilterAllocated);
      setExpandedInstallmentTxnId(null);
      setExpandedRecurringTxnId(null);
    }
  }, [open, initialFilterAllocated]);

  // Show all transactions (expenses and income/credits)
  const availableTransactions = useMemo(() => {
    return allTransactions;
  }, [allTransactions]);

  // Filter by search query and allocation status
  const filteredTransactions = useMemo(() => {
    let filtered = availableTransactions;

    // Filter by allocation status
    if (showOnlyAllocated) {
      filtered = filtered.filter((t) => selectedIds.includes(t.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.amount.toString().includes(query)
      );
    }

    return filtered;
  }, [availableTransactions, searchQuery, showOnlyAllocated, selectedIds]);

  const selectedExpenses = useMemo(() => {
    return allTransactions
      .filter((t) => selectedIds.includes(t.id) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [allTransactions, selectedIds]);

  const selectedCredits = useMemo(() => {
    return allTransactions
      .filter((t) => selectedIds.includes(t.id) && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [allTransactions, selectedIds]);

  const handleToggle = (transactionId: string) => {
    setSelectedIds((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map((t) => t.id));
    }
  };

  const handleSave = () => {
    onSave(budget.id, selectedIds);
    onClose();
  };

  const handleClose = () => {
    setSelectedIds(budget.transactionIds || []);
    setSearchQuery('');
    setShowOnlyAllocated(false);
    setExpandedInstallmentTxnId(null);
    setExpandedRecurringTxnId(null);
    onClose();
  };

  /**
   * Compute the rollover date of the budget period that contains a given transaction date.
   * This becomes the start_period_date for the first installment.
   */
  const computeStartPeriodDate = (transactionDate: string): string => {
    const rolloverDay = budget.rolloverDay ?? 1;
    const parts = transactionDate.split('-');
    const txnDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const month = txnDate.getMonth();
    const year = txnDate.getFullYear();
    const thisMonthRollover = new Date(year, month, rolloverDay);
    if (txnDate >= thisMonthRollover) {
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(rolloverDay).padStart(2, '0')}`;
    }
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(rolloverDay).padStart(2, '0')}`;
  };

  const getExistingPlan = (transactionId: string): InstallmentPlan | undefined =>
    installmentPlans.find((p) => p.transactionId === transactionId);

  const handleToggleInstallmentPanel = (transaction: Transaction) => {
    if (expandedInstallmentTxnId === transaction.id) {
      setExpandedInstallmentTxnId(null);
      return;
    }
    const existing = getExistingPlan(transaction.id);
    if (existing) {
      setInstallmentNumPayments(existing.numInstallments);
      setInstallmentAmountStr(existing.amountPerInstallment.toFixed(2));
    } else {
      const defaultNum = 6;
      setInstallmentNumPayments(defaultNum);
      setInstallmentAmountStr((transaction.amount / defaultNum).toFixed(2));
    }
    setExpandedInstallmentTxnId(transaction.id);
  };

  const handleInstallmentNumChange = (value: number, transaction: Transaction) => {
    const clamped = Math.max(2, value || 2);
    setInstallmentNumPayments(clamped);
    // Auto-recalculate amount only if user hasn't manually changed it
    const autoAmount = transaction.amount / clamped;
    setInstallmentAmountStr(autoAmount.toFixed(2));
  };

  const handleInstallmentSave = (transaction: Transaction) => {
    const amount = parseFloat(installmentAmountStr);
    if (!amount || amount <= 0 || installmentNumPayments < 2) return;
    onInstallmentSave?.(
      transaction.id,
      installmentNumPayments,
      amount,
      computeStartPeriodDate(transaction.date)
    );
    setExpandedInstallmentTxnId(null);
  };

  const handleInstallmentRemove = (transaction: Transaction) => {
    const plan = getExistingPlan(transaction.id);
    if (plan) {
      onInstallmentRemove?.(plan.id);
    }
    setExpandedInstallmentTxnId(null);
  };

  // Returns the existing recurring charge that matches this transaction's description+amount
  const getExistingRecurringCharge = (transaction: Transaction): RecurringCharge | undefined =>
    recurringCharges.find(
      (c) =>
        c.description.toLowerCase() === transaction.description.toLowerCase() &&
        c.amount === transaction.amount
    );

  const handleToggleRecurringPanel = (transaction: Transaction) => {
    if (expandedRecurringTxnId === transaction.id) {
      setExpandedRecurringTxnId(null);
      return;
    }
    // Close installment panel if open
    setExpandedInstallmentTxnId(null);
    const existing = getExistingRecurringCharge(transaction);
    setRecurringAmountStr(existing ? existing.amount.toFixed(2) : transaction.amount.toFixed(2));
    setRecurringEndDate(existing?.endPeriodDate ?? '');
    setExpandedRecurringTxnId(transaction.id);
  };

  const handleRecurringChargeSave = (transaction: Transaction) => {
    const amount = parseFloat(recurringAmountStr);
    if (!amount || amount <= 0) return;
    const existing = getExistingRecurringCharge(transaction);
    if (existing) {
      onRecurringChargeUpdate?.(existing.id, {
        amount,
        endPeriodDate: recurringEndDate || null,
      });
    } else {
      onRecurringChargeSave?.(
        transaction.description,
        amount,
        computeStartPeriodDate(transaction.date),
        recurringEndDate || undefined
      );
    }
    setExpandedRecurringTxnId(null);
  };

  const handleRecurringChargeRemove = (transaction: Transaction) => {
    const charge = getExistingRecurringCharge(transaction);
    if (charge) {
      onRecurringChargeRemove?.(charge.id);
    }
    setExpandedRecurringTxnId(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6" gutterBottom>
            Allocate Transactions to Budget
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {budget.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <ToggleButtonGroup
            value={showOnlyAllocated ? 'allocated' : 'all'}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setShowOnlyAllocated(newValue === 'allocated');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                px: 2,
                '&.Mui-selected': {
                  backgroundColor: '#14959c',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#0d7378',
                  },
                },
              },
            }}
          >
            <ToggleButton value="all">All Transactions</ToggleButton>
            <ToggleButton value="allocated">Allocated Only</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip
              label={`${selectedIds.length} selected`}
              color="primary"
              size="small"
              sx={{
                backgroundColor: '#14959c',
                '&:hover': {
                  backgroundColor: '#0d7378',
                },
              }}
            />
            <Chip
              label={`Net: $${(selectedExpenses - selectedCredits).toFixed(2)}`}
              variant="outlined"
              size="small"
            />
            {selectedCredits > 0 && (
              <Chip
                label={`Credits: -$${selectedCredits.toFixed(2)}`}
                variant="outlined"
                size="small"
                color="success"
              />
            )}
          </Box>
          <Button
            size="small"
            onClick={handleSelectAll}
            sx={{ color: '#14959c' }}
          >
            {selectedIds.length === filteredTransactions.length ? 'Deselect All' : 'Select All'}
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {filteredTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No transactions match your search' : 'No transactions available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredTransactions.map((transaction) => {
              const existingPlan = getExistingPlan(transaction.id);
              const existingRecurringCharge = getExistingRecurringCharge(transaction);
              const isAllocated = selectedIds.includes(transaction.id);
              const isExpanded = expandedInstallmentTxnId === transaction.id;
              const isRecurringExpanded = expandedRecurringTxnId === transaction.id;

              return (
                <React.Fragment key={transaction.id}>
                  <ListItem disablePadding
                    secondaryAction={
                      isAllocated && (onInstallmentSave || onRecurringChargeSave) ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1 }}>
                          {existingPlan && (
                            <Chip
                              label={`${existingPlan.numInstallments} × $${existingPlan.amountPerInstallment.toFixed(2)}/mo`}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {existingRecurringCharge && (
                            <Chip
                              label={existingRecurringCharge.endPeriodDate
                                ? `$${existingRecurringCharge.amount.toFixed(2)}/mo until ${new Date(existingRecurringCharge.endPeriodDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                                : `$${existingRecurringCharge.amount.toFixed(2)}/mo ∞`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          {onInstallmentSave && (
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleToggleInstallmentPanel(transaction); }}
                              title={existingPlan ? 'Edit payment schedule' : 'Set up payment schedule'}
                              sx={{ color: existingPlan ? 'info.main' : 'text.secondary' }}
                            >
                              <CalendarMonthIcon fontSize="small" />
                            </IconButton>
                          )}
                          {onRecurringChargeSave && (
                            <IconButton
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleToggleRecurringPanel(transaction); }}
                              title={existingRecurringCharge ? 'Edit recurring charge' : 'Set as recurring monthly charge'}
                              sx={{ color: existingRecurringCharge ? 'success.main' : 'text.secondary' }}
                            >
                              <AutorenewIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      ) : undefined
                    }
                  >
                    <ListItemButton dense sx={{ cursor: 'default' }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Checkbox
                          edge="start"
                          checked={selectedIds.includes(transaction.id)}
                          tabIndex={-1}
                          disableRipple
                          onChange={() => handleToggle(transaction.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            cursor: 'pointer',
                            '&.Mui-checked': {
                              color: '#14959c',
                            },
                          }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: isAllocated && onInstallmentSave ? 14 : 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {decodeHtmlEntities(transaction.description)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: transaction.type === 'income' ? 'success.main' : '#ff6f00' }}>
                              {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={transaction.category} size="small" variant="outlined" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(transaction.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>

                  {/* Inline installment plan form */}
                  <Collapse in={isExpanded} unmountOnExit>
                    <Paper
                      elevation={0}
                      sx={{
                        mx: 2,
                        mb: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'info.light',
                        borderRadius: 2,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(2, 136, 209, 0.08)' : 'rgba(2, 136, 209, 0.04)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" color="info.main">
                          Payment Schedule
                        </Typography>
                        <IconButton size="small" onClick={() => setExpandedInstallmentTxnId(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                        <TextField
                          label="Number of payments"
                          type="number"
                          size="small"
                          value={installmentNumPayments}
                          onChange={(e) => handleInstallmentNumChange(Number(e.target.value), transaction)}
                          inputProps={{ min: 2, max: 120 }}
                          sx={{ width: 160 }}
                        />
                        <TextField
                          label="Amount per payment"
                          size="small"
                          value={installmentAmountStr}
                          onChange={(e) => setInstallmentAmountStr(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          sx={{ width: 160 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="caption" color="text.secondary">First payment period</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(computeStartPeriodDate(transaction.date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>

                      {installmentNumPayments >= 2 && parseFloat(installmentAmountStr) > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                          Total: ${(installmentNumPayments * parseFloat(installmentAmountStr)).toFixed(2)} over {installmentNumPayments} payments
                          {Math.abs((installmentNumPayments * parseFloat(installmentAmountStr)) - transaction.amount) > 0.01 && (
                            <span style={{ marginLeft: 8 }}>
                              (original: ${transaction.amount.toFixed(2)})
                            </span>
                          )}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleInstallmentSave(transaction)}
                          disabled={!installmentAmountStr || parseFloat(installmentAmountStr) <= 0 || installmentNumPayments < 2}
                          sx={{ backgroundColor: 'info.main', '&:hover': { backgroundColor: 'info.dark' } }}
                        >
                          Save Schedule
                        </Button>
                        {existingPlan && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleInstallmentRemove(transaction)}
                          >
                            Remove Schedule
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Collapse>
                  {/* Inline recurring charge form */}
                  <Collapse in={isRecurringExpanded} unmountOnExit>
                    <Paper
                      elevation={0}
                      sx={{
                        mx: 2,
                        mb: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'success.light',
                        borderRadius: 2,
                        backgroundColor: (theme) =>
                          theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.08)' : 'rgba(46, 125, 50, 0.04)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="subtitle2" color="success.main">
                          Recurring Monthly Charge
                        </Typography>
                        <IconButton size="small" onClick={() => setExpandedRecurringTxnId(null)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Description (matched)</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {transaction.description}
                          </Typography>
                        </Box>
                        <TextField
                          label="Amount per period"
                          size="small"
                          value={recurringAmountStr}
                          onChange={(e) => setRecurringAmountStr(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                          sx={{ width: 160 }}
                        />
                        <TextField
                          label="End date (optional)"
                          type="month"
                          size="small"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          helperText="Leave blank for indefinite"
                          InputLabelProps={{ shrink: true }}
                          sx={{ width: 180 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Starts from period</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {new Date(computeStartPeriodDate(transaction.date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleRecurringChargeSave(transaction)}
                          disabled={!recurringAmountStr || parseFloat(recurringAmountStr) <= 0}
                          sx={{ backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}
                        >
                          {existingRecurringCharge ? 'Update Charge' : 'Activate Recurring Charge'}
                        </Button>
                        {existingRecurringCharge && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleRecurringChargeRemove(transaction)}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={handleClose}
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
          onClick={handleSave}
          variant="contained"
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
          Save Allocation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
