import { supabase } from '../lib/supabase';
import { Budget, Transaction } from '../types/transaction';

/**
 * Database service layer for Supabase operations
 * This replaces the Dexie.js database with Supabase
 */

// ==================== BUDGETS ====================

export const budgetService = {
  /**
   * Get all budgets for the current user
   */
  async getAll(): Promise<Budget[]> {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch transaction IDs for each budget
    const budgets = (data || []).map(mapBudgetFromDb);

    for (const budget of budgets) {
      const { data: txnData } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('budget_id', budget.id);

      budget.transactionIds = (txnData || []).map((t: any) => t.id);
    }

    return budgets;
  },

  /**
   * Get a single budget by ID
   */
  async getById(id: string): Promise<Budget | null> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapBudgetFromDb(data);
  },

  /**
   * Create a new budget
   */
  async create(budget: Omit<Budget, 'id' | 'createdAt'>): Promise<Budget> {
    const user = await getCurrentUser();

    const insertData: any = {
      user_id: user.id,
      title: budget.title,
      amount: budget.amount,
      period: budget.period,
      spent: budget.spent ?? 0,
      starting_balance: budget.startingBalance ?? 0,
    };

    // Only include optional fields if they are defined
    if (budget.startDate !== undefined) {
      insertData.start_date = budget.startDate;
    }
    if (budget.rolloverDay !== undefined) {
      insertData.rollover_day = budget.rolloverDay;
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert([insertData] as any)
      .select()
      .single();

    if (error) throw error;

    return mapBudgetFromDb(data);
  },  /**
   * Update an existing budget
   */
  async update(id: string, updates: Partial<Budget>): Promise<Budget> {
    const updateData: Record<string, any> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.period !== undefined) updateData.period = updates.period;
    if (updates.spent !== undefined) updateData.spent = updates.spent;
    if (updates.startingBalance !== undefined) updateData.starting_balance = updates.startingBalance;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.rolloverDay !== undefined) updateData.rollover_day = updates.rolloverDay;

    const { data, error } = await (supabase
      .from('budgets')
      .update as any)(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapBudgetFromDb(data);
  },

  /**
   * Delete a budget
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Allocate transactions to a budget
   * Updates the budget_id field on specified transactions
   */
  async allocateTransactions(budgetId: string, transactionIds: string[]): Promise<void> {
    const user = await getCurrentUser();

    // First, clear any existing allocations for this budget
    const { error: clearError } = await (supabase
      .from('transactions')
      .update as any)({ budget_id: null })
      .eq('user_id', user.id)
      .eq('budget_id', budgetId);

    if (clearError) throw clearError;

    // Then, allocate the new transactions to this budget
    if (transactionIds.length > 0) {
      const { error: allocateError } = await (supabase
        .from('transactions')
        .update as any)({ budget_id: budgetId })
        .eq('user_id', user.id)
        .in('id', transactionIds);

      if (allocateError) throw allocateError;
    }
  },
};

// ==================== TRANSACTIONS ====================

export const transactionService = {
  /**
   * Get all transactions for the current user
   */
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTransactionFromDb);
  },

  /**
   * Get transactions by budget ID
   */
  async getByBudgetId(budgetId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('budget_id', budgetId)
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapTransactionFromDb);
  },

  /**
   * Get a single transaction by ID
   */
  async getById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return mapTransactionFromDb(data);
  },

  /**
   * Create a new transaction
   */
  async create(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        budget_id: transaction.budgetId ?? null,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        account: transaction.account,
        notes: transaction.notes ?? null,
        status: transaction.status ?? 'cleared',
      }] as any)
      .select()
      .single();

    if (error) throw error;

    return mapTransactionFromDb(data);
  },

  /**
   * Create multiple transactions (bulk insert)
   */
  async createMany(transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]> {
    const user = await getCurrentUser();

    const inserts = transactions.map(txn => ({
      user_id: user.id,
      budget_id: txn.budgetId ?? null,
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      type: txn.type,
      category: txn.category,
      account: txn.account,
      notes: txn.notes ?? null,
      status: txn.status ?? 'cleared',
    }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(inserts as any)
      .select();

    if (error) throw error;

    return (data || []).map(mapTransactionFromDb);
  },

  /**
   * Update an existing transaction
   */
  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const updateData: Record<string, any> = {};

    if (updates.budgetId !== undefined) updateData.budget_id = updates.budgetId;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.account !== undefined) updateData.account = updates.account;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await (supabase
      .from('transactions')
      .update as any)(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return mapTransactionFromDb(data);
  },

  /**
   * Delete a transaction
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Delete multiple transactions
   */
  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  /**
   * Bulk create transactions (alias for createMany)
   */
  async bulkCreate(transactions: Omit<Transaction, 'id'>[]): Promise<Transaction[]> {
    return this.createMany(transactions);
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the current authenticated user
 */
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('User not authenticated');
  }

  return user;
}

/**
 * Map database budget to app Budget type
 */
function mapBudgetFromDb(dbBudget: any): Budget {
  return {
    id: dbBudget.id,
    title: dbBudget.title,
    amount: Number(dbBudget.amount),
    period: dbBudget.period,
    spent: Number(dbBudget.spent),
    startingBalance: Number(dbBudget.starting_balance || 0),
    startDate: dbBudget.start_date || undefined,
    rolloverDay: dbBudget.rollover_day || undefined,
    createdAt: dbBudget.created_at,
    transactionIds: [], // Will be populated when needed
  };
}

/**
 * Map database transaction to app Transaction type
 */
function mapTransactionFromDb(dbTxn: any): Transaction {
  return {
    id: dbTxn.id,
    budgetId: dbTxn.budget_id,
    date: dbTxn.date,
    description: dbTxn.description,
    amount: Number(dbTxn.amount),
    type: dbTxn.type,
    category: dbTxn.category,
    account: dbTxn.account,
    notes: dbTxn.notes,
    status: dbTxn.status,
  };
}

// ==================== CATEGORY SERVICE ====================

export const categoryService = {
  /**
   * Get all categories for the current user
   */
  async getAll(): Promise<Array<{ id: string; name: string; type: 'income' | 'expense'; color?: string; icon?: string }>> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
  },

  /**
   * Create a new category
   */
  async create(category: { name: string; type: 'income' | 'expense'; color?: string; icon?: string }): Promise<any> {
    const user = await getCurrentUser();

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        user_id: user.id,
        name: category.name,
        type: category.type,
        color: category.color ?? null,
        icon: category.icon ?? null,
      }] as any)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
