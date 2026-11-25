import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/auth/callback/route";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ auth: { exchangeCodeForSession } }),
}));

const call = async (query: string) =>
  (await GET(new NextRequest(`https://app.test/auth/callback${query}`))).headers.get("location");

describe("auth/callback", () => {
  beforeEach(() => exchangeCodeForSession.mockReset());

  it("entra a la app cuando el codigo se canjea bien", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(await call("?code=abc")).toBe("https://app.test/");
  });

  it("vuelve al login con error cuando el proveedor no manda codigo", async () => {
    expect(await call("?error=server_error")).toBe("https://app.test/login?error=1");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("vuelve al login con error cuando falla el canje del codigo", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "boom" } });
    expect(await call("?code=abc")).toBe("https://app.test/login?error=1");
  });
});
