"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "right" | "center";
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  searchPredicate?: (row: T, query: string) => boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  loading?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  getRowId,
  searchPlaceholder = "Buscar...",
  searchPredicate,
  emptyTitle,
  emptyDescription,
  emptyAction,
  toolbar,
  loading,
  pageSize = 10,
  onRowClick,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query || !searchPredicate) return data;
    return data.filter((row) => searchPredicate(row, query.toLowerCase()));
  }, [data, query, searchPredicate]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = column.sortValue!(a);
      const bv = column.sortValue!(b);
      const result = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.direction === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageSafe = Math.min(page, pageCount);
  const rows = sorted.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {(searchPredicate || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchPredicate ? (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" aria-hidden="true" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
          ) : <div />}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-foreground-muted",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {column.header}
                      {sort?.key === column.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="size-3.5" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-border text-foreground last:border-0",
                      onRowClick && "cursor-pointer hover:bg-surface-muted",
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          "px-4 py-3",
                          column.align === "right" && "text-right",
                          column.align === "center" && "text-center",
                          column.className,
                        )}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className="rounded-none border-0" />
        ) : null}
      </div>

      {!loading && rows.length > 0 ? (
        <Pagination page={pageSafe} pageCount={pageCount} onPageChange={setPage} totalItems={sorted.length} pageSize={pageSize} />
      ) : null}
    </div>
  );
}
