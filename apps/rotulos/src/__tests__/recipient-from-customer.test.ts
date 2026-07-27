import { describe, expect, it } from "vitest";
import { mergeCustomerIntoRecipient } from "@/lib/recipient-from-customer";
import type { Customer } from "@/lib/business-types";
import type { Recipient } from "@/lib/types";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    fullName: "MARIA PEREZ",
    phone: "3001234567",
    email: "maria@example.com",
    department: "ANTIOQUIA",
    city: "MEDELLIN",
    locality: "",
    address: "CALLE 10 # 20-30",
    neighborhood: "LAURELES",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeRecipient(overrides: Partial<Recipient> = {}): Recipient {
  return {
    fullName: "",
    phone: "",
    department: "",
    city: "",
    locality: "",
    address: "",
    neighborhood: "",
    reference: "SE PUEDE DEJAR EN PORTERIA",
    notes: "ENTREGAR EN LA TARDE",
    ...overrides,
  };
}

describe("mergeCustomerIntoRecipient", () => {
  it("copies the customer's identity and location into the recipient", () => {
    const result = mergeCustomerIntoRecipient(makeRecipient(), makeCustomer());

    expect(result.fullName).toBe("MARIA PEREZ");
    expect(result.phone).toBe("3001234567");
    expect(result.department).toBe("ANTIOQUIA");
    expect(result.city).toBe("MEDELLIN");
    expect(result.address).toBe("CALLE 10 # 20-30");
    expect(result.neighborhood).toBe("LAURELES");
  });

  it("preserves recipient-only fields the customer record doesn't have", () => {
    const result = mergeCustomerIntoRecipient(
      makeRecipient({ reference: "SE PUEDE DEJAR EN PORTERIA", notes: "ENTREGAR EN LA TARDE" }),
      makeCustomer(),
    );

    expect(result.reference).toBe("SE PUEDE DEJAR EN PORTERIA");
    expect(result.notes).toBe("ENTREGAR EN LA TARDE");
  });

  it("defaults a missing customer locality to an empty string", () => {
    const result = mergeCustomerIntoRecipient(makeRecipient(), makeCustomer({ locality: undefined }));

    expect(result.locality).toBe("");
  });
});
