import type { Customer, OrderRecord } from "@/lib/business-types";

export function normalizeForMatch(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isRelatedOrderToCustomer(order: OrderRecord, customer: Customer): boolean {
  if (order.customerId === customer.id) return true;
  const orderName = normalizeForMatch(order.customer.fullName);
  const customerName = normalizeForMatch(customer.fullName);
  if (!orderName || !customerName) return false;
  if (orderName === customerName) return true;
  return orderName.length >= 4 && customerName.startsWith(`${orderName} `);
}

export type AlternateContact = {
  key: string;
  phone: string;
  address: string;
  city: string;
  count: number;
};

/**
 * Telefonos/direcciones distintos al dato maestro del cliente que aparecen
 * en sus pedidos (customer_snapshot). Util para detectar el dato correcto
 * cuando el cliente cambio de direccion o uso varios numeros.
 */
export function collectAlternateContacts(customer: Customer, orders: OrderRecord[]): AlternateContact[] {
  const currentPhone = customer.phone.trim();
  const currentAddress = customer.address.trim();
  const map = new Map<string, AlternateContact>();

  for (const order of orders) {
    const phone = order.customer.phone.trim();
    const address = order.customer.address.trim();
    const city = order.customer.city.trim();
    if (!phone && !address) continue;
    if (phone === currentPhone && address === currentAddress) continue;

    const key = `${phone}|${address}|${city}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { key, phone, address, city, count: 1 });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
