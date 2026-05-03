import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { forecastService } from '@/services/database';
import type { Forecast, Budget } from '@shared/types/transaction';

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
    if (!targetAmount || isNaN(amt) || amt <= 0) next.targetAmount = 'Enter a positive target amount.';
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
    <Dialog open={open} onOpenChange={(o) => !saving && !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Forecast' : 'New Forecast'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Budget</Label>
            <Select value={budgetId} onValueChange={setBudgetId} disabled={isEditing}>
              <SelectTrigger className={errors.budgetId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select a budget" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.budgetId && <p className="text-xs text-destructive">{errors.budgetId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-title">What are you saving for?</Label>
            <Input
              id="fc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New laptop, Vacation, Emergency fund"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-amount">Target Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="fc-amount"
                type="number"
                min="0"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className={`pl-7 ${errors.targetAmount ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.targetAmount && <p className="text-xs text-destructive">{errors.targetAmount}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fc-notes">Notes (optional)</Label>
            <Textarea
              id="fc-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
            className="text-white"
          >
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Forecast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
