import { describe, expect, it } from "vitest";
import type { OrderPayment, OrderRecord } from "@/lib/business-types";
import { buildPaymentReminderText, listReceivables, summarizePayment, totalReceivable } from "@/lib/payments";

const order = (overrides: Partial<OrderRecord> = {}) =>
  ({ id: "o1", total: 100000, status: "pending", source: "app", orderDate: "2026-09-01", ...overrides }) as OrderRecord;
const payment = (amount: number, orderId = "o1") => ({ id: `p${amount}`, orderId, amount }) as OrderPayment;

describe("summarizePayment", () => {
  it("marks a pending app order without payments as unpaid with full balance", () => {
    expect(summarizePayment(order(), [])).toEqual({ status: "unpaid", paid: 0, balance: 100000 });
  });

  it("marks a partially paid order as partial with the remaining balance", () => {
    expect(summarizePayment(order(), [payment(30000), payment(20000)])).toEqual({
      status: "partial",
      paid: 50000,
      balance: 50000,
    });
  });

  it("marks a fully paid order as paid, even when overpaid", () => {
    expect(summarizePayment(order(), [payment(100000)]).status).toBe("paid");
    expect(summarizePayment(order(), [payment(120000)])).toEqual({ status: "paid", paid: 120000, balance: 0 });
  });

  it("does not invent debt for completed or imported orders with no payment records", () => {
    expect(summarizePayment(order({ status: "completed" }), []).status).toBe("legacy");
    expect(summarizePayment(order({ source: "excel_import" }), []).status).toBe("legacy");
  });

  it("still tracks the balance of a completed order once a partial payment exists", () => {
    expect(summarizePayment(order({ status: "completed" }), [payment(40000)])).toEqual({
      status: "partial",
      paid: 40000,
      balance: 60000,
    });
  });

  it("never counts cancelled orders as receivable", () => {
    expect(summarizePayment(order({ status: "cancelled" }), [payment(10000)]).balance).toBe(0);
  });
});

describe("listReceivables", () => {
  it("returns orders with balance, oldest first, and sums them", () => {
    const orders = [
      order({ id: "a", orderDate: "2026-09-10" }),
      order({ id: "b", orderDate: "2026-08-01", total: 50000 }),
      order({ id: "c", orderDate: "2026-07-01", status: "completed" }),
    ];
    const receivables = listReceivables(orders, [payment(100000, "a")]);
    expect(receivables.map((entry) => entry.order.id)).toEqual(["b"]);
    expect(totalReceivable(receivables)).toBe(50000);
  });
});

describe("buildPaymentReminderText", () => {
  it("mentions the balance and the amount already paid", () => {
    const receivables = listReceivables(
      [order({ customer: { fullName: "ZAIDA SUAREZ" } as OrderRecord["customer"] })],
      [payment(30000)],
    );
    const text = buildPaymentReminderText(receivables[0], (value) => `$${value}`);
    expect(text).toContain("ZAIDA SUAREZ");
    expect(text).toContain("saldo pendiente de $70000");
    expect(text).toContain("abonaste $30000 de $100000");
  });
});
