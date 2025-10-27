import React from 'react';
import { Paper, Typography } from '@mui/material';

export const CategoriesPage: React.FC = () => {
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
        <li>Spending breakdown by category</li>
        <li>Category trends over time</li>
        <li>Top spending categories</li>
        <li>Category budget vs. actual comparison</li>
        <li>Visual charts and graphs</li>
      </ul>
    </Paper>
  );
};