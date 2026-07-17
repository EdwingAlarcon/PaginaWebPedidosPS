"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Product,
  ProductDraft,
  StockAlerts,
  StockMovement,
  StockMovementDraft,
} from "@/lib/inventory-types";

export type InventoryStore = {
  listProducts(): Promise<Product[]>;
  saveProduct(draft: ProductDraft, id?: string): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  listMovements(productId?: string): Promise<StockMovement[]>;
  recordMovement(draft: StockMovementDraft): Promise<StockMovement>;
  getStockAlerts(): Promise<StockAlerts>;
};

export type ProductRow = {
  id: string;
  name: string;
  category: string;
  sku: string;
  unit_price: number | string;
  current_stock: number | string;
  min_stock: number | string;
  max_stock: number | string | null;
  last_restock_date: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovementRow = {
  id: string;
  product_id: string;
  type: StockMovementDraft["type"];
  quantity: number | string;
  reason: string;
  supplier: string;
  created_at: string;
};

const storageKeys = {
  products: "purpleshop.inventory.products",
  movements: "purpleshop.inventory.movements",
};

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    sku: row.sku,
    unitPrice: Number(row.unit_price),
    currentStock: Number(row.current_stock),
    minStock: Number(row.min_stock),
    maxStock: row.max_stock === null ? null : Number(row.max_stock),
    lastRestockDate: row.last_restock_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    type: row.type,
    quantity: Number(row.quantity),
    reason: row.reason,
    supplier: row.supplier,
    createdAt: row.created_at,
  };
}

function computeAlerts(products: Product[]): StockAlerts {
  return {
    lowStock: products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock),
    critical: products.filter((p) => p.currentStock === 0),
    overstocked: products.filter((p) => p.maxStock !== null && p.currentStock > p.maxStock),
  };
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

export function createLocalInventoryStore(): InventoryStore {
  return {
    async listProducts() {
      return readStorage<Product[]>(storageKeys.products, []);
    },
    async saveProduct(draft, id) {
      const now = new Date().toISOString();
      const products = readStorage<Product[]>(storageKeys.products, []);
      const index = id ? products.findIndex((p) => p.id === id) : -1;
      const existing = index >= 0 ? products[index] : undefined;
      const record: Product = {
        id: existing?.id ?? crypto.randomUUID(),
        name: draft.name,
        category: draft.category,
        sku: draft.sku,
        unitPrice: draft.unitPrice,
        currentStock: existing?.currentStock ?? 0,
        minStock: draft.minStock,
        maxStock: draft.maxStock,
        lastRestockDate: existing?.lastRestockDate ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      if (index >= 0) products[index] = record;
      else products.unshift(record);
      writeStorage(storageKeys.products, products);
      return record;
    },
    async deleteProduct(id) {
      const products = readStorage<Product[]>(storageKeys.products, []);
      writeStorage(storageKeys.products, products.filter((p) => p.id !== id));
    },
    async listMovements(productId) {
      const movements = readStorage<StockMovement[]>(storageKeys.movements, []);
      const filtered = productId ? movements.filter((m) => m.productId === productId) : movements;
      return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async recordMovement(draft) {
      const products = readStorage<Product[]>(storageKeys.products, []);
      const index = products.findIndex((p) => p.id === draft.productId);
      if (index < 0) throw new Error("producto_no_encontrado");
      const product = products[index];

      const delta = draft.type === "entrada" ? draft.quantity : draft.type === "salida" ? -draft.quantity : draft.quantity;

      if (product.currentStock + delta < 0) {
        throw new Error("stock_insuficiente");
      }
      const now = new Date().toISOString();
      products[index] = {
        ...product,
        currentStock: product.currentStock + delta,
        lastRestockDate: draft.type === "entrada" ? now : product.lastRestockDate,
        updatedAt: now,
      };
      writeStorage(storageKeys.products, products);

      const movement: StockMovement = {
        id: crypto.randomUUID(),
        productId: draft.productId,
        type: draft.type,
        quantity: draft.quantity,
        reason: draft.reason,
        supplier: draft.supplier,
        createdAt: now,
      };
      const movements = readStorage<StockMovement[]>(storageKeys.movements, []);
      writeStorage(storageKeys.movements, [movement, ...movements]);
      return movement;
    },
    async getStockAlerts() {
      return computeAlerts(readStorage<Product[]>(storageKeys.products, []));
    },
  };
}

function createSupabaseInventoryStore(): InventoryStore | null {
  const supabase = createClient();
  if (!supabase) return null;
  return {
    async listProducts() {
      const { data, error } = await supabase.from("products").select("*").order("name").returns<ProductRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToProduct);
    },
    async saveProduct(draft, id) {
      const payload = {
        name: draft.name,
        category: draft.category,
        sku: draft.sku,
        unit_price: draft.unitPrice,
        min_stock: draft.minStock,
        max_stock: draft.maxStock,
      };
      const request = id
        ? supabase.from("products").update(payload).eq("id", id).select("*").single<ProductRow>()
        : supabase.from("products").insert(payload).select("*").single<ProductRow>();
      const { data, error } = await request;
      if (error) throw error;
      return rowToProduct(data);
    },
    async deleteProduct(id) {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    async listMovements(productId) {
      let query = supabase.from("stock_movements").select("*").order("created_at", { ascending: false });
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query.returns<StockMovementRow[]>();
      if (error) throw error;
      return (data ?? []).map(rowToMovement);
    },
    async recordMovement(draft) {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert({
          product_id: draft.productId,
          type: draft.type,
          quantity: draft.quantity,
          reason: draft.reason,
          supplier: draft.supplier,
        })
        .select("*")
        .single<StockMovementRow>();
      if (error) throw new Error(error.message.includes("stock_insuficiente") ? "stock_insuficiente" : error.message);
      return rowToMovement(data);
    },
    async getStockAlerts() {
      return computeAlerts(await this.listProducts());
    },
  };
}

export function getInventoryStore(): InventoryStore {
  return createSupabaseInventoryStore() ?? createLocalInventoryStore();
}
