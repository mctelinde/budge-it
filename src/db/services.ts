import { db } from './database';
import { Transaction, Budget } from '../types/transaction';

// ============================================
// Budget Operations
// ============================================

export const budgetService = {
  async getAll(): Promise<Budget[]> {
    return await db.budgets.toArray();
  },

  async getById(id: string): Promise<Budget | undefined> {
    return await db.budgets.get(id);
  },

  async create(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      transactionIds: budget.transactionIds || [],
      startingBalance: budget.startingBalance ?? 0,
    };
    await db.budgets.add(newBudget);
    return newBudget;
  },

  async update(id: string, updates: Partial<Budget>): Promise<void> {
    await db.budgets.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    // Also unlink any transactions associated with this budget
    const transactions = await db.transactions
      .where('budgetId')
      .equals(id)
      .toArray();

    for (const transaction of transactions) {
      await db.transactions.update(transaction.id, { budgetId: undefined });
    }

    await db.budgets.delete(id);
  },

  async allocateTransactions(budgetId: string, transactionIds: string[]): Promise<void> {
    // First, get the budget and update its transaction IDs
    await db.budgets.update(budgetId, { transactionIds });

    // Get all transactions that were previously allocated to this budget
    const previouslyAllocated = await db.transactions
      .where('budgetId')
      .equals(budgetId)
      .toArray();

    // Remove budget ID from transactions that are no longer allocated
    for (const transaction of previouslyAllocated) {
      if (!transactionIds.includes(transaction.id)) {
        await db.transactions.update(transaction.id, { budgetId: undefined });
      }
    }

    // Add budget ID to newly allocated transactions
    for (const transactionId of transactionIds) {
      await db.transactions.update(transactionId, { budgetId });
    }
  },

  async calculateSpent(budget: Budget, transactions: Transaction[]): Promise<number> {
    if (!budget.transactionIds || budget.transactionIds.length === 0) {
      return 0;
    }
    return transactions
      .filter((t) => budget.transactionIds?.includes(t.id) && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },
};

// ============================================
// Transaction Operations
// ============================================

export const transactionService = {
  async getAll(): Promise<Transaction[]> {
    return await db.transactions.orderBy('date').reverse().toArray();
  },

  async getById(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  },

  async getByBudgetId(budgetId: string): Promise<Transaction[]> {
    return await db.transactions
      .where('budgetId')
      .equals(budgetId)
      .toArray();
  },

  async getByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    return await db.transactions
      .where('type')
      .equals(type)
      .toArray();
  },

  async getByCategory(category: string): Promise<Transaction[]> {
    return await db.transactions
      .where('category')
      .equals(category)
      .toArray();
  },

  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    await db.transactions.add(newTransaction);
    return newTransaction;
  },

  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    await db.transactions.update(id, updates);
  },

  async delete(id: string): Promise<void> {
    // Remove transaction from any budget that references it
    const transaction = await db.transactions.get(id);
    if (transaction?.budgetId) {
      const budget = await db.budgets.get(transaction.budgetId);
      if (budget?.transactionIds) {
        const updatedIds = budget.transactionIds.filter(tid => tid !== id);
        await db.budgets.update(transaction.budgetId, { transactionIds: updatedIds });
      }
    }

    await db.transactions.delete(id);
  },

  async bulkCreate(transactions: Transaction[]): Promise<void> {
    await db.transactions.bulkAdd(transactions);
  },
};

// ============================================
// Database Initialization
// ============================================

export const initializeDatabase = async (): Promise<void> => {
  // Database is ready - no mock data seeding
  // Users will import their own transactions via CSV
  console.log('Database initialized and ready for use.');
};

// ============================================
// Utility Functions
// ============================================

export const databaseService = {
  async clearAll(): Promise<void> {
    await db.transactions.clear();
    await db.budgets.clear();
  },

  async exportData(): Promise<{ budgets: Budget[]; transactions: Transaction[] }> {
    const budgets = await db.budgets.toArray();
    const transactions = await db.transactions.toArray();
    return { budgets, transactions };
  },

  async importData(data: { budgets: Budget[]; transactions: Transaction[] }): Promise<void> {
    await db.budgets.bulkAdd(data.budgets);
    await db.transactions.bulkAdd(data.transactions);
  },

  async getStats(): Promise<{
    totalBudgets: number;
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
  }> {
    const budgets = await db.budgets.count();
    const transactions = await db.transactions.toArray();

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalBudgets: budgets,
      totalTransactions: transactions.length,
      totalIncome: income,
      totalExpenses: expenses,
    };
  },
};
