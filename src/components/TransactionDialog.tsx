import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  InputAdornment,
  useTheme,
  Box,
} from '@mui/material';
import { Transaction } from '../data/mockData';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
  transaction?: Transaction;
  isEditing?: boolean;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  transaction,
  isEditing = false,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = React.useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'expense',
    category: '',
    account: '',
    notes: '',
  });

  // Update form data when transaction prop changes or dialog opens
  useEffect(() => {
    if (open) {
      if (transaction) {
        setFormData({
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          account: transaction.account,
          notes: transaction.notes || '',
        });
      } else {
        // Reset to default values for new transaction
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          amount: 0,
          type: 'expense',
          category: '',
          account: '',
          notes: '',
        });
      }
    }
  }, [open, transaction]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (transaction?.id && onDelete) {
      onDelete(transaction.id);
      onClose();
    }
  };

  const categories = [
    'Salary',
    'Freelance',
    'Investments',
    'Groceries',
    'Entertainment',
    'Transportation',
    'Utilities',
    'Dining Out',
    'Health & Fitness',
    'Shopping',
    'Other',
  ];

  const accounts = [
    'Chase Checking',
    'Chase Credit Card',
    'Amex Credit Card',
    'Vanguard Account',
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isEditing ? 'Edit Transaction' : 'New Transaction'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                select
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <MenuItem value="income">Income</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </TextField>

              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              fullWidth
              select
              label="Account"
              name="account"
              value={formData.account}
              onChange={handleChange}
              required
            >
              {accounts.map((account) => (
                <MenuItem key={account} value={account}>
                  {account}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            {isEditing && onDelete && (
              <Button
                onClick={handleDelete}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #d84315 0%, #ff6f00 100%)',
                  color: '#ffffff',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #bf360c 0%, #e65100 100%)',
                  }
                }}
              >
                Delete
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={onClose}
              sx={{
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
                }
              }}
            >
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};