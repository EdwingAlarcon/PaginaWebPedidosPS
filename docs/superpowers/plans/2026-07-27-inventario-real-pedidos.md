# Inventario real vinculado a pedidos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vincular cada línea de un pedido nuevo a un producto real de `products` (inventario), de modo que crear, editar y cancelar pedidos descuente/devuelva `products.current_stock` automáticamente, en la misma transacción que ya usan `save_order`/`update_order`.

**Architecture:** `order_items.product_id` (nullable, FK a `products`) y `stock_movements.order_id` (nullable, FK a `orders`) se agregan al esquema. `save_order()` y `update_order()` (funciones `security definer` ya existentes) se extienden para insertar filas en `stock_movements` con `order_id`; el trigger `apply_stock_movement()` ya existente descuenta/devuelve el stock y revierte toda la transacción si falta stock. `order-form.tsx` cambia su selector de producto de `product_codes` a `products`, capturando `productId` y mostrando el stock disponible.

**Tech Stack:** Next.js 16 / TypeScript, Supabase (Postgres + PL/pgSQL, `supabase-js`), Vitest + Testing Library.

## Global Constraints

- Todo texto de usuario persistido se normaliza a MAYÚSCULA vía `src/lib/normalize.ts` (ver `CLAUDE.md`) — no romper ese flujo al tocar `normalizeOrderItem`.
- No usar `SUPABASE_SERVICE_ROLE_KEY` en código cliente.
- `product_id` en `order_items` y `order_id` en `stock_movements` son **nullable** — no backfill retroactivo de pedidos históricos/importados (riesgo aceptado, mismo criterio que otras normalizaciones del proyecto).
- Vincular producto es **obligatorio solo para pedidos nuevos creados desde `order-form.tsx`** — se exige en la UI, no como `not null` en la base (para no romper el importador de Excel).
- `order-edit-form.tsx` **no** permite agregar líneas nuevas a un pedido existente (solo editar cantidad/precio o eliminar) — este plan no cambia eso.
- Correr `npm run lint && npm run typecheck && npm test && npm run build` (todas, no un subconjunto) antes de dar cualquier tarea de código por terminada — regla de `CLAUDE.md`.
- La migración SQL **no se puede probar desde vitest** (mock de JS, no Postgres real) — cada tarea que toca la migración termina con una nota explícita de qué validar a mano con Edwing en el SQL Editor de Supabase.
- Spec de referencia completo: `docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md`.

---

### Task 1: Migración — columnas de vínculo + extender `save_order`/`update_order`

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607270003_add_order_inventory_link.sql`

**Interfaces:**
- Consumes: tablas/funciones existentes `public.products`, `public.orders`, `public.order_items`, `public.stock_movements`, `public.apply_stock_movement()` (trigger ya existente, sin cambios), `public.save_order(jsonb, jsonb, jsonb)` y `public.update_order(uuid, jsonb)` definidas en `202607270002_add_order_transaction_rpcs.sql`.
- Produces: `order_items.product_id` (uuid, nullable), `stock_movements.order_id` (uuid, nullable). `save_order` acepta ahora que cada elemento de `p_items` incluya la clave `"productId"` (string uuid o ausente/null). `update_order` no cambia su firma (`p_order_id uuid, p_patch jsonb`), pero ahora genera movimientos de stock como efecto secundario dentro de la misma transacción.

- [ ] **Step 1: Escribir el archivo de migración completo**

```sql
alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

alter table public.stock_movements
  add column if not exists order_id uuid references public.orders(id) on delete set null;

create index if not exists order_items_product_id_idx on public.order_items (product_id);
create index if not exists stock_movements_order_id_idx on public.stock_movements (order_id);

-- save_order: ahora tambien registra la salida de stock por cada linea
-- con product_id, en la misma transaccion (revierte todo si falta stock).
create or replace function public.save_order(
  p_customer jsonb,
  p_order jsonb,
  p_items jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_phone text := p_customer->>'phone';
  v_order public.orders;
begin
  if v_phone is not null and v_phone <> '' then
    select id into v_customer_id from public.customers where phone = v_phone;
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email, department, city, locality, address, neighborhood)
    values (
      p_customer->>'fullName', coalesce(v_phone, ''), coalesce(p_customer->>'email', ''),
      coalesce(p_customer->>'department', ''), coalesce(p_customer->>'city', ''),
      coalesce(p_customer->>'locality', ''), coalesce(p_customer->>'address', ''),
      coalesce(p_customer->>'neighborhood', '')
    )
    returning id into v_customer_id;
  else
    update public.customers set
      full_name = p_customer->>'fullName',
      email = coalesce(p_customer->>'email', ''),
      department = coalesce(p_customer->>'department', ''),
      city = coalesce(p_customer->>'city', ''),
      locality = coalesce(p_customer->>'locality', ''),
      address = coalesce(p_customer->>'address', ''),
      neighborhood = coalesce(p_customer->>'neighborhood', ''),
      updated_at = now()
    where id = v_customer_id;
  end if;

  insert into public.orders (customer_id, customer_snapshot, order_date, status, notes, discount, shipping_cost, subtotal, total)
  values (
    v_customer_id, p_customer, (p_order->>'orderDate')::date, p_order->>'status', coalesce(p_order->>'notes', ''),
    (p_order->>'discount')::numeric, (p_order->>'shippingCost')::numeric,
    (p_order->>'subtotal')::numeric, (p_order->>'total')::numeric
  )
  returning * into v_order;

  insert into public.order_items (order_id, product_id, product_code, product_name, category, quantity, unit_price, total)
  select
    v_order.id, (item->>'productId')::uuid, item->>'productCode', item->>'productName', coalesce(item->>'category', ''),
    (item->>'quantity')::numeric, (item->>'unitPrice')::numeric,
    (item->>'quantity')::numeric * (item->>'unitPrice')::numeric
  from jsonb_array_elements(p_items) as item;

  insert into public.stock_movements (product_id, type, quantity, order_id, reason)
  select
    (item->>'productId')::uuid, 'salida', (item->>'quantity')::numeric, v_order.id,
    'Pedido ' || v_order.id
  from jsonb_array_elements(p_items) as item
  where (item->>'productId') is not null;

  return v_order;
end;
$$;

revoke all on function public.save_order(jsonb, jsonb, jsonb) from public;
grant execute on function public.save_order(jsonb, jsonb, jsonb) to authenticated;

-- update_order: ahora tambien genera movimientos compensatorios de stock
-- (devolucion completa al cancelar, delta al cambiar cantidades, devolucion
-- completa al eliminar una linea), en la misma transaccion.
create or replace function public.update_order(
  p_order_id uuid,
  p_patch jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.orders;
  v_items_patch jsonb := p_patch->'items';
  v_kept_ids uuid[];
  v_discount numeric;
  v_shipping_cost numeric;
  v_subtotal numeric := 0;
  v_total numeric;
  v_notes text;
  v_reason text := p_patch->>'adjustmentReason';
  v_item jsonb;
  v_new_status text := p_patch->>'status';
  v_cancelling boolean;
  v_old_item record;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  v_cancelling := v_new_status = 'cancelled' and v_current.status <> 'cancelled';

  if v_cancelling then
    for v_old_item in
      select product_id, quantity from public.order_items
      where order_id = p_order_id and product_id is not null
    loop
      insert into public.stock_movements (product_id, type, quantity, order_id, reason)
      values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Cancelacion pedido ' || p_order_id);
    end loop;
  end if;

  v_discount := coalesce((p_patch->>'discount')::numeric, v_current.discount);
  v_shipping_cost := coalesce((p_patch->>'shippingCost')::numeric, v_current.shipping_cost);

  if v_items_patch is not null then
    select array_agg((item->>'id')::uuid) into v_kept_ids
    from jsonb_array_elements(v_items_patch) as item;

    if not v_cancelling then
      for v_old_item in
        select product_id, quantity from public.order_items
        where order_id = p_order_id
          and product_id is not null
          and (v_kept_ids is null or not (id = any(v_kept_ids)))
      loop
        insert into public.stock_movements (product_id, type, quantity, order_id, reason)
        values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Linea eliminada, pedido ' || p_order_id);
      end loop;
    end if;

    delete from public.order_items
    where order_id = p_order_id
      and (v_kept_ids is null or not (id = any(v_kept_ids)));

    for v_item in select * from jsonb_array_elements(v_items_patch) loop
      if not v_cancelling then
        select product_id, quantity into v_old_item
        from public.order_items where id = (v_item->>'id')::uuid and order_id = p_order_id;

        if v_old_item.product_id is not null and v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (
            v_old_item.product_id,
            case when (v_item->>'quantity')::numeric < v_old_item.quantity then 'entrada' else 'salida' end,
            abs((v_item->>'quantity')::numeric - v_old_item.quantity),
            p_order_id,
            'Ajuste de cantidad, pedido ' || p_order_id
          );
        end if;
      end if;

      update public.order_items set
        product_code = v_item->>'productCode',
        product_name = v_item->>'productName',
        category = coalesce(v_item->>'category', ''),
        quantity = (v_item->>'quantity')::numeric,
        unit_price = (v_item->>'unitPrice')::numeric,
        total = (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric
      where id = (v_item->>'id')::uuid and order_id = p_order_id;
      v_subtotal := v_subtotal + (v_item->>'quantity')::numeric * (v_item->>'unitPrice')::numeric;
    end loop;
  else
    select coalesce(sum(quantity * unit_price), 0) into v_subtotal
    from public.order_items where order_id = p_order_id;
  end if;

  v_total := greatest(0, v_subtotal - v_discount + v_shipping_cost);

  v_notes := coalesce(p_patch->>'notes', v_current.notes);
  if v_reason is not null and length(trim(v_reason)) > 0 then
    v_notes := case
      when length(trim(v_notes)) > 0 then v_notes || E'\n' || 'AJUSTE: ' || trim(v_reason)
      else 'AJUSTE: ' || trim(v_reason)
    end;
  end if;

  update public.orders set
    customer_snapshot = coalesce(p_patch->'customer', customer_snapshot),
    order_date = coalesce((p_patch->>'orderDate')::date, order_date),
    status = coalesce(v_new_status, status),
    notes = v_notes,
    discount = v_discount,
    shipping_cost = v_shipping_cost,
    subtotal = v_subtotal,
    total = v_total,
    updated_at = now()
  where id = p_order_id
  returning * into v_current;

  return v_current;
end;
$$;

revoke all on function public.update_order(uuid, jsonb) from public;
grant execute on function public.update_order(uuid, jsonb) to authenticated;
```

- [ ] **Step 2: Verificar sintaxis con typecheck/build (no ejecuta la migración, solo confirma que no rompe nada en el repo)**

Run: `cd apps/rotulos && npm run typecheck && npm run build`
Expected: ambos comandos terminan sin error (el archivo `.sql` no lo importa ningún módulo TS, así que esto solo confirma que el resto del repo sigue intacto).

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607270003_add_order_inventory_link.sql
git commit -m "feat(rotulos): agregar vinculo order_items-products y movimientos de stock por pedido en save_order/update_order"
```

**Nota para la validación manual (no se puede hacer desde este plan):** esta migración necesita que Edwing la corra en el SQL Editor de Supabase antes de que las Tasks 2-4 tengan efecto real en producción. El plan completo termina con un script de prueba manual (Task 5) para correr junto a Edwing después de que la migración esté aplicada y el resto del código desplegado.

---

### Task 2: `productId` en `OrderItemDraft`/`OrderItem` + mapeo `order_items.product_id`

**Files:**
- Modify: `apps/rotulos/src/lib/business-types.ts`
- Modify: `apps/rotulos/src/lib/business-store.ts`
- Test: `apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts`

**Interfaces:**
- Consumes: `OrderItemRow` (tipo existente en `business-store.ts`), columna `product_id` agregada en Task 1.
- Produces: `OrderItemDraft.productId?: string | null`, `OrderItem.productId` (heredado de `OrderItemDraft`), `rowToOrderItem(row: OrderItemRow): OrderItem` incluye `productId: row.product_id`.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts` (después del último `it(...)` del `describe`, antes del `});` de cierre):

```ts
  it("mapea product_id de order_items a productId en el modelo de la app", async () => {
    const supabase = mockSupabase();
    const rowWithItem = {
      ...ORDER_ROW,
      order_items: [
        { id: "item-1", product_id: "prod-9", product_code: "SKU1", product_name: "Bolso", category: "Bolsos", quantity: 2, unit_price: 50, total: 100 },
      ],
    };
    supabase.single.mockResolvedValueOnce({ data: rowWithItem, error: null });
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    const order = await getBusinessStore().saveOrder(createBlankOrderDraft());

    expect(order.items[0].productId).toBe("prod-9");
  });
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/business-store-supabase-rpc.test.ts -t "mapea product_id"`
Expected: FAIL — `order.items[0].productId` es `undefined`, no `"prod-9"` (el campo no existe todavía en el tipo ni en el mapeo).

- [ ] **Step 3: Agregar `productId` al tipo `OrderItemDraft`**

En `apps/rotulos/src/lib/business-types.ts`, reemplazar:

```ts
export type OrderItemDraft = {
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
};
```

por:

```ts
export type OrderItemDraft = {
  productId?: string | null;
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
};
```

- [ ] **Step 4: Agregar `product_id` a `OrderItemRow` y mapearlo en `rowToOrderItem`**

En `apps/rotulos/src/lib/business-store.ts`, reemplazar el tipo `OrderItemRow`:

```ts
type OrderItemRow = {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  quantity: number | string;
  unit_price: number | string;
  total: number | string;
};
```

por:

```ts
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
```

Y reemplazar `rowToOrderItem`:

```ts
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
```

por:

```ts
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
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/business-store-supabase-rpc.test.ts`
Expected: PASS (los 5 tests del archivo, incluyendo el nuevo).

- [ ] **Step 6: Typecheck completo**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores (confirma que ningún otro archivo desestructura `OrderItemDraft`/`OrderItem` de forma que rompa con el campo nuevo opcional).

- [ ] **Step 7: Commit**

```bash
git add apps/rotulos/src/lib/business-types.ts apps/rotulos/src/lib/business-store.ts apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts
git commit -m "feat(rotulos): agregar productId a OrderItem y mapear order_items.product_id"
```

---

### Task 3: Confirmar que `productId` viaja en el payload del RPC `save_order`

**Files:**
- Test: `apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts`

**Interfaces:**
- Consumes: `getBusinessStore().saveOrder(draft: OrderDraft)` (sin cambios de firma), `OrderItemDraft.productId` (de Task 2).
- Produces: ninguna interfaz nueva — esta tarea es una red de seguridad: si `normalizeOrderItem` (en `normalize.ts`) alguna vez deja de hacer spread de todos los campos del item, este test lo detecta.

- [ ] **Step 1: Escribir el test que falla**

Agregar al `describe("createSupabaseBusinessStore (rama Supabase)", ...)` en `apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts`:

```ts
  it("incluye productId en el payload p_items enviado al RPC save_order", async () => {
    const supabase = mockSupabase();
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore, createBlankOrderDraft } = await import("@/lib/business-store");

    const draft = createBlankOrderDraft();
    draft.customer.fullName = "Ana Perez";
    draft.items = [{ productId: "prod-1", productCode: "SKU1", productName: "Bolso", category: "Bolsos", quantity: 2, unitPrice: 50 }];

    await getBusinessStore().saveOrder(draft);

    expect(supabase.rpc).toHaveBeenCalledWith("save_order", expect.objectContaining({
      p_items: [expect.objectContaining({ productId: "prod-1", quantity: 2 })],
    }));
  });
```

- [ ] **Step 2: Correr el test**

Run: `cd apps/rotulos && npx vitest run src/__tests__/business-store-supabase-rpc.test.ts -t "incluye productId en el payload"`
Expected: PASS ya de entrada (Task 2 ya deja `productId` fluyendo por `normalizeOrderItem`, que hace `{ ...item, productCode: ..., productName: ..., category: ... }` — el spread inicial preserva `productId`). Si falla, revisar `normalizeOrderItem` en `apps/rotulos/src/lib/normalize.ts` — algo está reconstruyendo el objeto sin spread completo.

- [ ] **Step 3: Correr toda la suite para confirmar que nada se rompió**

Run: `cd apps/rotulos && npm test`
Expected: todos los test files en verde.

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/__tests__/business-store-supabase-rpc.test.ts
git commit -m "test(rotulos): confirmar que productId viaja intacto hasta el payload del RPC save_order"
```

---

### Task 4: `order-form.tsx` — elegir producto desde inventario, capturar `productId`, mostrar stock disponible

**Files:**
- Modify: `apps/rotulos/src/components/order-form.tsx`
- Test: Create `apps/rotulos/src/__tests__/order-form-inventory.test.tsx`

**Interfaces:**
- Consumes: `getInventoryStore().listProducts(): Promise<Product[]>` (ya existe en `apps/rotulos/src/lib/inventory-store.ts`), `Product` de `apps/rotulos/src/lib/inventory-types.ts` (`{ id, name, category, sku, unitPrice, currentStock, ... }`), `OrderItemDraft.productId` (de Task 2).
- Produces: ninguna interfaz nueva consumida por otros archivos — este es el punto final de la cadena (UI).

- [ ] **Step 1: Escribir el test que falla — bloquea guardar sin producto de inventario**

Crear `apps/rotulos/src/__tests__/order-form-inventory.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBusinessStore } from "@/lib/business-store";
import { getInventoryStore } from "@/lib/inventory-store";
import { OrderForm } from "@/components/order-form";
import { ToastProvider } from "@/components/ui/toast";

function renderWithToast(children: ReactNode) {
  return render(<ToastProvider>{children}</ToastProvider>);
}

async function seedProduct() {
  const product = await getInventoryStore().saveProduct({
    name: "Bolso Grande",
    category: "Bolsos",
    sku: "BOL-001",
    unitPrice: 40000,
    minStock: 0,
    maxStock: null,
  });
  await getInventoryStore().recordMovement({
    productId: product.id,
    type: "entrada",
    quantity: 10,
    reason: "Seed inicial",
    supplier: "",
  });
  return product;
}

describe("OrderForm con inventario real", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("bloquea guardar si el producto escrito no existe en inventario", async () => {
    await seedProduct();
    const user = userEvent.setup();
    renderWithToast(<OrderForm />);

    await user.type(screen.getByPlaceholderText("Busca o escribe un cliente nuevo"), "Cliente Nuevo");
    await user.type(screen.getByLabelText("Producto"), "Producto Inexistente");
    fireEvent.click(screen.getByRole("button", { name: "Guardar pedido" }));

    expect(await screen.findByText("Selecciona cada producto desde el listado de inventario.")).toBeInTheDocument();
    expect(await getBusinessStore().listOrders()).toHaveLength(0);
  });

  it("captura el productId y muestra el stock disponible al elegir un producto real", async () => {
    const product = await seedProduct();
    const user = userEvent.setup();
    renderWithToast(<OrderForm />);

    await user.type(screen.getByPlaceholderText("Busca o escribe un cliente nuevo"), "Cliente Nuevo");
    await user.type(screen.getByLabelText("Producto"), "Bolso Grande");

    expect(await screen.findByText("Stock disponible: 10")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Guardar pedido" }));

    await waitFor(() => expect(screen.queryByText("Selecciona cada producto desde el listado de inventario.")).not.toBeInTheDocument());
    const orders = await getBusinessStore().listOrders();
    expect(orders[0].items[0].productId).toBe(product.id);
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `cd apps/rotulos && npx vitest run src/__tests__/order-form-inventory.test.tsx`
Expected: FAIL — hoy `order-form.tsx` no tiene un campo `aria-label`/label "Producto" enlazado como para que `getByLabelText("Producto")` funcione con el datalist de productos (el datalist está en "Codigo"), no valida `productId`, y no muestra ningún hint de stock.

- [ ] **Step 3: Reescribir los imports y el estado de productos**

En `apps/rotulos/src/components/order-form.tsx`, reemplazar:

```tsx
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";
import type { Customer, OrderDraft, ProductCode } from "@/lib/business-types";
```

por:

```tsx
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";
import { getInventoryStore } from "@/lib/inventory-store";
import type { Customer, OrderDraft } from "@/lib/business-types";
import type { Product } from "@/lib/inventory-types";
```

Reemplazar:

```tsx
  const [productCodes, setProductCodes] = useState<ProductCode[]>([]);
```

por:

```tsx
  const [products, setProducts] = useState<Product[]>([]);
```

Reemplazar:

```tsx
    getBusinessStore().listProductCodes().then(setProductCodes).catch(() => setProductCodes([]));
```

por:

```tsx
    getInventoryStore().listProducts().then(setProducts).catch(() => setProducts([]));
```

- [ ] **Step 4: Reemplazar `handleProductCodeChange` por `handleProductNameChange`**

Reemplazar:

```tsx
  function handleProductCodeChange(index: number, code: string) {
    setItem(index, "productCode", code.toUpperCase());
    const match = productCodes.find((entry) => entry.code.toUpperCase() === code.toUpperCase());
    if (match) {
      setDraft((current) => ({
        ...current,
        items: current.items.map((item, itemIndex) =>
          itemIndex === index
            ? { ...item, productName: match.productName, category: match.category, unitPrice: match.unitPrice }
            : item,
        ),
      }));
    }
  }
```

por:

```tsx
  function handleProductNameChange(index: number, name: string) {
    setItem(index, "productName", name);
    const match = products.find((product) => product.name.trim().toUpperCase() === name.trim().toUpperCase());
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId: match?.id ?? null,
              productCode: match?.sku ?? item.productCode,
              category: match?.category ?? item.category,
              unitPrice: match?.unitPrice ?? item.unitPrice,
            }
          : item,
      ),
    }));
  }
```

- [ ] **Step 5: Inicializar `productId` en líneas nuevas**

Reemplazar:

```tsx
      items: [...current.items, { productCode: "", productName: "", category: "", quantity: 1, unitPrice: 0 }],
```

por:

```tsx
      items: [...current.items, { productId: null, productCode: "", productName: "", category: "", quantity: 1, unitPrice: 0 }],
```

- [ ] **Step 6: Agregar la validación de producto obligatorio**

Reemplazar:

```tsx
    if (!draft.customer.fullName.trim()) nextErrors.customer = "El nombre del cliente es obligatorio.";
    if (!draft.items.some((item) => item.productName.trim())) nextErrors.items = "Agrega al menos un producto.";
```

por:

```tsx
    if (!draft.customer.fullName.trim()) nextErrors.customer = "El nombre del cliente es obligatorio.";
    const itemsWithName = draft.items.filter((item) => item.productName.trim());
    if (itemsWithName.length === 0) {
      nextErrors.items = "Agrega al menos un producto.";
    } else if (itemsWithName.some((item) => !item.productId)) {
      nextErrors.items = "Selecciona cada producto desde el listado de inventario.";
    }
```

- [ ] **Step 7: Cambiar el datalist y los campos de la línea de producto**

Reemplazar:

```tsx
          <datalist id={productListId}>
            {productCodes.map((entry) => (
              <option key={entry.id} value={entry.code} />
            ))}
          </datalist>
```

por:

```tsx
          <datalist id={productListId}>
            {products.map((product) => (
              <option key={product.id} value={product.name} />
            ))}
          </datalist>
```

Reemplazar el bloque de la fila de producto:

```tsx
                <FormField label="Codigo" className="sm:col-span-1">
                  <Input
                    list={productListId}
                    value={item.productCode}
                    onChange={(event) => handleProductCodeChange(index, event.target.value)}
                  />
                </FormField>
                <FormField label="Producto" className="col-span-2 sm:col-span-2">
                  <Input value={item.productName} onChange={(event) => setItem(index, "productName", event.target.value)} />
                </FormField>
                <FormField label="Cantidad" className="sm:col-span-1">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => setItem(index, "quantity", Number(event.target.value))}
                  />
                </FormField>
```

por:

```tsx
                <FormField label="Codigo" className="sm:col-span-1">
                  <Input value={item.productCode} disabled />
                </FormField>
                <FormField label="Producto" className="col-span-2 sm:col-span-2">
                  <Input
                    list={productListId}
                    value={item.productName}
                    onChange={(event) => handleProductNameChange(index, event.target.value)}
                  />
                </FormField>
                <FormField
                  label="Cantidad"
                  className="sm:col-span-1"
                  hint={item.productId ? `Stock disponible: ${products.find((product) => product.id === item.productId)?.currentStock ?? 0}` : undefined}
                >
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(event) => setItem(index, "quantity", Number(event.target.value))}
                  />
                </FormField>
```

- [ ] **Step 8: Correr los tests nuevos y confirmar que pasan**

Run: `cd apps/rotulos && npx vitest run src/__tests__/order-form-inventory.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 9: Correr toda la suite, lint, typecheck y build**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm test && npm run build`
Expected: los 4 comandos terminan sin error. Prestar atención especial a `src/__tests__/business-tables.test.tsx` (usa `OrderForm` en varios tests) — ninguno de esos tests llena los campos de producto a través de la UI (todos crean pedidos con `store.saveOrder()` directo), así que no deberían verse afectados, pero confirmar igual.

- [ ] **Step 10: Commit**

```bash
git add apps/rotulos/src/components/order-form.tsx apps/rotulos/src/__tests__/order-form-inventory.test.tsx
git commit -m "feat(rotulos): elegir producto desde inventario real en Nuevo pedido, con stock disponible"
```

---

### Task 5: Documentación + script de prueba manual + push

**Files:**
- Modify: `NEXT_STEPS.md`
- Modify: `docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md`

**Interfaces:** Ninguna — solo documentación.

- [ ] **Step 1: Marcar el diseño como implementado (pendiente de validación manual) en el spec**

En `docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md`, cambiar la primera línea:

```
Estado: **aprobado, sin implementar**. Brainstorming del 2026-07-27, ítem
```

por:

```
Estado: **código implementado 2026-07-27, pendiente de validación manual
con Edwing** (correr la migración + probar los 4 escenarios de abajo).
Brainstorming del 2026-07-27, ítem
```

- [ ] **Step 2: Actualizar `NEXT_STEPS.md` con el script de prueba manual**

Buscar la sección "Importantes después de agosto" y agregar, después del ítem de RPC transaccional (o como ítem nuevo si ya no está en ese formato), el siguiente bloque:

```markdown
- **Inventario real vinculado a pedidos — código listo 2026-07-27,
  pendiente de validación manual.** Diseño completo en
  `docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md`.
  `order_items.product_id` y `stock_movements.order_id` (migración
  `202607270003_add_order_inventory_link.sql`), `save_order`/`update_order`
  extendidos para generar movimientos automáticos, `order-form.tsx` ahora
  elige el producto desde `Inventario` (obligatorio) en vez de
  `product_codes`. **Antes de operar con esto:**
  1. Edwing corre la migración en el SQL Editor de Supabase.
  2. Crear un producto de prueba en Inventario con stock exacto (ej. 5
     unidades) y armar un pedido nuevo con esa cantidad exacta — debe
     guardar y el stock debe quedar en 0.
  3. Intentar un pedido con cantidad mayor al stock disponible — debe
     fallar y **no** crear el pedido ni tocar el stock.
  4. Cancelar un pedido con producto vinculado — el stock debe volver a
     su valor original.
  5. Editar un pedido y bajar la cantidad de una línea — debe aparecer un
     movimiento de entrada por la diferencia en el historial de
     Inventario del producto.
```

- [ ] **Step 3: Commit y push**

```bash
git add NEXT_STEPS.md docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md
git commit -m "docs: marcar inventario real vinculado a pedidos como implementado, pendiente de validacion manual"
git push
```
