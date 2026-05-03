import React from 'react';
import { Pencil, Trash2, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Forecast, Budget } from '@shared/types/transaction';
import type { ForecastResult } from '@shared/utils/forecastCalculations';
import { calculateRemaining } from '@shared/utils/budgetCalculations';

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
  const isAchieved = !!forecast.achievedAt;
  const currentRemaining = calculateRemaining(budget, computedSpent);
  const progress = Math.min(100, Math.max(0, (currentRemaining / forecast.targetAmount) * 100));

  const progressColor = isAchieved || forecastResult.isAchievableNow
    ? '[&>div]:bg-green-500'
    : '[&>div]:bg-[#14959c]';

  return (
    <Card className={cn('border', isAchieved && 'opacity-75')}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="size-4 shrink-0 text-[#14959c]" />
            <h3 className="font-semibold text-base truncate">{forecast.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAchieved && (
              <Badge variant="outline" className="border-green-500 text-green-600 dark:text-green-400 text-xs">
                <CheckCircle className="size-3 mr-1" />
                Achieved {new Date(forecast.achievedAt!).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Badge>
            )}
            {!isAchieved && forecastResult.isAchievableNow && (
              <Badge className="bg-green-500 text-white text-xs">Ready now! 🎉</Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
                  <Pencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            {!isAchieved && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-7 text-green-600 hover:text-green-700" onClick={onMarkAchieved}>
                    <CheckCircle className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as Achieved</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={onDelete}>
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Budget name */}
        <p className="text-sm text-muted-foreground mb-1">
          Budget: <strong className="text-foreground">{budget.title}</strong>
        </p>

        {/* Notes */}
        {forecast.notes && (
          <p className="text-sm text-muted-foreground italic mb-2">{forecast.notes}</p>
        )}

        {/* Stats row */}
        <div className="flex gap-6 flex-wrap mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-semibold">{formatCurrency(forecast.targetAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Remaining</p>
            <p className={cn('font-semibold', currentRemaining < 0 && 'text-destructive')}>
              {formatCurrency(currentRemaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Shortfall</p>
            <p className={cn('font-semibold', forecastResult.shortfall > 0 ? 'text-amber-500' : 'text-green-600')}>
              {forecastResult.shortfall > 0 ? formatCurrency(forecastResult.shortfall) : '—'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className={cn('h-2 mb-2', progressColor)} />

        {/* Projection text */}
        {!isAchieved && (
          <p className="text-sm text-muted-foreground">
            {forecastResult.isAchievableNow
              ? 'You already have enough to make this purchase!'
              : forecastResult.projectedDate
                ? `Projected reach date: ${formatProjectedDate(forecastResult.projectedDate)} (${forecastResult.periodsNeeded} ${budget.period === 'weekly' ? 'week' : budget.period === 'yearly' ? 'year' : 'month'}${forecastResult.periodsNeeded !== 1 ? 's' : ''})`
                : 'Cannot project — budget has no per-period credit.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
