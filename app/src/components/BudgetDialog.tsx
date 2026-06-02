import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Budget } from '@shared/types/transaction';

interface BudgetDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  budget?: Budget;
}

export const BudgetDialog: React.FC<BudgetDialogProps> = ({ open, onClose, onSave, budget }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [startingBalance, setStartingBalance] = useState('');
  const [startDate, setStartDate] = useState('');
  const [rolloverDay, setRolloverDay] = useState('1');

  useEffect(() => {
    if (open) {
      if (budget) {
        setTitle(budget.title);
        setAmount(budget.amount.toString());
        setPeriod(budget.period);
        setStartingBalance(budget.startingBalance?.toString() ?? '');
        setStartDate(budget.startDate ?? '');
        setRolloverDay(budget.rolloverDay?.toString() ?? '1');
      } else {
        setTitle('');
        setAmount('');
        setPeriod('monthly');
        setStartingBalance('');
        setStartDate(new Date().toISOString().split('T')[0]);
        setRolloverDay('1');
      }
    }
  }, [budget, open]);

  const isValid = title.trim() && amount && parseFloat(amount) > 0;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      title: title.trim(),
      amount: parseFloat(amount),
      period,
      categories: budget?.categories ?? [],
      startingBalance: startingBalance ? parseFloat(startingBalance) : 0,
      startDate: startDate || new Date().toISOString().split('T')[0],
      rolloverDay: rolloverDay ? parseInt(rolloverDay) : 1,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="bd-title">Budget Title</Label>
            <Input
              id="bd-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Groceries, Entertainment, Savings"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bd-amount">Budget Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="bd-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bd-starting">Starting Balance (optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="bd-starting"
                type="number"
                step="0.01"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">Previous balance from external tracking (can be negative)</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bd-start">Start Date</Label>
            <Input
              id="bd-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Budget tracking begins on this date</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bd-rollover">Rollover Day</Label>
            <Input
              id="bd-rollover"
              type="number"
              min="1"
              max="31"
              value={rolloverDay}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (e.target.value === '' || (v >= 1 && v <= 31)) setRolloverDay(e.target.value);
              }}
            />
            <p className="text-xs text-muted-foreground">Day of month when budget amount is credited (1–31)</p>
          </div>

          <div className="space-y-1.5">
            <Label>Period</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
            className="text-white"
          >
            {budget ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
