import { render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Customer, OrderRecord } from "@/lib/business-types";

function makeOrder(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    id: "o1",
    customerId: "c1",
    customer: { fullName: "ANA PEREZ", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" },
    orderDate: "2026-11-01",
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 50000,
    total: 50000,
    items: [{ id: "i1", productId: null, productCode: "X-1", productName: "MEDIAS", category: "MODA", quantity: 1, unitPrice: 50000, total: 50000 }],
    createdAt: "2026-11-01T10:00:00.000Z",
    updatedAt: "2026-11-01T10:00:00.000Z",
    source: "app",
    importBatchId: null,
    importRowKey: null,
    ...overrides,
  } as OrderRecord;
}

const customerLuisa = {
  id: "c2",
  fullName: "LUISA GOMEZ",
  phone: "3001112233",
  email: "",
  department: "",
  city: "",
  locality: "",
  address: "",
  neighborhood: "",
} as Customer;

const orders = [
  // Pendiente, sin telefono/direccion: cuenta como "por despachar" incompleto y "por cobrar".
  makeOrder({ id: "o1", customerId: "c1" }),
  // Pedido viejo y completado de una clienta con telefono: candidata a reactivar.
  makeOrder({
    id: "o2",
    customerId: "c2",
    customer: { fullName: "LUISA GOMEZ", phone: "3001112233", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" },
    orderDate: "2026-01-05",
    status: "completed",
    source: "excel_import",
    createdAt: "2026-01-05T10:00:00.000Z",
  }),
];

vi.mock("@/lib/business-store", () => ({
  getBusinessStore: () => ({
    listOrders: async () => orders,
    listPayments: async () => [],
    listCustomers: async () => [customerLuisa],
  }),
}));
const listLabelsMock = vi.fn(async (): Promise<unknown[]> => []);
vi.mock("@/lib/label-store", () => ({ getLabelStore: () => ({ listLabels: () => listLabelsMock() }) }));
vi.mock("@/lib/inventory-store", () => ({
  getInventoryStore: () => ({
    getStockAlerts: async () => ({ lowStock: [], critical: [], overstocked: [] }),
    listProducts: async () => [],
  }),
}));

import { DashboardStats } from "@/components/dashboard-stats";

describe("DashboardStats - Que hacer hoy", () => {
  it("resume lo accionable: por despachar, por cobrar y clientes por reactivar", async () => {
    render(<DashboardStats />);

    const section = await waitFor(() => {
      const el = screen.getByRole("region", { name: /qué hacer hoy/i });
      expect(within(el).getByText("1 con datos incompletos")).toBeInTheDocument();
      return el;
    });

    expect(within(section).getByRole("link", { name: /por despachar/i })).toHaveAttribute("href", "/despacho");
    expect(within(section).getByText(/50\.000/)).toBeInTheDocument();
    expect(within(section).getByText("1 pedido con saldo")).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: /clientes por reactivar/i })).toHaveAttribute("href", "/reportes");
    expect(within(section).getByText(/más de 45 días sin comprar/i)).toBeInTheDocument();
  });

  it("avisa cuando no se pueden cargar los rotulos en vez de decir que no hay", async () => {
    listLabelsMock.mockRejectedValueOnce(new Error("boom"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<DashboardStats />);

    expect(await screen.findByText("No se pudieron cargar los rótulos")).toBeInTheDocument();
    expect(screen.queryByText("Aún no hay rótulos")).not.toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
