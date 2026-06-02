import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { categoryService, accountService } from '@/services/database';
import type { Transaction } from '@shared/types/transaction';

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
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    type: 'expense',
    category: '',
    account: '',
    notes: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);

  useEffect(() => {
    categoryService.getAll()
      .then((data) => setCategories(data.map((c) => c.name).sort()))
      .catch(() => setCategories([]));
    accountService.getAll()
      .then((data) => setAccounts(data.map((a) => a.name).sort()))
      .catch(() => setAccounts([]));
  }, []);

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

  const set = (field: keyof Transaction, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg !flex !flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
        </DialogHeader>

        <form id="txn-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
                  className="pl-7"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Account</Label>
            <Select value={formData.account} onValueChange={(v) => set('account', v)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
            />
          </div>
        </form>

        <DialogFooter className="flex flex-row items-center justify-between">
          <div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              form="txn-form"
              style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)', color: '#fff' }}
            >
              {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
