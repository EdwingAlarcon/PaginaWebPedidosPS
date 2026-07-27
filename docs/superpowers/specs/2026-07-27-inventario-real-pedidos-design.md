# Diseño: inventario real vinculado a pedidos

Estado: **aprobado, sin implementar**. Brainstorming del 2026-07-27, ítem
"Importante después de agosto" de `NEXT_STEPS.md`. Depende de la RPC
transaccional de la tarea previa (`save_order`/`update_order`,
`202607270002_add_order_transaction_rpcs.sql`) — este diseño extiende esas
mismas funciones.

## Problema

`product_codes` (catálogo usado en pedidos/rótulos) y `products`
(inventario con `current_stock` real) son tablas distintas e
independientes (ver `CLAUDE.md`). Un pedido nuevo no tiene forma de saber
a qué producto de inventario corresponde cada línea, así que crear,
editar o cancelar pedidos **nunca** toca `products.current_stock`. La
edición actual de pedidos (`order-edit-form.tsx`, flujo "AJUSTE") cambia el
pedido como documento comercial pero no descuenta/devuelve inventario —
Edwing tiene que corregir el stock a mano en `Inventario` si un pedido
afecta el stock real.

Ya existe la pieza clave para resolverlo sin reinventar nada:
`stock_movements` tiene un trigger `apply_stock_movement()`
(`202607161000_create_inventory_schema.sql`) que, al insertar una fila,
descuenta o devuelve `products.current_stock` automáticamente y **revierte
la transacción completa** si el stock quedaría negativo (`raise exception
'stock_insuficiente'`).

## Decisiones (confirmadas con Edwing)

- **Vínculo obligatorio para pedidos nuevos.** Toda línea de un pedido
  nuevo debe mapear a un producto real de `products`. Si el producto no
  existe todavía en Inventario, hay que crearlo ahí primero — no se puede
  escribir un producto nuevo "al vuelo" desde el formulario de pedido
  (a diferencia de `product_codes` hoy).
- **`product_codes` deja de alimentar pedidos nuevos**, pero no se borra
  ni se fusiona con `products`. Sigue existiendo por compatibilidad
  histórica (pedidos viejos, catálogo legado).
- **El descuento de stock ocurre al crear el pedido** (estado `pending`),
  sin importar el estado — el producto ya se considera comprometido/salido
  apenas se guarda el pedido. Cancelar devuelve el stock.
- **Los ajustes de cantidad en la edición de un pedido generan movimientos
  automáticos** (la diferencia se descuenta o se devuelve), reemplazando
  el paso manual de hoy en Inventario.
- **Los movimientos de pedidos van en la misma tabla `stock_movements`**
  que los movimientos manuales (con `order_id` nuevo, nullable), no en una
  tabla separada — reusa el trigger existente y da un solo lugar para ver
  el historial completo de un producto.
- **Alcance separado de la tarea "auditoría de ajustes de pedidos".** Este
  diseño solo cubre el historial de **cantidad/stock** vía
  `stock_movements.order_id`. Ajustes de precio, descuento o notas sin
  cambio de cantidad siguen como están hoy (texto libre `AJUSTE: ...` en
  `orders.notes`) — quedan fuera de este diseño, para una tarea aparte.
- **Todo o nada al crear.** Si falta stock de cualquier línea, el pedido
  completo no se guarda (no hay pedidos parciales ni ventas con stock
  negativo/preventa).

## Modelo de datos

```sql
alter table public.order_items
  add column if not exists product_id uuid references public.products(id) on delete set null;

alter table public.stock_movements
  add column if not exists order_id uuid references public.orders(id) on delete set null;
```

- `order_items.product_id`: **nullable**. Pedidos históricos e importados
  desde Excel quedan sin vínculo — no se migran retroactivamente (mismo
  criterio de riesgo aceptado que la normalización a MAYÚSCULA y la
  columna `locality`). La obligatoriedad "toda línea debe tener producto"
  se exige en la UI del formulario de pedido nuevo, no como `not null` en
  la base — así no se rompe el importador de Excel ni datos viejos.
- `stock_movements.order_id`: **nullable**. Movimientos manuales de
  Inventario (entradas de proveedor, ajustes de conteo) no tienen pedido
  asociado.
- No se agregan valores nuevos al `check` de `stock_movements.type` — se
  reusan `'entrada'`/`'salida'` tal como existen hoy.

## Flujo de creación (`save_order`)

Al insertar cada `order_item`, si trae `product_id` (no nulo), se inserta
además una fila en `stock_movements`:

```
type = 'salida'
quantity = item.quantity
product_id = item.productId
order_id = <id del pedido recién creado>
reason = 'Pedido ' || <id del pedido>
```

El trigger `apply_stock_movement()` ya existente descuenta
`products.current_stock` y, si no alcanza, lanza `stock_insuficiente`.
Como todo el `insert` de `order_items` + `stock_movements` ocurre dentro de
la misma transacción de `save_order`, si **cualquier** línea no tiene
stock suficiente, Postgres revierte el pedido completo — no queda un
pedido a medias ni con algunas líneas sin descontar.

Líneas sin `product_id` (no debería pasar en pedidos nuevos de la app,
pero la función lo tolera por si acaso) no generan movimiento — se
guardan igual, sin tocar stock.

## Flujo de edición y cancelación (`update_order`)

Antes de aplicar cualquier cambio, la función ya lee `v_current` (el
pedido tal como está en la base). A partir de ahí:

1. **Si el patch cambia `status` a `'cancelled'`** (y el estado actual no
   era ya `'cancelled'`): se genera un movimiento `'entrada'` por la
   cantidad completa de **cada línea actual del pedido** (snapshot de
   `order_items` antes de este guardado, no el patch), para cada línea con
   `product_id`. **Regla explícita para evitar doble conteo:** si el mismo
   guardado cancela el pedido Y trae un patch de líneas, el stock se rige
   únicamente por este snapshot pre-edición — el patch de líneas se aplica
   igual al documento del pedido, pero no genera movimientos adicionales
   de stock en esta misma operación.
2. **Si no se cancela y el patch trae líneas** (`p_patch->'items'` no
   nulo): para cada línea que sigue existiendo, se compara la cantidad
   nueva contra la cantidad que tenía en `order_items` antes del update:
   - cantidad baja → `entrada` por la diferencia (se devuelve stock).
   - cantidad sube → `salida` por la diferencia (puede fallar por
     `stock_insuficiente` y revertir el ajuste completo).
   - Para cada línea que existía antes y ya no está en el patch (línea
     eliminada): `entrada` por su cantidad completa.
   - Todo esto solo para líneas con `product_id` no nulo.
3. Líneas sin `product_id` (pedidos legados) nunca generan movimiento.

**Supuesto heredado del flujo actual:** `order-edit-form.tsx` solo permite
corregir cantidades/precios de líneas existentes o eliminarlas, nunca
agregar líneas nuevas a un pedido ya creado. Este diseño asume que eso no
cambia — no contempla el caso "línea nueva agregada durante una edición".
Si en el futuro se habilita agregar líneas al editar, hay que extender
`update_order` para generar también un movimiento `'salida'` por esas
líneas nuevas.

## UI (`order-form.tsx`, `order-edit-form.tsx`)

- El datalist de **Nuevo pedido** pasa de `listProductCodes()` a
  `listProducts()` (inventario). Al elegir un producto se completa
  `productCode` (desde `sku`), `productName`, `category`, `unitPrice`, y
  ahora también `productId`.
- Se agrega un hint "Stock disponible: N" junto al campo de cantidad —
  chequeo de UX en el cliente; la garantía real sigue siendo el trigger en
  la base (si el hint queda desincronizado por cualquier razón, el guardado
  falla igual del lado del servidor).
- Si el producto elegido no existe en Inventario, no se puede escribir uno
  nuevo "al vuelo" desde el pedido — hay que crearlo primero en
  `Inventario`. Esto es un cambio de flujo respecto a `product_codes` hoy
  (que sí permite escribir un código nuevo directo en el pedido).

## Testing y riesgos conocidos

- **Mismas limitaciones que la tarea de RPC transaccional
  (`2026-07-20-transacciones-rpc-design.md`):** los tests unitarios
  (vitest) solo pueden mockear `supabase.rpc(...)` y verificar que se
  llama con el payload esperado (`productId` incluido). **No hay forma de
  probar el trigger real de Postgres** (`stock_insuficiente`, descuento
  real, reversión al cancelar) desde un mock de JS — se necesita Postgres
  real.
- **Validación manual obligatoria con Edwing antes de confiar en esto**:
  (1) crear un pedido que agote el stock exacto de un producto; (2) crear
  uno que exceda el stock disponible — debe fallar y **no** crear el
  pedido ni tocar `products.current_stock`; (3) cancelar un pedido y
  confirmar que el stock vuelve; (4) editar cantidades de un pedido
  existente y confirmar el movimiento generado en `Inventario`.
- **Riesgo aceptado:** pedidos históricos/importados sin `product_id` no
  reflejan consumo de stock retroactivo. No se pidió backfill — si hace
  falta en el futuro, es tarea aparte.
- **Fuera de alcance de este diseño** (queda para otra tarea): auditoría
  genérica de ajustes de precio/descuento/notas sin cambio de cantidad.

## Impacto en LocalStore

Ninguno. `createLocalBusinessStore` (fallback sin Supabase) no tiene
noción de inventario real hoy y no se le agrega en este diseño — sigue
sin tocar stock, igual que hoy.
