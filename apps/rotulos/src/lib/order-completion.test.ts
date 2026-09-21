import { describe, expect, it, vi } from "vitest";
import type { OrderPayment, OrderRecord } from "@/lib/business-types";
import { completeOrderWithPayment, completionBalance } from "@/lib/order-completion";
import { getOrderLock } from "@/lib/order-lock";

const order = (overrides: Partial<OrderRecord> = {}) =>
  ({ id: "o1", total: 100000, status: "pending", source: "app", ...overrides }) as OrderRecord;
const payment = (amount: number) => ({ id: `p${amount}`, orderId: "o1", amount }) as OrderPayment;
const options = { registerPayment: true, method: "transferencia" as const, paidAt: "2026-09-21" };

function fakeStore() {
  return {
    updateOrder: vi.fn(async (id: string, patch: { status: OrderRecord["status"] }) => order({ id, ...patch })),
    addPayment: vi.fn(async (orderId: string, draft: { amount: number }) => ({ ...payment(draft.amount), orderId })),
  };
}

describe("completeOrderWithPayment", () => {
  it("registers the remaining balance and completes the order in one action", async () => {
    const store = fakeStore();
    const result = await completeOrderWithPayment(store, order(), [payment(40000)], options);

    expect(store.addPayment).toHaveBeenCalledWith("o1", {
      amount: 60000,
      method: "transferencia",
      paidAt: "2026-09-21",
      note: "PAGADO AL COMPLETAR",
    });
    expect(store.updateOrder).toHaveBeenCalledWith("o1", { status: "completed" });
    expect(result.order.status).toBe("completed");
    expect(result.payment?.amount).toBe(60000);
  });

  it("completes without touching payments when the user chooses not to register one", async () => {
    const store = fakeStore();
    const result = await completeOrderWithPayment(store, order(), [], { ...options, registerPayment: false });

    expect(store.addPayment).not.toHaveBeenCalled();
    expect(result.payment).toBeNull();
    expect(result.order.status).toBe("completed");
  });

  it("does not add a payment when the order is already fully paid", async () => {
    const store = fakeStore();
    await completeOrderWithPayment(store, order(), [payment(100000)], options);
    expect(store.addPayment).not.toHaveBeenCalled();
    expect(store.updateOrder).toHaveBeenCalled();
  });

  it("does not complete the order if the payment could not be saved", async () => {
    const store = fakeStore();
    store.addPayment.mockRejectedValueOnce(new Error("boom"));
    await expect(completeOrderWithPayment(store, order(), [], options)).rejects.toThrow("boom");
    expect(store.updateOrder).not.toHaveBeenCalled();
  });

  it("skips the status update for an order that is already completed", async () => {
    const store = fakeStore();
    await completeOrderWithPayment(store, order({ status: "completed" }), [], options);
    expect(store.updateOrder).not.toHaveBeenCalled();
    expect(store.addPayment).toHaveBeenCalled();
  });
});

describe("completionBalance", () => {
  it("ignores imported orders without payments and cancelled orders", () => {
    expect(completionBalance(order({ source: "excel_import" }), [])).toBe(0);
    expect(completionBalance(order({ status: "cancelled" }), [])).toBe(0);
    expect(completionBalance(order(), [])).toBe(100000);
  });
});

describe("getOrderLock", () => {
  it("locks completed orders and fully paid orders, leaves open orders editable", () => {
    expect(getOrderLock(order({ status: "completed" }), [])).toEqual({ locked: true, reason: "completed" });
    expect(getOrderLock(order(), [payment(100000)])).toEqual({ locked: true, reason: "paid" });
    expect(getOrderLock(order(), [payment(30000)])).toEqual({ locked: false, reason: null });
    expect(getOrderLock(order(), [])).toEqual({ locked: false, reason: null });
  });

  it("keeps completed as the reason when the order is both completed and paid", () => {
    expect(getOrderLock(order({ status: "completed" }), [payment(100000)]).reason).toBe("completed");
  });

  it("does not lock cancelled orders", () => {
    expect(getOrderLock(order({ status: "cancelled" }), [payment(100000)]).locked).toBe(false);
  });
});
