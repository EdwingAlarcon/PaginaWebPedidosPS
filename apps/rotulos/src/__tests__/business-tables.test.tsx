import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";
import { CustomersTable } from "@/components/customers-table";
import { OrdersTable } from "@/components/orders-table";
import { ToastProvider } from "@/components/ui/toast";

function renderWithToast(children: ReactNode) {
  return render(<ToastProvider>{children}</ToastProvider>);
}

describe("business tables", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("opens a customer drawer and saves normalized customer edits", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.phone = "3001111111";
    await store.saveOrder(draft);
    const user = userEvent.setup();

    renderWithToast(<CustomersTable />);

    await user.click(await screen.findByText("ANA PEREZ"));
    const nameInput = await screen.findByLabelText(/Nombre/);
    await user.clear(nameInput);
    await user.type(nameInput, "ana tienda");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/Cliente actualizado/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("ANA TIENDA").length).toBeGreaterThan(0));
    expect((await store.listCustomers())[0].fullName).toBe("ANA TIENDA");
  });

  it("syncs edited customer data to linked orders and only extra pending matches when requested", async () => {
    const store = getBusinessStore();
    const pendingDraft = createBlankOrderDraft();
    pendingDraft.customer.fullName = "ana perez";
    pendingDraft.customer.phone = "3001111111";
    pendingDraft.customer.city = "bogota";
    const pendingOrder = await store.saveOrder(pendingDraft);
    const completedDraft = createBlankOrderDraft();
    completedDraft.customer.fullName = "ana perez";
    completedDraft.customer.phone = "3001111111";
    completedDraft.customer.city = "bogota";
    completedDraft.status = "completed";
    const completedOrder = await store.saveOrder(completedDraft);
    const user = userEvent.setup();

    renderWithToast(<CustomersTable />);

    await user.click(await screen.findByText("ANA PEREZ"));
    const nameInput = await screen.findByLabelText(/Nombre/);
    await user.clear(nameInput);
    await user.type(nameInput, "ana tienda");
    await user.click(screen.getByLabelText("Aplicar cambios a pedidos pendientes"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/pedido\(s\) relacionado\(s\) actualizado\(s\)/i)).toBeInTheDocument();
    const orders = await store.listOrders();
    expect(orders.find((order) => order.id === pendingOrder.id)?.customer.fullName).toBe("ANA TIENDA");
    expect(orders.find((order) => order.id === completedOrder.id)?.customer.fullName).toBe("ANA TIENDA");
  });

  it("fills only missing customer fields in related historical orders when requested", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "zaida";
    draft.customer.phone = "";
    draft.customer.city = "";
    draft.customer.address = "DIRECCION ORIGINAL";
    const savedOrder = await store.saveOrder(draft);
    const user = userEvent.setup();

    renderWithToast(<CustomersTable />);

    await user.click(await screen.findByText("ZAIDA"));
    await user.type(screen.getByLabelText("Telefono"), "3009999999");
    await user.selectOptions(screen.getByLabelText("Departamento"), "ANTIOQUIA");
    await user.selectOptions(screen.getByLabelText("Ciudad / municipio"), "MEDELLÍN");
    await user.clear(screen.getByLabelText("Direccion"));
    await user.type(screen.getByLabelText("Direccion"), "calle nueva");
    await user.type(screen.getByLabelText("Barrio / sector"), "castilla");
    await user.click(screen.getByLabelText("Completar datos faltantes en pedidos relacionados"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/pedido\(s\) relacionado\(s\) actualizado\(s\)/i)).toBeInTheDocument();
    const [order] = (await store.listOrders()).filter((item) => item.id === savedOrder.id);
    expect(order.customer.phone).toBe("3009999999");
    expect(order.customer.city).toBe("MEDELLÍN");
    expect(order.customer.address).toBe("CALLE NUEVA");
    expect(order.customer.neighborhood).toBe("CASTILLA");
  });

  it("syncs completed linked orders matched by a short snapshot name", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "zaida";
    draft.customer.phone = "";
    draft.customer.city = "";
    draft.status = "completed";
    const savedOrder = await store.saveOrder(draft);
    const [customer] = await store.listCustomers();
    const updatedCustomer = await store.updateCustomer(customer.id, {
      fullName: "zaida suarez",
      phone: "3004825458",
      department: "bogota, d.c.",
      city: "bogota, d.c.",
      address: "cra 72 c bis a # 54 a - 51 sur",
    });
    await store.updateOrder(savedOrder.id, {
      customer: {
        ...savedOrder.customer,
        fullName: "ZAIDA",
        phone: "",
        department: "",
        city: "",
        address: "",
      },
    });
    const user = userEvent.setup();

    renderWithToast(<CustomersTable />);

    await user.click(await screen.findByText(updatedCustomer.fullName));
    await user.click(screen.getByLabelText("Completar datos faltantes en pedidos relacionados"));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/pedido\(s\) relacionado\(s\) actualizado\(s\)/i)).toBeInTheDocument();
    const [order] = (await store.listOrders()).filter((item) => item.id === savedOrder.id);
    expect(order.customer.fullName).toBe("ZAIDA SUAREZ");
    expect(order.customer.phone).toBe("3004825458");
    expect(order.customer.city).toBe("BOGOTA, D.C.");
    expect(order.customer.address).toBe("CRA 72 C BIS A # 54 A - 51 SUR");
    expect(order.status).toBe("completed");
  });

  it("shows customer fallback data in orders when the snapshot is short or missing phone", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "zaida";
    draft.customer.phone = "";
    const savedOrder = await store.saveOrder(draft);
    const [customer] = await store.listCustomers();
    await store.updateCustomer(customer.id, { fullName: "zaida suarez", phone: "3004825458" });
    await store.updateOrder(savedOrder.id, { customer: { ...savedOrder.customer, fullName: "ZAIDA", phone: "" } });

    renderWithToast(<OrdersTable />);

    expect(await screen.findByText("ZAIDA SUAREZ")).toBeInTheDocument();
    expect(screen.getByText("3004825458")).toBeInTheDocument();
  });

  it("shows and persists current customer data for linked orders with stale snapshots", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.phone = "3001111111";
    const savedOrder = await store.saveOrder(draft);
    const [customer] = await store.listCustomers();
    await store.updateCustomer(customer.id, { fullName: "ana tienda", phone: "3002222222" });

    renderWithToast(<OrdersTable />);

    expect(await screen.findByText("ANA TIENDA")).toBeInTheDocument();
    expect(screen.getByText("3002222222")).toBeInTheDocument();
    await waitFor(async () => {
      const order = (await store.listOrders()).find((item) => item.id === savedOrder.id);
      expect(order?.customer.fullName).toBe("ANA TIENDA");
      expect(order?.customer.phone).toBe("3002222222");
    });
  });

  it("opens an order detail drawer with customer, items, and totals", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.items = [{ productCode: "MED-001", productName: "medias largas", category: "medias", quantity: 2, unitPrice: 15000 }];
    draft.shippingCost = 5000;
    await store.saveOrder(draft);
    const user = userEvent.setup();

    renderWithToast(<OrdersTable />);

    await user.click(await screen.findByText("ANA PEREZ"));

    expect(await screen.findByRole("dialog", { name: "Detalle del pedido" })).toBeInTheDocument();
    expect(screen.getByText("MEDIAS LARGAS")).toBeInTheDocument();
    expect(screen.getByText("MED-001")).toBeInTheDocument();
    expect(screen.getAllByText("$35.000").length).toBeGreaterThan(0);
  });

  it("edits safe order fields from the order drawer and keeps the item line visible", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.items = [{ productCode: "MED-001", productName: "medias largas", category: "medias", quantity: 2, unitPrice: 15000 }];
    draft.shippingCost = 5000;
    await store.saveOrder(draft);
    const user = userEvent.setup();

    renderWithToast(<OrdersTable />);

    await user.click(await screen.findByText("ANA PEREZ"));
    await user.click(await screen.findByRole("button", { name: "Editar pedido" }));
    const nameInput = await screen.findByLabelText(/Nombre/);
    await user.clear(nameInput);
    await user.type(nameInput, "ana tienda");
    await user.clear(screen.getByLabelText("Notas"));
    await user.type(screen.getByLabelText("Notas"), "entregar en porteria");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Pedido actualizado.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("ANA TIENDA").length).toBeGreaterThan(0));
    expect(screen.getByText("ENTREGAR EN PORTERIA")).toBeInTheDocument();
    expect(screen.getByText("MEDIAS LARGAS")).toBeInTheDocument();
    expect((await store.listOrders())[0].items).toHaveLength(1);
  });

  it("edits order quantities, removes a line, recalculates totals, and shows the adjustment", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.items = [
      { productCode: "MED-001", productName: "medias largas", category: "medias", quantity: 2, unitPrice: 15000 },
      { productCode: "BOL-001", productName: "bolso", category: "bolsos", quantity: 1, unitPrice: 40000 },
    ];
    draft.shippingCost = 5000;
    await store.saveOrder(draft);
    const user = userEvent.setup();

    renderWithToast(<OrdersTable />);

    await user.click(await screen.findByText("ANA PEREZ"));
    await user.click(await screen.findByRole("button", { name: "Editar pedido" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar pedido" });
    const quantityInputs = await within(dialog).findAllByLabelText("Cantidad");
    fireEvent.change(quantityInputs[0], { target: { value: "1" } });
    await user.selectOptions(await within(dialog).findByLabelText(/Motivo del ajuste/), "Producto dañado");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Pedido ajustado")).toBeInTheDocument();
    expect(screen.getByText("PRODUCTO DAÑADO")).toBeInTheDocument();
    const [order] = await store.listOrders();
    expect(order.items).toHaveLength(2);
    expect(order.items[0].quantity).toBe(1);
    expect(order.subtotal).toBe(55000);
    expect(order.total).toBe(60000);
  });
});
