import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockMovementForm } from "@/components/stock-movement-form";
import { createLocalInventoryStore } from "@/lib/inventory-store";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

describe("StockMovementForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("registra un movimiento de entrada para un producto existente", async () => {
    const user = userEvent.setup();
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    render(<StockMovementForm onSaved={vi.fn()} />);

    // Wait for the product to be loaded into the select
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "MEDIAS LARGAS" })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/^producto/i), product.id);
    await user.selectOptions(screen.getByLabelText(/tipo de movimiento/i), "entrada");
    await user.type(screen.getByLabelText(/cantidad/i), "10");
    await user.click(screen.getByRole("button", { name: /registrar movimiento/i }));

    await waitFor(async () => {
      const [updated] = await store.listProducts();
      expect(updated.currentStock).toBe(10);
    });
  });
});
