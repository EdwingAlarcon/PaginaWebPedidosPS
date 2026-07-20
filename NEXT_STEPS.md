# Purple Shop — Próximos pasos / handoff

> Última actualización: 2026-07-19 noche Colombia (clientes/pedidos sincronizados, unificación de clientes, dedupe en Nuevo pedido y reportes corregidos).

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

## Pendiente

- **Inventario real vinculado a pedidos.** La edición actual cambia el
  pedido como documento comercial, no el stock. Para que los pedidos
  descuenten/devuelvan inventario hace falta diseño y migración aparte:
  enlazar `order_items.product_id` con `products.id`, definir movimientos
  compensatorios al editar/cancelar/devolver, reglas por estado del pedido y
  una tabla de auditoria dedicada para ajustes.
- Impresión física real del rótulo con impresora final todavía no
  probada (solo validación en pantalla/PDF hasta ahora).
- Si se hacen nuevos ajustes al diseño del rótulo, mantener sincronizadas
  las coordenadas entre `globals.css` y `pdf.ts`; la vista previa y el PDF
  no comparten motor de render.

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
