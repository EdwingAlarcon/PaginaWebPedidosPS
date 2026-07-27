import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBusinessStore } from "@/lib/business-store";
import { getInventoryStore } from "@/lib/inventory-store";
import { OrderForm } from "@/components/order-form";
import { ToastProvider } from "@/components/ui/toast";

function renderWithToast(children: ReactNode) {
  return render(<ToastProvider>{children}</ToastProvider>);
}

async function seedProduct() {
  const product = await getInventoryStore().saveProduct({
    name: "Bolso Grande",
    category: "Bolsos",
    sku: "BOL-001",
    unitPrice: 40000,
    minStock: 0,
    maxStock: null,
  });
  await getInventoryStore().recordMovement({
    productId: product.id,
    type: "entrada",
    quantity: 10,
    reason: "Seed inicial",
    supplier: "",
  });
  return product;
}

describe("OrderForm con inventario real", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("bloquea guardar si el producto escrito no existe en inventario", async () => {
    await seedProduct();
    const user = userEvent.setup();
    renderWithToast(<OrderForm />);

    await user.type(screen.getByPlaceholderText("Busca o escribe un cliente nuevo"), "Cliente Nuevo");
    await user.type(screen.getByLabelText("Producto"), "Producto Inexistente");
    fireEvent.click(screen.getByRole("button", { name: "Guardar pedido" }));

    expect(await screen.findByText("Selecciona cada producto desde el listado de inventario.")).toBeInTheDocument();
    expect(await getBusinessStore().listOrders()).toHaveLength(0);
  });

  it("captura el productId y muestra el stock disponible al elegir un producto real", async () => {
    const product = await seedProduct();
    const user = userEvent.setup();
    renderWithToast(<OrderForm />);

    await user.type(screen.getByPlaceholderText("Busca o escribe un cliente nuevo"), "Cliente Nuevo");
    await user.type(screen.getByLabelText("Producto"), "Bolso Grande");

    expect(await screen.findByText("Stock disponible: 10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar pedido" }));

    await waitFor(() => expect(screen.queryByText("Selecciona cada producto desde el listado de inventario.")).not.toBeInTheDocument());
    const orders = await getBusinessStore().listOrders();
    expect(orders[0].items[0].productId).toBe(product.id);
  });
});
