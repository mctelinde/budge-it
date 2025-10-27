import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  useTheme,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';

interface BudgetCardProps {
  budgetTotal: number;
  spent: number;
  income: number;
  topCategories: { category: string; amount: number; percentage: number }[];
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budgetTotal,
  spent,
  income,
  topCategories,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(true);

  const remaining = budgetTotal - spent;
  const percentageUsed = (spent / budgetTotal) * 100;
  const netBalance = income - spent;

  const getProgressColor = () => {
    if (percentageUsed < 70) return '#14959c';
    if (percentageUsed < 90) return '#ff9800';
    return '#ff6f00';
  };

  return (
    <Card
      sx={{
        mb: 3,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(13, 115, 119, 0.15) 0%, rgba(20, 149, 156, 0.15) 100%)'
          : 'linear-gradient(135deg, rgba(20, 149, 156, 0.08) 0%, rgba(31, 181, 188, 0.08) 100%)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(20, 149, 156, 0.3)' : 'rgba(20, 149, 156, 0.2)'}`,
        boxShadow: theme.palette.mode === 'dark'
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#14959c' }}>
            Monthly Budget Overview
          </Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box>
            {/* Budget Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                gap: 3,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Budget
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#14959c' }}>
                  ${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Spent
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff6f00' }}>
                  ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Remaining
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: remaining >= 0 ? '#14959c' : '#d84315',
                  }}
                >
                  ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Budget Used
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {percentageUsed.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(percentageUsed, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, ${getProgressColor()} 0%, ${getProgressColor()}dd 100%)`,
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Net Balance */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                borderRadius: 2,
                background: theme.palette.mode === 'dark'
                  ? netBalance >= 0
                    ? 'rgba(20, 149, 156, 0.1)'
                    : 'rgba(216, 67, 21, 0.1)'
                  : netBalance >= 0
                    ? 'rgba(20, 149, 156, 0.05)'
                    : 'rgba(216, 67, 21, 0.05)',
                mb: 3,
              }}
            >
              {netBalance >= 0 ? (
                <TrendingUp sx={{ color: '#14959c', fontSize: '2rem' }} />
              ) : (
                <TrendingDown sx={{ color: '#d84315', fontSize: '2rem' }} />
              )}
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Net Balance (Income - Expenses)
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: netBalance >= 0 ? '#14959c' : '#d84315',
                  }}
                >
                  {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>

            {/* Top Expense Categories */}
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Top Expense Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {topCategories.map((cat, index) => (
                  <Chip
                    key={index}
                    label={`${cat.category}: $${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`}
                    sx={{
                      background: 'linear-gradient(135deg, #ff6f00 0%, #d84315 100%)',
                      color: '#ffffff',
                      fontWeight: 500,
                      fontSize: '0.813rem',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e65100 0%, #bf360c 100%)',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
