import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './database';
import { Budget, Transaction } from '../types/transaction';
import { budgetService, transactionService } from './services';

/**
 * Hook to get all budgets with live updates
 */
export const useBudgets = () => {
  return useLiveQuery(() => db.budgets.toArray(), []) || [];
};

/**
 * Hook to get all transactions with live updates
 */
export const useTransactions = () => {
  return useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), []) || [];
};

/**
 * Hook to get a single budget by ID with live updates
 */
export const useBudget = (id: string | undefined) => {
  return useLiveQuery(() => (id ? db.budgets.get(id) : undefined), [id]);
};

/**
 * Hook to get transactions for a specific budget with live updates
 */
export const useBudgetTransactions = (budgetId: string | undefined) => {
  return useLiveQuery(
    () => (budgetId ? db.transactions.where('budgetId').equals(budgetId).toArray() : []),
    [budgetId]
  ) || [];
};

/**
 * Hook to get transactions by type (income/expense) with live updates
 */
export const useTransactionsByType = (type: 'income' | 'expense') => {
  return useLiveQuery(() => db.transactions.where('type').equals(type).toArray(), [type]) || [];
};

/**
 * Hook for database statistics
 */
export const useDatabaseStats = () => {
  const [stats, setStats] = useState({
    totalBudgets: 0,
    totalTransactions: 0,
    totalIncome: 0,
    totalExpenses: 0,
  });

  const budgets = useBudgets();
  const transactions = useTransactions();

  useEffect(() => {
    const income = transactions
      .filter((t: Transaction) => t.type === 'income')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t: Transaction) => t.type === 'expense')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

    setStats({
      totalBudgets: budgets.length,
      totalTransactions: transactions.length,
      totalIncome: income,
      totalExpenses: expenses,
    });
  }, [budgets, transactions]);

  return stats;
};

/**
 * Hook to calculate spent amount for a budget
 */
export const useBudgetSpent = (budget: Budget | undefined, transactions: Transaction[]) => {
  if (!budget?.transactionIds || budget.transactionIds.length === 0) {
    return 0;
  }
  return transactions
    .filter((t) => budget.transactionIds?.includes(t.id) && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};
