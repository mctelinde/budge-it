import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  useTheme,
  Chip,
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';

interface BudgetCardCondensedProps {
  title: string;
  period: 'monthly' | 'weekly' | 'yearly';
  budgetTotal: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  transactionCount: number;
  onClick?: () => void;
}

export const BudgetCardCondensed: React.FC<BudgetCardCondensedProps> = ({
  title,
  period,
  budgetTotal,
  spent,
  remaining,
  percentageUsed,
  transactionCount,
  onClick,
}) => {
  const theme = useTheme();

  const getProgressColor = () => {
    if (percentageUsed < 70) return '#14959c';
    if (percentageUsed < 90) return '#ff9800';
    return '#ff6f00';
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'weekly': return 'Week';
      case 'yearly': return 'Year';
      default: return 'Month';
    }
  };

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(13, 115, 119, 0.15) 0%, rgba(20, 149, 156, 0.15) 100%)'
          : 'linear-gradient(135deg, rgba(20, 149, 156, 0.08) 0%, rgba(31, 181, 188, 0.08) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.3)' : 'rgba(20, 149, 156, 0.2)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 6px 16px rgba(0, 0, 0, 0.4)'
            : '0 6px 16px rgba(0, 0, 0, 0.15)',
        } : {},
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#14959c', mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getPeriodLabel()} • {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp sx={{ fontSize: 16 }} />}
            label={`${percentageUsed.toFixed(0)}%`}
            size="small"
            sx={{
              backgroundColor: `${getProgressColor()}20`,
              color: getProgressColor(),
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Box sx={{ mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentageUsed, 100)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${getProgressColor()} 0%, ${getProgressColor()}dd 100%)`,
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Spent
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#ff6f00' }}>
              ${spent.toFixed(2)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Remaining
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#14959c' }}>
              ${remaining.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
