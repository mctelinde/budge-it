import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Category as CategoryIcon,
  AccountBalance,
  Notifications,
  Palette,
  DeleteSweep as DeleteSweepIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const settingsItems = [
    {
      title: 'Manage Categories',
      description: 'Create, edit, and organize transaction categories',
      icon: <CategoryIcon />,
      path: '/app/settings/categories',
    },
    {
      title: 'Accounts',
      description: 'Manage your bank accounts and payment methods',
      icon: <AccountBalance />,
      path: '/app/settings/accounts',
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and reminders',
      icon: <Notifications />,
      path: '/app/settings/notifications',
    },
    {
      title: 'Appearance',
      description: 'Customize the look and feel of the app',
      icon: <Palette />,
      path: '/app/settings/appearance',
    },
  ];

  const handleClearData = async () => {
    setClearing(true);
    try {
      // Note: With Supabase, we can't easily clear all data from the client side
      // This would require server-side logic or manual deletion via Supabase dashboard
      alert('Data clearing is not yet implemented with Supabase. Please use the Supabase dashboard to manage your data.');
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('Failed to clear data. Please try again.');
    } finally {
      setClearing(false);
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
      <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
        Manage your application settings and preferences
      </Typography>

      <Paper
        elevation={0}
        sx={{
          backgroundColor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
        }}
      >
        <List>
          {settingsItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <ListItem
                component={Link}
                to={item.path}
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  py: 2,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <ListItemIcon sx={{
                  color: (theme) => theme.palette.mode === 'dark' ? '#14959c' : '#0d7377',
                  minWidth: 56,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                />
              </ListItem>
              {index < settingsItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Data Management Section */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(0, 0, 0, 0.2)'
            : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          mt: 3,
          p: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Data Management
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage your application data
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DeleteSweepIcon sx={{ color: '#d32f2f', fontSize: 40 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Clear All Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Remove all transactions, budgets, and settings. This action cannot be undone.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmDialogOpen(true)}
            sx={{
              borderColor: '#d32f2f',
              color: '#d32f2f',
              '&:hover': {
                borderColor: '#b71c1c',
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
              },
            }}
          >
            Clear Data
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !clearing && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: '#ff9800' }} />
          Confirm Clear All Data
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will permanently delete all your data including:
          </Alert>
          <Box component="ul" sx={{ pl: 2 }}>
            <li>All transactions</li>
            <li>All budgets and allocations</li>
            <li>All settings and preferences</li>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 600 }}>
            This action cannot be undone. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={clearing}>
            Cancel
          </Button>
          <Button
            onClick={handleClearData}
            variant="contained"
            color="error"
            disabled={clearing}
            sx={{
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#b71c1c',
              },
            }}
          >
            {clearing ? 'Clearing...' : 'Yes, Clear All Data'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
