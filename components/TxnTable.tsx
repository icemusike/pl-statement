import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';

export interface Transaction {
  date: string;
  description: string;
  vendor: string | null;
  amount: string;
  currency: string;
  debit: string;
  credit: string;
  amount_ron: string | null;
  rrn: string | null;
}

interface TxnTableProps {
  transactions: Transaction[];
  onExportCSV: () => void;
}

const TxnTable: React.FC<TxnTableProps> = ({ transactions, onExportCSV }) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'date', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  
  const formatCurrency = (value: string, currency: string) => {
    if (!value || value === '0') return '';
    try {
      const numValue = parseFloat(value);
      const options = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
      return new Intl.NumberFormat('ro-RO', options).format(numValue) + ' ' + currency;
    } catch (error) {
      console.error('Error formatting currency value:', value, error);
      return value + ' ' + currency;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      // Try to parse the date
      const date = parseISO(dateStr);
      return format(date, 'dd.MM.yyyy', { locale: ro });
    } catch (error) {
      console.error('Error formatting date:', dateStr, error);
      return dateStr; // Return original if parsing fails
    }
  };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        id: 'date',
        header: 'Data',
        accessorFn: (row) => row.date,
        cell: ({ row }) => formatDate(row.original.date),
        enableColumnFilter: true,
      },
      {
        id: 'vendor',
        header: 'Beneficiar',
        accessorFn: (row) => row.vendor || '',
        cell: ({ row }) => row.original.vendor || '',
        enableColumnFilter: true,
      },
      {
        id: 'description',
        header: 'Descriere',
        accessorFn: (row) => row.description,
        cell: ({ row }) => (
          <div 
            className="max-w-md truncate" 
            title={row.original.description}
          >
            {row.original.description}
          </div>
        ),
        enableColumnFilter: true,
      },
      {
        id: 'debit',
        header: 'Debit',
        accessorFn: (row) => {
          try {
            return parseFloat(row.debit || '0');
          } catch {
            return 0;
          }
        },
        cell: ({ row }) => formatCurrency(row.original.debit, row.original.currency),
        enableColumnFilter: false,
        meta: {
          align: 'right',
        },
      },
      {
        id: 'credit',
        header: 'Credit',
        accessorFn: (row) => {
          try {
            return parseFloat(row.credit || '0');
          } catch {
            return 0;
          }
        },
        cell: ({ row }) => formatCurrency(row.original.credit, row.original.currency),
        enableColumnFilter: false,
        meta: {
          align: 'right',
        },
      },
      {
        id: 'currency',
        header: 'Valută',
        accessorFn: (row) => row.currency,
        cell: ({ row }) => row.original.currency,
        enableColumnFilter: true,
      },
      {
        id: 'amount_ron',
        header: 'RON',
        accessorFn: (row) => {
          try {
            return row.amount_ron ? parseFloat(row.amount_ron) : 0;
          } catch {
            return 0;
          }
        },
        cell: ({ row }) => row.original.amount_ron ? formatCurrency(row.original.amount_ron, 'RON') : '',
        enableColumnFilter: false,
        meta: {
          align: 'right',
        },
      },
      {
        id: 'rrn',
        header: 'RRN/REF',
        accessorFn: (row) => row.rrn || '',
        cell: ({ row }) => row.original.rrn || '',
        enableColumnFilter: true,
      },
    ],
    []
  );

  const table = useReactTable({
    data: transactions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  });

  const totalDebit = useMemo(() => {
    return transactions.reduce((sum, txn) => {
      try {
        return sum + parseFloat(txn.debit || '0');
      } catch {
        return sum;
      }
    }, 0);
  }, [transactions]);

  const totalCredit = useMemo(() => {
    return transactions.reduce((sum, txn) => {
      try {
        return sum + parseFloat(txn.credit || '0');
      } catch {
        return sum;
      }
    }, 0);
  }, [transactions]);

  const balance = useMemo(() => {
    return totalCredit - totalDebit;
  }, [totalCredit, totalDebit]);

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50 dark:bg-gray-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    style={{
                      width: header.id === 'description' ? '30%' : 'auto',
                      textAlign: (header.column.columnDef.meta as any)?.align === 'right' ? 'right' : 'left',
                    }}
                  >
                    <div 
                      className={`group inline-flex ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                          {{
                            asc: '▴',
                            desc: '▾',
                          }[header.column.getIsSorted() as string] ?? '⇅'}
                        </span>
                      )}
                    </div>
                    
                    {header.column.getCanFilter() && (
                      <div className="mt-1">
                        <input
                          type="text"
                          className="w-full rounded border p-1 text-sm"
                          placeholder={`Filter...`}
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={e => header.column.setFilterValue(e.target.value)}
                        />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300"
                      style={{
                        textAlign: (cell.column.columnDef.meta as any)?.align === 'right' ? 'right' : 'left',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-300">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <td colSpan={3} className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Total
              </td>
              <td className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalDebit.toString(), 'RON')}
              </td>
              <td className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalCredit.toString(), 'RON')}
              </td>
              <td className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                -
              </td>
              <td className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(balance.toString(), 'RON')}
              </td>
              <td className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                -
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
          <span className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <div>Page</div>
            <strong>
              {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </strong>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            onClick={onExportCSV}
          >
            Export CSV
          </button>
          <select
            className="p-2 text-sm border rounded"
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
          >
            {[10, 20, 30, 50, 100].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TxnTable; 