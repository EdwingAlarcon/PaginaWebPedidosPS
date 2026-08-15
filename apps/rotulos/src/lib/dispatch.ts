import type { OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";

export type DispatchIssueKey = "phone" | "address" | "city" | "locality" | "items" | "total";

export type DispatchIssue = {
  key: DispatchIssueKey;
  label: string;
};

export type DispatchRow = {
  order: OrderRecord;
  label: LabelRecord | null;
  issues: DispatchIssue[];
};

const ISSUE_LABELS: Record<DispatchIssueKey, string> = {
  phone: "Telefono",
  address: "Direccion",
  city: "Ciudad",
  locality: "Barrio/localidad",
  items: "Productos",
  total: "Total",
};

function issue(key: DispatchIssueKey): DispatchIssue {
  return { key, label: ISSUE_LABELS[key] };
}

function hasText(value: string | undefined | null): boolean {
  return Boolean(value?.trim());
}

function isRecent(order: OrderRecord, now: Date, days = 14): boolean {
  const createdAt = new Date(order.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return now.getTime() - createdAt <= days * 24 * 60 * 60 * 1000;
}

export function getDispatchIssues(order: OrderRecord): DispatchIssue[] {
  const issues: DispatchIssue[] = [];
  if (!hasText(order.customer.phone)) issues.push(issue("phone"));
  if (!hasText(order.customer.address)) issues.push(issue("address"));
  if (!hasText(order.customer.city)) issues.push(issue("city"));
  if (!hasText(order.customer.neighborhood) && !hasText(order.customer.locality)) issues.push(issue("locality"));
  if (order.items.length === 0) issues.push(issue("items"));
  if (order.total <= 0) issues.push(issue("total"));
  return issues;
}

export function buildDispatchRows(orders: OrderRecord[], labels: LabelRecord[], now = new Date()): DispatchRow[] {
  const labelByOrderId = new Map<string, LabelRecord>();
  for (const label of labels) {
    if (!label.orderId || label.status === "anulado") continue;
    const current = labelByOrderId.get(label.orderId);
    if (!current || label.updatedAt.localeCompare(current.updatedAt) > 0) {
      labelByOrderId.set(label.orderId, label);
    }
  }

  return orders
    .filter((order) => order.status !== "cancelled")
    .map((order) => ({
      order,
      label: labelByOrderId.get(order.id) ?? null,
      issues: getDispatchIssues(order),
    }))
    .filter((row) => row.order.status === "pending" || (isRecent(row.order, now) && (!row.label || row.label.status !== "impreso")))
    .sort((a, b) => {
      const urgent = Number(b.issues.length > 0) - Number(a.issues.length > 0);
      if (urgent !== 0) return urgent;
      return b.order.createdAt.localeCompare(a.order.createdAt);
    });
}
