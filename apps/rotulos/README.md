# apps/rotulos — Purple Shop

App Next.js para operar Purple Shop: pedidos, pagos, clientes, catálogo,
despacho, guías y rótulos de envío. Es la **única** app del repositorio.

**Producción:** https://purpleshoponline.vercel.app
**Local:** http://localhost:3001
**Supabase producción:** proyecto `purpleshop`, ref `enrruhuzlnqqjnsabgzq`.

## Pantallas

| Ruta | Qué hace |
|---|---|
| `/` | Inicio: "Qué hacer hoy" (por despachar, por cobrar, clientes por reactivar). |
| `/pedidos/nuevo` | Alta de pedido con cliente nuevo o existente, autocompletar por nombre o código, pago inicial. |
| `/pedidos` | Listado con filtros (estado, pago, fechas); detalle con edición, abonos, línea de tiempo e historial de cambios. |
| `/clientes` | Ficha con historial unificado, alertas de duplicados, unificar, eliminar, completar teléfonos. |
| `/catalogo` | Catálogo de productos (`product_codes`) con foto y precio, calculadora de precios, PDF para compartir. |
| `/inventario` | Stock real (`products` + `stock_movements`). Vacío a propósito: el negocio vende por catálogo; el ítem del menú se oculta sin productos. |
| `/reportes` | Ventas por cliente y producto, comparativo mensual, por cobrar, clientes inactivos, histórico 2024/2025. |
| `/despacho` | Bandeja por despachar: generar rótulos y marcar completados, uno o en lote. |
| `/guias` | Asignar la guía de Interrapidísimo pegando o compartiendo el texto del comprobante. |
| `/historial` | Rótulos generados: reimprimir, descargar PDF, cargar guía, enviar por WhatsApp. |
| `/crear` | Editor de rótulo; se abre desde un pedido (`?fromOrderId=`) o un rótulo existente (`?id=`). No está en el menú. |
| `/configuracion` | Datos del negocio, usuarios permitidos, exportar/backup, comparar y restaurar backup, subir fotos en lote. |
| `/pedidos/importados` | Auditoría de pedidos cargados desde Excel. |

En pantallas de menos de 640px las tablas se muestran como tarjetas. La app
es una PWA instalable (sin modo offline).

## Stack técnico

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **React 19**.
- **Supabase**: Postgres + Auth (OAuth) + Row Level Security. Fallback a
  `localStorage` si no hay variables de Supabase configuradas (solo para
  desarrollo local sin backend).
- **Vercel**: hosting y despliegue.
- **Tailwind CSS** + Radix UI para componentes.
- **pdf-lib** para los PDF (rótulo, catálogo, resumen de pedido), server-side;
  **sharp** para reducir las fotos del catálogo.
- **Vitest + Testing Library** (unit/component) y **Playwright** (e2e).

## Autenticación y usuarios permitidos

Login vía Supabase Auth con **OAuth de Microsoft**. Además del login, todo
usuario autenticado debe existir en la tabla `public.allowed_users`
(email exacto) — si no está en la allowlist, se cierra la sesión
automáticamente y se redirige a `/login?unauthorized=1`.

- `proxy.ts` protege todas las rutas de página (excepto `/login` y
  `/auth/callback`).
- Las rutas bajo `/api` **no** pasan por ese proxy (el matcher excluye
  `api/`); cada una valida sesión + allowlist por su cuenta con
  `src/lib/require-session.ts`. La excepción es `/api/cron/backup`, que
  valida `CRON_SECRET`.

Para dar acceso a alguien nuevo: `Configuración` → "Usuarios permitidos".

### Rutas API

| Ruta | Uso |
|---|---|
| `POST /api/labels/pdf` | PDF del rótulo a partir del payload del cliente. |
| `/api/orders/summary/pdf` | PDF del resumen de compra de un pedido. |
| `/api/catalog/pdf` | PDF del catálogo. |
| `GET /api/export` | CSV por tabla (lista fija) o backup JSON completo. |
| `/api/allowed-users` | Listar, agregar y quitar usuarios permitidos. |
| `POST /api/backups/restore/preview` y `/execute` | Restauración controlada de un backup JSON. |
| `GET /api/cron/backup` | Backup diario (cron de Vercel, 06:00 UTC) al bucket `backups`; conserva los últimos 30. |

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
| `CRON_SECRET` | **solo servidor** (`/api/cron/backup`) | Vercel la envía como `Authorization: Bearer` al cron |
| `BACKUP_RESTORE_ENABLED` | **solo servidor** | `true` para habilitar la restauración de backups |
| `BACKUP_RESTORE_ALLOWED_EMAILS` | **solo servidor** | correos que pueden restaurar |

En Vercel deben estar configuradas para **Production** (verificar con
`vercel env ls production`). Las tres últimas no hacen falta en local.

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

Con Node 26 local, los tests necesitan
`NODE_OPTIONS=--no-experimental-webstorage`.

## Scripts de datos

Se corren a mano, con `.env.local` configurado; ninguno se ejecuta solo.

| Comando | Qué hace |
|---|---|
| `npm run import:excel -- <ruta.xlsx> [--commit]` | Importa pedidos históricos del Excel del negocio. Idempotente; sin `--commit` solo muestra la vista previa. |
| `npm run import:perfumes` | Importa el catálogo mayorista a `product_codes`. |
| `npx tsx scripts/import-product-photos.ts <carpeta> [--commit]` | Sube fotos nombradas como el código (`PS-M-001.jpg`). También se puede desde `Configuración`. |
| `npx tsx scripts/list-missing-photos.ts` | Lista productos sin foto. |
| `npm run backfill:payments -- [--commit]` | Marca como pagados los pedidos importados. Equivale al SQL de `supabase/manual/`. |

## Supabase y migraciones

Migraciones en `supabase/migrations/`, en orden por nombre (timestamp). En
la práctica se aplican **a mano en el SQL Editor de Supabase**: el CLI
(`supabase db push --workdir apps/rotulos`) no tiene sesión en este entorno.
`supabase/manual/` guarda SQL que no es migración:
`verificar_migraciones_pendientes.sql` (solo lectura, dice cuáles faltan) y
el backfill de pagos históricos.

Tablas principales: `customers`, `orders` + `order_items`, `order_payments`,
`order_edits`, `product_codes` (catálogo), `products` + `stock_movements`
(inventario), `labels`, `settings`, `order_sequences`, `allowed_users`,
`backup_restore_runs`. Buckets de Storage: `product-images` y `backups`.
Todas las tablas tienen RLS activo, restringido al rol `authenticated` (sin
acceso `anon`); dentro de ese rol las políticas de escritura no distinguen
entre usuarios de la allowlist, aceptado como riesgo bajo para un equipo
chico de confianza.

Guardar pedido, editar pedido y unificar clientes pasan por las RPC
transaccionales `save_order`, `update_order` y `merge_customers`.

## Despliegue

Automático: un push a `main` despliega en Vercel (proyecto
`purpleshoponline`, Root Directory `apps/rotulos`). Antes del push: correr
las 4 validaciones. Después: abrir producción y confirmar login, un pedido y
un rótulo/PDF. Si un cambio trae migración, aplicarla antes de usar la
función.

## Respaldo

Hay un backup JSON automático diario (ver `/api/cron/backup`). Además,
antes de una operación masiva (importar Excel, unificar varios clientes,
restaurar), descargar uno a mano:

1. Iniciar sesión → `Configuración`.
2. Sección "Exportar datos": descargar los 4 CSV (Clientes, Pedidos,
   Líneas de pedido, Catálogo de productos) y el "Backup completo (JSON)".
3. Guardar esos archivos fuera del repo (carpeta local o Drive), no se
   suben a git.

El plan de Supabase es Free, sin point-in-time recovery: estos backups son
el único respaldo. La restauración desde `Configuración` cubre solo
`customers`, `labels`, `settings` y `order_payments`, con vista previa y
confirmación escrita.

## Pendientes

Ver `/NEXT_STEPS.md`. Reglas técnicas y estado reciente: `/CLAUDE.md`.
Marca: `/docs/brand/BRAND.md`.

## PDF e impresión

Tamaños soportados: **10×9 cm** y **14×12 cm** (default), configurable en
`Configuración`. Preview, impresión de navegador y PDF comparten el mismo
diseño (`globals.css` + `src/lib/pdf.ts`): si se cambia uno, cambiar el otro
y validar los dos. Impresión física validada con la impresora final.

Recomendaciones de impresión:

- Papel/etiqueta al tamaño configurado, escala 100%, márgenes en cero.
- Desactivar encabezados/pies de página del navegador si se imprime desde
  ahí en vez de descargar el PDF.
