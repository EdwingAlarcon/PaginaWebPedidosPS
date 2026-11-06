import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { selectAllRows } from "@/lib/backup";

function clientWithRows(total: number) {
  const range = vi.fn(async (from: number, to: number) => ({
    data: Array.from({ length: Math.max(0, Math.min(to + 1, total) - from) }, (_, i) => ({ id: from + i })),
    error: null,
  }));
  const order = vi.fn(() => ({ range }));
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { client: { from } as unknown as SupabaseClient, range };
}

describe("selectAllRows (backup sin truncar en 1000 filas)", () => {
  it("trae las 2.350 filas aunque Supabase corte cada pagina en 1000", async () => {
    const { client, range } = clientWithRows(2350);
    const result = await selectAllRows(client, "order_items");
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2350);
    expect(range.mock.calls).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
  });

  it("propaga el error como { message }", async () => {
    const range = vi.fn(async () => ({ data: null, error: { message: "permission denied" } }));
    const client = { from: () => ({ select: () => ({ order: () => ({ range }) }) }) } as unknown as SupabaseClient;
    const result = await selectAllRows(client, "orders");
    expect(result.error).toEqual({ message: "permission denied" });
  });
});
