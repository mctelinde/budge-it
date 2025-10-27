import { Transaction } from '../types/transaction';

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-10-25',
    description: 'Monthly Salary',
    amount: 5000.00,
    type: 'income',
    category: 'Salary',
    account: 'Chase Checking',
    status: 'cleared'
  },
  {
    id: '2',
    date: '2025-10-24',
    description: 'Grocery Shopping - Whole Foods',
    amount: 189.47,
    type: 'expense',
    category: 'Groceries',
    account: 'Chase Credit Card',
    notes: 'Weekly groceries and household items',
    status: 'cleared'
  },
  {
    id: '3',
    date: '2025-10-24',
    description: 'Netflix Subscription',
    amount: 19.99,
    type: 'expense',
    category: 'Entertainment',
    account: 'Amex Credit Card',
    status: 'cleared'
  },
  {
    id: '4',
    date: '2025-10-23',
    description: 'Freelance Work - Web Design',
    amount: 750.00,
    type: 'income',
    category: 'Freelance',
    account: 'Chase Checking',
    notes: 'Logo design project for client',
    status: 'pending'
  },
  {
    id: '5',
    date: '2025-10-23',
    description: 'Gas Station - Shell',
    amount: 48.55,
    type: 'expense',
    category: 'Transportation',
    account: 'Chase Credit Card',
    status: 'cleared'
  },
  {
    id: '6',
    date: '2025-10-22',
    description: 'Electricity Bill',
    amount: 145.32,
    type: 'expense',
    category: 'Utilities',
    account: 'Chase Checking',
    status: 'cleared'
  },
  {
    id: '7',
    date: '2025-10-22',
    description: 'Restaurant - Cheesecake Factory',
    amount: 86.75,
    type: 'expense',
    category: 'Dining Out',
    account: 'Amex Credit Card',
    notes: 'Dinner with friends',
    status: 'pending'
  },
  {
    id: '8',
    date: '2025-10-21',
    description: 'Amazon Prime',
    amount: 14.99,
    type: 'expense',
    category: 'Subscriptions',
    account: 'Chase Credit Card',
    status: 'cleared'
  },
  {
    id: '9',
    date: '2025-10-21',
    description: 'Investment Dividend',
    amount: 235.50,
    type: 'income',
    category: 'Investments',
    account: 'Vanguard Account',
    status: 'cleared'
  },
  {
    id: '10',
    date: '2025-10-20',
    description: 'Gym Membership',
    amount: 55.00,
    type: 'expense',
    category: 'Health & Fitness',
    account: 'Chase Credit Card',
    status: 'cleared'
  }
];