import { resolveCustomerAlias } from "@/lib/customer-aliases";
import { normalizeText } from "@/lib/normalize";
import type { Customer } from "@/lib/business-types";

export type CustomerDuplicateReason = "same_name" | "same_phone" | "alias";

export type CustomerDuplicateCandidate = {
  reason: CustomerDuplicateReason;
  primary: Customer;
  duplicates: Customer[];
};

function normalizedPhone(phone: string): string {
  return phone.replace(/\D+/g, "");
}

function completeness(customer: Customer): number {
  return [
    customer.fullName,
    customer.phone,
    customer.email,
    customer.department,
    customer.city,
    customer.locality ?? "",
    customer.address,
    customer.neighborhood,
  ].filter((value) => value.trim()).length;
}

function choosePrimary(customers: Customer[]): Customer {
  return [...customers].sort((a, b) => {
    const sourceScore = (customer: Customer) => customer.source === "excel_import" ? 0 : 1;
    return (
      sourceScore(b) - sourceScore(a) ||
      completeness(b) - completeness(a) ||
      b.updatedAt.localeCompare(a.updatedAt) ||
      a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" })
    );
  })[0];
}

function candidateFromGroup(reason: CustomerDuplicateReason, customers: Customer[]): CustomerDuplicateCandidate | null {
  if (customers.length < 2) return null;
  const primary = choosePrimary(customers);
  const duplicates = customers
    .filter((customer) => customer.id !== primary.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }));
  return { reason, primary, duplicates };
}

function addGroups(
  candidates: CustomerDuplicateCandidate[],
  reason: CustomerDuplicateReason,
  groups: Map<string, Customer[]>,
  seen: Set<string>,
) {
  for (const customers of groups.values()) {
    const candidate = candidateFromGroup(reason, customers);
    if (!candidate) continue;
    const ids = [candidate.primary, ...candidate.duplicates].map((customer) => customer.id).sort().join("|");
    const key = ids;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(candidate);
  }
}

export function findCustomerDuplicateCandidates(customers: Customer[]): CustomerDuplicateCandidate[] {
  const byName = new Map<string, Customer[]>();
  const byPhone = new Map<string, Customer[]>();
  const byAlias = new Map<string, Customer[]>();

  for (const customer of customers) {
    const name = normalizeText(customer.fullName);
    if (name) byName.set(name, [...(byName.get(name) ?? []), customer]);

    const phone = normalizedPhone(customer.phone);
    if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), customer]);

    const alias = resolveCustomerAlias(customer.fullName);
    if (alias) byAlias.set(alias, [...(byAlias.get(alias) ?? []), customer]);
  }

  const candidates: CustomerDuplicateCandidate[] = [];
  const seen = new Set<string>();
  addGroups(candidates, "same_name", byName, seen);
  addGroups(candidates, "same_phone", byPhone, seen);
  const aliasGroups = new Map(
    [...byAlias.entries()].filter(([alias, group]) => group.some((customer) => normalizeText(customer.fullName) !== alias)),
  );
  addGroups(candidates, "alias", aliasGroups, seen);

  return candidates.sort((a, b) =>
    a.primary.fullName.localeCompare(b.primary.fullName, "es", { sensitivity: "base" }) ||
    a.reason.localeCompare(b.reason),
  );
}
