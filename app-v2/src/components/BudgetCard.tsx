import React, { useState } from 'react';
import {
  ChevronDown,
  Pencil,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { generateBudgetLifecycleData } from '@shared/utils/budgetGraphData';
import { calculateNextPeriodInstallments } from '@shared/utils/budgetCalculations';
import type { Transaction, InstallmentPlan, RecurringCharge } from '@shared/types/transaction';

interface BudgetCardProps {
  title?: string;
  period?: 'monthly' | 'weekly' | 'yearly';
  budgetTotal: number;
  spent: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  transactionCount?: number;
  startingBalance?: number;
  startDate?: string;
  cumulativeBudget?: number;
  elapsedPeriods?: number;
  allocatedTransactions?: Transaction[];
  rolloverDay?: number;
  installmentPlans?: InstallmentPlan[];
  recurringCharges?: RecurringCharge[];
  onEdit?: () => void;
  onDelete?: () => void;
  onManageTransactions?: () => void;
  onTransactionCountClick?: () => void;
}

interface CustomChartTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color: string; dataKey: string }[];
  label?: string;
}

const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  // Deduplicate by dataKey (Area + Line both use dataKey="balance") and skip zero values
  const seen = new Set<string>();
  const entries = payload.filter(e => {
    if (e.value === 0 || seen.has(e.dataKey)) return false;
    seen.add(e.dataKey);
    return true;
  });
  if (!entries.length) return null;
  return (
    <div
      className="rounded-lg border border-[#14959c] p-2 text-xs shadow-lg"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <p className="font-medium mb-1">{label}</p>
      {entries.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: ${entry.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
};

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
  rolloverDay,
  installmentPlans = [],
  recurringCharges = [],
  onEdit,
  onDelete,
  onManageTransactions,
  onTransactionCountClick,
}) => {
  const [expanded, setExpanded] = useState(true);

  const totalBudgetAvailable = cumulativeBudget ?? budgetTotal;
  const totalAvailable = startingBalance + totalBudgetAvailable;
  const remaining = totalAvailable - spent;
  const percentageUsed = totalAvailable > 0 ? (spent / totalAvailable) * 100 : 0;

  const progressColor =
    percentageUsed < 70 ? '#14959c' : percentageUsed < 90 ? '#f97316' : '#ea580c';

  const nextPeriodInstallments = calculateNextPeriodInstallments(installmentPlans, period, rolloverDay);
  const nextPeriodRecurring = recurringCharges.reduce((sum, charge) => {
    const isEnded = charge.endPeriodDate && new Date(charge.endPeriodDate) <= new Date();
    return isEnded ? sum : sum + charge.amount;
  }, 0);
  const nextStartingBalance = remaining + budgetTotal - nextPeriodInstallments - nextPeriodRecurring;

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statCls = 'rounded-xl border p-3 bg-muted/30';

  return (
    <div
      className="rounded-xl border mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(20,149,156,0.08) 0%, rgba(31,181,188,0.08) 100%)',
        borderColor: 'rgba(20,149,156,0.2)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-base font-semibold text-[#14959c] truncate">{title}</h3>
              {(onEdit || onDelete) && (
                <div className="flex gap-0.5">
                  {onEdit && (
                    <Button variant="ghost" size="icon" className="size-6" onClick={onEdit}>
                      <Pencil className="size-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" className="size-6 text-destructive hover:text-destructive" onClick={onDelete}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {period}
              {startDate && ` • Since ${new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </p>
          </div>
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 ml-2 shrink-0">
                <ChevronDown className={`size-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleContent>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4"
              style={{ gridTemplateColumns: startingBalance !== 0 ? undefined : undefined }}>
              <div className={statCls}>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {elapsedPeriods && elapsedPeriods > 1 ? `Budget (${elapsedPeriods} periods)` : 'Budget'}
                </p>
                <p className="text-xl font-semibold text-[#14959c]">${fmt(totalBudgetAvailable)}</p>
                {elapsedPeriods && elapsedPeriods > 1 && (
                  <p className="text-xs text-muted-foreground">${fmt(budgetTotal)} per period</p>
                )}
              </div>

              <div className={statCls}>
                <p className="text-xs text-muted-foreground mb-0.5">Spent</p>
                <p className="text-xl font-semibold text-orange-600">${fmt(spent)}</p>
              </div>

              <div className={statCls}>
                <p className="text-xs text-muted-foreground mb-0.5">Remaining</p>
                <p className={`text-xl font-semibold ${remaining >= 0 ? 'text-[#14959c]' : 'text-red-600'}`}>
                  {remaining < 0 ? '-' : ''}${fmt(Math.abs(remaining))}
                </p>
              </div>

              {startingBalance !== 0 && (
                <div className={statCls}>
                  <p className="text-xs text-muted-foreground mb-0.5">Starting Balance</p>
                  <p className={`text-xl font-semibold ${startingBalance >= 0 ? 'text-[#14959c]' : 'text-red-600'}`}>
                    {startingBalance >= 0 ? '+' : '-'}${fmt(Math.abs(startingBalance))}
                  </p>
                </div>
              )}

              <div className={statCls}>
                <p className="text-xs text-muted-foreground mb-0.5">Next Starting Balance</p>
                <p className={`text-xl font-semibold ${nextStartingBalance >= 0 ? 'text-[#14959c]' : 'text-red-600'}`}>
                  {nextStartingBalance < 0 ? '-' : ''}${fmt(Math.abs(nextStartingBalance))}
                </p>
                <p className="text-xs text-muted-foreground">if period ended today</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Budget Used</span>
                <span className="font-semibold">{percentageUsed.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(percentageUsed, 100)}%`, background: progressColor }}
                />
              </div>
            </div>

            {/* Manage Transactions */}
            {onManageTransactions && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Allocated Transactions</span>
                  <button
                    onClick={onTransactionCountClick}
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#14959c' }}
                  >
                    {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  style={{ borderColor: '#14959c', color: '#14959c' }}
                  onClick={onManageTransactions}
                >
                  <ClipboardList className="size-4 mr-2" />
                  Manage Transactions
                </Button>
              </div>
            )}

            {/* Budget Lifecycle Chart */}
            {startDate && allocatedTransactions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Budget Lifecycle</p>
                <div className="rounded-lg bg-muted/30 p-2">
                  <ResponsiveContainer width="100%" height={250} debounce={0}>
                    <ComposedChart
                      data={generateBudgetLifecycleData({
                        id: '',
                        title: title ?? '',
                        amount: budgetTotal,
                        period,
                        createdAt: '',
                        startDate,
                        startingBalance,
                        rolloverDay,
                        installmentPlans,
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
                      <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                      <ReferenceLine y={0} stroke="rgba(128,128,128,0.3)" strokeDasharray="3 3" />
                      <Bar dataKey="credit" fill="#14959c" name="Budget Added" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="debit" fill="#f97316" name="Spent" radius={[4, 4, 0, 0]} />
                      <Area type="monotone" dataKey="balance" fill="url(#splitColor)" stroke="none" legendType="none" isAnimationActive={false} />
                      <Line type="monotone" dataKey="balance" stroke="#0d7377" strokeWidth={2} name="Balance" dot={{ r: 3 }} isAnimationActive={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Top Categories */}
            {topCategories.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Top Expense Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {topCategories.map((cat, i) => (
                    <Badge
                      key={i}
                      className="text-white font-medium"
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)' }}
                    >
                      {cat.category}: ${cat.amount.toFixed(2)} ({cat.percentage.toFixed(1)}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};
