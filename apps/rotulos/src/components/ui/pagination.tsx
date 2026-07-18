import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({ page, pageCount, onPageChange, totalItems, pageSize }: PaginationProps) {
  if (pageCount <= 1) return null;

  const rangeStart = totalItems && pageSize ? (page - 1) * pageSize + 1 : undefined;
  const rangeEnd = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div className="flex items-center justify-between gap-4 pt-3">
      <p className="text-xs text-foreground-muted">
        {rangeStart && rangeEnd && totalItems
          ? `${rangeStart}-${rangeEnd} de ${totalItems}`
          : `Pagina ${page} de ${pageCount}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-sm text-foreground-muted">
          {page} / {pageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
