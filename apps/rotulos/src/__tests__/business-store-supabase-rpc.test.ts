import { afterEach, describe, expect, it, vi } from "vitest";

const ORDER_ROW = {
  id: "order-1",
  customer_id: "cust-1",
  customer_snapshot: {
    fullName: "ANA PEREZ",
    phone: "3001234567",
    email: "",
    department: "ANTIOQUIA",
    city: "MEDELLIN",
    locality: "",
    address: "CALLE 1",
    neighborhood: "",
  },
  order_date: "2026-07-27",
  status: "pending",
  notes: "",
  discount: 0,
  shipping_cost: 0,
  subtotal: 100,
  total: 100,
  created_at: "2026-07-27T00:00:00Z",
  updated_at: "2026-07-27T00:00:00Z",
  order_items: [],
};

function mockSupabase() {
  const rpc = vi.fn(async (): Promise<{ data: unknown; error: unknown }> => ({ data: ORDER_ROW, error: null }));
  const single = vi.fn(async () => ({ data: ORDER_ROW, error: null }));
  const eq = vi.fn(() => ({ single }));
  const returns = vi.fn(async () => ({ data: [], error: null }));
  const order = vi.fn(() => ({ returns }));
  const select = vi.fn(() => ({ eq, order, returns }));
  const from = vi.fn(() => ({ select }));
  return { rpc, from, single, eq, select, order, returns };
}

afterEach(() => {
  vi.doUnmock("@/lib/supabase/client");
  vi.resetModules();
});

describe("createSupabaseBusinessStore (rama Supabase)", () => {
  it("saveOrder llama al RPC save_order y luego relee el pedido con sus lineas", async () => {
    const supabase = mockSupabase();
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    const draft = createBlankOrderDraft();
    draft.customer.fullName = "Ana Perez";
    draft.customer.phone = "3001234567";
    draft.items = [{ productCode: "SKU1", productName: "Bolso", category: "Bolsos", quantity: 2, unitPrice: 50 }];

    const order = await getBusinessStore().saveOrder(draft);

    expect(supabase.rpc).toHaveBeenCalledWith("save_order", expect.objectContaining({
      p_customer: expect.objectContaining({ fullName: "ANA PEREZ", phone: "3001234567" }),
      p_order: expect.objectContaining({ subtotal: 100, total: 100 }),
      p_items: expect.arrayContaining([expect.objectContaining({ productCode: "SKU1", quantity: 2 })]),
    }));
    expect(supabase.from).toHaveBeenCalledWith("orders");
    expect(supabase.eq).toHaveBeenCalledWith("id", "order-1");
    expect(order.id).toBe("order-1");
  });

  it("updateOrder llama al RPC update_order con el patch normalizado", async () => {
    const supabase = mockSupabase();
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore } = await import("@/lib/business-store");

    await getBusinessStore().updateOrder("order-1", { notes: "hola", adjustmentReason: "correccion de precio" });

    expect(supabase.rpc).toHaveBeenCalledWith("update_order", {
      p_order_id: "order-1",
      p_patch: expect.objectContaining({ notes: "HOLA", adjustmentReason: "CORRECCION DE PRECIO" }),
    });
  });

  it("mergeCustomers llama al RPC merge_customers y devuelve la cantidad de pedidos actualizados", async () => {
    const supabase = mockSupabase();
    supabase.rpc.mockResolvedValue({ data: 3, error: null });
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore } = await import("@/lib/business-store");

    const result = await getBusinessStore().mergeCustomers("source-1", "target-1");

    expect(supabase.rpc).toHaveBeenCalledWith("merge_customers", { p_source_id: "source-1", p_target_id: "target-1" });
    expect(result).toEqual({ updatedOrders: 3 });
  });

  it("listCustomers pide a Supabase los clientes ordenados alfabeticamente", async () => {
    const supabase = mockSupabase();
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore } = await import("@/lib/business-store");

    await getBusinessStore().listCustomers();

    expect(supabase.from).toHaveBeenCalledWith("customers");
    expect(supabase.select).toHaveBeenCalledWith("*");
    expect(supabase.order).toHaveBeenCalledWith("full_name", { ascending: true });
  });

  it("propaga el error del RPC si save_order falla (sin dejar estado parcial en el cliente)", async () => {
    const supabase = mockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: new Error("boom") });
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    await expect(getBusinessStore().saveOrder(createBlankOrderDraft())).rejects.toThrow("boom");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("propaga el error stock_insuficiente sin dejar estado parcial en el cliente", async () => {
    const supabase = mockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: new Error("stock_insuficiente") });
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    await expect(getBusinessStore().saveOrder(createBlankOrderDraft())).rejects.toThrow("stock_insuficiente");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("mapea product_id de order_items a productId en el modelo de la app", async () => {
    const supabase = mockSupabase();
    const rowWithItem = {
      ...ORDER_ROW,
      order_items: [
        { id: "item-1", product_id: "prod-9", product_code: "SKU1", product_name: "Bolso", category: "Bolsos", quantity: 2, unit_price: 50, total: 100 },
      ],
    } as any;
    supabase.single.mockResolvedValueOnce({ data: rowWithItem, error: null });
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    const order = await getBusinessStore().saveOrder(createBlankOrderDraft());

    expect(order.items[0].productId).toBe("prod-9");
  });

  it("incluye productId en el payload p_items enviado al RPC save_order", async () => {
    const supabase = mockSupabase();
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    const draft = createBlankOrderDraft();
    draft.customer.fullName = "Ana Perez";
    draft.items = [{ productId: "prod-1", productCode: "SKU1", productName: "Bolso", category: "Bolsos", quantity: 2, unitPrice: 50 }];

    await getBusinessStore().saveOrder(draft);

    expect(supabase.rpc).toHaveBeenCalledWith("save_order", expect.objectContaining({
      p_items: [expect.objectContaining({ productId: "prod-1", quantity: 2 })],
    }));
  });
});
