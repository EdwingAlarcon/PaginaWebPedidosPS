"use client";

import { createClient } from "@/lib/supabase/client";
import { businessToday } from "@/lib/date";
import { normalizeCustomerFields, normalizeOrderDraft, normalizeProductCode, normalizeProductCodePatch } from "@/lib/normalize";
import type { Customer, CustomerPatch, OrderDraft, OrderEdit, OrderItem, OrderPatch, OrderRecord, ProductCode, ProductCodePatch } from "@/lib/business-types";

export type BusinessStore = {
  listOrders(): Promise<OrderRecord[]>;
  saveOrder(draft: OrderDraft): Promise<OrderRecord>;
  updateOrder(id: string, patch: OrderPatch): Promise<OrderRecord>;
  listOrderEdits(orderId: string): Promise<OrderEdit[]>;
  listCustomers(): Promise<Customer[]>;
  updateCustomer(id: string, patch: CustomerPatch): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  mergeCustomers(sourceId: string, targetId: string): Promise<{ updatedOrders: number }>;
  listProductCodes(): Promise<ProductCode[]>;
  saveProductCode(code: Omit<ProductCode, "id" | "createdAt" | "updatedAt">): Promise<ProductCode>;
  updateProductCode(id: string, patch: ProductCodePatch): Promise<ProductCode>;
  deleteProductCode(id: string): Promise<void>;
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
  source?: Customer["source"] | null;
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
  source?: OrderRecord["source"] | null;
  import_batch_id?: string | null;
  import_row_key?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  product_id: string | null;
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
  supplier_price: number | string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

type OrderEditRow = {
  id: string;
  order_id: string;
  changed_by: string;
  changed_at: string;
  changes: Record<string, unknown>;
  reason: string | null;
};

function rowToOrderEdit(row: OrderEditRow): OrderEdit {
  return {
    id: row.id,
    orderId: row.order_id,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
    changes: row.changes,
    reason: row.reason,
  };
}

const storageKeys = {
  orders: "purpleshop.business.orders",
  customers: "purpleshop.business.customers",
  productCodes: "purpleshop.business.productCodes",
};

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
    orderDate: businessToday(),
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
    source: row.source ?? "app",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortCustomersByName(customers: Customer[]): Customer[] {
  return [...customers].sort((a, b) => a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }));
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
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
    source: row.source ?? "app",
    importBatchId: row.import_batch_id ?? null,
    importRowKey: row.import_row_key ?? null,
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
    supplierPrice: Number(row.supplier_price),
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeForMatch(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function isRelatedOrderToCustomer(order: OrderRecord, customer: Customer): boolean {
  if (order.customerId === customer.id) return true;
  const orderName = normalizeForMatch(order.customer.fullName);
  const customerName = normalizeForMatch(customer.fullName);
  if (!orderName || !customerName) return false;
  if (orderName === customerName) return true;
  return orderName.length >= 4 && customerName.startsWith(`${orderName} `);
}

function snapshotFromCustomer(customer: Customer): OrderDraft["customer"] {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    department: customer.department,
    city: customer.city,
    locality: customer.locality ?? "",
    address: customer.address,
    neighborhood: customer.neighborhood,
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
    orderDate: businessToday(),
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
        source: "app",
        importBatchId: null,
        importRowKey: null,
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
    async listOrderEdits() {
      return [];
    },
    async listCustomers() {
      return sortCustomersByName(readStorage<Customer[]>(storageKeys.customers, []));
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
    async deleteCustomer(id) {
      const customers = readStorage<Customer[]>(storageKeys.customers, []);
      const orders = readStorage<OrderRecord[]>(storageKeys.orders, []);
      const customerExists = customers.some((customer) => customer.id === id);
      if (!customerExists) throw new Error("customer_not_found");
      const now = new Date().toISOString();
      writeStorage(storageKeys.customers, customers.filter((customer) => customer.id !== id));
      writeStorage(
        storageKeys.orders,
        orders.map((order) => (order.customerId === id ? { ...order, customerId: null, updatedAt: now } : order)),
      );
    },
    async mergeCustomers(sourceId, targetId) {
      if (sourceId === targetId) throw new Error("same_customer");
      const customers = readStorage<Customer[]>(storageKeys.customers, []);
      const source = customers.find((customer) => customer.id === sourceId);
      const target = customers.find((customer) => customer.id === targetId);
      if (!source || !target) throw new Error("customer_not_found");
      const orders = readStorage<OrderRecord[]>(storageKeys.orders, []);
      const now = new Date().toISOString();
      const targetSnapshot = snapshotFromCustomer(target);
      let updatedOrders = 0;
      const nextOrders = orders.map((order) => {
        if (!isRelatedOrderToCustomer(order, source)) return order;
        updatedOrders += 1;
        return { ...order, customerId: target.id, customer: targetSnapshot, updatedAt: now };
      });
      writeStorage(storageKeys.orders, nextOrders);
      writeStorage(storageKeys.customers, customers.filter((customer) => customer.id !== source.id));
      return { updatedOrders };
    },
    async listProductCodes() {
      return readStorage<ProductCode[]>(storageKeys.productCodes, []);
    },
    async saveProductCode(code) {
      const normalizedCode = normalizeProductCode(code);
      const now = new Date().toISOString();
      const record: ProductCode = { ...normalizedCode, imageUrl: normalizedCode.imageUrl ?? null, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      const current = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== normalizedCode.code)]);
      return record;
    },
    async updateProductCode(id, patch) {
      const products = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      const index = products.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("product_code_not_found");
      const normalizedPatch = normalizeProductCodePatch(patch);
      const updated = { ...products[index], ...normalizedPatch, updatedAt: new Date().toISOString() };
      products[index] = updated;
      writeStorage(storageKeys.productCodes, products);
      return updated;
    },
    async deleteProductCode(id) {
      const products = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, products.filter((item) => item.id !== id));
    },
  };
}

async function getSupabaseOrder(supabase: NonNullable<ReturnType<typeof createClient>>, id: string): Promise<OrderRecord> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single<OrderRow>();
  if (error) throw error;
  return rowToOrder(data);
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
      const { data: order, error } = await supabase.rpc("save_order", {
        p_customer: normalizedDraft.customer,
        p_order: {
          orderDate: normalizedDraft.orderDate,
          status: normalizedDraft.status,
          notes: normalizedDraft.notes,
          discount: normalizedDraft.discount,
          shippingCost: normalizedDraft.shippingCost,
          subtotal: computed.subtotal,
          total: computed.total,
        },
        p_items: normalizedDraft.items,
      });
      if (error) throw error;
      return getSupabaseOrder(supabase, (order as OrderRow).id);
    },
    async updateOrder(id, patch) {
      const normalizedPatch = normalizeOrderPatch(patch);
      const { error } = await supabase.rpc("update_order", { p_order_id: id, p_patch: normalizedPatch });
      if (error) throw error;
      return getSupabaseOrder(supabase, id);
    },
    async listOrderEdits(orderId) {
      const { data, error } = await supabase
        .from("order_edits")
        .select("*")
        .eq("order_id", orderId)
        .order("changed_at", { ascending: false })
        .returns<OrderEditRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToOrderEdit);
    },
    async listCustomers() {
      const { data, error } = await supabase.from("customers").select("*").order("full_name", { ascending: true }).returns<CustomerRow[]>();
      if (error) throw error;
      return sortCustomersByName((data ?? []).map(rowToCustomer));
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
    async deleteCustomer(id) {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    async mergeCustomers(sourceId, targetId) {
      if (sourceId === targetId) throw new Error("same_customer");
      const { data, error } = await supabase.rpc("merge_customers", { p_source_id: sourceId, p_target_id: targetId });
      if (error) throw error;
      return { updatedOrders: Number(data) };
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
        .upsert(
          { code: normalizedCode.code, product_name: normalizedCode.productName, category: normalizedCode.category, unit_price: normalizedCode.unitPrice, supplier_price: normalizedCode.supplierPrice, image_url: normalizedCode.imageUrl ?? null },
          { onConflict: "code" },
        )
        .select("*")
        .single<ProductCodeRow>();
      if (error) throw error;
      return rowToProductCode(data);
    },
    async updateProductCode(id, patch) {
      const normalizedPatch = normalizeProductCodePatch(patch);
      const payload = {
        ...(normalizedPatch.productName !== undefined ? { product_name: normalizedPatch.productName } : {}),
        ...(normalizedPatch.category !== undefined ? { category: normalizedPatch.category } : {}),
        ...(normalizedPatch.unitPrice !== undefined ? { unit_price: normalizedPatch.unitPrice } : {}),
        ...(normalizedPatch.supplierPrice !== undefined ? { supplier_price: normalizedPatch.supplierPrice } : {}),
        ...(normalizedPatch.imageUrl !== undefined ? { image_url: normalizedPatch.imageUrl } : {}),
      };
      const { data, error } = await supabase
        .from("product_codes")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single<ProductCodeRow>();
      if (error) throw error;
      return rowToProductCode(data);
    },
    async deleteProductCode(id) {
      const { error } = await supabase.from("product_codes").delete().eq("id", id);
      if (error) throw error;
    },
  };
}

export function getBusinessStore(): BusinessStore {
  return createSupabaseBusinessStore() ?? createLocalBusinessStore();
}
