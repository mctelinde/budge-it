import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { decodeHtmlEntities } from '@shared/utils/textUtils';
import type { Transaction } from '@shared/types/transaction';

interface TransactionTableProps {
  transactions: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
}

const TypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <span
    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize text-white"
    style={{
      background:
        type === 'income'
          ? 'linear-gradient(135deg, #0d7377 0%, #14959c 100%)'
          : 'linear-gradient(135deg, #d84315 0%, #ff6f00 100%)',
    }}
  >
    {type}
  </span>
);

const AmountCell: React.FC<{ amount: number; type: string }> = ({ amount, type }) => (
  <span
    className="font-semibold tabular-nums"
    style={{ color: type === 'income' ? '#14959c' : '#ff6f00' }}
  >
    {type === 'income' ? '+' : '-'}${Math.abs(amount).toFixed(2)}
  </span>
);

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Mobile card ───────────────────────────────────────────────────────────────

const MobileCard: React.FC<{ transaction: Transaction; onClick?: () => void }> = ({
  transaction,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="rounded-xl border bg-card p-4 mb-3 cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
  >
    <div className="flex justify-between items-start gap-2 mb-2">
      <p className="font-semibold text-sm flex-1 leading-snug">
        {decodeHtmlEntities(transaction.description)}
      </p>
      <AmountCell amount={transaction.amount} type={transaction.type} />
    </div>
    <TypeBadge type={transaction.type} />
    <div className="border-t my-3" />
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p className="text-xs text-muted-foreground">Date</p>
        <p>{formatDate(transaction.date)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Category</p>
        <p>{transaction.category}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Account</p>
        <p>{transaction.account}</p>
      </div>
      {transaction.notes && (
        <div className="col-span-2">
          <p className="text-xs text-muted-foreground">Notes</p>
          <p>{transaction.notes}</p>
        </div>
      )}
    </div>
  </div>
);

// ── Desktop table ─────────────────────────────────────────────────────────────

const SortIcon: React.FC<{ sorted: false | 'asc' | 'desc' }> = ({ sorted }) => {
  if (sorted === 'asc') return <ChevronUp className="size-3.5 ml-1 inline" />;
  if (sorted === 'desc') return <ChevronDown className="size-3.5 ml-1 inline" />;
  return <ChevronsUpDown className="size-3.5 ml-1 inline opacity-40" />;
};

// ── Main component ────────────────────────────────────────────────────────────

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onEditTransaction,
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: 'date', desc: true }]);
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = React.useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.date),
        size: 110,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ getValue }) => decodeHtmlEntities(getValue<string>()),
        size: 260,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <AmountCell amount={row.original.amount} type={row.original.type} />,
        size: 110,
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => <TypeBadge type={getValue<string>()} />,
        size: 90,
      },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 130,
      },
      {
        accessorKey: 'account',
        header: 'Account',
        size: 130,
      },
      {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground truncate max-w-[180px] block">
            {getValue<string>() ?? ''}
          </span>
        ),
        size: 180,
      },
    ],
    []
  );

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  // ── Mobile ──
  if (isMobile) {
    const rows = table.getRowModel().rows;
    return (
      <div>
        {rows.map((row) => (
          <MobileCard
            key={row.id}
            transaction={row.original}
            onClick={() => onEditTransaction?.(row.original)}
          />
        ))}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">{from}–{to} of {totalRows}</span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop ──
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b bg-muted/40">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap select-none"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className={header.column.getCanSort() ? 'cursor-pointer hover:text-foreground transition-colors' : ''}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => onEditTransaction?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t bg-muted/20 text-sm">
        <span className="text-muted-foreground">{from}–{to} of {totalRows}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="px-2 text-muted-foreground">
            Page {pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
