"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode | ((props: { column: ColumnDef<T> }) => React.ReactNode);
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  accessor?: (row: T) => any;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: keyof T | ((row: T) => string);
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search records...",
  pageSize = 10,
  onRowClick,
  isLoading = false,
  emptyState,
  toolbarActions,
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchKey) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) => {
      let value: any = "";
      if (typeof searchKey === "function") {
        value = searchKey(row);
      } else {
        value = row[searchKey];
      }
      return String(value ?? "").toLowerCase().includes(term);
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      let valA = column?.accessor ? column.accessor(a) : a[sortKey];
      let valB = column?.accessor ? column.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === "asc" ? (valA < valB ? -1 : 1) : valA > valB ? -1 : 1;
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search & Toolbar Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {searchKey && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 bg-white dark:bg-zinc-900/60"
            />
          </div>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {toolbarActions}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/40">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.sortable && "cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.className
                  )}
                  onClick={() => handleSort(column.key, column.sortable)}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      column.align === "center" && "justify-center",
                      column.align === "right" && "justify-end"
                    )}
                  >
                    <span>
                      {typeof column.header === "function"
                        ? column.header({ column })
                        : column.header}
                    </span>
                    {column.sortable && (
                      <ArrowUpDown
                        className={cn(
                          "h-3.5 w-3.5 opacity-40 transition-opacity",
                          sortKey === column.key && "opacity-100 text-indigo-600 dark:text-indigo-400"
                        )}
                      />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <TableRow key={`skeleton-${rIdx}`}>
                  {columns.map((col, cIdx) => (
                    <TableCell key={`skel-cell-${cIdx}`}>
                      <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center text-zinc-500"
                >
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <SlidersHorizontal className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium">No results found</p>
                      {searchTerm && (
                        <p className="text-xs text-zinc-400">
                          Try adjusting your search criteria
                        </p>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow
                  key={row.id ?? `row-${idx}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    onRowClick && "cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors"
                  )}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.className
                      )}
                    >
                      {column.cell
                        ? column.cell(row, idx)
                        : column.accessor
                        ? column.accessor(row)
                        : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="flex flex-col gap-3 border-t border-zinc-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {sortedData.length}
            </span>{" "}
            entries
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
              className="h-8 w-8"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 w-8"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="px-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Page {currentPage} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 w-8"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
