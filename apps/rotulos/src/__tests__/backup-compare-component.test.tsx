import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackupCompare } from "@/components/backup-compare";
import type { FullBackupPayload } from "@/lib/backup";

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BackupCompare", () => {
  it("compares a local backup file against the current export", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => snapshot({ customers: [{ id: "customer-1", full_name: "ANA MARIA" }, { id: "customer-2", full_name: "LUISA" }] }),
    })));
    const file = new File(
      [JSON.stringify(snapshot({ customers: [{ id: "customer-1", full_name: "ANA" }] }))],
      "backup.json",
      { type: "application/json" },
    );

    render(<BackupCompare />);

    await userEvent.upload(screen.getByLabelText("Backup JSON anterior"), file);
    await userEvent.click(screen.getByRole("button", { name: "Comparar" }));

    await waitFor(() => expect(screen.getByText("customers")).toBeInTheDocument());
    expect(screen.getByText("1 cambiado")).toBeInTheDocument();
    expect(screen.getByText("1 extra")).toBeInTheDocument();
  });

  it("prepares and executes an explicit restore selection", async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const target = String(url);
      if (target.includes("/api/export")) {
        return {
          ok: true,
          json: async () => snapshot(),
        };
      }
      if (target.includes("/api/backups/restore/preview")) {
        return {
          ok: true,
          json: async () => ({
            runId: "dry-run-1",
            sourceBackupGeneratedAt: "2026-08-22T00:00:00.000Z",
            currentGeneratedAt: "2026-08-22T01:00:00.000Z",
            report: {
              tables: {
                customers: { summary: { missing: 1, extra: 0, changed: 0, unchanged: 0 }, missing: [{ key: "customer-1" }], extra: [], changed: [] },
                orders: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                orderItems: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                orderEdits: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                productCodes: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                products: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                stockMovements: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                labels: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
                settings: { summary: { missing: 0, extra: 0, changed: 0, unchanged: 0 }, missing: [], extra: [], changed: [] },
              },
            },
            warnings: [],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ runId: "execute-1", preRestoreBackupFilename: "backup-before-restore.json", applied: [{ table: "customers", inserted: 1, updated: 0 }] }),
      };
    });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(
      [JSON.stringify(snapshot({ customers: [{ id: "customer-1", full_name: "ANA" }] }))],
      "backup.json",
      { type: "application/json" },
    );

    render(<BackupCompare />);

    await userEvent.upload(screen.getByLabelText("Backup JSON anterior"), file);
    await userEvent.click(screen.getByRole("button", { name: "Comparar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Preparar restauración" }));
    await userEvent.click(await screen.findByLabelText("Restaurar customers customer-1"));
    expect(screen.getByRole("button", { name: "Ejecutar restauración" })).toBeDisabled();

    await userEvent.type(screen.getByLabelText("Confirmación"), "RESTAURAR");
    await userEvent.click(screen.getByRole("button", { name: "Ejecutar restauración" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "/api/backups/restore/execute",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("customer-1"),
      }),
    ));
    expect(await screen.findByText("Restauración aplicada.")).toBeInTheDocument();
  });
});
