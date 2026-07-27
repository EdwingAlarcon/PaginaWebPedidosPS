import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

function mockServiceClient(overrides: { listResult?: { data: unknown; error: unknown } } = {}) {
  const selectAll = vi.fn(async () => ({ data: [], error: null }));
  const upload = vi.fn(async () => ({ error: null }));
  const remove = vi.fn(async () => ({ error: null }));
  const list = vi.fn(async () => overrides.listResult ?? { data: [], error: null });
  return {
    from: vi.fn(() => ({ select: selectAll })),
    storage: { from: vi.fn(() => ({ upload, remove, list })) },
  };
}

afterEach(() => {
  vi.doUnmock("@/lib/supabase/server");
  vi.resetModules();
  delete process.env.CRON_SECRET;
});

function request(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/backup", {
    headers: authHeader ? { authorization: authHeader } : undefined,
  });
}

describe("GET /api/cron/backup", () => {
  it("responde 401 sin CRON_SECRET configurado", async () => {
    const { GET } = await import("@/app/api/cron/backup/route");
    const response = await GET(request("Bearer lo-que-sea"));

    expect(response.status).toBe(401);
  });

  it("responde 401 si el header no coincide con CRON_SECRET", async () => {
    process.env.CRON_SECRET = "secreto";
    const { GET } = await import("@/app/api/cron/backup/route");
    const response = await GET(request("Bearer incorrecto"));

    expect(response.status).toBe(401);
  });

  it("sube un backup y poda archivos viejos por encima de la retencion", async () => {
    process.env.CRON_SECRET = "secreto";
    const oldFiles = Array.from({ length: 35 }, (_, i) => ({ name: `backup-rotulos-old-${i}.json` }));
    const supabase = mockServiceClient({ listResult: { data: oldFiles, error: null } });
    vi.doMock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => supabase) }));
    const { GET } = await import("@/app/api/cron/backup/route");

    const response = await GET(request("Bearer secreto"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.filename).toMatch(/^backup-rotulos-.*\.json$/);
    expect(supabase.storage.from().upload).toHaveBeenCalled();
    expect(supabase.storage.from().remove).toHaveBeenCalledWith(
      oldFiles.slice(0, 5).map((file) => file.name),
    );
  });

  it("no poda si hay menos archivos que la retencion", async () => {
    process.env.CRON_SECRET = "secreto";
    const supabase = mockServiceClient({ listResult: { data: [{ name: "backup-rotulos-1.json" }], error: null } });
    vi.doMock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn(() => supabase) }));
    const { GET } = await import("@/app/api/cron/backup/route");

    await GET(request("Bearer secreto"));

    expect(supabase.storage.from().remove).not.toHaveBeenCalled();
  });
});
