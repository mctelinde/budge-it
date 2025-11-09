import { Transaction } from '../types/transaction';

export interface ChaseCSVRow {
  'Transaction Date': string;
  'Post Date': string;
  'Description': string;
  'Category': string;
  'Type': string;
  'Amount': string;
  'Memo': string;
}

export interface PayPalCSVRow {
  'Date': string;
  'Time': string;
  'TimeZone': string;
  'Name': string;
  'Type': string;
  'Status': string;
  'Currency': string;
  'Amount': string;
  'Fees': string;
  'Total': string;
  'Exchange Rate': string;
  'Receipt ID': string;
  'Balance': string;
  'Transaction ID': string;
  'Item Title': string;
}

export interface TFCUCSVRow {
  'Account Name': string;
  'Processed Date': string;
  'Description': string;
  'Check Number': string;
  'Credit or Debit': string;
  'Amount': string;
}

export interface ImportResult {
  success: boolean;
  transactions: Transaction[];
  errors: string[];
  skipped: number;
}

/**
 * Parse CSV text into rows
 */
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Simple CSV parser (handles basic cases)
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
};

/**
 * Convert Chase CSV row to Transaction object
 */
export const chaseRowToTransaction = (row: ChaseCSVRow, accountName: string = 'Chase', rowIndex: number = 0): Transaction => {
  // Parse amount - negative values are expenses, positive are income
  const amount = Math.abs(parseFloat(row.Amount));
  const type: 'income' | 'expense' = parseFloat(row.Amount) < 0 ? 'expense' : 'income';

  // Map Chase categories to our categories
  const category = mapChaseCategory(row.Category);

  // Use Transaction Date for the transaction date
  const date = parseChaseDate(row['Transaction Date']);

  // Generate unique ID using timestamp and random component
  const uniqueId = `chase_${Date.now()}_${rowIndex}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    id: uniqueId,
    date: date,
    description: row.Description.trim(),
    amount: amount,
    type: type,
    category: category,
    account: accountName,
    notes: row.Memo ? row.Memo.trim() : undefined,
    status: 'cleared',
  };
};

/**
 * Parse Chase date format (MM/DD/YYYY) to ISO format
 */
const parseChaseDate = (dateStr: string): string => {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Map Chase categories to our app's categories
 */
const mapChaseCategory = (chaseCategory: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Food & Drink': 'Food & Dining',
    'Groceries': 'Groceries',
    'Shopping': 'Shopping',
    'Gas': 'Gas & Fuel',
    'Travel': 'Travel',
    'Entertainment': 'Entertainment',
    'Bills & Utilities': 'Bills & Utilities',
    'Health & Wellness': 'Health & Medical',
    'Personal': 'Personal Care',
    'Education': 'Education',
    'Fees & Adjustments': 'Fees & Adjustments',
  };

  return categoryMap[chaseCategory] || chaseCategory;
};

/**
 * Convert PayPal CSV row to Transaction object
 */
export const paypalRowToTransaction = (row: PayPalCSVRow, accountName: string = 'PayPal', rowIndex: number = 0): Transaction | null => {
  // Skip pending transactions
  if (row.Status.toLowerCase() === 'pending') {
    return null;
  }

  // Skip internal transfers (deposits to account)
  const type = row.Type.toLowerCase();
  if (type.includes('deposit to pp account') || type.includes('general card deposit') || type.includes('bank deposit')) {
    return null;
  }

  // Parse amount - negative values are expenses, positive are income
  const amount = Math.abs(parseFloat(row.Amount));

  // Skip zero-amount transactions
  if (amount === 0 || isNaN(amount)) {
    return null;
  }

  const transactionType: 'income' | 'expense' = parseFloat(row.Amount) < 0 ? 'expense' : 'income';

  // Categorize based on merchant name and type
  const category = categorizePayPalTransaction(row.Name, row.Type);

  // Parse date (MM/DD/YYYY format)
  const date = parsePayPalDate(row.Date);

  // Generate unique ID
  const uniqueId = `paypal_${Date.now()}_${rowIndex}_${Math.random().toString(36).substring(2, 9)}`;

  // Use merchant name as description, or type if no name
  const description = row.Name.trim() || row.Type;

  return {
    id: uniqueId,
    date: date,
    description: description,
    amount: amount,
    type: transactionType,
    category: category,
    account: accountName,
    notes: row['Item Title'] ? row['Item Title'].trim() : undefined,
    status: 'cleared',
  };
};

/**
 * Parse PayPal date format (MM/DD/YYYY) to ISO format
 */
const parsePayPalDate = (dateStr: string): string => {
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Categorize PayPal transaction based on merchant and type
 */
const categorizePayPalTransaction = (merchant: string, type: string): string => {
  const merchantLower = merchant.toLowerCase();
  const typeLower = type.toLowerCase();

  // Music/Entertainment subscriptions
  if (merchantLower.includes('spotify')) return 'Entertainment';
  if (merchantLower.includes('apple') && typeLower.includes('preapproved')) return 'Entertainment';
  if (merchantLower.includes('netflix') || merchantLower.includes('hulu')) return 'Entertainment';
  if (merchantLower.includes('bandcamp')) return 'Entertainment';
  if (merchantLower.includes('patreon')) return 'Entertainment';

  // Gaming
  if (merchantLower.includes('valve') || merchantLower.includes('steam')) return 'Entertainment';
  if (merchantLower.includes('nintendo')) return 'Entertainment';
  if (merchantLower.includes('microsoft') && typeLower.includes('preapproved')) return 'Entertainment';
  if (merchantLower.includes('green man gaming')) return 'Entertainment';

  // Shopping
  if (merchantLower.includes('target')) return 'Shopping';
  if (merchantLower.includes('amazon')) return 'Shopping';

  // Travel
  if (merchantLower.includes('southwest') || merchantLower.includes('airline')) return 'Travel';
  if (merchantLower.includes('hotel') || merchantLower.includes('airbnb')) return 'Travel';

  // Tickets/Events
  if (merchantLower.includes('axs') || merchantLower.includes('ticketmaster')) return 'Entertainment';

  // Government/Fees
  if (merchantLower.includes('colorado interactive')) return 'Bills & Utilities';

  // Default categories based on type
  if (typeLower.includes('preapproved payment')) return 'Subscriptions';
  if (typeLower.includes('express checkout')) return 'Shopping';

  return 'Other';
};

/**
 * Parse Chase CSV file and convert to transactions
 */
export const importChaseCSV = async (file: File): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    transactions: [],
    errors: [],
    skipped: 0,
  };

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      result.errors.push('File is empty');
      return result;
    }

    // First row should be headers
    const headers = rows[0];
    const expectedHeaders = ['Transaction Date', 'Post Date', 'Description', 'Category', 'Type', 'Amount', 'Memo'];

    // Validate headers
    const hasValidHeaders = expectedHeaders.every((header, index) =>
      headers[index]?.toLowerCase().includes(header.toLowerCase())
    );

    if (!hasValidHeaders) {
      result.errors.push('Invalid Chase CSV format. Expected headers: ' + expectedHeaders.join(', '));
      return result;
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (row.every(cell => !cell.trim())) {
        result.skipped++;
        continue;
      }

      try {
        const chaseRow: ChaseCSVRow = {
          'Transaction Date': row[0],
          'Post Date': row[1],
          'Description': row[2],
          'Category': row[3],
          'Type': row[4],
          'Amount': row[5],
          'Memo': row[6] || '',
        };

        const transaction = chaseRowToTransaction(chaseRow, 'Chase Credit Card', i);
        result.transactions.push(transaction);
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.transactions.length > 0;
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Convert TFCU CSV row to Transaction object
 */
export const tfcuRowToTransaction = (row: TFCUCSVRow, accountName: string = 'TFCU Checking', rowIndex: number = 0): Transaction | null => {
  // Parse amount
  const amount = Math.abs(parseFloat(row.Amount));

  // Skip zero-amount transactions
  if (amount === 0 || isNaN(amount)) {
    return null;
  }

  // Determine type from Credit or Debit column
  const type: 'income' | 'expense' = row['Credit or Debit'].toLowerCase() === 'credit' ? 'income' : 'expense';

  // Categorize based on description
  const category = categorizeTFCUTransaction(row.Description, type);

  // Parse date (YYYY-MM-DD format)
  const date = row['Processed Date'];

  // Generate unique ID
  const uniqueId = `tfcu_${Date.now()}_${rowIndex}_${Math.random().toString(36).substring(2, 9)}`;

  // Clean up description
  const description = cleanTFCUDescription(row.Description);

  return {
    id: uniqueId,
    date: date,
    description: description,
    amount: amount,
    type: type,
    category: category,
    account: accountName,
    notes: row['Check Number'] ? `Check: ${row['Check Number']}` : undefined,
    status: 'cleared',
  };
};

/**
 * Clean up TFCU description to make it more readable
 */
const cleanTFCUDescription = (description: string): string => {
  // Remove common prefixes
  let cleaned = description
    .replace(/^WITHDRAWAL\s+/i, '')
    .replace(/^DEPOSIT\s+/i, '')
    .replace(/^ACH\s+/i, '')
    .replace(/^DEBIT CARD\s+/i, '')
    .replace(/^POS\s+#\d+\s+/i, '')
    .replace(/^AT ATM\s+#\d+\s+/i, 'ATM ')
    .replace(/^SHARED BRANCH\s+#\d+\s+/i, '')
    .replace(/^TRANSFER\s+(TO|FROM)\s+/i, 'Transfer ')
    .replace(/^HOME BANKING\s+/i, '');

  // Remove merchant category codes
  cleaned = cleaned.replace(/\s+MERCHANT CATEGORY CODE:\s+\d+/gi, '');

  // Remove type/ID information for cleaner merchant names
  cleaned = cleaned
    .replace(/\s+TYPE:\s+[A-Z\s]+ID:\s+\S+\s+CO:\s+/gi, ' - ')
    .replace(/\s+NAME:\s+/gi, ' ')
    .replace(/\s+ENTRY CLASS CODE:\s+\w+/gi, '');

  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};

/**
 * Categorize TFCU transaction based on description
 */
const categorizeTFCUTransaction = (description: string, type: 'income' | 'expense'): string => {
  const descLower = description.toLowerCase();

  // Income categories
  if (type === 'income') {
    if (descLower.includes('lexisnexis') || descLower.includes('payroll')) return 'Income';
    if (descLower.includes('hsa bank') || descLower.includes('plan distr')) return 'Health & Medical';
    if (descLower.includes('go program') || descLower.includes('okepc')) return 'Income';
    if (descLower.includes('venmo') && descLower.includes('cashout')) return 'Transfer';
    if (descLower.includes('transfer from')) return 'Transfer';
    return 'Income';
  }

  // Expense categories
  if (descLower.includes('paypal')) return 'Online Purchase';
  if (descLower.includes('fortcolutilities')) return 'Bills & Utilities';
  if (descLower.includes('xcel energy')) return 'Bills & Utilities';
  if (descLower.includes('verizon')) return 'Bills & Utilities';

  // Education
  if (descLower.includes('tgs-college')) return 'Education';
  if (descLower.includes('academy of arts')) return 'Education';

  // Loans
  if (descLower.includes('earnest') || descLower.includes('studntloan') || descLower.includes('advs ed serv')) return 'Loan Payment';

  // Credit card payments
  if (descLower.includes('chase credit') || descLower.includes('citi card')) return 'Credit Card Payment';

  // Food
  if (descLower.includes('king soopers') || descLower.includes('wal-mart') || descLower.includes('walmart')) return 'Groceries';
  if (descLower.includes('mcdonald')) return 'Food & Dining';
  if (descLower.includes('cinemark')) return 'Entertainment';

  // Services
  if (descLower.includes('spendr inc')) return 'Childcare';
  if (descLower.includes('venmo') && !descLower.includes('cashout')) return 'Transfer';
  if (descLower.includes('nintendo')) return 'Entertainment';

  // Transfers
  if (descLower.includes('transfer to loan')) return 'Loan Payment';
  if (descLower.includes('transfer') || descLower.includes('shared branch')) return 'Transfer';

  // ATM
  if (descLower.includes('atm')) return 'Cash Withdrawal';

  // Default
  return 'Other';
};

/**
 * Parse TFCU CSV file and convert to transactions
 */
export const importTFCUCSV = async (file: File): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    transactions: [],
    errors: [],
    skipped: 0,
  };

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      result.errors.push('File is empty');
      return result;
    }

    // First row should be headers
    const headers = rows[0];
    const expectedHeaders = ['Account Name', 'Processed Date', 'Description', 'Check Number', 'Credit or Debit', 'Amount'];

    // Validate headers
    const hasValidHeaders = expectedHeaders.every((header) =>
      headers.some(h => h.replace(/"/g, '').trim().toLowerCase() === header.toLowerCase())
    );

    if (!hasValidHeaders) {
      result.errors.push('Invalid TFCU CSV format. Expected headers: ' + expectedHeaders.join(', '));
      return result;
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (row.every(cell => !cell.trim())) {
        result.skipped++;
        continue;
      }

      try {
        const tfcuRow: TFCUCSVRow = {
          'Account Name': row[0].replace(/"/g, '').trim(),
          'Processed Date': row[1].replace(/"/g, '').trim(),
          'Description': row[2].replace(/"/g, '').trim(),
          'Check Number': row[3].replace(/"/g, '').trim(),
          'Credit or Debit': row[4].replace(/"/g, '').trim(),
          'Amount': row[5].replace(/"/g, '').trim(),
        };

        const transaction = tfcuRowToTransaction(tfcuRow, 'TFCU Checking', i);

        // Only add non-null transactions
        if (transaction) {
          result.transactions.push(transaction);
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.transactions.length > 0;
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Parse PayPal CSV file and convert to transactions
 */
export const importPayPalCSV = async (file: File): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    transactions: [],
    errors: [],
    skipped: 0,
  };

  try {
    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      result.errors.push('File is empty');
      return result;
    }

    // First row should be headers
    const headers = rows[0];
    const expectedHeaders = ['Date', 'Time', 'TimeZone', 'Name', 'Type', 'Status', 'Currency', 'Amount'];

    // Validate headers
    const hasValidHeaders = expectedHeaders.slice(0, 5).every((header) =>
      headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
    );

    if (!hasValidHeaders) {
      result.errors.push('Invalid PayPal CSV format. Expected columns: Date, Time, Name, Type, Status, Amount, etc.');
      return result;
    }

    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];

      // Skip empty rows
      if (row.every(cell => !cell.trim())) {
        result.skipped++;
        continue;
      }

      try {
        const paypalRow: PayPalCSVRow = {
          'Date': row[0],
          'Time': row[1],
          'TimeZone': row[2],
          'Name': row[3],
          'Type': row[4],
          'Status': row[5],
          'Currency': row[6],
          'Amount': row[7],
          'Fees': row[8] || '',
          'Total': row[9] || '',
          'Exchange Rate': row[10] || '',
          'Receipt ID': row[11] || '',
          'Balance': row[12] || '',
          'Transaction ID': row[13] || '',
          'Item Title': row[14] || '',
        };

        const transaction = paypalRowToTransaction(paypalRow, 'PayPal', i);

        // Only add non-null transactions (filters out pending and internal transfers)
        if (transaction) {
          result.transactions.push(transaction);
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.transactions.length > 0;
    return result;
  } catch (error) {
    result.errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Calculate similarity between two strings (0 to 1)
 * Uses a simple approach: count matching words
 */
const calculateStringSimilarity = (str1: string, str2: string): number => {
  const words1 = str1.toLowerCase().split(/\s+/);
  const words2 = str2.toLowerCase().split(/\s+/);

  let matches = 0;
  for (const word of words1) {
    if (word.length > 3 && words2.includes(word)) {
      matches++;
    }
  }

  const maxWords = Math.max(words1.length, words2.length);
  return maxWords > 0 ? matches / maxWords : 0;
};

/**
 * Check if two transactions are likely duplicates
 * Considers: same date, same amount, similar description
 */
const areLikelyDuplicates = (txn1: Transaction, txn2: Transaction): boolean => {
  // Must have same date
  if (txn1.date !== txn2.date) return false;

  // Must have same amount
  if (txn1.amount !== txn2.amount) return false;

  // Must have same type (income/expense)
  if (txn1.type !== txn2.type) return false;

  // Check description similarity (at least 30% similar)
  const similarity = calculateStringSimilarity(txn1.description, txn2.description);
  if (similarity >= 0.3) return true;

  // Special case: PayPal transactions from TFCU
  // If TFCU description contains "PAYPAL" and dates/amounts match, likely duplicate
  if (
    (txn1.account.includes('PayPal') && txn2.description.toLowerCase().includes('paypal')) ||
    (txn2.account.includes('PayPal') && txn1.description.toLowerCase().includes('paypal'))
  ) {
    return true;
  }

  return false;
};

/**
 * Validate that imported transactions don't conflict with existing ones
 * Enhanced duplicate detection that checks date, amount, and description similarity
 */
export const detectDuplicates = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): { duplicates: Transaction[]; unique: Transaction[] } => {
  const duplicates: Transaction[] = [];
  const unique: Transaction[] = [];

  for (const newTxn of newTransactions) {
    const isDuplicate = existingTransactions.some(existing =>
      areLikelyDuplicates(newTxn, existing)
    );

    if (isDuplicate) {
      duplicates.push(newTxn);
    } else {
      unique.push(newTxn);
    }
  }

  return { duplicates, unique };
};
