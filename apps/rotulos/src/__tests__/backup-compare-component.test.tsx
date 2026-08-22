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
});
