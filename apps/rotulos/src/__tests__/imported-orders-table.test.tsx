import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ImportedOrdersTable } from "@/components/imported-orders-table";
import type { OrderRecord } from "@/lib/business-types";

function order(overrides: Partial<OrderRecord> & { id: string }): OrderRecord {
  const { id, ...rest } = overrides;
  return {
    id,
    customerId: null,
    customer: {
      fullName: "CLIENTE BASE",
      phone: "",
      email: "",
      department: "",
      city: "BOGOTA",
      locality: "",
      address: "",
      neighborhood: "",
    },
    orderDate: "2025-08-01",
    status: "completed",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 100_000,
    total: 100_000,
    items: [
      {
        id: `${overrides.id}-item`,
        productId: null,
        productCode: "REF-1",
        productName: "CAMISETA",
        category: "ROPA",
        quantity: 1,
        unitPrice: 100_000,
        total: 100_000,
      },
    ],
    source: "excel_import",
    importBatchId: "batch",
    importRowKey: `${overrides.id}:row`,
    createdAt: "2025-08-01T00:00:00.000Z",
    updatedAt: "2025-08-01T00:00:00.000Z",
    ...rest,
  };
}

describe("ImportedOrdersTable", () => {
  it("renders only imported rows with import row keys", () => {
    render(
      <ImportedOrdersTable
        orders={[
          order({ id: "imported", customer: { fullName: "JOHANNA", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
          order({ id: "app", source: "app", customer: { fullName: "APP CLIENTE", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
        ]}
      />,
    );

    expect(screen.getByText("JOHANNA")).toBeInTheDocument();
    expect(screen.getByText("imported:row")).toBeInTheDocument();
    expect(screen.queryByText("APP CLIENTE")).not.toBeInTheDocument();
  });

  it("filters by customer text", async () => {
    render(
      <ImportedOrdersTable
        orders={[
          order({ id: "zaida", customer: { fullName: "ZAIDA SUAREZ", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
          order({ id: "lina", customer: { fullName: "LINA GONZALEZ", phone: "", email: "", department: "", city: "", locality: "", address: "", neighborhood: "" } }),
        ]}
      />,
    );

    await userEvent.type(screen.getByLabelText("Buscar importados"), "zaida");

    expect(screen.getByText("ZAIDA SUAREZ")).toBeInTheDocument();
    expect(screen.queryByText("LINA GONZALEZ")).not.toBeInTheDocument();
  });
});
