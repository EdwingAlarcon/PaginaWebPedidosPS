# Purple Shop — Próximos pasos / handoff

> Última actualización: 2026-07-19 noche Colombia (importador de Excel histórico completado y corrido contra producción; diseño de "editar cliente" listo para implementar).

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

## Pendiente

- **Editar clientes** (pedido por Edwing el 2026-07-19, motivado por los
  clientes importados del Excel que quedaron con datos incompletos:
  `phone`/`department`/`city`/`address`/`neighborhood` vacíos). Diseño
  brainstormeado y **aprobado por Edwing, sin implementar todavía**:
  - Hoy `apps/rotulos/src/components/customers-table.tsx` (y la página
    `apps/rotulos/src/app/(app)/clientes/page.tsx`) es de **solo lectura**
    — no hay ningún patrón de "editar entidad" en el codebase (Productos
    solo tiene crear + borrar, no editar).
  - Patrón elegido: click en la fila de `CustomersTable` abre un
    `Drawer` (`apps/rotulos/src/components/ui/drawer.tsx`, mismo
    componente que ya usa `ProductsTable` para "ver movimientos") con un
    formulario de edición nuevo, `customer-edit-form.tsx`.
  - El formulario reusa el selector de departamento/ciudad/localidad/
    barrio de Colombia ya usado en `order-form.tsx`
    (`apps/rotulos/src/lib/location.ts`, `validateDepartmentCity`,
    `getBogotaLocalities`, etc.) — **pero sin bloquear el guardado** si
    esos campos quedan vacíos (a diferencia de Crear pedido, donde sí son
    obligatorios). `fullName` sigue siendo el único campo realmente
    obligatorio.
  - Falta agregar `updateCustomer(id, patch)` a la interfaz
    `BusinessStore` (`apps/rotulos/src/lib/business-store.ts:7-13`) y a
    sus dos implementaciones (`createLocalBusinessStore`,
    `createSupabaseBusinessStore`). La política RLS de `customers` ya
    permite `update` libre a usuarios autenticados
    (`202607150001_create_rotulos_schema.sql:129-132`, `using(true) with
    check(true)`, sin columna `created_by` en esa tabla) — no hace falta
    tocar Supabase para esto.
  - Normalizar con `normalizeCustomerFields` (ya existe en
    `apps/rotulos/src/lib/normalize.ts`) antes de guardar, igual que en
    `saveOrder`.
  - Nota importante: `customers.source` (agregada por la migración
    `202607190002` de arriba) es **solo** para que el importador de Excel
    identifique a los clientes que él mismo creó (evita fusionarse con
    clientes reales). El formulario de editar cliente no debe tocar ni
    exponer ese campo — es interno del importador, no una clasificación
    de negocio.
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
