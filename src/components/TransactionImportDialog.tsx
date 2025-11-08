import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Transaction } from '../types/transaction';
import { importChaseCSV, importPayPalCSV, detectDuplicates } from '../utils/csvImport';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface TransactionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (transactions: Transaction[]) => Promise<void>;
  existingTransactions: Transaction[];
}

export const TransactionImportDialog: React.FC<TransactionImportDialogProps> = ({
  open,
  onClose,
  onImport,
  existingTransactions,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Transaction[]>([]);
  const [duplicates, setDuplicates] = useState<Transaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'preview' | 'complete'>('select');
  const [format, setFormat] = useState<'chase' | 'paypal'>('chase');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);
    setDuplicates([]);

    try {
      // Use the appropriate import function based on selected format
      const result = format === 'chase'
        ? await importChaseCSV(selectedFile)
        : await importPayPalCSV(selectedFile);

      if (!result.success) {
        setErrors(result.errors);
        return;
      }

      if (result.errors.length > 0) {
        setErrors(result.errors);
      }

      // Detect duplicates
      const { duplicates: dups, unique } = detectDuplicates(result.transactions, existingTransactions);
      setPreview(unique);
      setDuplicates(dups);
      setStep('preview');
    } catch (error) {
      setErrors([`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    try {
      await onImport(preview);
      setStep('complete');
    } catch (error) {
      setErrors([`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setDuplicates([]);
    setErrors([]);
    setStep('select');
    onClose();
  };

  const renderSelectStep = () => (
    <>
      <DialogContent sx={{ pt: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Bank/Service</InputLabel>
          <Select
            value={format}
            label="Bank/Service"
            onChange={(e) => setFormat(e.target.value as 'chase' | 'paypal')}
          >
            <MenuItem value="chase">Chase Bank</MenuItem>
            <MenuItem value="paypal">PayPal</MenuItem>
          </Select>
        </FormControl>

        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              borderColor: '#14959c',
              backgroundColor: 'rgba(20, 149, 156, 0.05)',
            },
          }}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <UploadIcon sx={{ fontSize: 48, color: '#14959c', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Upload {format === 'chase' ? 'Chase' : 'PayPal'} CSV Export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click to select a file or drag and drop
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Supported format: {format === 'chase' ? 'Chase Bank' : 'PayPal'} CSV export
          </Typography>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Import Errors:
            </Typography>
            <List dense>
              {errors.map((error, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="caption">• {error}</Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>How to export from {format === 'chase' ? 'Chase' : 'PayPal'}:</strong>
          </Typography>
          {format === 'chase' ? (
            <Typography variant="caption" color="text.secondary" component="div">
              1. Log in to your Chase account<br />
              2. Navigate to your credit card or checking account<br />
              3. Click "Download" or "Export"<br />
              4. Select CSV format and date range<br />
              5. Upload the downloaded file here
            </Typography>
          ) : (
            <Typography variant="caption" color="text.secondary" component="div">
              1. Log in to your PayPal account<br />
              2. Go to "Activity" or "Statements"<br />
              3. Click "Statements" → "Custom" or "Download"<br />
              4. Select date range and download CSV<br />
              5. Upload the downloaded file here
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${preview.length} new transactions`}
              color="primary"
              sx={{
                backgroundColor: '#14959c',
                '&:hover': { backgroundColor: '#0d7378' },
              }}
            />
            {duplicates.length > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${duplicates.length} duplicates skipped`}
                color="warning"
              />
            )}
          </Box>

          {duplicates.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {duplicates.length} duplicate transaction{duplicates.length > 1 ? 's' : ''} detected and will be skipped.
            </Alert>
          )}
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Preview (first 10 transactions):
        </Typography>
        <List sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          {preview.slice(0, 10).map((txn, index) => (
            <React.Fragment key={index}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {txn.description}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: txn.type === 'expense' ? '#ff6f00' : '#14959c',
                        }}
                      >
                        {txn.type === 'expense' ? '-' : '+'}${txn.amount.toFixed(2)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip label={txn.category} size="small" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(txn.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < 9 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        {preview.length > 10 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            ... and {preview.length - 10} more transactions
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={importing || preview.length === 0}
          sx={{
            backgroundColor: '#14959c',
            '&:hover': { backgroundColor: '#0d7378' },
          }}
        >
          {importing ? 'Importing...' : `Import ${preview.length} Transactions`}
        </Button>
      </DialogActions>
      {importing && <LinearProgress sx={{ '& .MuiLinearProgress-bar': { backgroundColor: '#14959c' } }} />}
    </>
  );

  const renderCompleteStep = () => (
    <>
      <DialogContent>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: '#14959c', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Import Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {preview.length} transaction{preview.length !== 1 ? 's' : ''} imported successfully.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          variant="contained"
          sx={{
            backgroundColor: '#14959c',
            '&:hover': { backgroundColor: '#0d7378' },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Import Transactions
        {step === 'preview' && file && (
          <Typography variant="caption" color="text.secondary" display="block">
            File: {file.name}
          </Typography>
        )}
      </DialogTitle>
      {step === 'select' && renderSelectStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'complete' && renderCompleteStep()}
    </Dialog>
  );
};
