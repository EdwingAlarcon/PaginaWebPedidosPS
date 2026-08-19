import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerOrderHistory } from "@/components/customer-order-history";
import { ToastProvider } from "@/components/ui/toast";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "customer-1",
    fullName: "ANA PEREZ",
    phone: "3001111111",
    email: "",
    department: "",
    city: "MEDELLIN",
    address: "CALLE ACTUAL 1",
    neighborhood: "",
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    customerId: "customer-1",
    customer: {
      fullName: "ANA PEREZ",
      phone: "3009999999",
      email: "",
      department: "",
      city: "MEDELLIN",
      address: "CALLE VIEJA 2",
      neighborhood: "",
    },
    orderDate: "2026-08-10",
    status: "completed",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 60000,
    total: 60000,
    items: [],
    createdAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  };
}

describe("CustomerOrderHistory", () => {
  it("shows alternate contact data and the label count for related orders", () => {
    const order = makeOrder();
    const labels: LabelRecord[] = [
      {
        id: "label-1",
        orderId: "order-1",
        orderNumber: "PS-1",
        size: "14x12",
        date: "2026-08-10",
        sender: { name: "", phone: "", city: "", department: "", address: "" },
        recipient: { fullName: "", phone: "", department: "", city: "", address: "", neighborhood: "", reference: "", notes: "" },
        carrier: "",
        paymentMethod: "pagado",
        codAmount: 0,
        packageCount: 1,
        status: "generado",
        createdAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-10T00:00:00.000Z",
        pdfUrl: null,
        createdBy: null,
      },
    ];

    render(
      <ToastProvider>
        <CustomerOrderHistory customer={makeCustomer()} orders={[order]} labels={labels} />
      </ToastProvider>,
    );

    expect(screen.getByText("Otros datos usados")).toBeInTheDocument();
    expect(screen.getByText("3009999999")).toBeInTheDocument();
    expect(screen.getByText(/CALLE VIEJA 2/)).toBeInTheDocument();
    expect(screen.getByText("1 rotulo generado para este cliente.")).toBeInTheDocument();
  });

  it("does not show the alternate data card when every order matches the current customer", () => {
    const customer = makeCustomer();
    const order = makeOrder({ customer: { ...makeOrder().customer, phone: customer.phone, address: customer.address } });

    render(
      <ToastProvider>
        <CustomerOrderHistory customer={customer} orders={[order]} />
      </ToastProvider>,
    );

    expect(screen.queryByText("Otros datos usados")).not.toBeInTheDocument();
  });
});
