# apps/rotulos — Purple Shop

App Next.js para operar Purple Shop: gestión de pedidos, clientes,
productos, inventario, rótulos de envío y su PDF. Es la **única** app del
repositorio (la app legacy en la raíz fue retirada el 2026-07-18; ver
`/README.md`).

**Producción:** https://purpleshoponline.vercel.app
**Local:** http://localhost:3001
**Supabase producción:** proyecto `purpleshop`, ref `enrruhuzlnqqjnsabgzq`.

## Qué hace

- **Clientes**: alta, edición, búsqueda por nombre/teléfono/ciudad,
  unificación de duplicados (mueve los pedidos relacionados y borra el
  origen), eliminación (solo del registro, conserva sus pedidos sin
  `customer_id`).
- **Pedidos**: alta con cliente nuevo o existente, edición de líneas
  (cantidad/precio/eliminar), recálculo de subtotal/total, motivo de
  ajuste guardado en `orders.notes`, sincronización automática con el
  cliente vinculado (`customer_snapshot` se refresca si el cliente maestro
  cambió).
- **Productos / Inventario**: catálogo de productos (`product_codes`, usado
  al armar líneas de pedido) e inventario con stock real
  (`products` + `stock_movements`), independientes entre sí. Los pedidos
  hoy **no** descuentan inventario automáticamente (ver `NEXT_STEPS.md`).
- **Rótulos / PDF**: creación, vista previa, impresión y descarga de PDF
  (`pdf-lib`, sin navegador headless). Dos tamaños: 10×9 cm y 14×12 cm
  (default). Preview e impresión comparten coordenadas.
- **Importación histórica desde Excel**: script `npm run import:excel`
  (no expuesto en la web), idempotente vía `orders.import_row_key`.
- **Exportar datos / backup**: `Configuración → Exportar datos` — CSV de
  clientes, pedidos, líneas de pedido y catálogo de productos, más un
  backup JSON completo (incluye inventario, movimientos de stock, rótulos
  y configuración). Ver la sección "Snapshot manual" más abajo.

## Stack técnico

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**.
- **Supabase**: Postgres + Auth (OAuth) + Row Level Security. Fallback a
  `localStorage` si no hay variables de Supabase configuradas (solo para
  desarrollo local sin backend).
- **Vercel**: hosting y despliegue.
- **Tailwind CSS** + Radix UI para componentes.
- **pdf-lib** para generar el PDF del rótulo server-side.
- **Vitest + Testing Library** (unit/component) y **Playwright** (e2e).

## Autenticación y usuarios permitidos

Login vía Supabase Auth con **OAuth de Microsoft**. Además del login, todo
usuario autenticado debe existir en la tabla `public.allowed_users`
(email exacto) — si no está en la allowlist, se cierra la sesión
automáticamente y se redirige a `/login?unauthorized=1`.

- `middleware.ts` protege todas las rutas de página (excepto `/login` y
  `/auth/callback`).
- Las rutas bajo `/api` (`/api/export`, `/api/labels/pdf`) **no** pasan por
  ese middleware (el matcher excluye `api/`); cada una valida sesión +
  allowlist por su cuenta con `src/lib/require-session.ts`.

Para dar acceso a alguien nuevo: agregar su email a `allowed_users` en
Supabase (no hay UI para esto todavía).

## Variables de entorno

Copiar el ejemplo y completar los valores (nunca commitear `.env.local`):

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ROTULOS_BASE_URL=http://localhost:3001
```

| Variable | Dónde se usa | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente y servidor | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | pública, respeta RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo servidor** (`lib/supabase/server.ts`, `/api/export`, `scripts/import-excel.ts`) | nunca debe llegar al bundle de cliente; no prefijarla con `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_ROTULOS_BASE_URL` | generación de PDF/links | URL pública o local de la app |

En Vercel, las 4 deben estar configuradas para **Production** (verificar con
`vercel env ls production`).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3001`. Sin `.env.local`, la app cae a un store en
`localStorage` (modo local, solo para probar UI sin backend real).

## Validaciones

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e        # Playwright, requiere la app corriendo
```

## Supabase y migraciones

Migraciones en `supabase/migrations/`, aplicadas en orden por nombre
(timestamp). Para aplicar la última en el proyecto remoto:

```bash
supabase db push --workdir apps/rotulos
```

O ejecutar el SQL directamente en el SQL editor de Supabase si no usás la
CLI.

Tablas principales: `customers`, `orders` + `order_items`, `product_codes`
(catálogo), `products` + `stock_movements` (inventario), `labels`,
`settings`, `order_sequences`, `allowed_users`. Todas tienen RLS activo,
restringido al rol `authenticated` (sin acceso `anon`); dentro de ese rol,
las políticas de escritura no distinguen entre los 2 usuarios de la
allowlist — aceptado como riesgo bajo para un equipo de 2 personas de
confianza.

## Despliegue

Manual, no hay integración Git→Vercel configurada (un `git push` no
despliega solo):

```bash
vercel deploy --prod
```

Antes de desplegar: correr las 4 validaciones de arriba. Después de
desplegar: crear un pedido, generar un rótulo/PDF, y confirmar login.

## Snapshot manual antes de usar datos reales

Antes de cargar pedidos reales o de hacer una operación masiva (importar
Excel, unificar varios clientes), descargar un respaldo:

1. Iniciar sesión → `Configuración`.
2. Sección "Exportar datos": descargar los 4 CSV (Clientes, Pedidos,
   Líneas de pedido, Catálogo de productos) y el "Backup completo (JSON)".
3. Guardar esos archivos fuera del repo (carpeta local o Drive), no se
   suben a git.

No hay backup automático ni point-in-time recovery propio de la app —
depende del plan de Supabase contratado.

## Riesgos conocidos

- `saveOrder`, `updateOrder` y `mergeCustomers` hacen varias escrituras
  Supabase secuenciales sin transacción de base de datos. Riesgo bajo en la
  práctica; diseño de la corrección (RPC transaccional) en
  `docs/superpowers/specs/2026-07-20-transacciones-rpc-design.md`.
- Impresión física del rótulo en la impresora final: no validada todavía
  (solo preview/PDF en pantalla).
- Pedidos e items de inventario no están enlazados: crear/editar un pedido
  no descuenta ni devuelve stock real.

## Pendientes importantes

Ver `/NEXT_STEPS.md` (fuente de verdad de pendientes, priorizada).

## PDF e impresión

Tamaños soportados: **10×9 cm** y **14×12 cm** (default), configurable en
`Configuración`. Preview, impresión de navegador y PDF comparten el mismo
diseño (`globals.css` + `src/lib/pdf.ts`).

Recomendaciones de impresión:

- Papel/etiqueta al tamaño configurado, escala 100%, márgenes en cero.
- Desactivar encabezados/pies de página del navegador si se imprime desde
  ahí en vez de descargar el PDF.
