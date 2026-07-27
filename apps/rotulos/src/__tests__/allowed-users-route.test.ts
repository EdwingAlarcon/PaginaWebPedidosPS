import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

function mockServiceClient(overrides: {
  selectResult?: { data: unknown; error: unknown };
  insertResult?: { error: unknown };
  deleteResult?: { error: unknown };
} = {}) {
  const order = vi.fn(async () => overrides.selectResult ?? { data: [], error: null });
  const select = vi.fn(() => ({ order }));
  const insert = vi.fn(async () => overrides.insertResult ?? { error: null });
  const eq = vi.fn(async () => overrides.deleteResult ?? { error: null });
  const del = vi.fn(() => ({ eq }));
  return { from: vi.fn(() => ({ select, insert, delete: del })) };
}

afterEach(() => {
  vi.doUnmock("@/lib/require-session");
  vi.doUnmock("@/lib/supabase/server");
  vi.resetModules();
});

describe("GET /api/allowed-users", () => {
  it("responde 401 sin sesion", async () => {
    vi.doMock("@/lib/require-session", () => ({ requireSession: vi.fn(async () => null) }));
    const { GET } = await import("@/app/api/allowed-users/route");

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("lista los usuarios permitidos con sesion valida", async () => {
    vi.doMock("@/lib/require-session", () => ({
      requireSession: vi.fn(async () => ({ userId: "u1", email: "edwing@example.com" })),
    }));
    const supabase = mockServiceClient({
      selectResult: { data: [{ email: "edwing@example.com", created_at: "2026-07-17" }], error: null },
    });
    vi.doMock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => supabase) }));
    const { GET } = await import("@/app/api/allowed-users/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users).toEqual([{ email: "edwing@example.com", created_at: "2026-07-17" }]);
  });
});

describe("POST /api/allowed-users", () => {
  it("agrega un email valido, normalizado a minuscula", async () => {
    vi.doMock("@/lib/require-session", () => ({
      requireSession: vi.fn(async () => ({ userId: "u1", email: "edwing@example.com" })),
    }));
    const supabase = mockServiceClient();
    vi.doMock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => supabase) }));
    const { POST } = await import("@/app/api/allowed-users/route");

    const request = new NextRequest("http://localhost/api/allowed-users", {
      method: "POST",
      body: JSON.stringify({ email: "  Gerente@Example.com  " }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.email).toBe("gerente@example.com");
    expect(supabase.from().insert).toHaveBeenCalledWith({ email: "gerente@example.com" });
  });

  it("rechaza un email con formato invalido", async () => {
    vi.doMock("@/lib/require-session", () => ({
      requireSession: vi.fn(async () => ({ userId: "u1", email: "edwing@example.com" })),
    }));
    const { POST } = await import("@/app/api/allowed-users/route");

    const request = new NextRequest("http://localhost/api/allowed-users", {
      method: "POST",
      body: JSON.stringify({ email: "no-es-un-email" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/allowed-users", () => {
  it("elimina un email que no es el propio", async () => {
    vi.doMock("@/lib/require-session", () => ({
      requireSession: vi.fn(async () => ({ userId: "u1", email: "edwing@example.com" })),
    }));
    const supabase = mockServiceClient();
    vi.doMock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => supabase) }));
    const { DELETE } = await import("@/app/api/allowed-users/route");

    const request = new NextRequest("http://localhost/api/allowed-users?email=gerente@example.com", { method: "DELETE" });
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    expect(supabase.from().delete().eq).toHaveBeenCalledWith("email", "gerente@example.com");
  });

  it("rechaza que un usuario se elimine a si mismo", async () => {
    vi.doMock("@/lib/require-session", () => ({
      requireSession: vi.fn(async () => ({ userId: "u1", email: "edwing@example.com" })),
    }));
    const { DELETE } = await import("@/app/api/allowed-users/route");

    const request = new NextRequest("http://localhost/api/allowed-users?email=edwing@example.com", { method: "DELETE" });
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("cannot_remove_self");
  });
});
