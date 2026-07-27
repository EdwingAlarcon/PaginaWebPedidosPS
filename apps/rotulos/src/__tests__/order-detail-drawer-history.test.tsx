import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as businessStoreModule from "@/lib/business-store";
import type { BusinessStore } from "@/lib/business-store";
import { OrderDetailDrawer } from "@/components/order-detail-drawer";
import type { OrderRecord } from "@/lib/business-types";

function baseOrder(): OrderRecord {
  return {
    id: "order-1",
    customerId: null,
    customer: {
      fullName: "ANA PEREZ",
      phone: "3001234567",
      email: "",
      department: "ANTIOQUIA",
      city: "MEDELLIN",
      locality: "",
      address: "CALLE 1",
      neighborhood: "",
    },
    orderDate: "2026-07-27",
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 40000,
    total: 40000,
    items: [],
    createdAt: "2026-07-27T00:00:00Z",
    updatedAt: "2026-07-27T00:00:00Z",
  };
}

describe("OrderDetailDrawer - historial de cambios", () => {
  it("no muestra la seccion de historial cuando no hay ediciones registradas", async () => {
    render(<OrderDetailDrawer order={baseOrder()} />);

    await waitFor(() => expect(screen.queryByText("Historial de cambios")).not.toBeInTheDocument());
  });

  it("muestra cada campo cambiado con su valor antes y despues", async () => {
    vi.spyOn(businessStoreModule, "getBusinessStore").mockReturnValue({
      listOrderEdits: vi.fn().mockResolvedValue([
        {
          id: "edit-1",
          orderId: "order-1",
          changedBy: "edwing@example.com",
          changedAt: "2026-07-27T15:00:00Z",
          changes: { discount: { before: 0, after: 5000 } },
          reason: "correccion de precio",
        },
      ]),
    } as unknown as BusinessStore);

    render(<OrderDetailDrawer order={baseOrder()} />);

    expect(await screen.findByText("Historial de cambios")).toBeInTheDocument();
    expect(screen.getByText("edwing@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Descuento:/)).toBeInTheDocument();
    expect(screen.getByText(/\$\s?0.*\$\s?5\.000/)).toBeInTheDocument();
    expect(screen.getByText(/correccion de precio/i)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
