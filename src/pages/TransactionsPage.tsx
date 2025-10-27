import React, { useState } from 'react';
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  useTheme,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  PostAdd as PostAddIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { TransactionDialog } from '../components/TransactionDialog';
import { TransactionTable } from '../components/TransactionTable';
import { mockTransactions, Transaction } from '../data/mockData';

export const TransactionsPage: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleImportCSV = () => {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const importedTransactions: Transaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map(v => v.trim());
        const transaction: any = {};

        headers.forEach((header, index) => {
          transaction[header] = values[index];
        });

        // Create transaction object with proper typing
        const newTransaction: Transaction = {
          id: Date.now().toString() + i,
          date: transaction.date || new Date().toISOString().split('T')[0],
          description: transaction.description || '',
          amount: parseFloat(transaction.amount) || 0,
          type: (transaction.type?.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense',
          category: transaction.category || '',
          account: transaction.account || '',
          notes: transaction.notes || '',
        };

        importedTransactions.push(newTransaction);
      }

      setTransactions(prev => [...prev, ...importedTransactions]);
      setImportDialogOpen(false);
      setCsvFile(null);
    };

    reader.readAsText(csvFile);
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
          variant="outlined"
          color="primary"
          onClick={() => setImportDialogOpen(true)}
          sx={{
            minWidth: '56px',
            width: '56px',
            height: '56px',
            p: 0,
            borderRadius: 2,
            borderColor: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
            color: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
            transition: theme.transitions.create(['background', 'transform', 'border-color'], {
              duration: theme.transitions.duration.short,
            }),
            '&:hover': {
              borderColor: theme.palette.mode === 'dark' ? '#1fb5bc' : '#14959c',
              backgroundColor: theme.palette.mode === 'dark'
                ? 'rgba(20, 149, 156, 0.08)'
                : 'rgba(13, 115, 119, 0.04)',
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.98)',
            }
          }}
        >
          <UploadIcon sx={{
            fontSize: 28,
            color: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
          }} />
        </Button>
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

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Transactions from CSV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, mt: 1, color: 'text.secondary' }}>
            Upload a CSV file with the following columns: date, description, amount, type, category, account, notes
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Example format: 2025-10-26, Grocery Shopping, 150.00, expense, Groceries, Chase Card, Weekly shopping
          </Typography>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Choose CSV File
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          {csvFile && (
            <Typography variant="body2" sx={{ color: 'success.main' }}>
              Selected file: {csvFile.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setCsvFile(null);
            }}
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
            onClick={handleImportCSV}
            variant="contained"
            disabled={!csvFile}
            sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
                : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)',
              '&:hover': {
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #0a5c5f 0%, #107a80 100%)'
                  : 'linear-gradient(135deg, #107a80 0%, #1aa3a9 100%)',
              }
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};