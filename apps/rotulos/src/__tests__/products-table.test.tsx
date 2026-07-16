import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsTable } from "@/components/products-table";
import { createLocalInventoryStore } from "@/lib/inventory-store";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

describe("ProductsTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("muestra un mensaje cuando no hay productos", async () => {
    render(<ProductsTable />);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No hay productos"));
  });

  it("lista productos guardados y marca stock bajo", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 2, reason: "Stock inicial", supplier: "" });

    render(<ProductsTable />);

    await waitFor(() => expect(screen.getByText("Medias largas")).toBeInTheDocument());
    expect(screen.getByText(/stock bajo/i)).toBeInTheDocument();
  });
});
