# Diseño: transacciones atómicas para saveOrder / updateOrder / mergeCustomers

Estado: **propuesta, sin implementar**. Documentado como parte del cierre
pre-agosto (hallazgo #2 de la auditoría 2026-07-20), a implementar en la
siguiente fase, no antes de cargar pedidos reales de agosto.

## Problema

En `apps/rotulos/src/lib/business-store.ts`, la rama `createSupabaseBusinessStore`
hace operaciones de negocio en varias llamadas HTTP secuenciales al cliente
de Supabase, sin transacción de base de datos:

- **`saveOrder`**: upsert de `customers` → insert de `orders` → insert de
  `order_items`. Si el insert de `order_items` falla despues de crear el
  `order`, queda un pedido sin lineas.
- **`updateOrder`**: update de `orders` → delete de `order_items` removidas →
  update de cada `order_item` restante en un loop. Un fallo a mitad del loop
  deja el pedido con lineas parcialmente actualizadas y el total ya
  recalculado en `orders` no coincide con la suma real de `order_items`.
- **`mergeCustomers`**: por cada pedido relacionado hace un `update` de
  `orders` en loop, y solo al final borra el cliente origen. Un fallo a
  mitad del loop deja pedidos ya movidos al cliente destino y otros todavia
  en el origen, con el cliente origen sin borrar (estado recuperable
  reintentando el merge, pero inconsistente mientras tanto).

Ninguno de los tres tiene rollback: si una llamada intermedia falla, las
llamadas anteriores ya se aplicaron en la base de datos.

## Por que no se corrige antes de agosto

El riesgo requiere que la conexion falle *entre* dos llamadas HTTP
consecutivas del mismo flujo (ventana de milisegundos, en un entorno con dos
usuarios y volumen bajo de pedidos/mes). No es un bug determinista: el codigo
actual ya paso 170 tests, build y typecheck limpios, y produce resultados
correctos en el camino feliz. Es una limitacion estructural conocida, no un
defecto que vaya a manifestarse por el solo hecho de operar en agosto. El
mitigante inmediato es el backup manual (prioridad 1: `/api/export`), que
permite reconstruir el estado si algo asi ocurre.

**Ninguna de las tres operaciones debe bloquear el arranque de agosto.** Si
tuviera que priorizar una para la siguiente fase, seria `saveOrder`: es la
que corre con mas frecuencia (cada pedido nuevo) y la que mas directamente
viola la regla de negocio explicita de "no dejar pedidos sin lineas".

## Propuesta: mover cada operacion a una funcion Postgres `security definer`

Ya existe precedente en el propio esquema: `reserve_order_number` (en
`202607150001_create_rotulos_schema.sql`) y `apply_stock_movement` (en
`202607161000_create_inventory_schema.sql`) son funciones PL/pgSQL
`security definer` invocadas via `supabase.rpc(...)`. Una funcion Postgres
es transaccional por naturaleza: si cualquier sentencia dentro de ella
lanza una excepcion, Postgres revierte todo el bloque automaticamente.

### `save_order(p_customer jsonb, p_order jsonb, p_items jsonb[])`

```sql
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
  v_order public.orders;
begin
  -- upsert de cliente por telefono (si viene telefono)
  if (p_customer->>'phone') is not null and (p_customer->>'phone') <> '' then
    select id into v_customer_id from public.customers where phone = p_customer->>'phone';
  end if;

  if v_customer_id is null then
    insert into public.customers (full_name, phone, email, department, city, locality, address, neighborhood)
    values (p_customer->>'fullName', p_customer->>'phone', p_customer->>'email', p_customer->>'department',
            p_customer->>'city', p_customer->>'locality', p_customer->>'address', p_customer->>'neighborhood')
    returning id into v_customer_id;
  else
    update public.customers set
      full_name = p_customer->>'fullName', email = p_customer->>'email',
      department = p_customer->>'department', city = p_customer->>'city',
      locality = p_customer->>'locality', address = p_customer->>'address',
      neighborhood = p_customer->>'neighborhood', updated_at = now()
    where id = v_customer_id;
  end if;

  insert into public.orders (customer_id, customer_snapshot, order_date, status, notes, discount, shipping_cost, subtotal, total)
  values (v_customer_id, p_customer, (p_order->>'orderDate')::date, p_order->>'status', p_order->>'notes',
          (p_order->>'discount')::numeric, (p_order->>'shippingCost')::numeric,
          (p_order->>'subtotal')::numeric, (p_order->>'total')::numeric)
  returning * into v_order;

  insert into public.order_items (order_id, product_code, product_name, category, quantity, unit_price, total)
  select v_order.id, item->>'productCode', item->>'productName', item->>'category',
         (item->>'quantity')::numeric, (item->>'unitPrice')::numeric, (item->>'total')::numeric
  from jsonb_array_elements(p_items) as item;

  return v_order;
end;
$$;
```

Si el `insert` de `order_items` lanza (por ejemplo, `quantity > 0` violado),
Postgres revierte el `insert` de `orders` y el upsert de `customers`
automaticamente. El cliente (`business-store.ts`) hace **una sola** llamada
`supabase.rpc("save_order", {...})` en vez de tres.

### `update_order(...)` y `merge_customers(source_id, target_id)`

Mismo patron: mover el cuerpo de `updateOrder` (update de `orders` + delete
de items removidos + update de items restantes) y de `mergeCustomers`
(update de pedidos relacionados + delete del cliente origen) a sendas
funciones `security definer`, cada una en una sola llamada RPC.

## Rollback

No hace falta logica de rollback manual en la aplicacion: es la garantia
transaccional de Postgres (`BEGIN`/`COMMIT`/`ROLLBACK` implicito de cada
funcion). El cliente JS simplemente recibe un error si la funcion completa
lanza una excepcion, y no hay estado parcial que limpiar porque nunca se
escribio.

## Impacto en LocalStore

Ninguno. `createLocalBusinessStore` (fallback sin Supabase, usa
`localStorage`) ya es sincrono y atomico por naturaleza (una sola pestaña,
sin red de por medio) — no se toca.

## Impacto en tests

- Los tests actuales de `business-store.test.ts` mockean el cliente
  Supabase a nivel de `.from(...).insert(...)` etc. Habria que agregar
  mocks para `.rpc("save_order", ...)`, `.rpc("update_order", ...)` y
  `.rpc("merge_customers", ...)`, similar a como ya se mockea
  `reserve_order_number` en los tests de rotulos.
- Se necesitan tests de integracion contra una instancia real de Postgres
  (o `supabase start` local) para probar el rollback de verdad — un mock de
  JS no puede simular una transaccion de Postgres.

## Riesgos de la migracion

- Requiere una migracion SQL nueva (`create or replace function ...`) y
  actualizar `grant execute` como ya se hace con `reserve_order_number`.
- Cambia la forma en que `business-store.ts` arma el payload (de objetos
  tipados a `jsonb`), lo que reduce el chequeo de tipos en el borde
  cliente-servidor — hay que validar con `zod` antes de armar el RPC call
  (el proyecto ya usa `zod` como dependencia).
- Es una migracion de comportamiento, no solo de schema: hay que probarla
  en un pedido real de prueba (crear, editar, unificar) antes de confiar en
  ella para agosto.

## Recomendacion

Implementar `save_order` como RPC en la fase siguiente (prioridad media),
dejar `update_order` y `merge_customers` para despues de validar el patron
con `save_order`. No es bloqueante para arrancar agosto: el backup manual
(prioridad 1) es la mitigacion suficiente para esta ventana de tiempo.
