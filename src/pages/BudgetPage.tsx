import React from 'react';
import { Paper, Typography } from '@mui/material';

export const BudgetPage: React.FC = () => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 0,
        backgroundColor: 'transparent',
      }}
    >
      <Typography variant="body1" sx={{ mt: 1, color: 'text.secondary' }}>
        Coming soon:
      </Typography>
      <ul style={{ 
        color: 'text.secondary',
        marginTop: '8px',
        paddingLeft: '24px'
      }}>
        <li>Budget category creation and management</li>
        <li>Budget amount allocation</li>
        <li>Transaction tagging interface</li>
        <li>Budget vs. Actual tracking</li>
      </ul>
    </Paper>
  );
};