import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Chip, useTheme } from '@mui/material';
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

  return (
    <Box sx={{
      width: '100%',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
      borderRadius: 2,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.36)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }}>
      <DataGrid
        rows={transactions}
        columns={columns}
        autoHeight
        getRowHeight={() => 'auto'}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
          sorting: {
            sortModel: [{ field: 'date', sort: 'desc' }],
          },
        }}
        pageSizeOptions={[5, 10, 25]}
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