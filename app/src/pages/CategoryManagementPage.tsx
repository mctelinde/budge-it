import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { categoryService } from '@/services/database';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<'income' | 'expense'>('expense');
  const [saving, setSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType('expense');
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError('Failed to delete category.');
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!categoryName.trim()) return;
    setSaving(true);
    try {
      if (editingCategory) {
        await categoryService.update(editingCategory.id, { name: categoryName.trim(), type: categoryType });
        setCategories((prev) =>
          prev.map((c) => c.id === editingCategory.id ? { ...c, name: categoryName.trim(), type: categoryType } : c)
        );
      } else {
        const newCat = await categoryService.create({ name: categoryName.trim(), type: categoryType });
        setCategories((prev) => [...prev, newCat]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError('Failed to save category.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Manage your transaction categories</p>
        <Button
          onClick={openAdd}
          style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
          className="text-white"
        >
          <Plus className="size-4 mr-1.5" /> Add Category
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-xs underline">Dismiss</button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="size-7 rounded-full border-2 border-[#14959c] border-t-transparent animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No categories yet. Add one to get started.
            </p>
          ) : (
            categories.map((category, index) => (
              <React.Fragment key={category.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{category.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{category.type}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="size-8 text-[#14959c] dark:text-[#1fb5bc]"
                      onClick={() => openEdit(category)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive"
                      onClick={() => handleDelete(category.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {index < categories.length - 1 && <Separator />}
              </React.Fragment>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(o) => !saving && setDialogOpen(o)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                autoFocus
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <ToggleGroup
                type="single"
                value={categoryType}
                onValueChange={(v) => v && setCategoryType(v as 'income' | 'expense')}
                className="justify-start"
              >
                <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
                <ToggleGroupItem value="income">Income</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!categoryName.trim() || saving}
              style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)' }}
              className="text-white"
            >
              {saving ? 'Saving…' : editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
