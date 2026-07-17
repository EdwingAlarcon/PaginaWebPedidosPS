import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

describe("createServerSupabaseClient", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("retorna null si faltan las variables de entorno de Supabase", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const client = await createServerSupabaseClient();

    expect(client).toBeNull();

    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it("crea un cliente cuando las variables de entorno existen", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { createServerSupabaseClient } = await import("@/lib/supabase/server");
    const client = await createServerSupabaseClient();

    expect(client).not.toBeNull();
  });
});
