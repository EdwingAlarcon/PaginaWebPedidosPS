import { afterEach, describe, expect, it, vi } from "vitest";

const EDIT_ROW = {
  id: "edit-1",
  order_id: "order-1",
  changed_by: "edwing@example.com",
  changed_at: "2026-07-27T00:00:00Z",
  changes: { discount: { before: 0, after: 5000 } },
  reason: "correccion de precio",
};

afterEach(() => {
  vi.doUnmock("@/lib/supabase/client");
  vi.resetModules();
});

describe("listOrderEdits (rama Supabase)", () => {
  it("consulta order_edits por order_id, ordenado por fecha descendente, y mapea a OrderEdit", async () => {
    const returns = vi.fn(async () => ({ data: [EDIT_ROW], error: null }));
    const order = vi.fn(() => ({ returns }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from };
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore } = await import("@/lib/business-store");

    const edits = await getBusinessStore().listOrderEdits("order-1");

    expect(from).toHaveBeenCalledWith("order_edits");
    expect(eq).toHaveBeenCalledWith("order_id", "order-1");
    expect(order).toHaveBeenCalledWith("changed_at", { ascending: false });
    expect(edits).toEqual([
      {
        id: "edit-1",
        orderId: "order-1",
        changedBy: "edwing@example.com",
        changedAt: "2026-07-27T00:00:00Z",
        changes: { discount: { before: 0, after: 5000 } },
        reason: "correccion de precio",
      },
    ]);
  });
});

describe("listOrderEdits (rama LocalStore)", () => {
  it("devuelve siempre un array vacio (no hay historial en el fallback local)", async () => {
    const { getBusinessStore } = await import("@/lib/business-store");
    expect(await getBusinessStore().listOrderEdits("cualquier-id")).toEqual([]);
  });
});
