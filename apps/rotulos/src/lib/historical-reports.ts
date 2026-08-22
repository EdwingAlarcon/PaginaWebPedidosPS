import type { OrderRecord } from "@/lib/business-types";

export type HistoricalYearTotal = {
  year: string;
  orders: number;
  units: number;
  total: number;
};

export type HistoricalProductTotal = {
  productCode: string;
  productName: string;
  quantity: number;
  total: number;
};

export type HistoricalCustomerTotal = {
  customer: string;
  orders: number;
  total: number;
};

export type HistoricalRefItem = {
  orderId: string;
  productCode?: string;
  productName: string;
  quantity: number;
};

export type HistoricalReport = {
  totalsByYear: HistoricalYearTotal[];
  topProducts: HistoricalProductTotal[];
  topCustomers: HistoricalCustomerTotal[];
  missingRefItems: HistoricalRefItem[];
  historicalRefItems: HistoricalRefItem[];
};

const DEFAULT_YEARS = ["2024", "2025"];

function reportOrders(orders: OrderRecord[], years: string[]): OrderRecord[] {
  const yearSet = new Set(years);
  return orders.filter((order) =>
    order.source === "excel_import" &&
    order.status !== "cancelled" &&
    yearSet.has(order.orderDate.slice(0, 4)),
  );
}

export function buildHistoricalReport(orders: OrderRecord[], years: string[] = DEFAULT_YEARS): HistoricalReport {
  const filtered = reportOrders(orders, years);
  const totalsByYear = new Map<string, HistoricalYearTotal>();
  const topProducts = new Map<string, HistoricalProductTotal>();
  const topCustomers = new Map<string, HistoricalCustomerTotal>();
  const missingRefItems: HistoricalRefItem[] = [];
  const historicalRefItems: HistoricalRefItem[] = [];

  for (const year of years) {
    totalsByYear.set(year, { year, orders: 0, units: 0, total: 0 });
  }

  for (const order of filtered) {
    const year = order.orderDate.slice(0, 4);
    const yearTotal = totalsByYear.get(year) ?? { year, orders: 0, units: 0, total: 0 };
    const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
    yearTotal.orders += 1;
    yearTotal.units += units;
    yearTotal.total += order.total;
    totalsByYear.set(year, yearTotal);

    const customerName = order.customer.fullName || "CLIENTE SIN NOMBRE";
    const customer = topCustomers.get(customerName) ?? { customer: customerName, orders: 0, total: 0 };
    customer.orders += 1;
    customer.total += order.total;
    topCustomers.set(customerName, customer);

    for (const item of order.items) {
      const productCode = item.productCode.trim();
      const productName = item.productName || "PRODUCTO SIN NOMBRE";
      const productKey = `${productCode}|${productName}`;
      const product = topProducts.get(productKey) ?? { productCode, productName, quantity: 0, total: 0 };
      product.quantity += item.quantity;
      product.total += item.total;
      topProducts.set(productKey, product);

      if (!productCode) {
        missingRefItems.push({ orderId: order.id, productName, quantity: item.quantity });
      } else if (productCode.startsWith("HIST_")) {
        historicalRefItems.push({ orderId: order.id, productCode, productName, quantity: item.quantity });
      }
    }
  }

  return {
    totalsByYear: [...totalsByYear.values()].filter((item) => item.orders > 0),
    topProducts: [...topProducts.values()]
      .sort((a, b) => b.quantity - a.quantity || b.total - a.total || a.productName.localeCompare(b.productName, "es", { sensitivity: "base" }))
      .slice(0, 10),
    topCustomers: [...topCustomers.values()]
      .sort((a, b) => b.total - a.total || b.orders - a.orders || a.customer.localeCompare(b.customer, "es", { sensitivity: "base" }))
      .slice(0, 10),
    missingRefItems,
    historicalRefItems,
  };
}
