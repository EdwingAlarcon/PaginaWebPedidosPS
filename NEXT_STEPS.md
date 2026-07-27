# Purple Shop — Próximos pasos / handoff

> Última actualización: 2026-07-26 Colombia (PRODUCT.md/DESIGN.md creados
> vía `/impeccable`; critique de UX sobre "Crear rótulo" encontró y se
> corrigió el P0 — rótulo sin vínculo real a pedido — y los dos P1 —
> doble-clic sin guard, sin autocompletado de destinatario. Fix de
> Root Directory en Vercel para que el auto-deploy por Git funcione).

## Estado actual: migración de GitHub Pages a Vercel/Supabase completada

`apps/rotulos/` (Next.js/TypeScript/Supabase) es la **única** app del
repo. La raíz legacy (HTML/CSS/JS + MSAL/Excel) fue retirada por completo
el 2026-07-18 — GitHub Pages apagado y código borrado (sigue disponible
en el historial de git antes de ese commit). Ver
`docs/superpowers/specs/2026-07-16-migracion-vercel-supabase-design.md`
y los tres planes en `docs/superpowers/plans/` de esa fecha para el
detalle completo de lo decidido y hecho.

**Producción:** `https://purpleshoponline.vercel.app` — incluye pedidos,
clientes, inventario (con alertas de stock, historial de movimientos y
eliminación de producto), reportes, y el generador de rótulos con el
diseño ilustrado aprobado. Validado visualmente por Edwing el
2026-07-17 ("se ve igual a la imagen").

**Supabase:** proyecto `purpleshop` (ref `enrruhuzlnqqjnsabgzq`). Las tres
migraciones existentes ya están aplicadas en remoto:
`202607150001_create_rotulos_schema.sql`,
`202607161000_create_inventory_schema.sql`,
`202607162000_add_label_size.sql`.

Además, el 2026-07-18 se aplicó en remoto la migración
`202607180001_add_customer_locality.sql`, que agrega `customers.locality`
como `text not null default ''`.

## Hecho recientemente

- **Importador de data histórica desde Excel** (2026-07-19): 23 pedidos
  históricos de `REFERENCIAS.xlsx` (SEPT 2025 → JULIO 2026) ya están
  cargados en Supabase producción, corridos y verificados idempotentes
  (`orders.import_row_key` único). Diseño completo en
  `docs/superpowers/specs/2026-07-19-importador-excel-historico-design.md`,
  plan en `docs/superpowers/plans/2026-07-19-importador-excel-historico.md`.
  Script CLI: `apps/rotulos/scripts/import-excel.ts` (`npm run import:excel
  -- <ruta.xlsx> [--commit]`), lógica pura testeada en
  `apps/rotulos/src/lib/excel-import/`. Dos migraciones nuevas ya
  aplicadas en remoto: `202607190001_add_excel_import_tracking.sql`
  (`orders.source`/`import_batch_id`/`import_row_key`) y
  `202607190002_add_customer_import_source.sql` (`customers.source`, usado
  para el dedupe de clientes del importador — **no** confundir con
  clientes reales, ver más abajo). 1 bloque quedó excluido por error real
  de datos (ZAIDA, hoja JULIO 2026, fila 2: falta cantidad/precio) — sin
  resolver, revisar a mano contra el Excel si hace falta rescatarlo.
  El script no se toca la app en vivo (nadie en `src/` lo importa); no
  requirió deploy.
- **Formularios de ubicación Colombia/Bogotá** (2026-07-18): los campos de
  ubicación de remitente/destinatario usan departamentos y ciudades de
  Colombia. Para Bogotá se habilitan `Localidad` y `Barrio/Sector` con
  filtrado y validación de pertenencia. Archivos principales:
  `apps/rotulos/src/components/location-fields.tsx`,
  `apps/rotulos/src/lib/location.ts`,
  `apps/rotulos/src/lib/colombia-locations.ts`,
  `apps/rotulos/src/lib/bogota-locations.ts`,
  `apps/rotulos/src/lib/bogota-neighborhoods.ts`.
- **Exportar PDF corregido en producción** (2026-07-18): el botón funciona
  desde `Crear rótulo` y desde `Historial`. Se reemplazó la generación con
  Playwright/Chromium por generación directa con `pdf-lib` para evitar
  fallos serverless en Vercel. Ruta central:
  `apps/rotulos/src/lib/pdf.ts`. Verificado contra producción con respuesta
  `200 application/pdf`.
- **Pie del rótulo compactado** (2026-07-18): se ajustaron coordenadas y
  tamaño de fuente para que `N° de pedido`, `Fecha`, `Transportadora`,
  `Valor`, `Paquetes` y el check de método de pago queden completos dentro
  de la franja inferior. Cambios sincronizados entre vista previa/impresión
  (`apps/rotulos/src/app/globals.css`) y PDF
  (`apps/rotulos/src/lib/pdf.ts`). Último commit funcional verificado:
  `35a38cd fix(rotulos): compactar textos del pie`.
- **Normalización de texto a MAYÚSCULA** (2026-07-18): todo campo de texto
  operativo (nombres, direcciones, ciudades, barrios, observaciones,
  referencias, remitente/destinatario, productos/categorías, motivos de
  movimiento, notas de pedidos) se guarda ahora en mayúscula
  (`trim().toUpperCase()`) antes de persistir en Supabase o en el fallback
  de `localStorage`, en los tres stores (`label-store.ts`,
  `inventory-store.ts`, `business-store.ts`). Módulo centralizado:
  `apps/rotulos/src/lib/normalize.ts`. Campos excluidos a propósito:
  `phone`, `email`, URLs, `instagramUser`, `brandPhrase`,
  `orderNumberConfig.*`, colores hex, ids/timestamps. Plan completo en
  `docs/superpowers/plans/2026-07-18-normalizar-texto-mayuscula.md`.
  Desplegado a producción (`vercel deploy --prod`) el mismo día.
  **Riesgo aceptado, no bloqueante:** los registros guardados *antes* de
  este cambio no se re-normalizan retroactivamente — mantienen su casing
  original hasta que se editen y regraben. Caso concreto: `saveProductCode`
  usa `code` como clave de deduplicación; un código viejo en minúscula ya
  no colisiona con uno nuevo en mayúscula del "mismo" producto (quedarían
  como dos registros separados). No se pidió migración de datos
  históricos — si hace falta, es tarea aparte.
- **Edición de clientes y pedidos** (2026-07-19): ya se puede abrir
  una fila de Clientes para editar nombre, contacto y ubicación; también
  una fila de Pedidos para editar datos del cliente, fecha, estado, notas,
  descuento, envío, cantidades, precios unitarios y eliminar líneas. Los
  ajustes de líneas recalculan subtotal/total y no modifican inventario.
  Archivos principales:
  `apps/rotulos/src/components/customer-edit-form.tsx`,
  `apps/rotulos/src/components/customers-table.tsx`,
  `apps/rotulos/src/components/order-detail-drawer.tsx`,
  `apps/rotulos/src/components/order-edit-form.tsx`,
  `apps/rotulos/src/components/orders-table.tsx`,
  `apps/rotulos/src/lib/business-store.ts`.
- **Sincronización de cliente a pedidos** (2026-07-19): el modelo real es
  mixto: `orders.customer_id` referencia a `customers.id`, pero el pedido
  tambien guarda `orders.customer_snapshot`. Despues de los fixes recientes,
  si un pedido esta vinculado por `customer_id`, debe mostrar siempre el
  dato actual del cliente maestro. Al abrir `Pedidos`, `orders-table.tsx`
  sincroniza silenciosamente snapshots obsoletos con el cliente vinculado.
  Al editar un cliente, `customer-edit-form.tsx` sincroniza automaticamente
  todos los pedidos vinculados. Las opciones manuales siguen existiendo
  solo para casos no vinculados o historicos relacionados por nombre:
  "Aplicar cambios a pedidos pendientes" y "Completar datos faltantes en
  pedidos relacionados". No se actualizan `labels.recipient` de rotulos ya
  creados.
- **Unificación/eliminación de clientes** (2026-07-19): en `Clientes` cada
  fila tiene menu de acciones con **Editar**, **Unificar** y **Eliminar
  cliente** (`apps/rotulos/src/components/customers-table.tsx`). Unificar
  mueve pedidos relacionados del cliente origen al cliente destino y
  reemplaza el snapshot del pedido con los datos del cliente correcto.
  Eliminar cliente borra solo el registro de cliente; conserva sus pedidos
  y los deja sin `customer_id`.
- **Nuevo pedido sin clientes duplicados** (2026-07-19): el datalist del
  campo **Nombre** en `apps/rotulos/src/components/order-form.tsx` muestra
  clientes unicos por nombre normalizado. Si existen varias fichas con el
  mismo nombre, usa la mas completa y, en empate, la mas reciente para
  autollenar telefono/direccion/ubicacion.
- **Reportes: barras en cero corregidas** (2026-07-19): `Pedidos por
  estado` ya no pinta barras cuando el valor es `0`; `BarList` usa ancho
  `0%` para valores cero y conserva un minimo visual solo para valores
  reales. Prueba: `apps/rotulos/src/__tests__/reports-page.test.tsx`.
- **Ajustes comerciales de pedidos sin inventario** (2026-07-19): desde el
  drawer de pedido se pueden corregir cantidades/precios y eliminar lineas.
  Si cambian lineas se pide "Motivo del ajuste"; por ahora se guarda en
  `orders.notes` como `AJUSTE: MOTIVO`, y el detalle muestra "Pedido
  ajustado" / "Ultimo ajuste". Para pedidos completados se pide confirmacion
  adicional antes de guardar. No hubo migracion de base de datos para esto.
- **Lista de productos sin guiones ambiguos** (2026-07-19): el guion visible
  en Productos correspondia a `sku` vacio; ahora se muestra "Sin SKU". En
  la columna Alerta, si no hay alerta, la celda queda vacia en vez de
  mostrar `-`.
- **Cierre de auditoría pre-agosto** (2026-07-20): auditoría técnica/seguridad
  completa antes de operar con pedidos reales de agosto (código, RLS, tests,
  build — sin bugs bloqueantes). Se cerraron los 2 hallazgos accionables:
  - **Backup/exportación**: nueva sección "Exportar datos" en
    `Configuración` (`src/components/data-export.tsx`) — CSV de
    clientes/pedidos/order_items/catálogo y backup JSON completo, via
    `GET /api/export` (protegida por sesión + `allowed_users`, usa
    `SUPABASE_SERVICE_ROLE_KEY` server-side).
  - **Rutas API públicas**: `/api/labels/pdf` ahora exige sesión
    (`src/lib/require-session.ts`); `/api/labels/[id]/pdf` se eliminó por
    estar muerta y rota (nunca funcionaba, sin uso en la app).
  - El tercer hallazgo (escrituras sin transacción en `saveOrder`/
    `updateOrder`/`mergeCustomers`) se documentó como propuesta de RPC en
    `docs/superpowers/specs/2026-07-20-transacciones-rpc-design.md`, no
    bloqueante, pendiente para una fase siguiente.
  - Fix adicional: `.legacy-sidebar` no tenía scroll y en pantallas de poca
    altura cortaba los últimos items del menú (ej. "Configuración"); se
    agregó `overflow-y: auto`.
  - Desplegado a producción y verificado con checklist manual completo
    (login, crear cliente, crear pedido, PDF, exportar CSV/JSON, editar
    cliente, unificar cliente, editar pedido) — **confirmado OK por
    Edwing**.

## Hecho recientemente (continuación)

- **Documentación de diseño via `/impeccable`** (2026-07-26): se crearon
  `PRODUCT.md` (contexto de producto: usuarios Edwing+gerente, uso
  desktop, posicionamiento vs Excel) y `DESIGN.md` +
  `.impeccable/design.json` (sistema visual real extraído del código:
  North Star "El Taller Violeta", paleta un-solo-acento, Regla
  Plana-por-Defecto para sombras). Ambos en la raíz del repo, autoridad
  para trabajo de diseño futuro.
- **Critique de UX + fix de vínculo rótulo-pedido** (2026-07-26): un
  critique dual-agent sobre `/crear` (flujo "Crear rótulo") encontró que
  el rótulo generado ahí **no tenía relación real con ningún pedido** de
  `orders` — el "número de pedido" era texto libre, contradiciendo el
  diferenciador de producto declarado en PRODUCT.md. Fix (P0, con TDD):
  - `labels.order_id` (uuid, nullable, FK a `orders.id`) — migración
    `202607260001_add_labels_order_id.sql`, **ya aplicada en Supabase
    producción** (corrida a mano por Edwing en el SQL Editor).
  - `buildLabelDraftFromOrder()` en `src/lib/label-from-order.ts`: prellena
    el rótulo con los datos reales del pedido.
  - Botón **"Generar rótulo"** en el detalle de pedido
    (`order-detail-drawer.tsx`) → `/crear?fromOrderId=<id>`.
  - `/crear` standalone se retiró del sidebar (`app-shell.tsx`) — sigue
    existiendo como ruta, alcanzable solo desde el pedido o edición
    existente (`?id=`).
  - Reporte completo del critique persistido en
    `.impeccable/critique/2026-07-26T22-55-14Z__apps-rotulos-src-app-app-crear-page-tsx.md`.
  - Probado end-to-end en producción con sesión real (Edwing): destinatario
    prellenado, guardado generó `PS-2026-000004` real, visible en Historial.
- **Fix de los dos P1 del mismo critique** (2026-07-26, mismo día):
  - Doble-clic guard: `Guardar rótulo`/`Descargar PDF` se deshabilitan
    (con spinner) mientras la petición está en curso
    (`label-form.tsx`, `label-actions.tsx`).
  - Autocompletado de destinatario: `recipient-fields.tsx` ahora tiene
    datalist de clientes existentes (mismo patrón que `order-form.tsx`),
    vía `mergeCustomerIntoRecipient()` en
    `src/lib/recipient-from-customer.ts`.
  - Todo con TDD (tests RED→GREEN), 182/182 tests, lint/typecheck/build
    limpios, desplegado a producción.
- **Fix de Root Directory en Vercel** (2026-07-26): el proyecto
  `purpleshoponline` en Vercel no tenía "Root Directory" configurado a
  `apps/rotulos` — la integración de Git (auto-deploy en cada push)
  nunca había funcionado hasta hoy (todos los deploys previos fueron
  manuales via `vercel deploy --prod` desde dentro de `apps/rotulos`).
  Edwing lo corrigió en el dashboard (Settings → Build and Deployment →
  Root Directory); confirmado funcionando: push a `main` ahora
  auto-despliega a producción sin CLI manual.

## Pendiente

### Bloqueantes antes de producción

Ninguno. La auditoría pre-agosto (2026-07-20) cerró los hallazgos
accionables, se desplegó y Edwing verificó el checklist manual completo.
La app está lista para operar con pedidos reales de agosto.

### Backlog del critique de "Crear rótulo": P2/P3 resueltos (2026-07-27)

Del critique persistido en `.impeccable/critique/2026-07-26T22-55-14Z__apps-rotulos-src-app-app-crear-page-tsx.md`
(P0 y ambos P1 resueltos el 2026-07-26, ver arriba):

- **[P2] resuelto.** El resumen de validación (`label-form.tsx`,
  `validation-summary`) ahora lista cada campo inválido como enlace
  (`<a href="#fieldId">`) que hace scroll y foco al input real; además
  `validateDraft()` enfoca automáticamente el primer campo inválido al
  fallar Guardar/Imprimir/Descargar. Requirió dar `id`/`htmlFor`
  explícitos y estables (iguales a la clave de error, ej.
  `sender.department`) a todos los campos validables en
  `sender-fields.tsx`, `recipient-fields.tsx`, `shipment-fields.tsx` y
  `location-fields.tsx`; `form-field.tsx` se ajustó para seguir
  clonando `aria-describedby`/`aria-invalid` en el hijo incluso cuando
  se pasa `htmlFor` explícito (antes solo pasaba con id autogenerado).
- **[P3] resuelto.** Los selects dependientes de ubicación
  (ciudad/localidad/barrio en `location-fields.tsx`) muestran borde
  punteado + fondo `surface-muted` cuando están deshabilitados, y el
  motivo ("Selecciona primero un departamento.", etc.) se movió del
  placeholder al `hint` del `FormField` (visible permanentemente, no
  solo al abrir el select).
- Tests nuevos en `label-form.test.tsx` y `location-fields.test.tsx`
  (TDD), 186/186 tests, lint/typecheck/build limpios. Desplegado a
  producción (push a `main`, auto-deploy).
- **Observaciones menores del critique, resueltas (2026-07-27):**
  `codAmount` en `shipment-fields.tsx` ahora usa `CurrencyInput` (igual
  que `order-form.tsx`); el botón de guardar dice "Guardar rotulo" para
  uno nuevo y "Guardar cambios" cuando `draft.id` ya existe
  (`label-actions.tsx`, `isEditing` prop); `packageCount` ya no puede
  quedar en `NaN` al vaciar el campo; se eliminaron los handlers
  `onInput`+`onChange` duplicados en `sender-fields.tsx`,
  `recipient-fields.tsx` y `shipment-fields.tsx`. TDD, 189/189 tests.
  Backlog completo del critique de `/impeccable` (P0-P3 + menores) ya
  cerrado.

### Importantes después de agosto

- ~~RPC transaccional para `saveOrder`/`updateOrder`/`mergeCustomers`~~
  codigo listo 2026-07-27 (los 3, no solo `save_order`): migracion
  `202607270002_add_order_transaction_rpcs.sql` agrega
  `save_order(jsonb, jsonb, jsonb)`, `update_order(uuid, jsonb)` y
  `merge_customers(uuid, uuid)` como funciones `security definer` (mismo
  patron que `reserve_order_number`/`apply_stock_movement`), y
  `business-store.ts` ya llama a cada una via `supabase.rpc(...)` en vez
  de las llamadas HTTP secuenciales. `isMissingLocalityColumnError`
  (fallback legacy) se elimino, ya no hace falta. Tests unitarios nuevos
  mockeando `supabase.rpc` (207/207 tests), pero **sin poder probar el
  rollback real de Postgres desde vitest** (mock, no Postgres real) —
  ver limitacion documentada en
  `docs/superpowers/specs/2026-07-20-transacciones-rpc-design.md`.
  **Pendiente antes de confiar en esto para pedidos reales:** (1) Edwing
  corre la migracion en el SQL Editor de Supabase; (2) probar juntos un
  pedido real end-to-end (crear, editar cantidades, unificar clientes)
  en produccion para confirmar que el comportamiento es identico al
  anterior antes de operar con volumen real de agosto.
- ~~Impresión física real del rótulo~~ confirmada funcional por Edwing
  2026-07-27 con la impresora final.
- **Inventario real vinculado a pedidos — código listo 2026-07-27,
  pendiente de validación manual.** Diseño completo en
  `docs/superpowers/specs/2026-07-27-inventario-real-pedidos-design.md`.
  `order_items.product_id` y `stock_movements.order_id` (migración
  `202607270003_add_order_inventory_link.sql`), `save_order`/`update_order`
  extendidos para generar movimientos automáticos, `order-form.tsx` ahora
  elige el producto desde `Inventario` (obligatorio) en vez de
  `product_codes`. Confirmado por Edwing: el catálogo de Inventario ya
  está poblado con el catálogo real del negocio, no hace falta seeding.
  **Antes de operar con esto:**
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
  6. Editar un pedido AUMENTANDO la cantidad de una línea — debe generar
     una salida adicional; si no hay stock suficiente para el aumento, el
     ajuste completo debe fallar y NO modificar el pedido.
  7. Eliminar una línea de un pedido durante una edición — debe devolver
     el stock completo de esa línea.
  8. Editar un pedido histórico/importado (sin `product_id` en sus
     líneas) — debe guardar sin error y sin generar ningún movimiento de
     stock.
  Limitación conocida (no es tarea pendiente por ahora): cancelar y luego
  "descancelar" un pedido (volverlo a `pending`) no vuelve a descontar el
  stock automáticamente.
- **Auditoría/historial de ajustes de pedidos.** Hoy el motivo del ajuste se
  guarda como texto libre en `orders.notes` (`AJUSTE: ...`); no hay tabla ni
  vista dedicada para ver el historial de cambios de un pedido.

### Mejoras futuras

- ~~Backups automáticos~~ resuelto 2026-07-27: plan Supabase es Free
  (sin point-in-time recovery), asi que se agrego un cron de Vercel
  (`vercel.json`, diario 06:00 UTC) que llama `/api/cron/backup`
  (`route.ts`) y sube un backup JSON completo (mismo payload que
  `/api/export?format=json`, extraido a `src/lib/backup.ts`) al bucket
  de Storage `backups`, podando automaticamente para conservar solo los
  ultimos 30. **Pendientes manuales de Edwing antes de que funcione en
  produccion:** (1) correr la migracion
  `202607270001_create_backups_bucket.sql` en el SQL Editor de Supabase
  (crea el bucket privado `backups`); (2) definir la variable de entorno
  `CRON_SECRET` en Vercel (Settings -> Environment Variables) con un
  valor random — Vercel la manda como `Authorization: Bearer <valor>` al
  invocar el cron, y la ruta la valida. Sin esas dos cosas el cron
  responde 401/500 sin romper nada mas.
- ~~UI para gestionar `allowed_users`~~ resuelto 2026-07-27: nueva
  seccion "Usuarios permitidos" en Configuracion
  (`allowed-users-admin.tsx`) para listar, agregar y eliminar correos
  permitidos, via `/api/allowed-users` (GET/POST/DELETE, protegida por
  sesion + service role, mismo patron que `/api/export`). No requirio
  migracion: RLS de `allowed_users` solo permite que cada usuario lea su
  propia fila, pero el service role la bypassa igual que en export. Un
  usuario no puede eliminarse a si mismo (evita bloqueo accidental). TDD,
  199/199 tests.
- **Bloque de importación Excel pendiente:** cliente `ZAIDA`, hoja `JULIO
  2026`, fila 2 quedó excluida por error real de datos (falta
  cantidad/precio) — revisar a mano contra el Excel si hace falta
  rescatarla.

### Deuda técnica

- Si se ajusta el diseño del rótulo, mantener sincronizadas las
  coordenadas entre `globals.css` y `pdf.ts` — preview/impresión y PDF no
  comparten motor de render.
- ~~`middleware.ts` usa la convención deprecada~~ resuelto 2026-07-27:
  renombrado a `proxy.ts` (función `proxy`, export `proxyConfig`),
  siguiendo la convención de Next.js 16. Warning de build ya no aparece.
- ~~Clases CSS con prefijo `legacy-`~~ resuelto 2026-07-27: renombradas
  a prefijo `app-shell-` (`app-shell-sidebar`, `app-shell-topbar`, etc.)
  en `globals.css`/`app-shell.tsx`, sin cambios visuales.

## Cosas explícitamente fuera de alcance / no tocar sin permiso

- **El Excel real ("REFERENCIAS") ya no está fuera de alcance** — se
  importó una vez (2026-07-19, ver arriba) con diseño explícito aprobado
  por Edwing. Si se necesita volver a importar (ej. meses nuevos que se
  sigan cargando ahí), el script ya existe
  (`apps/rotulos/scripts/import-excel.ts`) y es idempotente — correrlo de
  nuevo con el mismo archivo no duplica lo ya importado. Lo que sigue
  fuera de alcance sin permiso explícito es **automatizar** esa
  sincronización (ej. un cron o webhook que lea el Excel solo) — el
  importador es y debe seguir siendo manual, corrido a mano por Edwing.
- **No hacer push sin confirmación explícita del usuario**, salvo que ya
  lo haya pedido explícitamente (Edwing pidió el 2026-07-16 que se
  commitee y pushee sin repreguntar tras cada fix verificado — repo de un
  solo dev, sin PRs de por medio). El commit de retiro de legacy pidió
  confirmación aparte por su tamaño, ya se dio y ya se hizo el push
  (2026-07-18).
