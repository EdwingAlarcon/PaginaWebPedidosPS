# Diseño: auditoría/historial de ajustes de pedidos

Estado: **aprobado, sin implementar**. Brainstorming del 2026-07-27, ítem
"Importante después de agosto" de `NEXT_STEPS.md`. Alcance explícitamente
separado de la feature de inventario real recién implementada (esa cubre
`stock_movements.order_id` para cambios de **cantidad/stock**; este diseño
audita **todos los demás campos comerciales** de un pedido: precio unitario
por línea, descuento, envío, estado, notas, cliente).

## Problema

Hoy, cuando se edita un pedido (`order-edit-form.tsx` → `update_order()`),
el único rastro del ajuste es un texto libre `AJUSTE: <motivo>` concatenado
en `orders.notes`. No hay tabla ni vista dedicada para responder "¿qué
cambió, cuándo, quién, y cuál era el valor antes?" — Edwing confirma que
las correcciones de precio/descuento son frecuentes en el negocio, así que
esto no es un caso raro.

## Decisiones (confirmadas con Edwing)

- **Campos a auditar:** precio/descuento/envío/total, estado del pedido,
  datos del cliente en el snapshot del pedido, y notas/observaciones.
  Cantidad de ítems ya queda cubierta por `stock_movements.order_id`
  (feature de inventario); este diseño agrega precio unitario por ítem,
  que `stock_movements` no registra.
- **Granularidad: un registro por guardado**, no por campo individual. Un
  solo `insert` con un jsonb que lista únicamente los campos que
  realmente cambiaron ese guardado — no una fila por campo.
- **`orders.notes` y la tabla nueva coexisten.** El texto libre
  `AJUSTE: ...` en `notes` sigue funcionando igual que hoy (se ve rápido
  en el pedido, se imprime donde ya se imprime); la tabla nueva es el
  historial detallado con valores antes/después, en una sección aparte.
- **`mergeCustomers` queda fuera de alcance.** Es una operación masiva
  que puede tocar varios pedidos a la vez; auditar eso es una extensión
  futura si hace falta, no parte de este diseño.
- **UI: sección nueva dentro del drawer de detalle del pedido**, no una
  pantalla separada — timeline colapsable debajo de los datos actuales.

## Modelo de datos

```sql
create table public.order_edits (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by uuid not null default auth.uid(),
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
```

`changes` guarda **solo las claves que cambiaron** en ese guardado, forma:

```json
{
  "discount": { "before": 0, "after": 5000 },
  "status": { "before": "pending", "after": "completed" },
  "items": [
    { "id": "...", "productName": "BOLSO", "unitPrice": { "before": 40000, "after": 35000 } }
  ]
}
```

Claves posibles: `customer`, `orderDate`, `status`, `notes`, `discount`,
`shippingCost`, `subtotal`, `total`, `items` (array, solo ítems con precio
unitario o cantidad cambiada, o eliminados). No hay `insert` policy para
`authenticated` — la única vía de escritura es el RPC `security definer`
`update_order()`, que bypasea RLS igual que ya hace con `orders`/`order_items`/
`stock_movements`.

## Integración en `update_order()`

Antes de aplicar cualquier cambio, la función ya lee `v_current` (el pedido
tal como está en la base). Se agrega una variable `v_changes jsonb := '{}'::jsonb;`
y, para cada campo del patch, si el valor entrante difiere del actual, se
acumula en `v_changes` con `v_changes := v_changes || jsonb_build_object(...)`.
Para `notes`: se compara `v_current.notes` contra `v_notes` (el valor final,
ya con el `AJUSTE: ...` aplicado si corresponde) — el cambio real y visible
del campo, no un paso intermedio. Para ítems: se recolectan en un array
aparte los que cambiaron precio unitario o cantidad, o los eliminados
(reutilizando la misma comparación con `order_items` que ya hace la lógica
de `stock_movements` para cantidad, agregándole precio unitario).

Al final de la función, después de tener `v_current` refrescado (con
subtotal/total ya recalculados), si `v_changes` tiene al menos una clave:

```sql
if v_changes <> '{}'::jsonb then
  insert into public.order_edits (order_id, changes, reason)
  values (p_order_id, v_changes, v_reason);
end if;
```

Un solo `insert`, dentro de la misma transacción que ya actualiza
`orders`/`order_items`/`stock_movements` — si algo falla más adelante en la
función, esta fila tampoco se confirma, sin lógica de rollback manual. Un
guardado que no cambia nada real (usuario abre y cierra sin tocar nada) no
inserta fila.

## UI (`order-detail-drawer.tsx`, `business-store.ts`)

- `BusinessStore` gana `listOrderEdits(orderId: string): Promise<OrderEdit[]>`.
  Rama Supabase: `select * from order_edits where order_id = ? order by changed_at desc`.
  Rama LocalStore: devuelve `[]` siempre — no hay noción de historial en el
  fallback local (mismo criterio ya usado para inventario: "Impacto en
  LocalStore: ninguno").
- Nueva sección **"Historial de cambios"** en `order-detail-drawer.tsx`,
  colapsable, debajo de los datos actuales del pedido. Cada entrada del
  timeline muestra fecha, quién hizo el cambio (email del usuario), cada
  campo modificado como "Campo: antes → después" (formateado según tipo:
  moneda para precio/descuento/envío/total, texto para notas/estado,
  nombre para cliente), y el motivo si se dio uno. Si no hay ninguna
  entrada, la sección no se muestra (no hay "sin historial" vacío).

## Testing y riesgos conocidos

- Mismo límite que el resto de la sesión: los tests de `business-store.ts`
  pueden mockear `supabase.rpc`/`supabase.from` y confirmar que
  `listOrderEdits` hace la consulta esperada, pero **no hay forma de
  probar contra Postgres real** que el jsonb `changes` se construye
  correctamente dentro de `update_order()` — eso se valida a mano.
- **Validación manual con Edwing:** editar un pedido cambiando precio de
  una línea + descuento + estado en el mismo guardado, y confirmar que el
  historial muestra exactamente esos 3 cambios (ni más ni menos) con los
  valores antes/después correctos. Editar un pedido sin cambiar nada y
  confirmar que no aparece ninguna fila nueva.
- **Riesgo aceptado:** pedidos editados *antes* de aplicar esta migración
  no tienen historial retroactivo — el historial empieza a existir desde
  el primer `update_order()` posterior a la migración, mismo criterio de
  no-backfill del resto del proyecto.

## Impacto en LocalStore

Ninguno. `createLocalBusinessStore` no gana historial — `listOrderEdits`
devuelve `[]` siempre en esa rama.
