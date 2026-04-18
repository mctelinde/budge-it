import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { Forecast, Budget } from '../types/transaction';
import { ForecastResult } from '../utils/forecastCalculations';
import { calculateRemaining } from '../utils/budgetCalculations';

interface ForecastCardProps {
  forecast: Forecast;
  budget: Budget;
  computedSpent: number;
  forecastResult: ForecastResult;
  onEdit: () => void;
  onMarkAchieved: () => void;
  onDelete: () => void;
}

function formatProjectedDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
  forecast,
  budget,
  computedSpent,
  forecastResult,
  onEdit,
  onMarkAchieved,
  onDelete,
}) => {
  const theme = useTheme();
  const isAchieved = !!forecast.achievedAt;
  const currentRemaining = calculateRemaining(budget, computedSpent);
  const progress = Math.min(100, (currentRemaining / forecast.targetAmount) * 100);
  const clampedProgress = Math.max(0, progress);

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        opacity: isAchieved ? 0.75 : 1,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" fontSize="small" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {forecast.title}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isAchieved && (
              <Chip
                icon={<CheckCircleIcon />}
                label={`Achieved ${new Date(forecast.achievedAt!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                color="success"
                size="small"
                variant="outlined"
              />
            )}
            {!isAchieved && forecastResult.isAchievableNow && (
              <Chip label="Ready now! 🎉" color="success" size="small" />
            )}
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {!isAchieved && (
              <Tooltip title="Mark as Achieved">
                <IconButton size="small" onClick={onMarkAchieved} color="success">
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" onClick={onDelete} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Budget: <strong>{budget.title}</strong>
        </Typography>

        {forecast.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
            {forecast.notes}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 3, mb: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Target</Typography>
            <Typography variant="body1" fontWeight={600}>
              {formatCurrency(forecast.targetAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Current Remaining</Typography>
            <Typography
              variant="body1"
              fontWeight={600}
              color={currentRemaining < 0 ? 'error.main' : 'text.primary'}
            >
              {formatCurrency(currentRemaining)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Shortfall</Typography>
            <Typography variant="body1" fontWeight={600} color={forecastResult.shortfall > 0 ? 'warning.main' : 'success.main'}>
              {forecastResult.shortfall > 0 ? formatCurrency(forecastResult.shortfall) : '—'}
            </Typography>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={clampedProgress}
          sx={{ mb: 1, height: 8, borderRadius: 4 }}
          color={isAchieved ? 'success' : forecastResult.isAchievableNow ? 'success' : 'primary'}
        />

        {!isAchieved && (
          <Typography variant="body2" color="text.secondary">
            {forecastResult.isAchievableNow
              ? 'You already have enough to make this purchase!'
              : forecastResult.projectedDate
                ? `Projected reach date: ${formatProjectedDate(forecastResult.projectedDate)} (${forecastResult.periodsNeeded} ${budget.period === 'weekly' ? 'week' : budget.period === 'yearly' ? 'year' : 'month'}${forecastResult.periodsNeeded !== 1 ? 's' : ''})`
                : 'Cannot project — budget has no per-period credit.'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
