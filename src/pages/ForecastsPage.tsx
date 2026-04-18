import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  CircularProgress,
  Fab,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Forecast, Budget, Transaction } from '../types/transaction';
import { forecastService, budgetService, transactionService } from '../services/database';
import { calculateForecast, ForecastResult } from '../utils/forecastCalculations';
import { calculateRemaining, calculateBudgetSpent } from '../utils/budgetCalculations';
import { ForecastCard } from '../components/ForecastCard';
import { ForecastDialog } from '../components/ForecastDialog';

type FilterMode = 'all' | 'active' | 'achieved';

export const ForecastsPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Forecast | undefined>(undefined);
  const [filter, setFilter] = useState<FilterMode>('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [loadedForecasts, loadedBudgets, loadedTransactions] = await Promise.all([
        forecastService.getAll(),
        budgetService.getAll(),
        transactionService.getAll(),
      ]);
      setForecasts(loadedForecasts);
      setBudgets(loadedBudgets);
      setTransactions(loadedTransactions);
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingForecast(undefined);
    setDialogOpen(true);
  };

  const handleOpenEdit = (forecast: Forecast) => {
    setEditingForecast(forecast);
    setDialogOpen(true);
  };

  const handleMarkAchieved = async (forecast: Forecast) => {
    try {
      await forecastService.markAchieved(forecast.id);
      await loadData();
    } catch (err) {
      console.error('Failed to mark forecast as achieved:', err);
    }
  };

  const handleDelete = async (forecast: Forecast) => {
    try {
      await forecastService.delete(forecast.id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete forecast:', err);
    }
  };

  const getBudget = (budgetId: string): Budget | undefined =>
    budgets.find((b) => b.id === budgetId);

  const getForecastResult = (forecast: Forecast, budget: Budget): ForecastResult => {
    const spent = calculateBudgetSpent(budget, transactions);
    return calculateForecast(
      forecast.targetAmount,
      calculateRemaining(budget, spent),
      budget.amount,
      budget.period,
      budget.rolloverDay
    );
  };

  const getComputedSpent = (budget: Budget): number =>
    calculateBudgetSpent(budget, transactions);

  const filteredForecasts = forecasts.filter((f) => {
    if (filter === 'active') return !f.achievedAt;
    if (filter === 'achieved') return !!f.achievedAt;
    return true;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>


      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(_, val) => { if (val) setFilter(val); }}
        size="small"
        sx={{ mb: 3, mt: 2 }}
      >
        <ToggleButton value="active">Active</ToggleButton>
        <ToggleButton value="achieved">Achieved</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>

      {filteredForecasts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            border: (theme) => `1px dashed ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {filter === 'achieved' ? 'No achieved forecasts yet.' : 'No forecasts yet.'}
          </Typography>
          {filter !== 'achieved' && (
            <Typography variant="body2" color="text.secondary">
              Create a forecast to start planning for a future purchase.
            </Typography>
          )}
          {filter !== 'achieved' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ mt: 2 }}
            >
              New Forecast
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredForecasts.map((forecast) => {
            const budget = getBudget(forecast.budgetId);
            if (!budget) return null;
            const result = getForecastResult(forecast, budget);
            return (
              <ForecastCard
                key={forecast.id}
                forecast={forecast}
                budget={budget}
                computedSpent={getComputedSpent(budget)}
                forecastResult={result}
                onEdit={() => handleOpenEdit(forecast)}
                onMarkAchieved={() => handleMarkAchieved(forecast)}
                onDelete={() => handleDelete(forecast)}
              />
            );
          })}
        </Stack>
      )}

      <Fab
        color="primary"
        aria-label="Add forecast"
        onClick={handleOpenCreate}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>

      <ForecastDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        editingForecast={editingForecast}
        budgets={budgets}
      />
    </Box>
  );
};
