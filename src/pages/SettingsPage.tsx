import React from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Category as CategoryIcon,
  AccountBalance,
  Notifications,
  Palette,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
  const settingsItems = [
    {
      title: 'Manage Categories',
      description: 'Create, edit, and organize transaction categories',
      icon: <CategoryIcon />,
      path: '/settings/categories',
    },
    {
      title: 'Accounts',
      description: 'Manage your bank accounts and payment methods',
      icon: <AccountBalance />,
      path: '/settings/accounts',
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and reminders',
      icon: <Notifications />,
      path: '/settings/notifications',
    },
    {
      title: 'Appearance',
      description: 'Customize the look and feel of the app',
      icon: <Palette />,
      path: '/settings/appearance',
    },
  ];

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
    </Paper>
  );
};
