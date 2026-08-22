import { describe, expect, it } from "vitest";
import { findCustomerDuplicateCandidates } from "@/lib/customer-duplicates";
import type { Customer } from "@/lib/business-types";

function customer(overrides: Partial<Customer> & { id: string; fullName: string }): Customer {
  const { id, fullName, ...rest } = overrides;
  return {
    id,
    fullName,
    phone: "",
    email: "",
    department: "",
    city: "",
    locality: "",
    address: "",
    neighborhood: "",
    source: "app",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...rest,
  };
}

describe("findCustomerDuplicateCandidates", () => {
  it("finds exact same-name duplicates sorted by primary name", () => {
    const result = findCustomerDuplicateCandidates([
      customer({ id: "b", fullName: "ZAIDA", updatedAt: "2026-08-01T00:00:00.000Z" }),
      customer({ id: "a", fullName: "ANA" }),
      customer({ id: "c", fullName: "zaida", phone: "3001111111", updatedAt: "2026-08-02T00:00:00.000Z" }),
      customer({ id: "d", fullName: "ANA", phone: "3002222222" }),
    ]);

    expect(result.map((candidate) => ({
      reason: candidate.reason,
      primary: candidate.primary.fullName,
      duplicates: candidate.duplicates.map((item) => item.fullName),
    }))).toEqual([
      { reason: "same_name", primary: "ANA", duplicates: ["ANA"] },
      { reason: "same_name", primary: "zaida", duplicates: ["ZAIDA"] },
    ]);
  });

  it("finds same non-empty phone duplicates", () => {
    const result = findCustomerDuplicateCandidates([
      customer({ id: "a", fullName: "ANA", phone: "300 111 1111" }),
      customer({ id: "b", fullName: "LUISA", phone: "3001111111" }),
      customer({ id: "c", fullName: "VACIO", phone: "" }),
      customer({ id: "d", fullName: "SIN TELEFONO", phone: "" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe("same_phone");
    expect(result[0].primary.fullName).toBe("ANA");
    expect(result[0].duplicates.map((item) => item.fullName)).toEqual(["LUISA"]);
  });

  it("finds known alias duplicates and prefers non-imported complete records", () => {
    const result = findCustomerDuplicateCandidates([
      customer({ id: "short", fullName: "JOHANNA", source: "excel_import", updatedAt: "2026-08-03T00:00:00.000Z" }),
      customer({ id: "full", fullName: "JOHANNA CICACHA", phone: "3001234567", address: "CALLE 1", updatedAt: "2026-08-01T00:00:00.000Z" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe("alias");
    expect(result[0].primary.id).toBe("full");
    expect(result[0].duplicates.map((item) => item.id)).toEqual(["short"]);
  });
});
