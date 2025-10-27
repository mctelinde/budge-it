import React, { useState } from 'react';
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  useTheme,
  Button,
  Stack,
} from '@mui/material';
import { Search as SearchIcon, PostAdd as PostAddIcon } from '@mui/icons-material';
import { TransactionDialog } from '../components/TransactionDialog';
import { TransactionTable } from '../components/TransactionTable';
import { mockTransactions, Transaction } from '../data/mockData';

export const TransactionsPage: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.category.toLowerCase().includes(searchLower) ||
      transaction.account.toLowerCase().includes(searchLower) ||
      (transaction.notes?.toLowerCase().includes(searchLower))
    );
  });

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSaveTransaction = (transactionData: Partial<Transaction>) => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions(prev =>
        prev.map(t => t.id === editingTransaction.id
          ? { ...t, ...transactionData }
          : t
        )
      );
    } else {
      // Add new transaction
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: transactionData.date || new Date().toISOString().split('T')[0],
        description: transactionData.description || '',
        amount: transactionData.amount || 0,
        type: transactionData.type || 'expense',
        category: transactionData.category || '',
        account: transactionData.account || '',
        notes: transactionData.notes,
      };
      setTransactions(prev => [...prev, newTransaction]);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        backgroundColor: 'transparent',
      }}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, mt: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: '56px',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: 2,
              transition: theme.transitions.create(['background-color', 'box-shadow']),
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
              },
              '&.Mui-focused': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddTransaction}
          sx={{
            minWidth: '56px',
            width: '56px',
            height: '56px',
            p: 0,
            borderRadius: 2,
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
              : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)',
            transition: theme.transitions.create(['background', 'transform', 'box-shadow'], {
              duration: theme.transitions.duration.short,
            }),
            '&:hover': {
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0a5c5f 0%, #107a80 100%)'
                : 'linear-gradient(135deg, #107a80 0%, #1aa3a9 100%)',
              transform: 'scale(1.05)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 16px rgba(13, 115, 119, 0.4)'
                : '0 8px 16px rgba(20, 149, 156, 0.3)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            }
          }}
        >
          <PostAddIcon sx={{
            fontSize: 28,
            color: '#ffffff',
          }} />
        </Button>
      </Stack>

      <TransactionTable
        transactions={filteredTransactions}
        onEditTransaction={handleEditTransaction}
      />

      <TransactionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        isEditing={!!editingTransaction}
      />
    </Paper>
  );
};