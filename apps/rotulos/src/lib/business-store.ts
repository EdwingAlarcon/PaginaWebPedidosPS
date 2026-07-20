"use client";

import { createClient } from "@/lib/supabase/client";
import { normalizeCustomerFields, normalizeOrderDraft, normalizeProductCode } from "@/lib/normalize";
import type { Customer, CustomerPatch, OrderDraft, OrderItem, OrderPatch, OrderRecord, ProductCode } from "@/lib/business-types";

export type BusinessStore = {
  listOrders(): Promise<OrderRecord[]>;
  saveOrder(draft: OrderDraft): Promise<OrderRecord>;
  updateOrder(id: string, patch: OrderPatch): Promise<OrderRecord>;
  listCustomers(): Promise<Customer[]>;
  updateCustomer(id: string, patch: CustomerPatch): Promise<Customer>;
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
  locality?: string;
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
      locality: "",
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
    locality: row.locality ?? "",
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
  const customer = {
    fullName: row.customer_snapshot.fullName ?? "",
    phone: row.customer_snapshot.phone ?? "",
    email: row.customer_snapshot.email ?? "",
    department: row.customer_snapshot.department ?? "",
    city: row.customer_snapshot.city ?? "",
    locality: row.customer_snapshot.locality ?? "",
    address: row.customer_snapshot.address ?? "",
    neighborhood: row.customer_snapshot.neighborhood ?? "",
  };

  return {
    id: row.id,
    customerId: row.customer_id,
    customer,
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

function customerPayload(customer: CustomerPatch) {
  return {
    ...(customer.fullName !== undefined ? { full_name: customer.fullName } : {}),
    ...(customer.phone !== undefined ? { phone: customer.phone } : {}),
    ...(customer.email !== undefined ? { email: customer.email } : {}),
    ...(customer.department !== undefined ? { department: customer.department } : {}),
    ...(customer.city !== undefined ? { city: customer.city } : {}),
    ...(customer.locality !== undefined ? { locality: customer.locality ?? "" } : {}),
    ...(customer.address !== undefined ? { address: customer.address } : {}),
    ...(customer.neighborhood !== undefined ? { neighborhood: customer.neighborhood } : {}),
  };
}

function normalizeCustomerPatch(patch: CustomerPatch): CustomerPatch {
  const withDefaults = {
    fullName: patch.fullName ?? "",
    department: patch.department ?? "",
    city: patch.city ?? "",
    locality: patch.locality ?? "",
    address: patch.address ?? "",
    neighborhood: patch.neighborhood ?? "",
  };
  const normalized = normalizeCustomerFields(withDefaults);
  return {
    ...patch,
    ...(patch.fullName !== undefined ? { fullName: normalized.fullName } : {}),
    ...(patch.department !== undefined ? { department: normalized.department } : {}),
    ...(patch.city !== undefined ? { city: normalized.city } : {}),
    ...(patch.locality !== undefined ? { locality: normalized.locality } : {}),
    ...(patch.address !== undefined ? { address: normalized.address } : {}),
    ...(patch.neighborhood !== undefined ? { neighborhood: normalized.neighborhood } : {}),
  };
}

function normalizeOrderPatch(patch: OrderPatch): OrderPatch {
  const notes = patch.notes !== undefined ? normalizeCustomerFields({
    fullName: "",
    department: "",
    city: "",
    address: patch.notes,
    neighborhood: "",
  }).address : undefined;
  return {
    ...patch,
    ...(patch.customer !== undefined ? { customer: normalizeCustomerFields(patch.customer) } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(patch.items !== undefined ? { items: patch.items.map((item) => ({ ...normalizeOrderItemForPatch(item), id: item.id, total: item.quantity * item.unitPrice })) } : {}),
    ...(patch.adjustmentReason !== undefined ? { adjustmentReason: normalizeAdjustmentReason(patch.adjustmentReason) } : {}),
  };
}

function normalizeOrderItemForPatch(item: OrderItem): OrderItem {
  const normalized = normalizeOrderDraft({
    customer: {
      fullName: "",
      phone: "",
      email: "",
      department: "",
      city: "",
      locality: "",
      address: "",
      neighborhood: "",
    },
    orderDate: today(),
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    items: [item],
  }).items[0];
  return { ...item, ...normalized, total: normalized.quantity * normalized.unitPrice };
}

function normalizeAdjustmentReason(reason: string): string {
  return normalizeCustomerFields({
    fullName: "",
    department: "",
    city: "",
    address: reason,
    neighborhood: "",
  }).address;
}

function notesWithAdjustment(notes: string, reason?: string): string {
  const normalizedReason = reason?.trim();
  if (!normalizedReason) return notes;
  const line = `AJUSTE: ${normalizedReason}`;
  return notes.trim() ? `${notes.trim()}\n${line}` : line;
}

function totals(items: OrderDraft["items"], discount: number, shippingCost: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { subtotal, total: Math.max(0, subtotal - discount + shippingCost) };
}

function totalsFromOrder(order: Pick<OrderRecord, "items">, discount: number, shippingCost: number) {
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { subtotal, total: Math.max(0, subtotal - discount + shippingCost) };
}

function totalsFromItems(items: OrderItem[], discount: number, shippingCost: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return { subtotal, total: Math.max(0, subtotal - discount + shippingCost) };
}

function isMissingLocalityColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeError = error as { code?: string; message?: string };
  return maybeError.code === "PGRST204" && (maybeError.message ?? "").includes("locality");
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
      const normalizedDraft = normalizeOrderDraft(draft);
      const now = new Date().toISOString();
      const current = readStorage<OrderRecord[]>(storageKeys.orders, []);
      const customers = readStorage<Customer[]>(storageKeys.customers, []);
      const customerIndex = customers.findIndex((customer) =>
        normalizedDraft.customer.phone
          ? customer.phone === normalizedDraft.customer.phone
          : customer.fullName.toLowerCase() === normalizedDraft.customer.fullName.toLowerCase(),
      );
      const customer =
        customerIndex >= 0
          ? { ...customers[customerIndex], ...normalizedDraft.customer, updatedAt: now }
          : { ...normalizedDraft.customer, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      if (customerIndex >= 0) customers[customerIndex] = customer;
      else customers.unshift(customer);
      writeStorage(storageKeys.customers, customers);

      const computed = totals(normalizedDraft.items, normalizedDraft.discount, normalizedDraft.shippingCost);
      const record: OrderRecord = {
        id: crypto.randomUUID(),
        customerId: customer.id,
        customer: normalizedDraft.customer,
        orderDate: normalizedDraft.orderDate,
        status: normalizedDraft.status,
        notes: normalizedDraft.notes,
        discount: normalizedDraft.discount,
        shippingCost: normalizedDraft.shippingCost,
        subtotal: computed.subtotal,
        total: computed.total,
        items: normalizedDraft.items.map((item) => ({ ...item, id: crypto.randomUUID(), total: item.quantity * item.unitPrice })),
        createdAt: now,
        updatedAt: now,
      };
      writeStorage(storageKeys.orders, [record, ...current]);
      return record;
    },
    async updateOrder(id, patch) {
      const orders = readStorage<OrderRecord[]>(storageKeys.orders, []);
      const index = orders.findIndex((order) => order.id === id);
      if (index < 0) throw new Error("order_not_found");
      const normalizedPatch = normalizeOrderPatch(patch);
      const current = orders[index];
      const items = normalizedPatch.items ?? current.items;
      const discount = normalizedPatch.discount ?? current.discount;
      const shippingCost = normalizedPatch.shippingCost ?? current.shippingCost;
      const computed = totalsFromItems(items, discount, shippingCost);
      const notes = notesWithAdjustment(normalizedPatch.notes ?? current.notes, normalizedPatch.adjustmentReason);
      const updated: OrderRecord = {
        ...current,
        ...normalizedPatch,
        items,
        notes,
        discount,
        shippingCost,
        subtotal: computed.subtotal,
        total: computed.total,
        updatedAt: new Date().toISOString(),
      };
      orders[index] = updated;
      writeStorage(storageKeys.orders, orders);
      return updated;
    },
    async listCustomers() {
      return readStorage<Customer[]>(storageKeys.customers, []);
    },
    async updateCustomer(id, patch) {
      const customers = readStorage<Customer[]>(storageKeys.customers, []);
      const index = customers.findIndex((customer) => customer.id === id);
      if (index < 0) throw new Error("customer_not_found");
      const normalizedPatch = normalizeCustomerPatch(patch);
      const updated = { ...customers[index], ...normalizedPatch, updatedAt: new Date().toISOString() };
      customers[index] = updated;
      writeStorage(storageKeys.customers, customers);
      return updated;
    },
    async listProductCodes() {
      return readStorage<ProductCode[]>(storageKeys.productCodes, []);
    },
    async saveProductCode(code) {
      const normalizedCode = normalizeProductCode(code);
      const now = new Date().toISOString();
      const record = { ...normalizedCode, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      const current = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== normalizedCode.code)]);
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
      const normalizedDraft = normalizeOrderDraft(draft);
      const computed = totals(normalizedDraft.items, normalizedDraft.discount, normalizedDraft.shippingCost);
      const { data: existingCustomer, error: lookupError } = normalizedDraft.customer.phone
        ? await supabase.from("customers").select("*").eq("phone", normalizedDraft.customer.phone).maybeSingle<CustomerRow>()
        : { data: null, error: null };
      if (lookupError) throw lookupError;

      const customerPayload = {
        full_name: normalizedDraft.customer.fullName,
        phone: normalizedDraft.customer.phone,
        email: normalizedDraft.customer.email,
        department: normalizedDraft.customer.department,
        city: normalizedDraft.customer.city,
        locality: normalizedDraft.customer.locality ?? "",
        address: normalizedDraft.customer.address,
        neighborhood: normalizedDraft.customer.neighborhood,
      };
      const saveCustomer = (payload: typeof customerPayload | Omit<typeof customerPayload, "locality">) => existingCustomer
        ? supabase
          .from("customers")
          .update(payload)
          .eq("id", existingCustomer.id)
          .select("*")
          .single<CustomerRow>()
        : supabase
          .from("customers")
          .insert(payload)
          .select("*")
          .single<CustomerRow>();
      let { data: customer, error: customerError } = await saveCustomer(customerPayload);
      if (isMissingLocalityColumnError(customerError)) {
        const { locality: _locality, ...fallbackPayload } = customerPayload;
        const retry = await saveCustomer(fallbackPayload);
        customer = retry.data;
        customerError = retry.error;
      }
      if (customerError) throw customerError;
      if (!customer) throw new Error("customer_save_failed");

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          customer_snapshot: normalizedDraft.customer,
          order_date: normalizedDraft.orderDate,
          status: normalizedDraft.status,
          notes: normalizedDraft.notes,
          discount: normalizedDraft.discount,
          shipping_cost: normalizedDraft.shippingCost,
          subtotal: computed.subtotal,
          total: computed.total,
        })
        .select("*")
        .single<OrderRow>();
      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .insert(normalizedDraft.items.map((item) => ({
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
    async updateOrder(id, patch) {
      const normalizedPatch = normalizeOrderPatch(patch);
      const { data: existing, error: lookupError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single<OrderRow>();
      if (lookupError) throw lookupError;
      const current = rowToOrder(existing);
      const items = normalizedPatch.items ?? current.items;
      const discount = normalizedPatch.discount ?? current.discount;
      const shippingCost = normalizedPatch.shippingCost ?? current.shippingCost;
      const computed = totalsFromItems(items, discount, shippingCost);
      const notes = notesWithAdjustment(normalizedPatch.notes ?? current.notes, normalizedPatch.adjustmentReason);
      const { data, error } = await supabase
        .from("orders")
        .update({
          ...(normalizedPatch.customer !== undefined ? { customer_snapshot: normalizedPatch.customer } : {}),
          ...(normalizedPatch.orderDate !== undefined ? { order_date: normalizedPatch.orderDate } : {}),
          ...(normalizedPatch.status !== undefined ? { status: normalizedPatch.status } : {}),
          notes,
          discount,
          shipping_cost: shippingCost,
          subtotal: computed.subtotal,
          total: computed.total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, order_items(*)")
        .single<OrderRow>();
      if (error) throw error;
      if (normalizedPatch.items !== undefined) {
        const nextIds = new Set(normalizedPatch.items.map((item) => item.id));
        const removedIds = current.items.map((item) => item.id).filter((id) => !nextIds.has(id));
        if (removedIds.length > 0) {
          const { error: deleteError } = await supabase.from("order_items").delete().in("id", removedIds);
          if (deleteError) throw deleteError;
        }
        for (const item of normalizedPatch.items) {
          const { error: itemError } = await supabase
            .from("order_items")
            .update({
              product_code: item.productCode,
              product_name: item.productName,
              category: item.category,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })
            .eq("id", item.id);
          if (itemError) throw itemError;
        }
      }
      const { data: refreshed, error: refreshError } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", id)
        .single<OrderRow>();
      if (refreshError) throw refreshError;
      return rowToOrder(refreshed ?? data);
    },
    async listCustomers() {
      const { data, error } = await supabase.from("customers").select("*").order("updated_at", { ascending: false }).returns<CustomerRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToCustomer);
    },
    async updateCustomer(id, patch) {
      const normalizedPatch = normalizeCustomerPatch(patch);
      const payload = customerPayload(normalizedPatch);
      if (Object.keys(payload).length === 0) {
        const { data, error } = await supabase.from("customers").select("*").eq("id", id).single<CustomerRow>();
        if (error) throw error;
        return rowToCustomer(data);
      }
      const { data, error } = await supabase
        .from("customers")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single<CustomerRow>();
      if (error) throw error;
      return rowToCustomer(data);
    },
    async listProductCodes() {
      const { data, error } = await supabase.from("product_codes").select("*").order("code").returns<ProductCodeRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToProductCode);
    },
    async saveProductCode(code) {
      const normalizedCode = normalizeProductCode(code);
      const { data, error } = await supabase
        .from("product_codes")
        .upsert({ code: normalizedCode.code, product_name: normalizedCode.productName, category: normalizedCode.category, unit_price: normalizedCode.unitPrice }, { onConflict: "code" })
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
