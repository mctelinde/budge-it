import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { forecastService, budgetService, transactionService } from '@/services/database';
import { calculateForecast } from '@shared/utils/forecastCalculations';
import { calculateRemaining, calculateBudgetSpent } from '@shared/utils/budgetCalculations';
import { ForecastCard } from '@/components/ForecastCard';
import { ForecastDialog } from '@/components/ForecastDialog';
import type { Forecast, Budget, Transaction } from '@shared/types/transaction';

type FilterMode = 'all' | 'active' | 'achieved';

export const ForecastsPage: React.FC = () => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingForecast, setEditingForecast] = useState<Forecast | undefined>(undefined);
  const [filter, setFilter] = useState<FilterMode>('active');

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
      setTransactions(loadedTransactions as Transaction[]);
    } catch (err) {
      console.error('Failed to load forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenCreate = () => { setEditingForecast(undefined); setDialogOpen(true); };
  const handleOpenEdit = (forecast: Forecast) => { setEditingForecast(forecast); setDialogOpen(true); };

  const handleMarkAchieved = async (forecast: Forecast) => {
    try { await forecastService.markAchieved(forecast.id); await loadData(); }
    catch (err) { console.error('Failed to mark forecast as achieved:', err); }
  };

  const handleDelete = async (forecast: Forecast) => {
    try { await forecastService.delete(forecast.id); await loadData(); }
    catch (err) { console.error('Failed to delete forecast:', err); }
  };

  const getBudget = (budgetId: string) => budgets.find((b) => b.id === budgetId);

  const filteredForecasts = forecasts.filter((f) => {
    if (filter === 'active') return !f.achievedAt;
    if (filter === 'achieved') return !!f.achievedAt;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center mt-16">
        <div className="size-8 rounded-full border-2 border-[#14959c] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative pb-20">
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && setFilter(v as FilterMode)}
        className="justify-start mb-4"
      >
        <ToggleGroupItem value="active">Active</ToggleGroupItem>
        <ToggleGroupItem value="achieved">Achieved</ToggleGroupItem>
        <ToggleGroupItem value="all">All</ToggleGroupItem>
      </ToggleGroup>

      {filteredForecasts.length === 0 ? (
        <div className="p-8 text-center border border-dashed rounded-lg">
          <p className="text-muted-foreground font-medium mb-1">
            {filter === 'achieved' ? 'No achieved forecasts yet.' : 'No forecasts yet.'}
          </p>
          {filter !== 'achieved' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Create a forecast to start planning for a future purchase.
              </p>
              <Button
                onClick={handleOpenCreate}
                style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
                className="text-white"
              >
                <Plus className="size-4 mr-1.5" /> New Forecast
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredForecasts.map((forecast) => {
            const budget = getBudget(forecast.budgetId);
            if (!budget) return null;
            const spent = calculateBudgetSpent(budget, transactions);
            const result = calculateForecast(
              forecast.targetAmount,
              calculateRemaining(budget, spent),
              budget.amount,
              budget.period,
              budget.rolloverDay
            );
            return (
              <ForecastCard
                key={forecast.id}
                forecast={forecast}
                budget={budget}
                computedSpent={spent}
                forecastResult={result}
                onEdit={() => handleOpenEdit(forecast)}
                onMarkAchieved={() => handleMarkAchieved(forecast)}
                onDelete={() => handleDelete(forecast)}
              />
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={handleOpenCreate}
        aria-label="Add forecast"
        className="fixed bottom-6 right-6 h-12 px-6 text-white shadow-lg gap-2 text-base"
        style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
      >
        <Plus className="size-5" />
        Add Forecast
      </Button>

      <ForecastDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadData}
        editingForecast={editingForecast}
        budgets={budgets}
      />
    </div>
  );
};
