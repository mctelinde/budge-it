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
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Button } from '@mui/material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine, Area } from 'recharts';
import { Transaction } from '../types/transaction';
import { generateBudgetLifecycleData } from '../utils/budgetGraphData';

interface BudgetCardProps {
  title?: string;
  period?: 'monthly' | 'weekly' | 'yearly';
  budgetTotal: number;
  spent: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  transactionCount?: number;
  startingBalance?: number;
  startDate?: string;
  cumulativeBudget?: number; // Total budget accumulated over time
  elapsedPeriods?: number; // Number of periods that have passed
  allocatedTransactions?: Transaction[]; // Transactions allocated to this budget
  onEdit?: () => void;
  onDelete?: () => void;
  onManageTransactions?: () => void;
  onTransactionCountClick?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  title = 'Monthly Budget Overview',
  period = 'monthly',
  budgetTotal,
  spent,
  topCategories,
  transactionCount = 0,
  startingBalance = 0,
  startDate,
  cumulativeBudget,
  elapsedPeriods,
  allocatedTransactions = [],
  onEdit,
  onDelete,
  onManageTransactions,
  onTransactionCountClick,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(true);

  // Use cumulative budget if provided, otherwise fall back to single period
  const totalBudgetAvailable = cumulativeBudget ?? budgetTotal;
  const totalAvailable = startingBalance + totalBudgetAvailable;
  const remaining = totalAvailable - spent;
  const percentageUsed = totalAvailable > 0 ? (spent / totalAvailable) * 100 : 0;

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#14959c' }}>
                {title}
              </Typography>
              {(onEdit || onDelete) && (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {onEdit && (
                    <IconButton
                      size="small"
                      onClick={onEdit}
                      sx={{
                        padding: '4px',
                        '&:hover': {
                          backgroundColor: 'rgba(20, 149, 156, 0.1)',
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton
                      size="small"
                      onClick={onDelete}
                      sx={{
                        padding: '4px',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {period}
              {startDate && ` • Since ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
              ml: 1,
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box>
            {/* Budget Stats - Single Row */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr 1fr',
                  sm: startingBalance !== 0 ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)'
                },
                gap: 3,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {elapsedPeriods && elapsedPeriods > 1 ? `Budget (${elapsedPeriods} periods)` : 'Budget'}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#14959c' }}>
                  ${totalBudgetAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                {elapsedPeriods && elapsedPeriods > 1 && (
                  <Typography variant="caption" color="text.secondary">
                    ${budgetTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per period
                  </Typography>
                )}
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
                  {remaining >= 0 ? '' : '-'}${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </Box>

              {startingBalance !== 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Starting Balance
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: startingBalance >= 0 ? '#14959c' : '#d84315',
                    }}
                  >
                    {startingBalance >= 0 ? '+' : '-'}${Math.abs(startingBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              )}
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

            {/* Transaction Allocation */}
            {onManageTransactions && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Allocated Transactions
                  </Typography>
                  <Chip
                    label={`${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}`}
                    size="small"
                    onClick={onTransactionCountClick}
                    sx={{
                      backgroundColor: '#14959c',
                      color: 'white',
                      fontWeight: 500,
                      cursor: onTransactionCountClick ? 'pointer' : 'default',
                      '&:hover': onTransactionCountClick ? {
                        backgroundColor: '#0d7378',
                      } : undefined,
                    }}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AssignmentIcon />}
                  onClick={onManageTransactions}
                  fullWidth
                  size="small"
                  sx={{
                    borderColor: '#14959c',
                    color: '#14959c',
                    '&:hover': {
                      borderColor: '#0d7378',
                      backgroundColor: 'rgba(20, 149, 156, 0.08)',
                    },
                  }}
                >
                  Manage Transactions
                </Button>
              </Box>
            )}

            {/* Budget Lifecycle Graph */}
            {startDate && allocatedTransactions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Budget Lifecycle
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <ComposedChart
                      data={generateBudgetLifecycleData({
                        id: '',
                        title: title || '',
                        amount: budgetTotal,
                        spent: 0,
                        period,
                        createdAt: '',
                        startDate,
                        startingBalance
                      } as any, allocatedTransactions)}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset={0} stopColor="#ff6f00" stopOpacity={0.3} />
                          <stop offset={0.45} stopColor="#ff6f00" stopOpacity={0.05} />
                          <stop offset={0.55} stopColor="#0d7377" stopOpacity={0.05} />
                          <stop offset={1} stopColor="#0d7377" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        stroke={theme.palette.text.secondary}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
                          border: '1px solid #14959c',
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px' }}
                        iconType="circle"
                      />
                      <ReferenceLine
                        y={0}
                        stroke={theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                        strokeDasharray="3 3"
                      />
                      <Bar
                        dataKey="credit"
                        fill="#14959c"
                        name="Budget Added"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="debit"
                        fill="#ff6f00"
                        name="Spent"
                        radius={[4, 4, 0, 0]}
                      />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        fill="url(#splitColor)"
                        stroke="none"
                        legendType="none"
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#0d7377"
                        strokeWidth={2}
                        name="Balance"
                        dot={{ r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              </Box>
            )}

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
