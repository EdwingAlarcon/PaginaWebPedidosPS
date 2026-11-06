import { businessToday } from "@/lib/date";
import { isRelatedOrderToCustomer } from "@/lib/customer-orders";
import type { Customer, OrderRecord } from "@/lib/business-types";

export type InactiveCustomer = {
  customer: Customer;
  lastOrderDate: string;
  daysInactive: number;
};

function daysBetween(from: string, to: string): number {
  const fromMs = Date.parse(`${from}T00:00:00Z`);
  const toMs = Date.parse(`${to}T00:00:00Z`);
  return Math.floor((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

export function getInactiveCustomers(
  customers: Customer[],
  orders: OrderRecord[],
  thresholdDays: number,
  today: string = businessToday(),
): InactiveCustomer[] {
  const result: InactiveCustomer[] = [];
  for (const customer of customers) {
    let lastOrderDate = "";
    for (const order of orders) {
      if (!isRelatedOrderToCustomer(order, customer)) continue;
      if (order.orderDate > lastOrderDate) lastOrderDate = order.orderDate;
    }
    if (!lastOrderDate) continue;
    const daysInactive = daysBetween(lastOrderDate, today);
    if (daysInactive >= thresholdDays) result.push({ customer, lastOrderDate, daysInactive });
  }
  return result.sort((a, b) => b.daysInactive - a.daysInactive);
}
