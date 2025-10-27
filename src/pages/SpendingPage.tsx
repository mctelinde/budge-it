import React from 'react';
import { Paper, Typography } from '@mui/material';

export const SpendingPage: React.FC = () => {
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
        <li>Identify excessive spending categories</li>
        <li>Spending trends and patterns over time</li>
        <li>Top spending categories analysis</li>
        <li>Budget vs. actual spending comparison</li>
        <li>Spending alerts and recommendations</li>
        <li>Visual charts and graphs</li>
      </ul>
    </Paper>
  );
};
