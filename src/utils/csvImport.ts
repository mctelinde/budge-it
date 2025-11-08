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
 * Validate that imported transactions don't conflict with existing ones
 */
export const detectDuplicates = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): { duplicates: Transaction[]; unique: Transaction[] } => {
  const duplicates: Transaction[] = [];
  const unique: Transaction[] = [];

  for (const newTxn of newTransactions) {
    const isDuplicate = existingTransactions.some(
      existing =>
        existing.date === newTxn.date &&
        existing.description === newTxn.description &&
        existing.amount === newTxn.amount &&
        existing.type === newTxn.type
    );

    if (isDuplicate) {
      duplicates.push(newTxn);
    } else {
      unique.push(newTxn);
    }
  }

  return { duplicates, unique };
};
