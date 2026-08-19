import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarList, getInactiveCustomers, getMonthlySales, getPendingOrders, getTopCustomersBySales } from "@/app/(app)/reportes/page";
import type { Customer, OrderRecord } from "@/lib/business-types";

function customer(overrides: Partial<Customer>): Customer {
  return {
    id: "customer-1",
    fullName: "CLIENTE BASE",
    phone: "3000000000",
    email: "",
    department: "CUNDINAMARCA",
    city: "BOGOTA",
    address: "",
    neighborhood: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

type OrderOverrides = Partial<Omit<OrderRecord, "customer">> & {
  customer?: Partial<OrderRecord["customer"]>;
};

function order(overrides: OrderOverrides): OrderRecord {
  const { customer, ...orderOverrides } = overrides;
  const baseCustomer: OrderRecord["customer"] = {
    fullName: "CLIENTE BASE",
    phone: "",
    email: "",
    department: "CUNDINAMARCA",
    city: "BOGOTA",
    locality: "",
    address: "",
    neighborhood: "",
  };

  return {
    id: "order-1",
    customerId: "customer-1",
    customer: { ...baseCustomer, ...customer },
    orderDate: "2026-08-01",
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 0,
    total: 0,
    items: [],
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    ...orderOverrides,
  };
}

describe("reports page", () => {
  it("renders zero-value status bars with zero width", () => {
    render(
      <BarList
        items={[
          { label: "Pendiente", value: 0, formattedValue: "0" },
          { label: "Completado", value: 1, formattedValue: "1" },
          { label: "Cancelado", value: 0, formattedValue: "0" },
        ]}
      />,
    );

    const pendingBar = screen.getByText("Pendiente").closest("div")?.nextElementSibling?.firstElementChild;
    const completedBar = screen.getByText("Completado").closest("div")?.nextElementSibling?.firstElementChild;
    const cancelledBar = screen.getByText("Cancelado").closest("div")?.nextElementSibling?.firstElementChild;

    expect(pendingBar).toHaveStyle({ width: "0%" });
    expect(completedBar).toHaveStyle({ width: "100%" });
    expect(cancelledBar).toHaveStyle({ width: "0%" });
  });

  it("groups top customers by non-cancelled sales total", () => {
    const result = getTopCustomersBySales([
      order({ id: "1", customer: { fullName: "ANA" }, total: 100_000, status: "completed" }),
      order({ id: "2", customer: { fullName: "ANA" }, total: 50_000, status: "pending" }),
      order({ id: "3", customer: { fullName: "LUISA" }, total: 200_000, status: "cancelled" }),
      order({ id: "4", customer: { fullName: "MARTA" }, total: 120_000, status: "completed" }),
    ]);

    expect(result).toEqual([
      { customer: "ANA", orders: 2, total: 150_000 },
      { customer: "MARTA", orders: 1, total: 120_000 },
    ]);
  });

  it("builds monthly sales in chronological order without cancelled orders", () => {
    const result = getMonthlySales([
      order({ id: "1", orderDate: "2026-07-05", total: 100_000, status: "completed" }),
      order({ id: "2", orderDate: "2026-08-01", total: 50_000, status: "pending" }),
      order({ id: "3", orderDate: "2026-08-03", total: 25_000, status: "cancelled" }),
    ]);

    expect(result.map(({ month, orders, total }) => ({ month, orders, total }))).toEqual([
      { month: "2026-07", orders: 1, total: 100_000 },
      { month: "2026-08", orders: 1, total: 50_000 },
    ]);
  });

  it("returns the oldest pending orders first", () => {
    const result = getPendingOrders([
      order({ id: "new", orderDate: "2026-08-10", status: "pending" }),
      order({ id: "done", orderDate: "2026-08-01", status: "completed" }),
      order({ id: "old", orderDate: "2026-08-01", status: "pending" }),
    ]);

    expect(result.map((item) => item.id)).toEqual(["old", "new"]);
  });

  it("flags customers whose last related order is older than the threshold", () => {
    const ana = customer({ id: "ana", fullName: "ANA PEREZ" });
    const luisa = customer({ id: "luisa", fullName: "LUISA GOMEZ" });
    const orders = [
      order({ id: "1", customerId: "ana", customer: { fullName: "ANA PEREZ" }, orderDate: "2026-06-01" }),
      order({ id: "2", customerId: "luisa", customer: { fullName: "LUISA GOMEZ" }, orderDate: "2026-07-20" }),
    ];

    const result = getInactiveCustomers([ana, luisa], orders, 45, "2026-08-01");

    expect(result).toEqual([{ customer: ana, lastOrderDate: "2026-06-01", daysInactive: 61 }]);
  });

  it("uses the most recent related order, matching by customerId or historical name", () => {
    const ana = customer({ id: "ana", fullName: "ANA PEREZ" });
    const orders = [
      order({ id: "1", customerId: "ana", customer: { fullName: "ANA PEREZ" }, orderDate: "2026-06-01" }),
      order({ id: "2", customerId: null, customer: { fullName: "ana perez" }, orderDate: "2026-06-20" }),
    ];

    const result = getInactiveCustomers([ana], orders, 30, "2026-08-01");

    expect(result).toEqual([{ customer: ana, lastOrderDate: "2026-06-20", daysInactive: 42 }]);
  });

  it("excludes customers with no related orders at all", () => {
    const withoutOrders = customer({ id: "no-orders", fullName: "SIN PEDIDOS" });

    expect(getInactiveCustomers([withoutOrders], [], 45, "2026-08-01")).toEqual([]);
  });
});
