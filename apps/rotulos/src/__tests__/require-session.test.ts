import { describe, expect, it, vi } from "vitest";

function mockSupabase({
  user,
  allowed,
}: {
  user: { id: string; email: string } | null;
  allowed: boolean;
}) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user } })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: allowed ? { email: user?.email } : null })),
        })),
      })),
    })),
  };
}

describe("requireSession", () => {
  it("retorna null si no hay cliente de supabase disponible", async () => {
    vi.doMock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => null) }));
    const { requireSession } = await import("@/lib/require-session");

    expect(await requireSession()).toBeNull();
    vi.doUnmock("@/lib/supabase/server");
    vi.resetModules();
  });

  it("retorna null si no hay usuario autenticado", async () => {
    const supabase = mockSupabase({ user: null, allowed: false });
    vi.doMock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => supabase) }));
    const { requireSession } = await import("@/lib/require-session");

    expect(await requireSession()).toBeNull();
    vi.doUnmock("@/lib/supabase/server");
    vi.resetModules();
  });

  it("retorna null si el usuario autenticado no esta en allowed_users", async () => {
    const supabase = mockSupabase({ user: { id: "u1", email: "intruso@example.com" }, allowed: false });
    vi.doMock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => supabase) }));
    const { requireSession } = await import("@/lib/require-session");

    expect(await requireSession()).toBeNull();
    vi.doUnmock("@/lib/supabase/server");
    vi.resetModules();
  });

  it("retorna la sesion si el usuario esta autenticado y en allowed_users", async () => {
    const supabase = mockSupabase({ user: { id: "u1", email: "edwing@example.com" }, allowed: true });
    vi.doMock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => supabase) }));
    const { requireSession } = await import("@/lib/require-session");

    expect(await requireSession()).toEqual({ userId: "u1", email: "edwing@example.com" });
    vi.doUnmock("@/lib/supabase/server");
    vi.resetModules();
  });
});
