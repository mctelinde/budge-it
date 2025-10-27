export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  account: string;
  notes?: string;
}

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2025-10-25',
    description: 'Monthly Salary',
    amount: 5000.00,
    type: 'income',
    category: 'Salary',
    account: 'Chase Checking'
  },
  {
    id: '2',
    date: '2025-10-24',
    description: 'Grocery Shopping - Whole Foods',
    amount: 189.47,
    type: 'expense',
    category: 'Groceries',
    account: 'Chase Credit Card',
    notes: 'Weekly groceries and household items'
  },
  {
    id: '3',
    date: '2025-10-24',
    description: 'Netflix Subscription',
    amount: 19.99,
    type: 'expense',
    category: 'Entertainment',
    account: 'Amex Credit Card'
  },
  {
    id: '4',
    date: '2025-10-23',
    description: 'Freelance Work - Web Design',
    amount: 750.00,
    type: 'income',
    category: 'Freelance',
    account: 'Chase Checking',
    notes: 'Logo design project for client'
  },
  {
    id: '5',
    date: '2025-10-23',
    description: 'Gas Station - Shell',
    amount: 48.55,
    type: 'expense',
    category: 'Transportation',
    account: 'Chase Credit Card'
  },
  {
    id: '6',
    date: '2025-10-22',
    description: 'Electricity Bill',
    amount: 145.32,
    type: 'expense',
    category: 'Utilities',
    account: 'Chase Checking'
  },
  {
    id: '7',
    date: '2025-10-22',
    description: 'Restaurant - Cheesecake Factory',
    amount: 86.75,
    type: 'expense',
    category: 'Dining Out',
    account: 'Amex Credit Card',
    notes: 'Dinner with friends'
  },
  {
    id: '8',
    date: '2025-10-21',
    description: 'Amazon Prime',
    amount: 14.99,
    type: 'expense',
    category: 'Subscriptions',
    account: 'Chase Credit Card'
  },
  {
    id: '9',
    date: '2025-10-21',
    description: 'Investment Dividend',
    amount: 235.50,
    type: 'income',
    category: 'Investments',
    account: 'Vanguard Account'
  },
  {
    id: '10',
    date: '2025-10-20',
    description: 'Gym Membership',
    amount: 55.00,
    type: 'expense',
    category: 'Health & Fitness',
    account: 'Chase Credit Card'
  },
  {
    id: '11',
    date: '2025-10-19',
    description: 'Coffee Shop - Starbucks',
    amount: 12.50,
    type: 'expense',
    category: 'Dining Out',
    account: 'Chase Credit Card',
    notes: 'Morning coffee and pastry'
  },
  {
    id: '12',
    date: '2025-10-18',
    description: 'Uber Ride',
    amount: 28.30,
    type: 'expense',
    category: 'Transportation',
    account: 'Amex Credit Card'
  },
  {
    id: '13',
    date: '2025-10-18',
    description: 'Spotify Premium',
    amount: 10.99,
    type: 'expense',
    category: 'Entertainment',
    account: 'Chase Credit Card'
  },
  {
    id: '14',
    date: '2025-10-17',
    description: 'Target Shopping',
    amount: 127.84,
    type: 'expense',
    category: 'Shopping',
    account: 'Chase Credit Card',
    notes: 'Household supplies and clothing'
  },
  {
    id: '15',
    date: '2025-10-16',
    description: 'Consulting Project Payment',
    amount: 1200.00,
    type: 'income',
    category: 'Freelance',
    account: 'Chase Checking',
    notes: 'Web app development - Phase 1'
  },
  {
    id: '16',
    date: '2025-10-15',
    description: 'Internet Bill - Comcast',
    amount: 89.99,
    type: 'expense',
    category: 'Utilities',
    account: 'Chase Checking'
  },
  {
    id: '17',
    date: '2025-10-15',
    description: 'Pharmacy - CVS',
    amount: 34.20,
    type: 'expense',
    category: 'Health & Fitness',
    account: 'Amex Credit Card'
  },
  {
    id: '18',
    date: '2025-10-14',
    description: 'Grocery Shopping - Trader Joes',
    amount: 156.38,
    type: 'expense',
    category: 'Groceries',
    account: 'Chase Credit Card'
  },
  {
    id: '19',
    date: '2025-10-13',
    description: 'Movie Tickets - AMC',
    amount: 42.00,
    type: 'expense',
    category: 'Entertainment',
    account: 'Amex Credit Card',
    notes: 'Weekend movie night'
  },
  {
    id: '20',
    date: '2025-10-12',
    description: 'Gas Station - Chevron',
    amount: 52.10,
    type: 'expense',
    category: 'Transportation',
    account: 'Chase Credit Card'
  },
  {
    id: '21',
    date: '2025-10-11',
    description: 'Restaurant - Chipotle',
    amount: 23.45,
    type: 'expense',
    category: 'Dining Out',
    account: 'Chase Credit Card'
  },
  {
    id: '22',
    date: '2025-10-10',
    description: 'Stock Dividend - Apple',
    amount: 87.50,
    type: 'income',
    category: 'Investments',
    account: 'Vanguard Account'
  },
  {
    id: '23',
    date: '2025-10-09',
    description: 'Water Bill',
    amount: 45.67,
    type: 'expense',
    category: 'Utilities',
    account: 'Chase Checking'
  },
  {
    id: '24',
    date: '2025-10-08',
    description: 'Pet Store - Petco',
    amount: 68.90,
    type: 'expense',
    category: 'Shopping',
    account: 'Chase Credit Card',
    notes: 'Dog food and supplies'
  },
  {
    id: '25',
    date: '2025-10-07',
    description: 'Online Course - Udemy',
    amount: 29.99,
    type: 'expense',
    category: 'Other',
    account: 'Amex Credit Card',
    notes: 'React Advanced Patterns course'
  },
  {
    id: '26',
    date: '2025-10-06',
    description: 'Car Insurance Payment',
    amount: 185.00,
    type: 'expense',
    category: 'Transportation',
    account: 'Chase Checking'
  },
  {
    id: '27',
    date: '2025-10-05',
    description: 'Restaurant - Pizza Hut',
    amount: 34.60,
    type: 'expense',
    category: 'Dining Out',
    account: 'Chase Credit Card'
  },
  {
    id: '28',
    date: '2025-10-04',
    description: 'Freelance Design Work',
    amount: 425.00,
    type: 'income',
    category: 'Freelance',
    account: 'Chase Checking',
    notes: 'Brand identity package'
  },
  {
    id: '29',
    date: '2025-10-03',
    description: 'Grocery Shopping - Safeway',
    amount: 98.23,
    type: 'expense',
    category: 'Groceries',
    account: 'Chase Credit Card'
  },
  {
    id: '30',
    date: '2025-10-02',
    description: 'Gas Station - Shell',
    amount: 46.75,
    type: 'expense',
    category: 'Transportation',
    account: 'Chase Credit Card'
  }
];