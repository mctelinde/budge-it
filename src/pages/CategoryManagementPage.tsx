import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material';

interface Category {
  id: string;
  name: string;
}

export const CategoryManagementPage: React.FC = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Salary' },
    { id: '2', name: 'Freelance' },
    { id: '3', name: 'Investments' },
    { id: '4', name: 'Groceries' },
    { id: '5', name: 'Entertainment' },
    { id: '6', name: 'Transportation' },
    { id: '7', name: 'Utilities' },
    { id: '8', name: 'Dining Out' },
    { id: '9', name: 'Health & Fitness' },
    { id: '10', name: 'Shopping' },
    { id: '11', name: 'Other' },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');

  const handleAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = () => {
    if (!categoryName.trim()) return;

    if (editingCategory) {
      setCategories(prev =>
        prev.map(c => c.id === editingCategory.id
          ? { ...c, name: categoryName }
          : c
        )
      );
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryName,
      };
      setCategories(prev => [...prev, newCategory]);
    }

    setDialogOpen(false);
    setCategoryName('');
    setEditingCategory(null);
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

      <Paper
        elevation={0}
        sx={{
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
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
                primaryTypographyProps={{
                  fontWeight: 500,
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Category Name"
            type="text"
            fullWidth
            variant="outlined"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDialogOpen(false)}
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
            {editingCategory ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
