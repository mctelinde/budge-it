import React from 'react';
import { TrendingUp, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BudgetCardCondensedProps {
  title: string;
  period: 'monthly' | 'weekly' | 'yearly';
  budgetTotal: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  transactionCount: number;
  pinned?: boolean;
  onPinToggle?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

export const BudgetCardCondensed: React.FC<BudgetCardCondensedProps> = ({
  title,
  period,
  budgetTotal: _budgetTotal,
  spent,
  remaining,
  percentageUsed,
  transactionCount,
  pinned = false,
  onPinToggle,
  onClick,
}) => {
  const progressColor =
    percentageUsed < 70 ? '#14959c' : percentageUsed < 90 ? '#f97316' : '#ea580c';

  const periodLabel = period === 'weekly' ? 'Week' : period === 'yearly' ? 'Year' : 'Month';

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(20,149,156,0.08) 0%, rgba(31,181,188,0.08) 100%)',
        borderColor: 'rgba(20,149,156,0.2)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[#14959c] truncate">{title}</span>
            {onPinToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={onPinToggle}
                style={{ color: pinned ? '#14959c' : undefined }}
                title={pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className={`size-3.5 ${pinned ? 'fill-current' : ''}`} />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {periodLabel} • {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 ml-2 font-semibold text-xs"
          style={{ background: `${progressColor}20`, color: progressColor }}
        >
          <TrendingUp className="size-3 mr-1" />
          {percentageUsed.toFixed(0)}%
        </Badge>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(percentageUsed, 100)}%`, background: progressColor }}
        />
      </div>

      <div className="flex justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Spent</p>
          <p className="font-semibold text-orange-600">${spent.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="font-semibold text-[#14959c]">${remaining.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};
