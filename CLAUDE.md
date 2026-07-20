# CLAUDE.md

Guia tecnica para Claude Code / Codex al trabajar en este repositorio.
Para pendientes priorizados, ver `NEXT_STEPS.md`. Para instrucciones de
desarrollo/deploy paso a paso, ver `apps/rotulos/README.md`. Este archivo
es el handoff tecnico: arquitectura, reglas que no romper y estado
reciente.

## Proyecto

Purple Shop — gestion de pedidos, clientes, productos/inventario y
generacion de rotulos de envio. La unica app del repo vive en
`apps/rotulos/` (Next.js 16 + TypeScript + Supabase, desplegada en
Vercel).

**Produccion:** https://purpleshoponline.vercel.app

## Arquitectura general

- **Next.js App Router**, rutas de pagina bajo `apps/rotulos/src/app/(app)/`
  (protegidas por `middleware.ts`) mas `login/`, `auth/callback/` (publicas)
  y `api/` (rutas de servidor, **no** cubiertas por el middleware — cada
  una valida sesion por su cuenta, ver mas abajo).
- **Capa de datos**: dos "stores" con la misma interfaz — uno respaldado en
  Supabase (`createSupabaseBusinessStore` / `createSupabaseInventoryStore`)
  y un fallback en `localStorage` (`createLocalBusinessStore`) que se usa
  solo si faltan las variables de Supabase (desarrollo sin backend). Ver
  `src/lib/business-store.ts` e `src/lib/inventory-store.ts`.
  `product_codes` (catalogo usado en pedidos/rotulos) y `products`
  (inventario con stock real) son tablas **distintas e independientes**.
- **Supabase**: Postgres + Auth (OAuth Microsoft) + RLS en todas las
  tablas, rol `authenticated` unicamente (sin acceso `anon`). Migraciones
  en `apps/rotulos/supabase/migrations/`, aplicadas en orden por nombre
  (timestamp).
- **PDF**: `src/lib/pdf.ts` usa `pdf-lib` (no navegador/Chromium headless).
  Coordenadas sincronizadas manualmente con `src/app/globals.css` para que
  preview y PDF coincidan.

## Convenciones importantes

- **Normalizacion a MAYUSCULA**: todo texto de usuario (nombres, direcciones,
  notas, etc.) se normaliza a mayuscula antes de persistir, via
  `src/lib/normalize.ts`. Riesgo aceptado: datos historicos previos a esa
  normalizacion no se reescriben retroactivamente.
- **Ubicacion Colombia**: Departamento -> Ciudad/Municipio; si la ciudad es
  Bogota, se pide ademas Localidad y Barrio/Sector. Componentes en
  `src/components/location-fields.tsx`.
- **`customer_snapshot`**: cada `order` guarda `customer_id` (FK a
  `customers`) *y* una copia `customer_snapshot` (jsonb) con los datos del
  cliente al momento del pedido. **Si el pedido esta vinculado por
  `customer_id`, la UI debe mostrar siempre el dato actual del cliente
  maestro**, no la copia vieja: `orders-table.tsx` sincroniza
  silenciosamente el snapshot al abrir `Pedidos` si detecta que quedo
  desactualizado, y `customer-edit-form.tsx` sincroniza todos los pedidos
  vinculados al guardar una edicion de cliente. Pedidos sin `customer_id`
  (historicos importados, o el cliente fue borrado) dependen solo del
  snapshot y tienen opciones manuales de sincronizacion por nombre.
- **`orders.source`** distingue pedidos creados en la app (`'app'`) de los
  importados desde Excel (`'excel_import'`, con `import_batch_id` e
  `import_row_key` para idempotencia). Mismo patron en `customers.source`.

## Reglas que no se deben romper

- **No usar `SUPABASE_SERVICE_ROLE_KEY` en codigo cliente** (nada con
  `"use client"`, nada en componentes React). Solo se usa server-side en
  `src/lib/supabase/server.ts` (`createServiceClient`), consumida hoy por
  `src/app/api/export/route.ts` y `scripts/import-excel.ts`.
- **No tocar `customers.source` desde la UI.** Es metadata de trazabilidad
  de importacion, no un campo editable por el usuario.
- **No cambiar el diseno del rotulo sin validar preview y PDF juntos.**
  `globals.css` (preview/impresion navegador) y `src/lib/pdf.ts` (PDF)
  comparten coordenadas a mano; un cambio en uno sin el otro rompe la
  consistencia visual.
- **No automatizar la sincronizacion del Excel real del negocio**
  ("REFERENCIAS", OneDrive del gerente) sin permiso explicito — debe seguir
  siendo `npm run import:excel` corrido a mano.
- **No hacer deploy sin autorizacion explicita del usuario** en esta misma
  conversacion (no asumas que una autorizacion anterior aplica a cambios
  nuevos).

## Rutas API y proteccion de sesion

`middleware.ts` protege todas las rutas de **pagina** (matcher excluye
`api/`, `_next/static`, `_next/image`, `favicon.ico` e imagenes). Por eso
cada ruta bajo `src/app/api/` valida sesion **por su cuenta** con
`src/lib/require-session.ts` (login + presencia en `allowed_users`):

- `POST /api/labels/pdf` — protegida. Genera el PDF a partir del payload
  que manda el cliente (no consulta la base de datos).
- `GET /api/export` — protegida. Requiere ademas `SUPABASE_SERVICE_ROLE_KEY`
  configurada; sin ella responde 500 explicito. `table` solo acepta un
  whitelist fijo (`customers`, `orders`, `order-items`, `productos`); no
  hay forma de pedir una tabla arbitraria.
- `/api/labels/[id]/pdf` **ya no existe** (se elimino 2026-07-20: estaba
  muerta — usaba un cliente sin sesion dentro de una Route Handler, RLS la
  bloqueaba siempre, 404 permanente — y sin uso en la app).

Si agregas una ruta nueva bajo `/api`, agregale `requireSession()` al
inicio salvo que deba ser publica a proposito (documentalo si es asi).

## Exportacion / backup

`GET /api/export` (ver arriba) sirve CSV por tabla o un backup JSON
completo. UI en `Configuracion` (`src/components/data-export.tsx`). Usa el
service role para traer datos completos (incluyendo `labels` de todos los
usuarios, que por RLS normal quedarian limitados a `created_by = auth.uid()`).
No hay backup automatico ni scheduled — es manual, pensado para antes de
operaciones masivas (importar, unificar en lote) o como snapshot periodico.

## Escrituras sin transaccion (conocido, no bloqueante)

`saveOrder`, `updateOrder` y `mergeCustomers` en `business-store.ts` hacen
varias llamadas Supabase secuenciales sin transaccion de base de datos —
un fallo de red a mitad de camino puede en teoria dejar un pedido sin
lineas o un merge de clientes a medias. Diseno de la correccion (RPC
`security definer`, mismo patron que `reserve_order_number` y
`apply_stock_movement`) en
`docs/superpowers/specs/2026-07-20-transacciones-rpc-design.md`. No
implementar sin que el usuario lo pida explicitamente — es trabajo de fase
siguiente, no bloqueante para operar.

## Validaciones obligatorias antes de cerrar una tarea

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Corre las 4 (no un subconjunto) antes de dar una tarea de codigo por
terminada. Si tocaste UI, ademas probala en el navegador si es posible
(login real requiere credenciales que Claude no tiene — decilo
explicitamente si no pudiste probar con sesion autenticada).

## Estado operativo reciente

- 2026-07-18 noche: formularios de ubicacion Colombia/Bogota desplegados
  (Localidad y Barrio/Sector para Bogota). Supabase remoto tiene
  `customers.locality`.
- Exportar PDF funciona en produccion desde `Crear rotulo` y `Historial`
  (`pdf-lib`, sin Chromium).
- Pie del rotulo compactado y alineado (numero de pedido, fecha,
  transportadora, valor, paquetes, metodo de pago) en preview y PDF.
- 2026-07-19: importador de datos historicos desde Excel
  (`REFERENCIAS.xlsx`) corrido contra produccion (23 pedidos, 9 clientes
  nuevos). Detalle en `NEXT_STEPS.md` y
  `docs/superpowers/specs/2026-07-19-importador-excel-historico-design.md`.
- 2026-07-19 noche: edicion de clientes y pedidos implementada (ver
  "`customer_snapshot`" arriba). Edicion de pedidos permite corregir
  cantidades/precios y eliminar lineas como documento comercial
  (`AJUSTE: ...` en `orders.notes`), sin tocar inventario todavia.
- 2026-07-19 noche: menu por fila en `Clientes` con Editar/Unificar/
  Eliminar. Datalist de `Nuevo pedido` deduplicado por nombre normalizado.
  `Reportes` ya no dibuja barras en cero.
- 2026-07-20: cierre de auditoria tecnica pre-agosto. Se agrego
  exportacion/backup (`/api/export` + UI en Configuracion), se protegio
  `/api/labels/pdf` con sesion, se elimino `/api/labels/[id]/pdf` (muerta).
  Fix de sidebar sin scroll en pantallas bajas. Desplegado y verificado con
  checklist manual completo por Edwing.
- 2026-07-20 (mismo dia, depuracion de docs): se archivo toda la
  documentacion de la app legacy (`docs/*` pre-migracion, `CHANGELOG.md`,
  `CONTRIBUTING.md`, `SECURITY.md`, `project_redesign_status.md`,
  `apps/rotulos/PENDING_QA.md`) en `docs/_archive/legacy-app-2025/` — no
  describe el stack actual y contradecia el flujo de auth real (decian
  "magic link"; es OAuth Microsoft + allowlist). `README.md` raiz,
  `apps/rotulos/README.md`, `CLAUDE.md` y `NEXT_STEPS.md` quedaron como la
  documentacion vigente.
- Commits recientes relevantes:
  - `91f8847 fix(rotulos): permitir scroll en sidebar cuando el alto de ventana es chico`
  - `b467ea6 fix(rotulos): backup/export de datos y proteger rutas API sin sesion`
  - `4d1bd7c feat(rotulos): unificar y eliminar clientes`
  - `f92a024 fix(rotulos): sincronizar nombres actuales en pedidos`
  - `db9af72 fix(rotulos): evitar clientes duplicados en nuevo pedido`
  - `c69d3b4 fix(rotulos): ocultar barras en cero en reportes`

## Cosas explicitamente fuera de alcance / no tocar sin permiso

- **El Excel real del negocio** ("REFERENCIAS", en OneDrive del gerente)
  ya se importo una vez (2026-07-19) con un importador que entiende su
  estructura real (un worksheet por mes, bloques variables por cliente) —
  ver detalle en `NEXT_STEPS.md`. El importador es idempotente y se puede
  correr de nuevo a mano si hay meses nuevos que cargar. Lo que sigue
  fuera de alcance sin permiso explicito es **automatizar** esa
  sincronizacion (cron, webhook, etc.) — debe seguir siendo manual.

## Historia

Este repositorio alojo hasta 2026-07 una app legacy en la raiz
(HTML/CSS/JS plano con integracion a Excel/OneDrive via MSAL.js, servida
en GitHub Pages). Fue retirada tras migrar toda la funcionalidad a
`apps/rotulos`; el codigo sigue disponible en el historial de git anterior
a ese retiro, y su documentacion (ya obsoleta, no describe el stack
actual) esta archivada en `docs/_archive/legacy-app-2025/`.
