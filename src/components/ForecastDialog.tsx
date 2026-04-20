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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Forecast, Budget } from '../types/transaction';
import { forecastService } from '../services/database';

interface ForecastDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingForecast?: Forecast;
  budgets: Budget[];
  defaultBudgetId?: string;
}

export const ForecastDialog: React.FC<ForecastDialogProps> = ({
  open,
  onClose,
  onSaved,
  editingForecast,
  budgets,
  defaultBudgetId,
}) => {
  const theme = useTheme();
  const [budgetId, setBudgetId] = useState('');
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingForecast) {
        setBudgetId(editingForecast.budgetId);
        setTitle(editingForecast.title);
        setTargetAmount(String(editingForecast.targetAmount));
        setNotes(editingForecast.notes ?? '');
      } else {
        setBudgetId(defaultBudgetId ?? (budgets[0]?.id ?? ''));
        setTitle('');
        setTargetAmount('');
        setNotes('');
      }
      setErrors({});
    }
  }, [open, editingForecast, defaultBudgetId, budgets]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!budgetId) next.budgetId = 'Please select a budget.';
    if (!title.trim()) next.title = 'Title is required.';
    const amt = Number(targetAmount);
    if (!targetAmount || isNaN(amt) || amt <= 0) {
      next.targetAmount = 'Enter a positive target amount.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        budgetId,
        title: title.trim(),
        targetAmount: Number(targetAmount),
        notes: notes.trim() || undefined,
        achievedAt: editingForecast?.achievedAt ?? null,
      };

      if (editingForecast) {
        await forecastService.update(editingForecast.id, payload);
      } else {
        await forecastService.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save forecast:', err);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!editingForecast;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Forecast' : 'New Forecast'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Budget"
            value={budgetId}
            onChange={(e) => setBudgetId(e.target.value)}
            error={!!errors.budgetId}
            helperText={errors.budgetId}
            disabled={isEditing}
            fullWidth
          >
            {budgets.map((b) => (
              <MenuItem key={b.id} value={b.id}>
                {b.title}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="What are you saving for?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            placeholder="e.g. New laptop, Vacation, Emergency fund"
            fullWidth
          />

          <TextField
            label="Target Amount"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={!!errors.targetAmount}
            helperText={errors.targetAmount}
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            fullWidth
          />

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          disabled={saving}
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
          disabled={saving}
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
          {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Forecast'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
