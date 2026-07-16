# Migración de Purple Shop (raíz) a Vercel/Supabase — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Absorber el inventario de stock (hoy en `localStorage` de la app legacy raíz) dentro de `apps/rotulos` sobre Supabase, y cortar el hosting de GitHub Pages a Vercel de una sola vez, retirando después el código legacy de la raíz.

**Architecture:** `apps/rotulos` (Next.js 16 / React 19 / TypeScript / Supabase) gana dos tablas nuevas (`products`, `stock_movements`) siguiendo el mismo patrón dual local/Supabase ya usado por `business-store.ts` y `label-store.ts` — un `inventory-store.ts` con `createLocalInventoryStore()` (fallback `localStorage`, usado si no hay env de Supabase) y `createSupabaseInventoryStore()`, seleccionados por `getInventoryStore()`. La UI de Inventario y Reportes se completa contra ese store. Recién al final, tras validar en producción, se apaga GitHub Pages y se borra el código legacy de la raíz (`index.html`, `src/`, `css/`, `html/`, `pwa/`).

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Vitest 4 + Testing Library, Vercel.

## Global Constraints

- No hay datos reales de producción a migrar — la migración de datos arranca en limpio (del spec).
- Sin período de convivencia entre GitHub Pages y Vercel — el corte es directo, pero el código legacy solo se borra del repo *después* de validar en producción (del spec).
- El control de acceso pasa a ser exclusivamente Supabase Auth (magic link); se elimina el allowlist MSAL/Azure AD por hash (del spec).
- `current_stock` en `products` se mantiene consistente vía un trigger de Postgres en `stock_movements` (`after insert`), no en la capa de aplicación (del spec).
- Seguir el patrón dual local-store/Supabase-store ya establecido en `apps/rotulos/src/lib/business-store.ts` y `label-store.ts` — no introducir un patrón de acceso a datos distinto.
- Este entorno de desarrollo no tiene Docker disponible, por lo que `supabase start`/`supabase db reset` (Postgres local) no funcionan aquí — la migración SQL se valida por revisión + aplicación directa contra el proyecto remoto en la Tarea 9, no con una base local.

---

### Task 1: Migración SQL — tablas `products` y `stock_movements`

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607161000_create_inventory_schema.sql`

**Interfaces:**
- Produces: tablas `public.products` (columnas: `id`, `name`, `category`, `sku`, `unit_price`, `current_stock`, `min_stock`, `max_stock`, `last_restock_date`, `created_by`, `created_at`, `updated_at`) y `public.stock_movements` (`id`, `product_id`, `type`, `quantity`, `reason`, `supplier`, `created_by`, `created_at`); función/trigger `public.apply_stock_movement()` que las Tareas 3+ consumen vía `supabase.from("products")` / `supabase.from("stock_movements")`.

- [ ] **Step 1: Escribir la migración**

```sql
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  sku text not null default '',
  unit_price numeric not null default 0,
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  max_stock numeric,
  last_restock_date timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('entrada', 'salida', 'ajuste', 'transferencia')),
  quantity numeric not null check (quantity <> 0),
  reason text not null default '',
  supplier text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create unique index if not exists products_sku_unique_idx on public.products (sku) where sku <> '';
create index if not exists stock_movements_product_id_idx on public.stock_movements (product_id);
create index if not exists stock_movements_created_at_idx on public.stock_movements (created_at desc);

alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

grant select, insert, update, delete on public.products to authenticated;
grant select, insert on public.stock_movements to authenticated;

create policy "Authenticated users can read products."
  on public.products for select to authenticated
  using (true);

create policy "Authenticated users can insert products."
  on public.products for insert to authenticated
  with check (created_by = auth.uid());

create policy "Authenticated users can update products."
  on public.products for update to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete products."
  on public.products for delete to authenticated
  using (true);

create policy "Authenticated users can read stock movements."
  on public.stock_movements for select to authenticated
  using (true);

create policy "Authenticated users can insert stock movements."
  on public.stock_movements for insert to authenticated
  with check (created_by = auth.uid());

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_stock numeric;
begin
  select current_stock into v_current_stock from public.products where id = new.product_id for update;

  if new.type = 'salida' and v_current_stock < new.quantity then
    raise exception 'stock_insuficiente';
  end if;

  if new.type = 'entrada' then
    update public.products
    set current_stock = current_stock + new.quantity,
        last_restock_date = now(),
        updated_at = now()
    where id = new.product_id;
  elsif new.type = 'salida' then
    update public.products
    set current_stock = current_stock - new.quantity,
        updated_at = now()
    where id = new.product_id;
  else
    update public.products
    set current_stock = current_stock + new.quantity,
        updated_at = now()
    where id = new.product_id;
  end if;

  return new;
end;
$$;

create trigger stock_movements_apply
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();
```

- [ ] **Step 2: Revisar contra el patrón existente**

Abrir `apps/rotulos/supabase/migrations/202607150001_create_rotulos_schema.sql` y confirmar que el archivo nuevo sigue el mismo estilo: minúsculas, `if not exists`, RLS habilitada antes de las políticas, `grant` antes de `create policy`. No hay base local (sin Docker en este entorno — ver Global Constraints), así que no se corre `supabase db reset` aquí; la aplicación real contra el proyecto remoto ocurre en la Tarea 9.

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607161000_create_inventory_schema.sql
git commit -m "feat(inventario): agregar esquema Supabase de products y stock_movements"
```

---

### Task 2: Tipos de inventario

**Files:**
- Create: `apps/rotulos/src/lib/inventory-types.ts`

**Interfaces:**
- Produces: `Product`, `ProductDraft`, `StockMovementType`, `StockMovement`, `StockMovementDraft`, `StockAlerts` — consumidos por `inventory-store.ts` (Tarea 3) y los componentes de las Tareas 5-7.

- [ ] **Step 1: Escribir el archivo de tipos**

```typescript
export type Product = {
  id: string;
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  lastRestockDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductDraft = {
  name: string;
  category: string;
  sku: string;
  unitPrice: number;
  minStock: number;
  maxStock: number | null;
};

export type StockMovementType = "entrada" | "salida" | "ajuste" | "transferencia";

export type StockMovement = {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  supplier: string;
  createdAt: string;
};

export type StockMovementDraft = {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  supplier: string;
};

export type StockAlerts = {
  lowStock: Product[];
  critical: Product[];
  overstocked: Product[];
};
```

- [ ] **Step 2: Verificar que compila**

Run: `npm --prefix apps/rotulos run typecheck`
Expected: sin errores (el archivo no tiene todavía consumidores, así que solo valida sintaxis TS).

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/src/lib/inventory-types.ts
git commit -m "feat(inventario): agregar tipos Product y StockMovement"
```

---

### Task 3: `inventory-store.ts` — store local + Supabase

**Files:**
- Create: `apps/rotulos/src/lib/inventory-store.ts`
- Test: `apps/rotulos/src/__tests__/inventory-store.test.ts`

**Interfaces:**
- Consumes: `Product`, `ProductDraft`, `StockMovement`, `StockMovementDraft`, `StockAlerts` de `@/lib/inventory-types` (Tarea 2); `createClient` de `@/lib/supabase/client` (mismo import que `business-store.ts:3`).
- Produces: `InventoryStore` type con `listProducts(): Promise<Product[]>`, `saveProduct(draft: ProductDraft, id?: string): Promise<Product>`, `deleteProduct(id: string): Promise<void>`, `listMovements(productId?: string): Promise<StockMovement[]>`, `recordMovement(draft: StockMovementDraft): Promise<StockMovement>`, `getStockAlerts(): Promise<StockAlerts>`; `createLocalInventoryStore(): InventoryStore` (exportada para tests, igual que `createLocalLabelStore`); `getInventoryStore(): InventoryStore`. Consumido por los componentes de las Tareas 5-7.

- [ ] **Step 1: Escribir el test (contra el store local, mismo patrón que `label-store.test.ts`)**

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { createLocalInventoryStore } from "@/lib/inventory-store";

describe("local inventory store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un producto con stock en cero y lo lista", async () => {
    const store = createLocalInventoryStore();
    const saved = await store.saveProduct({
      name: "Medias largas",
      category: "medias",
      sku: "MED-001",
      unitPrice: 15000,
      minStock: 5,
      maxStock: 200,
    });

    expect(saved.currentStock).toBe(0);
    expect(await store.listProducts()).toEqual([saved]);
  });

  it("aumenta el stock al registrar una entrada", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Perfume 100ml", category: "perfumes", sku: "PER-001",
      unitPrice: 60000, minStock: 3, maxStock: 50,
    });

    const movement = await store.recordMovement({
      productId: product.id, type: "entrada", quantity: 10, reason: "Compra a proveedor", supplier: "ACME",
    });

    expect(movement.quantity).toBe(10);
    const [updated] = await store.listProducts();
    expect(updated.currentStock).toBe(10);
    expect(updated.lastRestockDate).not.toBeNull();
  });

  it("disminuye el stock al registrar una salida y rechaza salidas sin stock suficiente", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Camiseta M", category: "camisetas", sku: "CAM-001",
      unitPrice: 35000, minStock: 2, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 5, reason: "Stock inicial", supplier: "" });

    await store.recordMovement({ productId: product.id, type: "salida", quantity: 3, reason: "Venta", supplier: "" });
    const [afterSale] = await store.listProducts();
    expect(afterSale.currentStock).toBe(2);

    await expect(
      store.recordMovement({ productId: product.id, type: "salida", quantity: 10, reason: "Venta grande", supplier: "" }),
    ).rejects.toThrow("stock_insuficiente");
  });

  it("aplica el delta de un ajuste, incluyendo ajustes negativos", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Accesorio X", category: "accesorios", sku: "ACC-001",
      unitPrice: 8000, minStock: 1, maxStock: 30,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 8, reason: "Stock inicial", supplier: "" });

    await store.recordMovement({ productId: product.id, type: "ajuste", quantity: -3, reason: "Conteo fisico", supplier: "" });

    const [updated] = await store.listProducts();
    expect(updated.currentStock).toBe(5);
  });

  it("calcula alertas de stock bajo, critico y exceso", async () => {
    const store = createLocalInventoryStore();
    const low = await store.saveProduct({ name: "Bajo", category: "medias", sku: "L1", unitPrice: 1000, minStock: 5, maxStock: 100 });
    const critical = await store.saveProduct({ name: "Critico", category: "medias", sku: "L2", unitPrice: 1000, minStock: 5, maxStock: 100 });
    const over = await store.saveProduct({ name: "Exceso", category: "medias", sku: "L3", unitPrice: 1000, minStock: 5, maxStock: 10 });
    await store.recordMovement({ productId: low.id, type: "entrada", quantity: 3, reason: "", supplier: "" });
    await store.recordMovement({ productId: over.id, type: "entrada", quantity: 20, reason: "", supplier: "" });

    const alerts = await store.getStockAlerts();

    expect(alerts.lowStock.map((p) => p.id)).toContain(low.id);
    expect(alerts.critical.map((p) => p.id)).toContain(critical.id);
    expect(alerts.overstocked.map((p) => p.id)).toContain(over.id);
  });

  it("lista movimientos filtrados por producto, mas recientes primero", async () => {
    const store = createLocalInventoryStore();
    const a = await store.saveProduct({ name: "A", category: "medias", sku: "A1", unitPrice: 1000, minStock: 1, maxStock: 10 });
    const b = await store.saveProduct({ name: "B", category: "medias", sku: "B1", unitPrice: 1000, minStock: 1, maxStock: 10 });
    await store.recordMovement({ productId: a.id, type: "entrada", quantity: 1, reason: "1", supplier: "" });
    await store.recordMovement({ productId: b.id, type: "entrada", quantity: 1, reason: "2", supplier: "" });
    await store.recordMovement({ productId: a.id, type: "entrada", quantity: 1, reason: "3", supplier: "" });

    const forA = await store.listMovements(a.id);

    expect(forA.map((m) => m.reason)).toEqual(["3", "1"]);
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm --prefix apps/rotulos run test -- inventory-store`
Expected: FAIL — `Cannot find module '@/lib/inventory-store'`

- [ ] **Step 3: Implementar `inventory-store.ts`**

```typescript
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

type ProductRow = {
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

type StockMovementRow = {
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

function rowToProduct(row: ProductRow): Product {
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

function rowToMovement(row: StockMovementRow): StockMovement {
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

      if (draft.type === "salida" && product.currentStock < draft.quantity) {
        throw new Error("stock_insuficiente");
      }

      const delta = draft.type === "entrada" ? draft.quantity : draft.type === "salida" ? -draft.quantity : draft.quantity;
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
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- inventory-store`
Expected: PASS — 6 tests.

- [ ] **Step 5: Typecheck y lint**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/inventory-store.ts apps/rotulos/src/__tests__/inventory-store.test.ts
git commit -m "feat(inventario): agregar inventory-store con implementacion local y Supabase"
```

---

### Task 4: `products-table.tsx` — listado de productos con alertas

**Files:**
- Create: `apps/rotulos/src/components/products-table.tsx`
- Test: `apps/rotulos/src/__tests__/products-table.test.tsx`

**Interfaces:**
- Consumes: `getInventoryStore` de `@/lib/inventory-store` (Tarea 3); `Product` de `@/lib/inventory-types` (Tarea 2); `formatCop` de `@/lib/format` (`apps/rotulos/src/lib/format.ts:1`).
- Produces: componente `ProductsTable` exportado, consumido por `inventario/page.tsx` (Tarea 6).

- [ ] **Step 1: Escribir el test (mismo patrón que un test de componente existente, ver `label-form.test.tsx` para el estilo de Testing Library en este repo)**

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsTable } from "@/components/products-table";
import { createLocalInventoryStore } from "@/lib/inventory-store";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

describe("ProductsTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("muestra un mensaje cuando no hay productos", async () => {
    render(<ProductsTable />);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("No hay productos"));
  });

  it("lista productos guardados y marca stock bajo", async () => {
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    await store.recordMovement({ productId: product.id, type: "entrada", quantity: 2, reason: "Stock inicial", supplier: "" });

    render(<ProductsTable />);

    await waitFor(() => expect(screen.getByText("Medias largas")).toBeInTheDocument());
    expect(screen.getByText(/stock bajo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm --prefix apps/rotulos run test -- products-table`
Expected: FAIL — `Cannot find module '@/components/products-table'`

- [ ] **Step 3: Implementar el componente**

```typescript
"use client";

import { useEffect, useMemo, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product } from "@/lib/inventory-types";

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Cargando productos...");

  useEffect(() => {
    getInventoryStore().listProducts()
      .then((items) => {
        setProducts(items);
        setStatus(items.length ? "" : "No hay productos en el inventario todavia.");
      })
      .catch(() => setStatus("No se pudieron cargar los productos."));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(needle) ||
      product.sku.toLowerCase().includes(needle) ||
      product.category.toLowerCase().includes(needle),
    );
  }, [products, query]);

  function stockLabel(product: Product): string | null {
    if (product.currentStock === 0) return "Stock critico";
    if (product.currentStock <= product.minStock) return "Stock bajo";
    if (product.maxStock !== null && product.currentStock > product.maxStock) return "Exceso de stock";
    return null;
  }

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar producto</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p role="status">{status}</p>
      <div className="history-table">
        <div className="business-row business-head">
          <span>Producto</span><span>SKU</span><span>Categoria</span><span>Precio</span><span>Stock</span><span>Alerta</span>
        </div>
        {filtered.map((product) => {
          const alert = stockLabel(product);
          return (
            <div className="business-row" key={product.id}>
              <span>{product.name}</span>
              <span>{product.sku}</span>
              <span>{product.category}</span>
              <span>{formatCop(product.unitPrice)}</span>
              <span>{product.currentStock}</span>
              <span>{alert ?? "-"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- products-table`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/components/products-table.tsx apps/rotulos/src/__tests__/products-table.test.tsx
git commit -m "feat(inventario): agregar ProductsTable con alertas de stock"
```

---

### Task 5: `stock-movement-form.tsx` — registrar producto nuevo y movimientos

**Files:**
- Create: `apps/rotulos/src/components/stock-movement-form.tsx`
- Test: `apps/rotulos/src/__tests__/stock-movement-form.test.tsx`

**Interfaces:**
- Consumes: `getInventoryStore` de `@/lib/inventory-store` (Tarea 3); `Product`, `StockMovementType` de `@/lib/inventory-types` (Tarea 2).
- Produces: componente `StockMovementForm` exportado, con prop `onSaved: () => void` que el padre usa para refrescar `ProductsTable`. Consumido por `inventario/page.tsx` (Tarea 6).

- [ ] **Step 1: Escribir el test**

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockMovementForm } from "@/components/stock-movement-form";
import { createLocalInventoryStore } from "@/lib/inventory-store";

vi.mock("@/lib/inventory-store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/inventory-store")>("@/lib/inventory-store");
  return { ...actual, getInventoryStore: actual.createLocalInventoryStore };
});

describe("StockMovementForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("crea un producto nuevo con el formulario de alta", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    render(<StockMovementForm onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/nombre del producto/i), "Perfume 100ml");
    await user.type(screen.getByLabelText(/categoria/i), "perfumes");
    await user.type(screen.getByLabelText(/precio/i), "60000");
    await user.click(screen.getByRole("button", { name: /guardar producto/i }));

    await waitFor(async () => {
      const products = await createLocalInventoryStore().listProducts();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe("Perfume 100ml");
    });
    expect(onSaved).toHaveBeenCalled();
  });

  it("registra un movimiento de entrada para un producto existente", async () => {
    const user = userEvent.setup();
    const store = createLocalInventoryStore();
    const product = await store.saveProduct({
      name: "Medias largas", category: "medias", sku: "MED-001",
      unitPrice: 15000, minStock: 5, maxStock: 100,
    });
    render(<StockMovementForm onSaved={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText(/producto/i), product.id);
    await user.selectOptions(screen.getByLabelText(/tipo de movimiento/i), "entrada");
    await user.type(screen.getByLabelText(/cantidad/i), "10");
    await user.click(screen.getByRole("button", { name: /registrar movimiento/i }));

    await waitFor(async () => {
      const [updated] = await store.listProducts();
      expect(updated.currentStock).toBe(10);
    });
  });
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm --prefix apps/rotulos run test -- stock-movement-form`
Expected: FAIL — `Cannot find module '@/components/stock-movement-form'`

- [ ] **Step 3: Implementar el componente**

```typescript
"use client";

import { useEffect, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import type { Product, StockMovementType } from "@/lib/inventory-types";

export function StockMovementForm({ onSaved }: { onSaved: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [maxStock, setMaxStock] = useState("");

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockMovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    getInventoryStore().listProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  async function handleCreateProduct(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await getInventoryStore().saveProduct({
        name,
        category,
        sku,
        unitPrice: Number(unitPrice) || 0,
        minStock: Number(minStock) || 0,
        maxStock: maxStock ? Number(maxStock) : null,
      });
      setName(""); setCategory(""); setSku(""); setUnitPrice(""); setMinStock("5"); setMaxStock("");
      setProducts(await getInventoryStore().listProducts());
      onSaved();
    } catch {
      setStatus("No se pudo guardar el producto.");
    }
  }

  async function handleRecordMovement(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await getInventoryStore().recordMovement({
        productId,
        type,
        quantity: Number(quantity) || 0,
        reason,
        supplier,
      });
      setQuantity(""); setReason(""); setSupplier("");
      onSaved();
    } catch (error) {
      setStatus(error instanceof Error && error.message === "stock_insuficiente" ? "Stock insuficiente para esa salida." : "No se pudo registrar el movimiento.");
    }
  }

  return (
    <div className="business-forms-grid">
      <form className="panel" onSubmit={handleCreateProduct}>
        <div className="panel-title">Nuevo producto</div>
        <label className="field">
          <span>Nombre del producto</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Categoria</span>
          <input value={category} onChange={(event) => setCategory(event.target.value)} required />
        </label>
        <label className="field">
          <span>SKU</span>
          <input value={sku} onChange={(event) => setSku(event.target.value)} />
        </label>
        <label className="field">
          <span>Precio</span>
          <input type="number" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} required />
        </label>
        <label className="field">
          <span>Stock minimo</span>
          <input type="number" value={minStock} onChange={(event) => setMinStock(event.target.value)} />
        </label>
        <label className="field">
          <span>Stock maximo</span>
          <input type="number" value={maxStock} onChange={(event) => setMaxStock(event.target.value)} />
        </label>
        <button type="submit" className="primary-action">Guardar producto</button>
      </form>
      <form className="panel" onSubmit={handleRecordMovement}>
        <div className="panel-title">Registrar movimiento</div>
        <label className="field">
          <span>Producto</span>
          <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
            <option value="" disabled>Selecciona un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo de movimiento</span>
          <select value={type} onChange={(event) => setType(event.target.value as StockMovementType)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label className="field">
          <span>Cantidad</span>
          <input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="field">
          <span>Motivo</span>
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="field">
          <span>Proveedor</span>
          <input value={supplier} onChange={(event) => setSupplier(event.target.value)} />
        </label>
        <button type="submit" className="primary-action">Registrar movimiento</button>
      </form>
      {status && <p role="alert">{status}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- stock-movement-form`
Expected: PASS — 2 tests.

- [ ] **Step 5: Typecheck, lint y suite completa**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run test`
Expected: sin errores; toda la suite (incluye los tests preexistentes + los nuevos) pasa.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/components/stock-movement-form.tsx apps/rotulos/src/__tests__/stock-movement-form.test.tsx
git commit -m "feat(inventario): agregar formulario de alta de producto y registro de movimientos"
```

---

### Task 6: Conectar `inventario/page.tsx`

**Files:**
- Modify: `apps/rotulos/src/app/inventario/page.tsx` (reemplaza completo el placeholder listado arriba)

**Interfaces:**
- Consumes: `ProductsTable` (Tarea 4), `StockMovementForm` (Tarea 5).

- [ ] **Step 1: Reemplazar el placeholder por la UI real**

```typescript
"use client";

import { useState } from "react";
import { ProductsTable } from "@/components/products-table";
import { StockMovementForm } from "@/components/stock-movement-form";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Control de stock</p>
        <h1>Inventario</h1>
      </div>
      <StockMovementForm onSaved={() => setRefreshKey((key) => key + 1)} />
      <ProductsTable key={refreshKey} />
    </main>
  );
}
```

- [ ] **Step 2: Levantar en dev y probar el flujo a mano**

Run: `npm --prefix apps/rotulos run dev`

En el navegador, ir a `http://localhost:3001/inventario`:
1. Crear un producto ("Medias largas", categoría "medias", precio 15000, stock mínimo 5, stock máximo 100).
2. Registrar un movimiento de entrada de 10 unidades para ese producto.
3. Confirmar que la tabla de productos muestra stock `10` y que, al bajar el stock mínimo con una salida grande, aparece la alerta "Stock bajo"/"Stock critico".

Detener el server con Ctrl+C al terminar.

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/src/app/inventario/page.tsx
git commit -m "feat(inventario): conectar la pagina de inventario a ProductsTable y StockMovementForm"
```

---

### Task 7: Métricas de inventario en Reportes

**Files:**
- Modify: `apps/rotulos/src/app/reportes/page.tsx:1-20` (reemplaza completo)

**Interfaces:**
- Consumes: `getInventoryStore` de `@/lib/inventory-store` (Tarea 3); `formatCop` de `@/lib/format`.

- [ ] **Step 1: Extender la página con un panel de inventario (server component async, mismo patrón simple ya usado por la página)**

```typescript
import Link from "next/link";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";

export default async function ReportsPage() {
  const store = getInventoryStore();
  const [products, alerts] = await Promise.all([store.listProducts(), store.getStockAlerts()]);
  const totalValue = products.reduce((sum, product) => sum + product.currentStock * product.unitPrice, 0);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Analitica</p>
        <h1>Reportes</h1>
      </div>
      <section className="panel">
        <div className="panel-title">Inventario</div>
        <div className="summary-grid">
          <div><span>Productos activos</span><strong>{products.length}</strong></div>
          <div><span>Valor total en stock</span><strong>{formatCop(totalValue)}</strong></div>
          <div><span>Con stock bajo</span><strong>{alerts.lowStock.length}</strong></div>
          <div><span>Sin stock</span><strong>{alerts.critical.length}</strong></div>
          <div><span>Con exceso de stock</span><strong>{alerts.overstocked.length}</strong></div>
        </div>
      </section>
      <section className="panel">
        <div className="panel-title">Dashboard de reportes</div>
        <div className="quick-actions-grid">
          <Link className="primary-action" href="/pedidos">Pedidos</Link>
          <Link className="primary-action secondary" href="/clientes">Clientes</Link>
          <Link className="primary-action neutral" href="/inventario">Inventario</Link>
          <Link className="primary-action neutral" href="/historial">Rotulos</Link>
        </div>
      </section>
    </main>
  );
}
```

`getInventoryStore()` usa `createClient()` de `@/lib/supabase/client.ts`, que llama a `createBrowserClient` — funciona en un server component de Next porque solo lee `process.env.NEXT_PUBLIC_*` y hace `fetch`, sin acceder a APIs de navegador; si el proyecto no tiene esas env vars configuradas, cae al store local (que en un server component siempre estará vacío porque no hay `window.localStorage`) — comportamiento aceptable: sin Supabase configurado, Reportes simplemente no tiene inventario que mostrar, igual que hoy no tiene pedidos.

- [ ] **Step 2: Typecheck, lint y build**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: sin errores; el build de Next completa.

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/src/app/reportes/page.tsx
git commit -m "feat(reportes): agregar panel de metricas de inventario"
```

---

### Task 8: Actualizar `PENDING_QA.md` y `NEXT_STEPS.md`

**Files:**
- Modify: `apps/rotulos/PENDING_QA.md:59` (marcar como resuelto el ítem de migración de Inventario/Reportes)
- Modify: `NEXT_STEPS.md` (actualizar sección 2, agregar los pendientes de corte de hosting)

**Interfaces:** ninguna — solo documentación.

- [ ] **Step 1: Marcar en `PENDING_QA.md` el ítem ya resuelto**

En la línea `- [ ] Completar migración 1:1 de Inventario y Reportes contra Supabase; las rutas ya existen, pero Inventario está como base inicial.` cambiar `[ ]` por `[x]` y agregar una frase: "Inventario y Reportes ya están conectados a Supabase (`products`/`stock_movements`), con fallback local vía `inventory-store.ts`."

- [ ] **Step 2: Actualizar `NEXT_STEPS.md` sección 2**

Agregar debajo de la lista existente:
```markdown
- [x] Inventario de stock (productos, movimientos, alertas) migrado a
  Supabase (`products`, `stock_movements`), con UI en `apps/rotulos/src/app/inventario`
  y métricas agregadas en Reportes.
- [ ] Aplicar la migración `202607161000_create_inventory_schema.sql` en
  el proyecto Supabase remoto `purpleshop`.
- [ ] Validar en producción el flujo completo de inventario (crear
  producto, registrar entrada/salida, ver alertas).
- [ ] Apagar GitHub Pages y borrar el codigo legacy de la raiz una vez
  validado el corte.
```

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/PENDING_QA.md NEXT_STEPS.md
git commit -m "docs: actualizar pendientes tras migrar inventario a Supabase"
```

---

### Task 9: Aplicar la migración al proyecto Supabase remoto (`purpleshop`)

Esta tarea requiere las credenciales del proyecto Supabase remoto (`purpleshop`, ref `enrruhuzlnqqjnsabgzq`) y no puede completarse sin acceso a ellas — quien ejecute el plan debe correrla con su propia sesión autenticada.

**Files:** ninguno (solo aplica la migración creada en la Tarea 1 contra la base remota).

- [ ] **Step 1: Autenticarse con Supabase CLI (requiere un access token nuevo — el anterior fue revocado, ver `NEXT_STEPS.md`)**

Run: `npx supabase login`
Expected: abre el flujo de login en el navegador y confirma `You are now logged in.`

- [ ] **Step 2: Enlazar el proyecto remoto (si `apps/rotulos/supabase` no está ya enlazado)**

Run: `cd apps/rotulos && npx supabase link --project-ref enrruhuzlnqqjnsabgzq`
Expected: `Finished supabase link.`

- [ ] **Step 3: Aplicar la migración pendiente**

Run: `npx supabase db push`
Expected: lista `202607161000_create_inventory_schema.sql` como pendiente y la aplica sin errores.

- [ ] **Step 4: Verificar en el dashboard de Supabase**

Abrir el proyecto `purpleshop` en https://supabase.com/dashboard → Table Editor → confirmar que existen `products` y `stock_movements`, y que RLS está habilitada en ambas (ícono de escudo verde).

No hay commit en este paso — es una operación contra infraestructura externa, no un cambio de archivos en el repo.

---

### Task 10: Build de producción, deploy a Vercel y validación manual

**Files:** ninguno (deploy y validación, no cambios de código).

- [ ] **Step 1: Confirmar que el build de producción pasa localmente**

Run: `npm --prefix apps/rotulos run build`
Expected: `Compiled successfully`.

- [ ] **Step 2: Desplegar a producción en Vercel**

Run: `cd apps/rotulos && npx vercel --prod`
Expected: termina con una URL de producción (`https://rotulos-xi.vercel.app` o la que esté configurada como dominio de producción del proyecto `edwingalarcons-projects/rotulos`).

Si el proyecto ya tiene auto-deploy configurado desde `git push` a `main` (habitual en Vercel), este paso puede ser simplemente hacer push de los commits de las Tareas 1-8 y verificar en el dashboard de Vercel que el deploy de producción terminó en verde, en vez de correr `vercel --prod` a mano.

- [ ] **Step 3: Validar manualmente en producción (checklist)**

En `https://rotulos-xi.vercel.app` (o el dominio de producción):
1. Iniciar sesión con magic link con una cuenta invitada.
2. Crear un producto nuevo en Inventario.
3. Registrar una entrada y luego una salida sobre ese producto; confirmar que el stock mostrado es correcto.
4. Provocar una alerta de "Stock bajo" (salida hasta quedar por debajo del mínimo) y confirmar que aparece en la tabla y en el panel de Reportes.
5. Crear un pedido real desde "Nuevo Pedido" y confirmar que aparece en "Pedidos" — esto cubre el ítem ya pendiente de `PENDING_QA.md` de validar magic link + pedido real.
6. Generar un rótulo desde "Rotulos de envio" y confirmar que aparece en "Historial".

Si algún paso falla, no continuar a la Tarea 11 — GitHub Pages sigue siendo el rollback disponible hasta que esta validación pase completa.

---

### Task 11: Apagar GitHub Pages

Acción manual sobre la configuración del repositorio en GitHub — no es un cambio de código.

- [ ] **Step 1: Apagar Pages**

En GitHub → repositorio `EdwingAlarcon/PaginaWebPedidosPS` → Settings → Pages → cambiar "Source" a "None" → Save.

- [ ] **Step 2: Confirmar que la URL antigua de GitHub Pages deja de servir contenido actualizado**

Visitar la URL de GitHub Pages del repo y confirmar que ya no sirve la app (típicamente muestra un 404 de GitHub Pages tras la desactivación, puede tardar unos minutos en propagarse).

---

### Task 12: Borrar el código legacy de la raíz

**Solo ejecutar esta tarea después de que la Tarea 10 (validación en producción) haya pasado completa.**

**Files:**
- Delete: `index.html`, `src/`, `css/`, `html/`, `pwa/`, `tests/` (los que corresponden a la app legacy raíz — no `apps/rotulos/tests` ni `apps/rotulos/src/__tests__`, que se mantienen)
- Modify: `README.md` (reescribir para describir `apps/rotulos` como la única app)
- Modify: `CLAUDE.md` (retirar la sección de arquitectura legacy raíz; documentar `apps/rotulos` como único proyecto)
- Modify: `package.json` (raíz) — quitar los scripts `start`/`serve` que servían la app legacy; dejar solo los `rotulos:*`

**Interfaces:** ninguna — es limpieza de archivos, no código con consumidores.

- [ ] **Step 1: Confirmar el estado del repo antes de borrar**

Run: `git status`
Expected: working tree limpio (todos los commits de las tareas anteriores ya están hechos).

- [ ] **Step 2: Borrar los directorios y archivos legacy**

```bash
git rm -r index.html src/ css/ html/ pwa/ tests/
```

- [ ] **Step 3: Reescribir `README.md`**

Reemplazar el contenido actual por una descripción corta que apunte a `apps/rotulos/README.md` como fuente de verdad de la app, y explique brevemente que el repo alojó antes una app legacy en la raíz (ahora retirada, disponible en el historial de git antes del commit de esta tarea).

- [ ] **Step 4: Reescribir `CLAUDE.md`**

Quitar toda la sección "Architecture" que describe la app legacy (carga de scripts, `window.App`, MSAL, `ExcelManager`, etc.) y las secciones "Fixed gotcha" que documentan bugs de ese código. Mantener/adaptar únicamente lo que siga aplicando a `apps/rotulos` (convenciones de Next.js/Supabase del proyecto, si las hay documentadas en `apps/rotulos/README.md` — si no, dejar `CLAUDE.md` como un puntero corto a ese README en vez de duplicar contenido).

- [ ] **Step 5: Actualizar `package.json` de la raíz**

```json
{
  "name": "paginawebpedidosps",
  "version": "1.0.0",
  "description": "Purple Shop — gestion de pedidos, inventario y rotulos (Next.js/Supabase)",
  "scripts": {
    "dev": "npm --prefix apps/rotulos run dev",
    "build": "npm --prefix apps/rotulos run build",
    "test": "npm --prefix apps/rotulos run test",
    "test:e2e": "npm --prefix apps/rotulos run test:e2e",
    "qa": "npm --prefix apps/rotulos run qa:final"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/EdwingAlarcon/PaginaWebPedidosPS.git"
  }
}
```

Conservar los campos (`keywords`, `license`, etc.) que ya existían y siguen siendo válidos; ajustar solo `scripts`/`description` según lo de arriba.

- [ ] **Step 6: Confirmar que `apps/rotulos` sigue funcionando de forma aislada**

Run: `npm --prefix apps/rotulos run build && npm --prefix apps/rotulos run test`
Expected: ambos pasan — confirma que borrar la raíz no rompió nada dentro de `apps/rotulos` (no debería, porque no hay imports cruzados entre la raíz legacy y `apps/rotulos`).

- [ ] **Step 7: Commit**

```bash
git add README.md CLAUDE.md package.json
git commit -m "chore: retirar la app legacy de la raiz tras validar el corte a Vercel/Supabase"
```

- [ ] **Step 8: Push (requiere confirmación explícita del usuario antes de correr este paso)**

```bash
git push origin main
```

---

## Spec Coverage Check

- Migración de inventario a Supabase → Tareas 1-7.
- Fusión en `apps/rotulos` en vez de app nueva separada → todo el plan opera dentro de `apps/rotulos`, ningún archivo nuevo fuera de ahí salvo docs.
- Retiro de MSAL/Excel/OneDrive → Tarea 12 (se borra junto con toda la raíz legacy, que es donde vivía esa integración).
- Auth exclusivamente Supabase magic link → ya implementado en `apps/rotulos` (fuera de alcance de este plan, se valida en Tarea 10).
- Corte directo de hosting sin convivencia, pero borrado de legacy solo tras validar → Tareas 9-12 en ese orden exacto.
- Sin migración de datos existentes → ninguna tarea de import de datos, consistente con el spec.
- Pendientes ya anotados (token de Supabase expuesto, impresión física) → explícitamente fuera de alcance de este plan, ya documentados en `NEXT_STEPS.md`/`PENDING_QA.md`.
