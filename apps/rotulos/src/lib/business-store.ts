"use client";

import { createClient } from "@/lib/supabase/client";
import type { Customer, OrderDraft, OrderItem, OrderRecord, ProductCode } from "@/lib/business-types";

export type BusinessStore = {
  listOrders(): Promise<OrderRecord[]>;
  saveOrder(draft: OrderDraft): Promise<OrderRecord>;
  listCustomers(): Promise<Customer[]>;
  listProductCodes(): Promise<ProductCode[]>;
  saveProductCode(code: Omit<ProductCode, "id" | "createdAt" | "updatedAt">): Promise<ProductCode>;
};

type CustomerRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  customer_id: string | null;
  customer_snapshot: OrderRecord["customer"];
  order_date: string;
  status: OrderRecord["status"];
  notes: string;
  discount: number | string;
  shipping_cost: number | string;
  subtotal: number | string;
  total: number | string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity: number | string;
  unit_price: number | string;
  total: number | string;
};

type ProductCodeRow = {
  id: string;
  code: string;
  product_name: string;
  category: string;
  unit_price: number | string;
  created_at: string;
  updated_at: string;
};

const storageKeys = {
  orders: "purpleshop.business.orders",
  customers: "purpleshop.business.customers",
  productCodes: "purpleshop.business.productCodes",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function createBlankOrderDraft(): OrderDraft {
  return {
    customer: {
      fullName: "",
      phone: "",
      email: "",
      department: "",
      city: "",
      address: "",
      neighborhood: "",
    },
    orderDate: today(),
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    items: [{ productCode: "", productName: "", category: "", quantity: 1, unitPrice: 0 }],
  };
}

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    department: row.department,
    city: row.city,
    address: row.address,
    neighborhood: row.neighborhood,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productCode: row.product_code,
    productName: row.product_name,
    category: row.category,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
  };
}

function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    customer: row.customer_snapshot,
    orderDate: row.order_date,
    status: row.status,
    notes: row.notes,
    discount: Number(row.discount),
    shippingCost: Number(row.shipping_cost),
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    items: (row.order_items ?? []).map(rowToOrderItem),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProductCode(row: ProductCodeRow): ProductCode {
  return {
    id: row.id,
    code: row.code,
    productName: row.product_name,
    category: row.category,
    unitPrice: Number(row.unit_price),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function totals(items: OrderDraft["items"], discount: number, shippingCost: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { subtotal, total: Math.max(0, subtotal - discount + shippingCost) };
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

function createLocalBusinessStore(): BusinessStore {
  return {
    async listOrders() {
      return readStorage<OrderRecord[]>(storageKeys.orders, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async saveOrder(draft) {
      const now = new Date().toISOString();
      const current = readStorage<OrderRecord[]>(storageKeys.orders, []);
      const computed = totals(draft.items, draft.discount, draft.shippingCost);
      const record: OrderRecord = {
        id: crypto.randomUUID(),
        customerId: null,
        customer: draft.customer,
        orderDate: draft.orderDate,
        status: draft.status,
        notes: draft.notes,
        discount: draft.discount,
        shippingCost: draft.shippingCost,
        subtotal: computed.subtotal,
        total: computed.total,
        items: draft.items.map((item) => ({ ...item, id: crypto.randomUUID(), total: item.quantity * item.unitPrice })),
        createdAt: now,
        updatedAt: now,
      };
      writeStorage(storageKeys.orders, [record, ...current]);
      const customers = readStorage<Customer[]>(storageKeys.customers, []);
      if (draft.customer.fullName && !customers.some((customer) => customer.fullName.toLowerCase() === draft.customer.fullName.toLowerCase())) {
        customers.unshift({ ...draft.customer, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
        writeStorage(storageKeys.customers, customers);
      }
      return record;
    },
    async listCustomers() {
      return readStorage<Customer[]>(storageKeys.customers, []);
    },
    async listProductCodes() {
      return readStorage<ProductCode[]>(storageKeys.productCodes, []);
    },
    async saveProductCode(code) {
      const now = new Date().toISOString();
      const record = { ...code, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      const current = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== code.code)]);
      return record;
    },
  };
}

function createSupabaseBusinessStore(): BusinessStore | null {
  const supabase = createClient();
  if (!supabase) return null;
  return {
    async listOrders() {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
        .returns<OrderRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToOrder);
    },
    async saveOrder(draft) {
      const computed = totals(draft.items, draft.discount, draft.shippingCost);
      const { data: existingCustomer, error: lookupError } = draft.customer.phone
        ? await supabase.from("customers").select("*").eq("phone", draft.customer.phone).maybeSingle<CustomerRow>()
        : { data: null, error: null };
      if (lookupError) throw lookupError;

      const customerPayload = {
        full_name: draft.customer.fullName,
        phone: draft.customer.phone,
        email: draft.customer.email,
        department: draft.customer.department,
        city: draft.customer.city,
        address: draft.customer.address,
        neighborhood: draft.customer.neighborhood,
      };
      const customerRequest = existingCustomer
        ? supabase
          .from("customers")
          .update(customerPayload)
          .eq("id", existingCustomer.id)
          .select("*")
          .single<CustomerRow>()
        : supabase
          .from("customers")
          .insert(customerPayload)
          .select("*")
          .single<CustomerRow>();
      const { data: customer, error: customerError } = await customerRequest;
      if (customerError) throw customerError;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          customer_snapshot: draft.customer,
          order_date: draft.orderDate,
          status: draft.status,
          notes: draft.notes,
          discount: draft.discount,
          shipping_cost: draft.shippingCost,
          subtotal: computed.subtotal,
          total: computed.total,
        })
        .select("*")
        .single<OrderRow>();
      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .insert(draft.items.map((item) => ({
          order_id: order.id,
          product_code: item.productCode,
          product_name: item.productName,
          category: item.category,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })))
        .select("*")
        .returns<OrderItemRow[]>();
      if (itemsError) throw itemsError;
      return rowToOrder({ ...order, order_items: items ?? [] });
    },
    async listCustomers() {
      const { data, error } = await supabase.from("customers").select("*").order("updated_at", { ascending: false }).returns<CustomerRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToCustomer);
    },
    async listProductCodes() {
      const { data, error } = await supabase.from("product_codes").select("*").order("code").returns<ProductCodeRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToProductCode);
    },
    async saveProductCode(code) {
      const { data, error } = await supabase
        .from("product_codes")
        .upsert({ code: code.code, product_name: code.productName, category: code.category, unit_price: code.unitPrice }, { onConflict: "code" })
        .select("*")
        .single<ProductCodeRow>();
      if (error) throw error;
      return rowToProductCode(data);
    },
  };
}

export function getBusinessStore(): BusinessStore {
  return createSupabaseBusinessStore() ?? createLocalBusinessStore();
}
