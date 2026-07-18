import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsTable } from "@/components/products-table";
import { createLocalInventoryStore } from "@/lib/inventory-store";
import { ToastProvider } from "@/components/ui/toast";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

function renderProductsTable(initialQuery?: string) {
  return render(
    <ToastProvider>
      <ProductsTable initialQuery={initialQuery} />
    </ToastProvider>,
  );
}

describe("ProductsTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("muestra un mensaje cuando no hay productos", async () => {
    renderProductsTable();

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No hay productos"));
  });

  it("lista productos guardados y marca stock bajo", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 2, reason: "Stock inicial", supplier: "" });

    renderProductsTable();

    await waitFor(() => expect(screen.getByText("Medias largas")).toBeInTheDocument());
    expect(screen.getByText(/stock bajo/i)).toBeInTheDocument();
  });

  it("shows the movement history for a product in a drawer", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 10, reason: "Compra inicial", supplier: "Proveedor A" });
    const user = userEvent.setup();
    renderProductsTable();

    await screen.findByText("Medias largas");
    await user.click(screen.getByRole("button", { name: "Acciones para Medias largas" }));
    await user.click(screen.getByRole("menuitem", { name: "Ver movimientos" }));

    expect(await screen.findByText("Compra inicial")).toBeInTheDocument();
    expect(screen.getByText("entrada")).toBeInTheDocument();
  });

  it("removes a deleted product from the table after confirming", async () => {
    const store = createLocalInventoryStore();
    await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    const user = userEvent.setup();
    renderProductsTable();

    await screen.findByText("Medias largas");
    await user.click(screen.getByRole("button", { name: "Acciones para Medias largas" }));
    await user.click(screen.getByRole("menuitem", { name: "Eliminar producto" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Medias largas eliminado.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Medias largas")).not.toBeInTheDocument());
    expect(await store.listProducts()).toHaveLength(0);
  });
});
