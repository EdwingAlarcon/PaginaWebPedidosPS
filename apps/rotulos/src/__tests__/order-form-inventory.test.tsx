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

  it("permite guardar un producto de catalogo aunque no exista en inventario", async () => {
    await getBusinessStore().saveProductCode({
      code: "SET-001",
      productName: "Set de Aretes",
      category: "Accesorios",
      unitPrice: 25000,
      supplierPrice: 0,
      imageUrl: null,
    });
    const user = userEvent.setup();
    renderWithToast(<OrderForm />);

    await user.type(screen.getByPlaceholderText("Busca o escribe un cliente nuevo"), "Cliente Nuevo");
    await user.type(screen.getByLabelText("Producto"), "Set de Aretes");
    fireEvent.click(screen.getByRole("button", { name: "Guardar pedido" }));

    expect(await screen.findByText(/Pedido guardado para CLIENTE NUEVO/i)).toBeInTheDocument();
    const [order] = await getBusinessStore().listOrders();
    expect(order.items[0]).toMatchObject({
      productId: null,
      productCode: "SET-001",
      productName: "SET DE ARETES",
      category: "ACCESORIOS",
      unitPrice: 25000,
    });
    expect(screen.getByRole("link", { name: "Generar rótulo" })).toHaveAttribute("href", `/crear?fromOrderId=${order.id}`);
    expect(screen.getByRole("link", { name: "Ver despacho" })).toHaveAttribute("href", "/despacho");
    expect(screen.getByRole("button", { name: "Crear otro" })).toBeInTheDocument();
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
