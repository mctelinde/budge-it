import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Box,
  Chip,
  useTheme,
  Card,
  CardContent,
  Typography,
  useMediaQuery,
  Stack,
  Divider,
} from '@mui/material';
import { Transaction } from '../data/mockData';

interface TransactionTableProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEditTransaction
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(25);

  // Mobile Card View Component
  const MobileTransactionCard: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return (
      <Card
        onClick={() => onEditTransaction?.(transaction)}
        sx={{
          mb: 2,
          cursor: onEditTransaction ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
          background: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.9)',
          '&:hover': {
            transform: onEditTransaction ? 'translateY(-2px)' : 'none',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.4)'
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Stack spacing={1.5}>
            {/* Header: Description and Amount */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, pr: 1 }}>
                {transaction.description}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 'bold',
                  color: transaction.type === 'income' ? '#14959c' : '#ff6f00',
                  whiteSpace: 'nowrap',
                }}
              >
                {transaction.type === 'income' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
              </Typography>
            </Box>

            {/* Type Chip */}
            <Box>
              <Chip
                label={transaction.type}
                size="small"
                sx={{
                  textTransform: 'capitalize',
                  background: transaction.type === 'income'
                    ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
                    : 'linear-gradient(135deg, #d84315 0%, #ff6f00 100%)',
                  color: '#ffffff',
                  fontWeight: 600,
                  border: 'none',
                }}
              />
            </Box>

            <Divider />

            {/* Details Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1.5,
                fontSize: '0.875rem',
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Date
                </Typography>
                <Typography variant="body2">{formattedDate}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Category
                </Typography>
                <Typography variant="body2">{transaction.category}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Account
                </Typography>
                <Typography variant="body2">{transaction.account}</Typography>
              </Box>
              {transaction.notes && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Notes
                  </Typography>
                  <Typography variant="body2">{transaction.notes}</Typography>
                </Box>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination for mobile
  const paginatedTransactions = sortedTransactions.slice(
    page * pageSize,
    (page + 1) * pageSize
  );

  const columns: GridColDef[] = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      renderCell: (params) => {
        const date = new Date(params.row.date);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1,
      renderCell: (params) => {
        const amount = params.row.amount;
        const type = params.row.type;
        return (
          <Box
            sx={{
              color: type === 'income' ? '#14959c' : '#ff6f00',
              fontWeight: 'bold',
            }}
          >
            {type === 'income' ? '+' : '-'}${Math.abs(amount).toFixed(2)}
          </Box>
        );
      },
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            textTransform: 'capitalize',
            background: params.value === 'income'
              ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
              : 'linear-gradient(135deg, #d84315 0%, #ff6f00 100%)',
            color: '#ffffff',
            fontWeight: 600,
            border: 'none',
          }}
        />
      ),
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
    },
    {
      field: 'account',
      headerName: 'Account',
      flex: 1,
    },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1.5,
    },
  ];

  // Mobile view
  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        {paginatedTransactions.map((transaction) => (
          <MobileTransactionCard key={transaction.id} transaction={transaction} />
        ))}

        {/* Mobile Pagination */}
        {sortedTransactions.length > pageSize && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mt: 3,
              mb: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedTransactions.length)} of {sortedTransactions.length}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  // Desktop view (existing table)
  return (
    <Box sx={{
      width: '100%',
      height: 'calc(100vh - 200px)', // Fixed height to ensure footer is always visible
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 2,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.36)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }}>
      <DataGrid
        rows={transactions}
        columns={columns}
        getRowHeight={() => 'auto'}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 25,
            },
          },
          sorting: {
            sortModel: [{ field: 'date', sort: 'desc' }],
          },
        }}
        pageSizeOptions={[25, 50, 100]}
        onRowClick={onEditTransaction ? (params) => onEditTransaction(params.row as Transaction) : undefined}
        disableRowSelectionOnClick
        getRowClassName={(params) =>
          params.row.type === 'income' ? 'income-row' : 'expense-row'
        }
        sx={{
          cursor: onEditTransaction ? 'pointer' : 'default',
          border: 'none',
          borderRadius: 2,
          '& .MuiDataGrid-root': {
            borderRadius: 2,
          },
          '& .MuiDataGrid-cell': {
            borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            padding: '12px 16px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.mode === 'dark' ? '#14959c !important' : '#14959c !important',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%) !important'
              : 'linear-gradient(135deg, #14959c 0%, #1fb5bc 100%) !important',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            minHeight: '56px !important',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          },
          '& .MuiDataGrid-scrollbarFiller': {
            display: 'none',
          },
          '& .MuiDataGrid-filler': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeader': {
            backgroundColor: 'transparent !important',
            padding: '16px 16px',
            fontWeight: 600,
            fontSize: '0.875rem',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1px',
            '&:focus, &:focus-within': {
              outline: 'none',
            },
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            color: '#ffffff !important',
            fontWeight: 600,
            fontSize: '0.875rem',
          },
          '& .MuiDataGrid-columnSeparator': {
            color: 'rgba(255, 255, 255, 0.3) !important',
          },
          '& .MuiDataGrid-sortIcon': {
            color: '#ffffff !important',
            opacity: 0.9,
          },
          '& .MuiDataGrid-menuIcon': {
            color: '#ffffff !important',
            opacity: 0.9,
          },
          '& .MuiDataGrid-iconButtonContainer': {
            '& button': {
              color: '#ffffff !important',
              opacity: 0.9,
              '&:hover': {
                opacity: 1,
              },
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'transparent',
          },
          '& .MuiDataGrid-row': {
            '&:nth-of-type(even)': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            },
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiTablePagination-root': {
            color: theme.palette.text.secondary,
          },
        }}
      />
    </Box>
  );
};