"use client";

import { GitMerge } from "lucide-react";
import type { CustomerDuplicateCandidate, CustomerDuplicateReason } from "@/lib/customer-duplicates";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const REASON_LABEL: Record<CustomerDuplicateReason, string> = {
  same_name: "Mismo nombre",
  same_phone: "Mismo teléfono",
  alias: "Alias conocido",
};

export function CustomerDuplicateAlerts({
  candidates,
  onReview,
}: {
  candidates: CustomerDuplicateCandidate[];
  onReview: (candidate: CustomerDuplicateCandidate) => void;
}) {
  if (candidates.length === 0) return null;

  return (
    <Alert title="Posibles clientes duplicados" variant="warning" className="mb-3">
      <div className="mt-2 grid gap-2">
        {candidates.map((candidate) => (
          <div
            key={`${candidate.reason}-${candidate.primary.id}-${candidate.duplicates.map((customer) => customer.id).join("-")}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{candidate.primary.fullName}</span>
                <Badge variant="warning">{REASON_LABEL[candidate.reason]}</Badge>
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                Revisar con {candidate.duplicates.map((customer) => customer.fullName).join(", ")}
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => onReview(candidate)}>
              <GitMerge className="size-4" aria-hidden="true" />
              Revisar
            </Button>
          </div>
        ))}
      </div>
    </Alert>
  );
}
