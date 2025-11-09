import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  InputAdornment,
} from '@mui/material';
import { Budget } from '../types/transaction';

interface BudgetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  budget?: Budget;
}

export const BudgetDialog: React.FC<BudgetDialogProps> = ({
  open,
  onClose,
  onSave,
  budget,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [startingBalance, setStartingBalance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [rolloverDay, setRolloverDay] = useState('1');

  useEffect(() => {
    if (budget) {
      setTitle(budget.title);
      setAmount(budget.amount.toString());
      setPeriod(budget.period);
      setStartingBalance(budget.startingBalance?.toString() || '');
      setStartDate(budget.startDate || '');
      setRolloverDay(budget.rolloverDay?.toString() || '1');
    } else {
      setTitle('');
      setAmount('');
      setPeriod('monthly');
      setStartingBalance('');
      setStartDate(new Date().toISOString().split('T')[0]); // Default to today
      setRolloverDay('1');
    }
  }, [budget, open]);

  const handleSave = () => {
    if (title.trim() && amount && parseFloat(amount) > 0) {
      onSave({
        title: title.trim(),
        amount: parseFloat(amount),
        spent: budget?.spent || 0,
        period,
        categories: budget?.categories || [],
        startingBalance: startingBalance ? parseFloat(startingBalance) : 0,
        startDate: startDate || new Date().toISOString().split('T')[0],
        rolloverDay: rolloverDay ? parseInt(rolloverDay) : 1,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setAmount('');
    setPeriod('monthly');
    setStartingBalance('');
    setStartDate('');
    setRolloverDay('1');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {budget ? 'Edit Budget' : 'Create New Budget'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          <TextField
            label="Budget Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            placeholder="e.g., Groceries, Entertainment, Savings"
            autoFocus
          />

          <TextField
            label="Budget Amount"
            value={amount}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setAmount(value);
              }
            }}
            fullWidth
            required
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            placeholder="0.00"
          />

          <TextField
            label="Starting Balance (Optional)"
            value={startingBalance}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                setStartingBalance(value);
              }
            }}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            placeholder="0.00"
            helperText="Enter previous balance from external tracking (can be negative)"
          />

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth
            required
            InputLabelProps={{
              shrink: true,
            }}
            helperText="Budget tracking begins on this date"
          />

          <TextField
            label="Rollover Day"
            type="number"
            value={rolloverDay}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 31) {
                setRolloverDay(e.target.value);
              } else if (e.target.value === '') {
                setRolloverDay('');
              }
            }}
            fullWidth
            required
            inputProps={{ min: 1, max: 31 }}
            helperText="Day of month when budget amount is credited (1-31)"
          />

          <FormControl fullWidth>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as 'monthly' | 'weekly' | 'yearly')}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!title.trim() || !amount || parseFloat(amount) <= 0}
          sx={{
            backgroundColor: '#14959c',
            '&:hover': {
              backgroundColor: '#0d7378',
            },
          }}
        >
          {budget ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
