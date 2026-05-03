import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { importChaseCSV, importPayPalCSV, importTFCUCSV, detectDuplicates } from '@shared/utils/csvImport';
import { decodeHtmlEntities } from '@shared/utils/textUtils';
import type { Transaction } from '@shared/types/transaction';

interface TransactionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => Promise<void>;
  existingTransactions: Transaction[];
}

type Format = 'chase' | 'paypal' | 'tfcu';
type Step = 'select' | 'preview' | 'complete';

const FORMAT_LABELS: Record<Format, string> = {
  tfcu: 'Tinker Federal Credit Union',
  chase: 'Chase Bank',
  paypal: 'PayPal',
};

const FORMAT_INSTRUCTIONS: Record<Format, string[]> = {
  chase: [
    'Log in to your Chase account',
    'Navigate to your credit card or checking account',
    'Click "Download" or "Export"',
    'Select CSV format and date range',
    'Upload the downloaded file here',
  ],
  paypal: [
    'Log in to your PayPal account',
    'Go to "Activity" or "Statements"',
    'Click "Statements" → "Custom" or "Download"',
    'Select date range and download CSV',
    'Upload the downloaded file here',
  ],
  tfcu: [
    'Log in to Tinker FCU online banking',
    'Navigate to your checking account',
    'Click "Download Transactions" or "Export"',
    'Select CSV format and date range',
    'Upload the downloaded file here',
  ],
};

export const TransactionImportDialog: React.FC<TransactionImportDialogProps> = ({
  open,
  onClose,
  onImport,
  existingTransactions,
}) => {
  const [format, setFormat] = useState<Format>('chase');
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [duplicates, setDuplicates] = useState<Transaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<Step>('select');

  const handleClose = () => {
    setPreview([]);
    setDuplicates([]);
    setErrors([]);
    setStep('select');
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setPreview([]);
    setDuplicates([]);

    try {
      let result;
      if (format === 'chase') result = await importChaseCSV(file);
      else if (format === 'paypal') result = await importPayPalCSV(file);
      else result = await importTFCUCSV(file);

      if (!result.success) { setErrors(result.errors); return; }
      if (result.errors.length > 0) setErrors(result.errors);

      const { duplicates: dups, unique } = detectDuplicates(result.transactions, existingTransactions);
      setPreview(unique);
      setDuplicates(dups);
      setStep('preview');
    } catch (err) {
      setErrors([`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    }

    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    try {
      await onImport(preview);
      setStep('complete');
    } catch (err) {
      setErrors([`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`]);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl !flex !flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Transactions</DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <>
            <div className="flex flex-col gap-4 overflow-y-auto py-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Bank / Service</label>
                <Select value={format} onValueChange={(v) => setFormat(v as Format)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tfcu">Tinker Federal Credit Union</SelectItem>
                    <SelectItem value="chase">Chase Bank</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Drop zone */}
              <label
                htmlFor="csv-file-input"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-10 text-center cursor-pointer hover:border-[#14959c] hover:bg-[#14959c]/5 transition-colors"
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
                <Upload className="size-10 text-[#14959c]" />
                <div>
                  <p className="font-medium">Upload {FORMAT_LABELS[format]} CSV</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Click to select a file</p>
                </div>
              </label>

              {errors.length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive space-y-1">
                  <p className="font-semibold">Import Errors:</p>
                  {errors.map((err, i) => <p key={i}>• {err}</p>)}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">How to export from {FORMAT_LABELS[format]}:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  {FORMAT_INSTRUCTIONS[format].map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </DialogFooter>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="flex flex-col gap-3 overflow-hidden flex-1 min-h-0 py-1">
              <div className="flex gap-2 flex-wrap">
                <Badge style={{ background: '#14959c' }} className="text-white gap-1.5">
                  <CheckCircle className="size-3" /> {preview.length} new transactions
                </Badge>
                {duplicates.length > 0 && (
                  <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-500">
                    <AlertTriangle className="size-3" /> {duplicates.length} duplicates skipped
                  </Badge>
                )}
              </div>

              {duplicates.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {duplicates.length} duplicate transaction{duplicates.length > 1 ? 's' : ''} detected and will be skipped.
                </p>
              )}

              <p className="text-sm font-medium">Preview (first 10 transactions):</p>
              <div className="overflow-y-auto flex-1 min-h-0 rounded-lg border divide-y">
                {preview.slice(0, 10).map((txn, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium truncate">{decodeHtmlEntities(txn.description)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <span className="inline-block border rounded px-1.5 py-0.5 mr-1.5">{txn.category}</span>
                        {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-semibold whitespace-nowrap ${txn.type === 'income' ? 'text-[#14959c]' : 'text-orange-600'}`}>
                      {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                {preview.length > 10 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    … and {preview.length - 10} more transactions
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={importing}>Cancel</Button>
              <Button
                onClick={handleImport}
                disabled={importing || !preview.length}
                style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)', color: '#fff' }}
              >
                {importing ? 'Importing…' : `Import ${preview.length} Transactions`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <CheckCircle className="size-16 text-[#14959c]" />
              <p className="text-lg font-semibold">Import Successful!</p>
              <p className="text-sm text-muted-foreground">
                {preview.length} transaction{preview.length !== 1 ? 's' : ''} imported successfully.
              </p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                style={{ background: 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%)', color: '#fff' }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
