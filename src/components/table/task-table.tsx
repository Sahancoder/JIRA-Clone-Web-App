'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import type { Task, TaskStatus, TaskPriority } from '@/types/domain';

interface TaskTableProps {
  tasks: Task[];
  projectId: string;
}

const PRIORITY_COLORS = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_COLORS = {
  BACKLOG: 'bg-gray-100 text-gray-700',
  TODO: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELED: 'bg-red-100 text-red-700',
};

export function TaskTable({ tasks, projectId }: TaskTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: 'content',
        header: 'Task',
        cell: ({ row }) => (
          <div className="max-w-md">
            <div className="font-medium text-gray-900">{row.original.content}</div>
            {row.original.description && (
              <div className="text-sm text-gray-500 line-clamp-1 mt-1">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[row.original.status]}`}
          >
            {row.original.status.replace('_', ' ')}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || filterValue === 'all') return true;
          return row.getValue(columnId) === filterValue;
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${PRIORITY_COLORS[row.original.priority]}`}
          >
            {row.original.priority}
          </span>
        ),
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || filterValue === 'all') return true;
          return row.getValue(columnId) === filterValue;
        },
      },
      {
        accessorKey: 'assigneeId',
        header: 'Assignee',
        cell: ({ row }) => {
          const assigneeId = row.original.assigneeId;
          if (!assigneeId) return <span className="text-gray-400">Unassigned</span>;
          return (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white text-xs flex items-center justify-center font-medium">
                {assigneeId.substring(0, 2).toUpperCase()}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          if (!dueDate) return <span className="text-gray-400">No due date</span>;
          
          const date = new Date(dueDate);
          const isOverdue = date < new Date() && row.original.status !== 'DONE';
          
          return (
            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
              {date.toLocaleDateString()}
            </span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.dueDate;
          const b = rowB.original.dueDate;
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          return new Date(a).getTime() - new Date(b).getTime();
        },
      },
      {
        accessorKey: '$createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {new Date(row.original.$createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  const handleStatusFilter = (status: string) => {
    table.getColumn('status')?.setFilterValue(status === 'all' ? undefined : status);
  };

  const handlePriorityFilter = (priority: string) => {
    table.getColumn('priority')?.setFilterValue(priority === 'all' ? undefined : priority);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="BACKLOG">Backlog</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              onChange={(e) => handlePriorityFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() && (
                          <span>
                            {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    // TODO: Open task detail modal
                    console.log('Open task:', row.original.$id);
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {table.getRowModel().rows.length} of {tasks.length} tasks
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
