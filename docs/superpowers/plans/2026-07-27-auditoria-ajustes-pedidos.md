# Auditoría/historial de ajustes de pedidos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar en una tabla dedicada (`order_edits`) cada guardado de edición de un pedido que cambie precio/descuento/envío/total, estado, notas, cliente o precio/cantidad de ítems, y mostrar ese historial en el detalle del pedido.

**Architecture:** `update_order()` (función `security definer` ya existente) se extiende para construir un jsonb con solo los campos que cambiaron y, si no está vacío, insertarlo en `order_edits` dentro de la misma transacción. `business-store.ts` gana `listOrderEdits()`; `order-detail-drawer.tsx` la consume y muestra un timeline.

**Tech Stack:** Next.js 16 / TypeScript, Supabase (Postgres + PL/pgSQL, `supabase-js`), Vitest + Testing Library.

## Global Constraints

- `order_edits.changed_by` es **text** (email, vía `auth.jwt() ->> 'email'`), no uuid — evita tener que resolver un uuid a email del lado del cliente para mostrar "quién" (no hay ningún lugar hoy en la app que resuelva `auth.uid()` a un email visible; ver `CLAUDE.md` sobre RLS y `allowed_users`).
- `orders.notes` con el texto libre `AJUSTE: ...` sigue funcionando exactamente igual que hoy — este plan no lo toca, coexiste con `order_edits`.
- `mergeCustomers` queda fuera de alcance — no genera filas en `order_edits`.
- La migración SQL **no se puede probar desde vitest** (mock de JS, no Postgres real) — cada tarea que la toca termina con una nota de qué validar a mano con Edwing.
- Correr `npm run lint && npm run typecheck && npm test && npm run build` (las 4) antes de dar cualquier tarea de código por terminada.
- Spec de referencia completo: `docs/superpowers/specs/2026-07-27-auditoria-ajustes-pedidos-design.md`.

---

### Task 1: Migración — tabla `order_edits` + extender `update_order()`

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607270004_add_order_edits.sql`

**Interfaces:**
- Consumes: `public.orders`, `public.order_items`, `public.stock_movements`, `public.update_order(uuid, jsonb)` (definida en `202607270003_add_order_inventory_link.sql`, este task la reemplaza con `create or replace`).
- Produces: tabla `public.order_edits` (`id`, `order_id`, `changed_by`, `changed_at`, `changes` jsonb, `reason`). `update_order` mantiene su firma exacta (`p_order_id uuid, p_patch jsonb`) — el diff y el insert son efectos secundarios internos, invisibles para quien la llama.

- [ ] **Step 1: Escribir el archivo de migración completo**

```sql
create table public.order_edits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by text not null default (auth.jwt() ->> 'email'),
  changed_at timestamptz not null default now(),
  changes jsonb not null,
  reason text
);

create index if not exists order_edits_order_id_idx on public.order_edits (order_id);

alter table public.order_edits enable row level security;
grant select on public.order_edits to authenticated;

create policy "Authenticated users can read order edits."
  on public.order_edits for select to authenticated
  using (true);

-- update_order: ahora tambien registra en order_edits un resumen jsonb de
-- que cambio en este guardado (precio/descuento/envio/total, estado,
-- notas, cliente, items con precio/cantidad cambiada o eliminados), en la
-- misma transaccion. Solo inserta si algo realmente cambio.
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
  v_changes jsonb := '{}'::jsonb;
  v_items_changes jsonb := '[]'::jsonb;
  v_item_change jsonb;
begin
  select * into v_current from public.orders where id = p_order_id;
  if v_current is null then
    raise exception 'order_not_found';
  end if;

  v_cancelling := coalesce(v_new_status = 'cancelled' and v_current.status <> 'cancelled', false);

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
    select array_remove(array_agg((item->>'id')::uuid), null) into v_kept_ids
    from jsonb_array_elements(v_items_patch) as item;

    if not v_cancelling then
      for v_old_item in
        select id, product_id, quantity, unit_price, product_name from public.order_items
        where order_id = p_order_id
          and (v_kept_ids is null or not (id = any(v_kept_ids)))
      loop
        v_items_changes := v_items_changes || jsonb_build_array(jsonb_build_object(
          'id', v_old_item.id,
          'productName', v_old_item.product_name,
          'removed', true
        ));
        if v_old_item.product_id is not null then
          insert into public.stock_movements (product_id, type, quantity, order_id, reason)
          values (v_old_item.product_id, 'entrada', v_old_item.quantity, p_order_id, 'Linea eliminada, pedido ' || p_order_id);
        end if;
      end loop;
    end if;

    delete from public.order_items
    where order_id = p_order_id
      and (v_kept_ids is null or not (id = any(v_kept_ids)));

    for v_item in select * from jsonb_array_elements(v_items_patch) loop
      v_old_item := null;
      select id, product_id, quantity, unit_price, product_name into v_old_item
      from public.order_items where id = (v_item->>'id')::uuid and order_id = p_order_id;

      if not v_cancelling and v_old_item.product_id is not null and v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
        insert into public.stock_movements (product_id, type, quantity, order_id, reason)
        values (
          v_old_item.product_id,
          case when (v_item->>'quantity')::numeric < v_old_item.quantity then 'entrada' else 'salida' end,
          abs((v_item->>'quantity')::numeric - v_old_item.quantity),
          p_order_id,
          'Ajuste de cantidad, pedido ' || p_order_id
        );
      end if;

      v_item_change := '{}'::jsonb;
      if v_old_item.id is not null and v_old_item.quantity is distinct from (v_item->>'quantity')::numeric then
        v_item_change := v_item_change || jsonb_build_object('quantity', jsonb_build_object('before', v_old_item.quantity, 'after', (v_item->>'quantity')::numeric));
      end if;
      if v_old_item.id is not null and v_old_item.unit_price is distinct from (v_item->>'unitPrice')::numeric then
        v_item_change := v_item_change || jsonb_build_object('unitPrice', jsonb_build_object('before', v_old_item.unit_price, 'after', (v_item->>'unitPrice')::numeric));
      end if;
      if v_item_change <> '{}'::jsonb then
        v_items_changes := v_items_changes || jsonb_build_array(
          jsonb_build_object('id', v_item->>'id', 'productName', v_item->>'productName') || v_item_change
        );
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

  if p_patch->'customer' is not null and v_current.customer_snapshot is distinct from p_patch->'customer' then
    v_changes := v_changes || jsonb_build_object('customer', jsonb_build_object('before', v_current.customer_snapshot, 'after', p_patch->'customer'));
  end if;
  if p_patch->>'orderDate' is not null and v_current.order_date is distinct from (p_patch->>'orderDate')::date then
    v_changes := v_changes || jsonb_build_object('orderDate', jsonb_build_object('before', v_current.order_date, 'after', (p_patch->>'orderDate')::date));
  end if;
  if v_new_status is not null and v_current.status is distinct from v_new_status then
    v_changes := v_changes || jsonb_build_object('status', jsonb_build_object('before', v_current.status, 'after', v_new_status));
  end if;
  if v_current.notes is distinct from v_notes then
    v_changes := v_changes || jsonb_build_object('notes', jsonb_build_object('before', v_current.notes, 'after', v_notes));
  end if;
  if v_current.discount is distinct from v_discount then
    v_changes := v_changes || jsonb_build_object('discount', jsonb_build_object('before', v_current.discount, 'after', v_discount));
  end if;
  if v_current.shipping_cost is distinct from v_shipping_cost then
    v_changes := v_changes || jsonb_build_object('shippingCost', jsonb_build_object('before', v_current.shipping_cost, 'after', v_shipping_cost));
  end if;
  if v_current.subtotal is distinct from v_subtotal then
    v_changes := v_changes || jsonb_build_object('subtotal', jsonb_build_object('before', v_current.subtotal, 'after', v_subtotal));
  end if;
  if v_current.total is distinct from v_total then
    v_changes := v_changes || jsonb_build_object('total', jsonb_build_object('before', v_current.total, 'after', v_total));
  end if;
  if jsonb_array_length(v_items_changes) > 0 then
    v_changes := v_changes || jsonb_build_object('items', v_items_changes);
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

  if v_changes <> '{}'::jsonb then
    insert into public.order_edits (order_id, changes, reason)
    values (p_order_id, v_changes, v_reason);
  end if;

  return v_current;
end;
$$;

revoke all on function public.update_order(uuid, jsonb) from public;
grant execute on function public.update_order(uuid, jsonb) to authenticated;
```

- [ ] **Step 2: Verificar que el resto del repo sigue compilando**

Run: `cd apps/rotulos && npm run typecheck && npm run build`
Expected: ambos sin error (el `.sql` no lo importa ningun modulo TS).

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607270004_add_order_edits.sql
git commit -m "feat(rotulos): agregar order_edits y registrar diff de cambios en update_order"
```

**Nota para validacion manual:** esta migracion la corre Edwing en el SQL Editor de Supabase antes de que las Tasks 2-3 tengan efecto real en produccion. La Task 4 termina con el script de prueba manual completo.

---

### Task 2: `OrderEdit` en tipos + `listOrderEdits` en `business-store.ts`

**Files:**
- Modify: `apps/rotulos/src/lib/business-types.ts`
- Modify: `apps/rotulos/src/lib/business-store.ts`
- Test: Create `apps/rotulos/src/__tests__/business-store-order-edits.test.ts`

**Interfaces:**
- Consumes: tabla `order_edits` (Task 1).
- Produces: `OrderEdit` type (`{ id, orderId, changedBy, changedAt, changes: Record<string, unknown>, reason: string | null }`), `BusinessStore.listOrderEdits(orderId: string): Promise<OrderEdit[]>` — consumida por la Task 3.

- [ ] **Step 1: Escribir el test que falla**

Crear `apps/rotulos/src/__tests__/business-store-order-edits.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";

const EDIT_ROW = {
  id: "edit-1",
  order_id: "order-1",
  changed_by: "edwing@example.com",
  changed_at: "2026-07-27T00:00:00Z",
  changes: { discount: { before: 0, after: 5000 } },
  reason: "correccion de precio",
};

afterEach(() => {
  vi.doUnmock("@/lib/supabase/client");
  vi.resetModules();
});

describe("listOrderEdits (rama Supabase)", () => {
  it("consulta order_edits por order_id, ordenado por fecha descendente, y mapea a OrderEdit", async () => {
    const order = vi.fn(async () => ({ data: [EDIT_ROW], error: null }));
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const supabase = { from };
    vi.doMock("@/lib/supabase/client", () => ({ createClient: vi.fn(() => supabase) }));
    const { getBusinessStore } = await import("@/lib/business-store");

    const edits = await getBusinessStore().listOrderEdits("order-1");

    expect(from).toHaveBeenCalledWith("order_edits");
    expect(eq).toHaveBeenCalledWith("order_id", "order-1");
    expect(order).toHaveBeenCalledWith("changed_at", { ascending: false });
    expect(edits).toEqual([
      {
        id: "edit-1",
        orderId: "order-1",
        changedBy: "edwing@example.com",
        changedAt: "2026-07-27T00:00:00Z",
        changes: { discount: { before: 0, after: 5000 } },
        reason: "correccion de precio",
      },
    ]);
  });
});

describe("listOrderEdits (rama LocalStore)", () => {
  it("devuelve siempre un array vacio (no hay historial en el fallback local)", async () => {
    const { getBusinessStore } = await import("@/lib/business-store");
    expect(await getBusinessStore().listOrderEdits("cualquier-id")).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/business-store-order-edits.test.ts`
Expected: FAIL — `listOrderEdits` no existe todavia en `BusinessStore`.

- [ ] **Step 3: Agregar el tipo `OrderEdit`**

En `apps/rotulos/src/lib/business-types.ts`, agregar al final del archivo:

```ts
export type OrderEdit = {
  id: string;
  orderId: string;
  changedBy: string;
  changedAt: string;
  changes: Record<string, unknown>;
  reason: string | null;
};
```

- [ ] **Step 4: Agregar `listOrderEdits` a la interfaz `BusinessStore` y a los tipos de fila**

En `apps/rotulos/src/lib/business-store.ts`:

Reemplazar el import de tipos:

```ts
import type { Customer, CustomerPatch, OrderDraft, OrderItem, OrderPatch, OrderRecord, ProductCode } from "@/lib/business-types";
```

por:

```ts
import type { Customer, CustomerPatch, OrderDraft, OrderEdit, OrderItem, OrderPatch, OrderRecord, ProductCode } from "@/lib/business-types";
```

Reemplazar la interfaz `BusinessStore`:

```ts
export type BusinessStore = {
  listOrders(): Promise<OrderRecord[]>;
  saveOrder(draft: OrderDraft): Promise<OrderRecord>;
  updateOrder(id: string, patch: OrderPatch): Promise<OrderRecord>;
  listCustomers(): Promise<Customer[]>;
  updateCustomer(id: string, patch: CustomerPatch): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  mergeCustomers(sourceId: string, targetId: string): Promise<{ updatedOrders: number }>;
  listProductCodes(): Promise<ProductCode[]>;
  saveProductCode(code: Omit<ProductCode, "id" | "createdAt" | "updatedAt">): Promise<ProductCode>;
};
```

por:

```ts
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
};
```

Agregar, después del tipo `ProductCodeRow`, un nuevo tipo de fila y su mapeo:

```ts
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
```

- [ ] **Step 5: Implementar `listOrderEdits` en ambas ramas**

En `createLocalBusinessStore()`, agregar (justo después de `updateOrder`):

```ts
    async listOrderEdits() {
      return [];
    },
```

En `createSupabaseBusinessStore()`, agregar (justo después de `updateOrder`):

```ts
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
```

- [ ] **Step 6: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/business-store-order-edits.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Typecheck completo**

Run: `cd apps/rotulos && npm run typecheck`
Expected: sin errores.

- [ ] **Step 8: Commit**

```bash
git add apps/rotulos/src/lib/business-types.ts apps/rotulos/src/lib/business-store.ts apps/rotulos/src/__tests__/business-store-order-edits.test.ts
git commit -m "feat(rotulos): agregar OrderEdit y listOrderEdits a business-store"
```

---

### Task 3: Sección "Historial de cambios" en `order-detail-drawer.tsx`

**Files:**
- Modify: `apps/rotulos/src/components/order-detail-drawer.tsx`
- Test: Create `apps/rotulos/src/__tests__/order-detail-drawer-history.test.tsx`

**Interfaces:**
- Consumes: `getBusinessStore().listOrderEdits(orderId: string): Promise<OrderEdit[]>` (Task 2), `formatCop(value: number): string` (ya existe en `@/lib/format`).
- Produces: ninguna interfaz nueva — punto final de la cadena (UI).

- [ ] **Step 1: Escribir el test que falla**

Crear `apps/rotulos/src/__tests__/order-detail-drawer-history.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as businessStoreModule from "@/lib/business-store";
import type { BusinessStore } from "@/lib/business-store";
import { OrderDetailDrawer } from "@/components/order-detail-drawer";
import type { OrderRecord } from "@/lib/business-types";

function baseOrder(): OrderRecord {
  return {
    id: "order-1",
    customerId: null,
    customer: {
      fullName: "ANA PEREZ",
      phone: "3001234567",
      email: "",
      department: "ANTIOQUIA",
      city: "MEDELLIN",
      locality: "",
      address: "CALLE 1",
      neighborhood: "",
    },
    orderDate: "2026-07-27",
    status: "pending",
    notes: "",
    discount: 0,
    shippingCost: 0,
    subtotal: 40000,
    total: 40000,
    items: [],
    createdAt: "2026-07-27T00:00:00Z",
    updatedAt: "2026-07-27T00:00:00Z",
  };
}

describe("OrderDetailDrawer - historial de cambios", () => {
  it("no muestra la seccion de historial cuando no hay ediciones registradas", async () => {
    render(<OrderDetailDrawer order={baseOrder()} />);

    await waitFor(() => expect(screen.queryByText("Historial de cambios")).not.toBeInTheDocument());
  });

  it("muestra cada campo cambiado con su valor antes y despues", async () => {
    vi.spyOn(businessStoreModule, "getBusinessStore").mockReturnValue({
      listOrderEdits: vi.fn().mockResolvedValue([
        {
          id: "edit-1",
          orderId: "order-1",
          changedBy: "edwing@example.com",
          changedAt: "2026-07-27T15:00:00Z",
          changes: { discount: { before: 0, after: 5000 } },
          reason: "correccion de precio",
        },
      ]),
    } as unknown as BusinessStore);

    render(<OrderDetailDrawer order={baseOrder()} />);

    expect(await screen.findByText("Historial de cambios")).toBeInTheDocument();
    expect(screen.getByText("edwing@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Descuento:/)).toBeInTheDocument();
    expect(screen.getByText(/\$0.*\$5\.000/)).toBeInTheDocument();
    expect(screen.getByText(/correccion de precio/i)).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `cd apps/rotulos && npx vitest run src/__tests__/order-detail-drawer-history.test.tsx`
Expected: FAIL — todavia no existe la seccion "Historial de cambios" ni la logica de fetch.

- [ ] **Step 3: Agregar el fetch de historial y el helper de formato**

En `apps/rotulos/src/components/order-detail-drawer.tsx`, reemplazar los imports:

```tsx
"use client";

import Link from "next/link";
import { formatCop } from "@/lib/format";
import type { OrderRecord } from "@/lib/business-types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
```

por:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCop } from "@/lib/format";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderEdit, OrderRecord } from "@/lib/business-types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
```

Después de la función `latestAdjustment`, agregar las constantes y helpers de formato:

```tsx
const FIELD_LABELS: Record<string, string> = {
  customer: "Cliente",
  orderDate: "Fecha",
  status: "Estado",
  notes: "Notas",
  discount: "Descuento",
  shippingCost: "Envio",
  subtotal: "Subtotal",
  total: "Total",
};

const CURRENCY_FIELDS = new Set(["discount", "shippingCost", "subtotal", "total"]);

function formatEditValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (CURRENCY_FIELDS.has(field)) return formatCop(Number(value));
  if (field === "customer" && typeof value === "object") {
    return String((value as { fullName?: string }).fullName ?? "-");
  }
  return String(value);
}

type ItemChange = {
  id: string;
  productName: string;
  removed?: boolean;
  quantity?: { before: number; after: number };
  unitPrice?: { before: number; after: number };
};

function formatItemChange(item: ItemChange): string {
  if (item.removed) return "linea eliminada";
  const parts: string[] = [];
  if (item.quantity) parts.push(`cantidad ${item.quantity.before} -> ${item.quantity.after}`);
  if (item.unitPrice) parts.push(`precio ${formatCop(item.unitPrice.before)} -> ${formatCop(item.unitPrice.after)}`);
  return parts.join(", ");
}

function OrderEditEntry({ edit }: { edit: OrderEdit }) {
  const fieldEntries = Object.entries(edit.changes).filter(([key]) => key !== "items");
  const itemChanges = (edit.changes.items as ItemChange[] | undefined) ?? [];
  return (
    <div className="border-b border-border py-3 text-sm last:border-0">
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>{new Date(edit.changedAt).toLocaleString("es-CO")}</span>
        <span>{edit.changedBy}</span>
      </div>
      <ul className="mt-1 space-y-1">
        {fieldEntries.map(([field, value]) => {
          const { before, after } = value as { before: unknown; after: unknown };
          return (
            <li key={field}>
              <span className="font-medium text-foreground">{FIELD_LABELS[field] ?? field}:</span>{" "}
              {formatEditValue(field, before)} -&gt; {formatEditValue(field, after)}
            </li>
          );
        })}
        {itemChanges.map((item) => (
          <li key={item.id}>
            <span className="font-medium text-foreground">{item.productName}:</span> {formatItemChange(item)}
          </li>
        ))}
      </ul>
      {edit.reason ? <p className="mt-1 text-xs text-foreground-muted">Motivo: {edit.reason}</p> : null}
    </div>
  );
}
```

- [ ] **Step 4: Agregar el estado y el `useEffect` de carga dentro de `OrderDetailDrawer`**

Reemplazar:

```tsx
export function OrderDetailDrawer({ order, onEdit }: OrderDetailDrawerProps) {
  const adjustment = latestAdjustment(order.notes);
  return (
```

por:

```tsx
export function OrderDetailDrawer({ order, onEdit }: OrderDetailDrawerProps) {
  const adjustment = latestAdjustment(order.notes);
  const [edits, setEdits] = useState<OrderEdit[]>([]);

  useEffect(() => {
    let active = true;
    getBusinessStore()
      .listOrderEdits(order.id)
      .then((result) => {
        if (active) setEdits(result);
      })
      .catch(() => {
        if (active) setEdits([]);
      });
    return () => {
      active = false;
    };
  }, [order.id]);

  return (
```

- [ ] **Step 5: Agregar la sección al final del JSX**

Reemplazar el cierre del componente:

```tsx
      </Card>
    </div>
  );
}
```

(el último `</Card>` es el de la sección "Productos") por:

```tsx
      </Card>

      {edits.length > 0 ? (
        <Card className="shadow-none">
          <CardTitle>Historial de cambios</CardTitle>
          <div className="mt-4">
            {edits.map((edit) => (
              <OrderEditEntry key={edit.id} edit={edit} />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Correr el test y confirmar que pasa**

Run: `cd apps/rotulos && npx vitest run src/__tests__/order-detail-drawer-history.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Correr toda la suite, lint, typecheck y build**

Run: `cd apps/rotulos && npm run lint && npm run typecheck && npm test && npm run build`
Expected: los 4 comandos terminan sin error. Prestar atencion a `src/__tests__/business-tables.test.tsx` (usa `OrderDetailDrawer` indirectamente via `OrdersTable`) — como la rama LocalStore de `listOrderEdits` siempre devuelve `[]`, esos tests no deberian mostrar la seccion nueva ni romperse, pero confirmarlo con la corrida.

- [ ] **Step 8: Commit**

```bash
git add apps/rotulos/src/components/order-detail-drawer.tsx apps/rotulos/src/__tests__/order-detail-drawer-history.test.tsx
git commit -m "feat(rotulos): mostrar historial de cambios en el detalle del pedido"
```

---

### Task 4: Documentación + script de prueba manual + push

**Files:**
- Modify: `NEXT_STEPS.md`
- Modify: `docs/superpowers/specs/2026-07-27-auditoria-ajustes-pedidos-design.md`

**Interfaces:** Ninguna — solo documentación.

- [ ] **Step 1: Marcar el diseño como implementado en el spec**

En `docs/superpowers/specs/2026-07-27-auditoria-ajustes-pedidos-design.md`, cambiar la primera línea:

```
Estado: **aprobado, sin implementar**. Brainstorming del 2026-07-27, ítem
```

por:

```
Estado: **código implementado 2026-07-27, pendiente de validación manual
con Edwing** (correr la migración + probar los escenarios de abajo).
Brainstorming del 2026-07-27, ítem
```

- [ ] **Step 2: Actualizar `NEXT_STEPS.md`**

Buscar el ítem "Auditoría/historial de ajustes de pedidos" en la sección "Importantes después de agosto" y reemplazarlo por:

```markdown
- ~~Auditoría/historial de ajustes de pedidos~~ código listo 2026-07-27:
  tabla `order_edits` (migración `202607270004_add_order_edits.sql`),
  llenada por `update_order()` con un jsonb de solo los campos que
  cambiaron en cada guardado (precio/descuento/envío/total, estado,
  notas, cliente, ítems). Se ve en una sección "Historial de cambios"
  en el detalle del pedido. `orders.notes` con el texto libre
  `AJUSTE: ...` sigue funcionando igual, coexiste. **Antes de operar
  con esto:**
  1. Edwing corre la migración en el SQL Editor de Supabase.
  2. Editar un pedido cambiando precio de una línea + descuento + estado
     en el mismo guardado — el historial debe mostrar exactamente esos
     3 cambios, con los valores antes/después correctos.
  3. Editar un pedido sin cambiar nada — no debe aparecer ninguna fila
     nueva en el historial.
  4. Eliminar una línea de un pedido durante una edición — debe aparecer
     como "línea eliminada" en el historial.
```

- [ ] **Step 3: Commit y push**

```bash
git add NEXT_STEPS.md docs/superpowers/specs/2026-07-27-auditoria-ajustes-pedidos-design.md
git commit -m "docs: marcar auditoria de ajustes de pedidos como implementada, pendiente de validacion manual"
git push
```
