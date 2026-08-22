import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FullBackupPayload } from "@/lib/backup";

const routeMocks = vi.hoisted(() => ({
  session: null as null | { email: string; userId: string },
  serviceClient: null as unknown,
}));

vi.mock("@/lib/require-session", () => ({
  requireSession: vi.fn(async () => routeMocks.session),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: vi.fn(() => routeMocks.serviceClient),
}));

function snapshot(overrides: Partial<FullBackupPayload> = {}): FullBackupPayload {
  return {
    generatedAt: "2026-08-22T00:00:00.000Z",
    generatedBy: "test",
    customers: [],
    orders: [],
    orderItems: [],
    orderEdits: [],
    productCodes: [],
    products: [],
    stockMovements: [],
    labels: [],
    settings: [],
    ...overrides,
  };
}

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function createSupabaseMock(current: FullBackupPayload = snapshot()) {
  const auditInsert = vi.fn(async () => ({ data: { id: "run-1" }, error: null }));
  const auditUpdate = vi.fn(async () => ({ error: null }));
  const tableData = new Map<string, unknown[]>([
    ["customers", current.customers],
    ["orders", current.orders],
    ["order_items", current.orderItems],
    ["order_edits", current.orderEdits],
    ["product_codes", current.productCodes],
    ["products", current.products],
    ["stock_movements", current.stockMovements],
    ["labels", current.labels],
    ["settings", current.settings],
  ]);
  const insertCustomer = vi.fn(async () => ({ error: null }));
  const upload = vi.fn(async () => ({ error: null }));

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "backup_restore_runs") {
        return {
          insert: vi.fn(() => ({ select: vi.fn(() => ({ single: auditInsert })) })),
          update: vi.fn(() => ({ eq: auditUpdate })),
        };
      }
      return {
        select: vi.fn(async () => ({ data: tableData.get(table) ?? [], error: null })),
        insert: table === "customers" ? insertCustomer : vi.fn(async () => ({ error: null })),
        update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      };
    }),
    storage: { from: vi.fn(() => ({ upload })) },
  };

  return { supabase, auditInsert, auditUpdate, insertCustomer, upload };
}

afterEach(() => {
  routeMocks.session = null;
  routeMocks.serviceClient = null;
  vi.clearAllMocks();
  vi.resetModules();
  delete process.env.BACKUP_RESTORE_ENABLED;
  delete process.env.BACKUP_RESTORE_ALLOWED_EMAILS;
});

describe("backup restore routes", () => {
  it("preview rejects when restore feature flag is disabled", async () => {
    routeMocks.session = { email: "ana@example.com", userId: "user-1" };
    const { POST } = await import("@/app/api/backups/restore/preview/route");

    const response = await POST(jsonRequest("http://localhost/api/backups/restore/preview", { backup: snapshot() }));

    expect(response.status).toBe(403);
  });

  it("preview records a dry-run for allowed users", async () => {
    process.env.BACKUP_RESTORE_ENABLED = "true";
    process.env.BACKUP_RESTORE_ALLOWED_EMAILS = "ana@example.com";
    routeMocks.session = { email: "ana@example.com", userId: "user-1" };
    const { supabase, auditInsert } = createSupabaseMock(snapshot());
    routeMocks.serviceClient = supabase;
    const { POST } = await import("@/app/api/backups/restore/preview/route");

    const response = await POST(jsonRequest("http://localhost/api/backups/restore/preview", {
      backup: snapshot({ customers: [{ id: "customer-1", full_name: "ANA" }] }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.runId).toBe("run-1");
    expect(body.report.tables.customers.summary.missing).toBe(1);
    expect(auditInsert).toHaveBeenCalled();
  });

  it("execute requires the RESTAURAR confirmation", async () => {
    process.env.BACKUP_RESTORE_ENABLED = "true";
    process.env.BACKUP_RESTORE_ALLOWED_EMAILS = "ana@example.com";
    routeMocks.session = { email: "ana@example.com", userId: "user-1" };
    const { POST } = await import("@/app/api/backups/restore/execute/route");

    const response = await POST(jsonRequest("http://localhost/api/backups/restore/execute", {
      backup: snapshot(),
      selectedChanges: [],
      confirmation: "si",
    }));

    expect(response.status).toBe(400);
  });

  it("execute uploads a pre-restore backup before inserting selected missing rows", async () => {
    process.env.BACKUP_RESTORE_ENABLED = "true";
    process.env.BACKUP_RESTORE_ALLOWED_EMAILS = "ana@example.com";
    routeMocks.session = { email: "ana@example.com", userId: "user-1" };
    const { supabase, upload, insertCustomer } = createSupabaseMock(snapshot());
    routeMocks.serviceClient = supabase;
    const { POST } = await import("@/app/api/backups/restore/execute/route");

    const response = await POST(jsonRequest("http://localhost/api/backups/restore/execute", {
      backup: snapshot({ customers: [{ id: "customer-1", full_name: "ANA" }] }),
      selectedChanges: [{ table: "customers", key: "customer-1", action: "insert_missing" }],
      confirmation: "RESTAURAR",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preRestoreBackupFilename).toMatch(/^backup-before-restore-.*\.json$/);
    expect(upload).toHaveBeenCalledBefore(insertCustomer);
    expect(insertCustomer).toHaveBeenCalledWith({ id: "customer-1", full_name: "ANA" });
  });
});
