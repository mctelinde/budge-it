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
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { Transaction, Budget } from '../types/transaction';

interface TransactionAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  budget: Budget;
  allTransactions: Transaction[];
  onSave: (budgetId: string, transactionIds: string[]) => void;
  initialFilterAllocated?: boolean;
}

export const TransactionAllocationDialog: React.FC<TransactionAllocationDialogProps> = ({
  open,
  onClose,
  budget,
  allTransactions,
  onSave,
  initialFilterAllocated = false,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(budget.transactionIds || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAllocated, setShowOnlyAllocated] = useState(initialFilterAllocated);

  // Reset filter when dialog opens
  React.useEffect(() => {
    if (open) {
      setShowOnlyAllocated(initialFilterAllocated);
    }
  }, [open, initialFilterAllocated]);

  // Filter transactions - only show expenses
  const expenseTransactions = useMemo(() => {
    return allTransactions.filter((t) => t.type === 'expense');
  }, [allTransactions]);

  // Filter by search query and allocation status
  const filteredTransactions = useMemo(() => {
    let filtered = expenseTransactions;

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
  }, [expenseTransactions, searchQuery, showOnlyAllocated, selectedIds]);

  // Calculate total of selected transactions
  const selectedTotal = useMemo(() => {
    return allTransactions
      .filter((t) => selectedIds.includes(t.id))
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
    onClose();
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
              label={`Total: $${selectedTotal.toFixed(2)}`}
              variant="outlined"
              size="small"
            />
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
              {searchQuery ? 'No transactions match your search' : 'No expense transactions available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredTransactions.map((transaction) => (
              <ListItem key={transaction.id} disablePadding>
                <ListItemButton onClick={() => handleToggle(transaction.id)} dense>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      edge="start"
                      checked={selectedIds.includes(transaction.id)}
                      tabIndex={-1}
                      disableRipple
                      sx={{
                        '&.Mui-checked': {
                          color: '#14959c',
                        },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {transaction.description}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#ff6f00' }}>
                          ${transaction.amount.toFixed(2)}
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
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{
            backgroundColor: '#14959c',
            '&:hover': {
              backgroundColor: '#0d7378',
            },
          }}
        >
          Save Allocation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
