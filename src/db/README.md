# Database Documentation

This application uses **IndexedDB** via **Dexie.js** for local data storage.

## Structure

### Files
- `database.ts` - Database schema definition
- `services.ts` - CRUD operations for budgets and transactions
- `hooks.ts` - React hooks for easy data access with live updates
- `index.ts` - Convenient export file

## Database Schema

### Tables

#### `budgets`
- **Primary Key**: `id` (string)
- **Indexes**: `title`, `period`, `createdAt`
- **Fields**:
  - `id`: string
  - `title`: string
  - `amount`: number
  - `spent`: number
  - `period`: 'monthly' | 'weekly' | 'yearly'
  - `createdAt`: string (ISO date)
  - `categories`: string[] (optional)
  - `transactionIds`: string[] (optional)

#### `transactions`
- **Primary Key**: `id` (string)
- **Indexes**: `date`, `type`, `category`, `account`, `budgetId`, `status`
- **Fields**:
  - `id`: string
  - `date`: string (ISO date)
  - `description`: string
  - `amount`: number
  - `type`: 'income' | 'expense'
  - `category`: string
  - `account`: string
  - `notes`: string (optional)
  - `status`: 'pending' | 'cleared' | 'reconciled' (optional)
  - `budgetId`: string (optional)

## Usage

### Services (for manual operations)

```typescript
import { budgetService, transactionService, databaseService } from '../db';

// Create a budget
const budget = await budgetService.create({
  title: 'Groceries',
  amount: 500,
  spent: 0,
  period: 'monthly',
  transactionIds: [],
});

// Get all budgets
const budgets = await budgetService.getAll();

// Update a budget
await budgetService.update(budgetId, { amount: 600 });

// Delete a budget
await budgetService.delete(budgetId);

// Allocate transactions to budget
await budgetService.allocateTransactions(budgetId, ['txn1', 'txn2']);

// Create a transaction
const transaction = await transactionService.create({
  date: new Date().toISOString(),
  description: 'Whole Foods',
  amount: 125.50,
  type: 'expense',
  category: 'Groceries',
  account: 'Chase Checking',
});

// Get all transactions
const transactions = await transactionService.getAll();
```

### React Hooks (for live updates)

```typescript
import { useBudgets, useTransactions, useBudgetSpent } from '../db/hooks';

function MyComponent() {
  // Automatically updates when database changes
  const budgets = useBudgets();
  const transactions = useTransactions();

  // Get spent amount for a budget
  const spent = useBudgetSpent(budget, transactions);

  return <div>...</div>;
}
```

### Available Hooks

- `useBudgets()` - Get all budgets with live updates
- `useTransactions()` - Get all transactions with live updates
- `useBudget(id)` - Get single budget by ID
- `useBudgetTransactions(budgetId)` - Get transactions for a budget
- `useTransactionsByType(type)` - Get transactions by type
- `useDatabaseStats()` - Get overall statistics
- `useBudgetSpent(budget, transactions)` - Calculate spent amount

## Database Utilities

```typescript
import { databaseService } from '../db';

// Clear all data
await databaseService.clearAll();

// Export data (for backup)
const data = await databaseService.exportData();
// Returns: { budgets: Budget[], transactions: Transaction[] }

// Import data (for restore)
await databaseService.importData(data);

// Get statistics
const stats = await databaseService.getStats();
// Returns: { totalBudgets, totalTransactions, totalIncome, totalExpenses }
```

## Initialization

The database automatically initializes with sample data on first load:
- Sample transactions from `mockData.ts`
- One default "Monthly Budget"

This happens in `initializeDatabase()` function, which is called in `BudgetPage.tsx`.

## Data Persistence

- Data persists across browser sessions
- Each user's data is isolated per browser/domain
- Data survives page refreshes and browser restarts
- No server/internet connection required

## Storage Limits

IndexedDB typically allows:
- Chrome/Edge: ~60% of available disk space
- Firefox: Up to 2GB per origin
- Safari: 1GB per origin

This is **far more** than localStorage's 5-10MB limit.

## Benefits Over localStorage

1. ✅ **Asynchronous** - Doesn't block UI
2. ✅ **Structured queries** - Can filter, sort, and index data
3. ✅ **Type safety** - Works great with TypeScript
4. ✅ **Live updates** - React hooks auto-update components
5. ✅ **Much larger storage** - Hundreds of MB vs 5-10MB
6. ✅ **Better performance** - Optimized for large datasets
7. ✅ **No JSON serialization** - Store objects directly
