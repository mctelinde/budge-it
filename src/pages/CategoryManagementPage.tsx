import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';
import { categoryService } from '../services/database';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export const CategoryManagementPage: React.FC = () => {
  const theme = useTheme();
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

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryType('expense');
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryType(category.type);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await categoryService.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
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
        setCategories(prev =>
          prev.map(c => c.id === editingCategory.id ? { ...c, name: categoryName.trim(), type: categoryType } : c)
        );
      } else {
        const newCategory = await categoryService.create({ name: categoryName.trim(), type: categoryType });
        setCategories(prev => [...prev, newCategory]);
      }
      setDialogOpen(false);
      setCategoryName('');
      setEditingCategory(null);
    } catch (err) {
      setError('Failed to save category.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        backgroundColor: 'transparent',
      }}
    >
      <Box sx={{ mb: 4, mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
            fontSize: '1rem',
            fontWeight: 400,
            letterSpacing: '0.2px',
          }}
        >
          Manage your transaction categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
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
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#14959c' }} />
          </Box>
        ) : categories.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>
            No categories yet. Add one to get started.
          </Typography>
        ) : (
          <List>
            {categories.map((category) => (
              <ListItem
                key={category.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      edge="end"
                      onClick={() => handleEdit(category)}
                      sx={{ color: theme.palette.mode === 'dark' ? '#14959c' : '#0d7377' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(category.id)}
                      sx={{ color: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Stack>
                }
                sx={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                <ListItemText
                  primary={category.name}
                  secondary={category.type}
                  primaryTypographyProps={{ fontWeight: 500 }}
                  secondaryTypographyProps={{ sx: { textTransform: 'capitalize' } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Category Name"
              type="text"
              fullWidth
              variant="outlined"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Type
              </Typography>
              <ToggleButtonGroup
                value={categoryType}
                exclusive
                onChange={(_, val) => val && setCategoryType(val)}
                size="small"
              >
                <ToggleButton value="expense">Expense</ToggleButton>
                <ToggleButton value="income">Income</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={saving}
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
            onClick={handleSave}
            variant="contained"
            disabled={!categoryName.trim() || saving}
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
            {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
