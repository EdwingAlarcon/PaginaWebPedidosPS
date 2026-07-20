import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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

    expect(await screen.findByText("Cliente actualizado.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("ANA TIENDA").length).toBeGreaterThan(0));
    expect((await store.listCustomers())[0].fullName).toBe("ANA TIENDA");
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
});
