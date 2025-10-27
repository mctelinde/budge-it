import React from 'react';
import { Paper, Typography } from '@mui/material';

export const BillsPage: React.FC = () => {
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
        <li>Create and manage recurring bills</li>
        <li>Track due dates and payment status</li>
        <li>Link bills to transactions</li>
        <li>Set up payment reminders</li>
        <li>View bill payment history</li>
      </ul>
    </Paper>
  );
};
