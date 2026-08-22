import type { OrderRecord } from "@/lib/business-types";

export type ImportedOrderSummary = {
  orders: number;
  items: number;
  total: number;
  customers: number;
  years: string[];
};

export function getImportedOrders(orders: OrderRecord[]): OrderRecord[] {
  return orders
    .filter((order) => order.source === "excel_import")
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.createdAt.localeCompare(a.createdAt));
}

export function getImportedOrderSummary(orders: OrderRecord[]): ImportedOrderSummary {
  const imported = getImportedOrders(orders);
  const customers = new Set<string>();
  const years = new Set<string>();
  let items = 0;
  let total = 0;

  for (const order of imported) {
    const customerName = order.customer.fullName.trim();
    if (customerName) customers.add(customerName.toUpperCase());
    if (order.orderDate.length >= 4) years.add(order.orderDate.slice(0, 4));
    items += order.items.reduce((sum, item) => sum + item.quantity, 0);
    total += order.total;
  }

  return {
    orders: imported.length,
    items,
    total,
    customers: customers.size,
    years: [...years].sort(),
  };
}
