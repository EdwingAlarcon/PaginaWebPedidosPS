# Migración de Purple Shop (raíz) de GitHub Pages a Vercel/Supabase

Fecha: 2026-07-16
Estado: Aprobado por el usuario, listo para plan de implementación.

## Contexto

La app raíz del repo (`index.html` + `src/`) es Purple Shop, la app legacy
de gestión de pedidos/inventario: HTML/CSS/JS sin build, servida hoy vía
GitHub Pages, con login Microsoft (MSAL/Azure AD) y sync a un Excel en
OneDrive vía Microsoft Graph (`src/modules/excel.js`). El inventario de
stock (`src/core/inventory.js`) vive solo en `localStorage` del navegador.

En paralelo, `apps/rotulos` es una app Next.js/TypeScript/Tailwind ya
migrada a Vercel (`https://rotulos-xi.vercel.app`) y Supabase (proyecto
`purpleshop`, ref `enrruhuzlnqqjnsabgzq`). Ya tiene tablas `customers`,
`orders`, `order_items`, `product_codes`, `settings`, `labels` y
`order_sequences` con RLS, además de una shell visual tipo Purple Shop
(sidebar, topbar, Dashboard, Pedidos, Clientes, Inventario, Reportes,
Rótulos, Historial) y auth con Supabase magic link.

No hay datos reales de producción todavía en la app raíz (ni en Excel/
OneDrive con uso real desde esta app, ni en localStorage) — la migración
parte en limpio, sin necesidad de un import de datos existentes.

## Decisión

En vez de migrar la app raíz a un proyecto Vercel/Supabase nuevo y
separado, se **fusiona toda su funcionalidad restante en `apps/rotulos`**,
que pasa a ser la única app / fuente de verdad del negocio. Se evita así
duplicar esquema, auth y RLS ya construidos y probados.

Alcance de esta migración:
1. Agregar inventario de stock a Supabase + UI en `apps/rotulos`.
2. Completar la migración 1:1 de Reportes (pendiente ya anotada en
   `apps/rotulos/PENDING_QA.md`) para que cubra también inventario.
3. Retirar por completo la integración Microsoft (MSAL/Azure AD, sync a
   Excel/OneDrive) — Supabase Auth (magic link) y Supabase Postgres pasan
   a ser la única fuente de identidad y de datos.
4. Cortar el hosting: apagar GitHub Pages, `https://rotulos-xi.vercel.app`
   (o el dominio que se configure) pasa a ser la URL real del negocio.
   Sin período de convivencia — es un corte directo, no una migración
   gradual con ambas versiones activas.
5. Borrar del repo los archivos legacy de la raíz una vez validado el
   corte (`index.html`, `src/`, `css/`, `html/`, `pwa/` y todo lo que hoy
   sirve GitHub Pages). Quedan disponibles en el historial de git.

Fuera de alcance: no hay integración con el workbook Excel "REFERENCIAS"
del gerente hoy desde esta app (ver advertencia en `CLAUDE.md` de la
raíz — nunca estuvo conectado); esto no cambia con la migración.

## Modelo de datos nuevo

Nueva migración SQL en `apps/rotulos/supabase/migrations/`, siguiendo el
mismo patrón de la migración existente (RLS habilitada, políticas
`authenticated` con `using (true)`/`with check (true)` salvo donde ya
existe un patrón de "dueño" como `created_by`):

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  sku text not null default '',
  unit_price numeric not null default 0,
  current_stock numeric not null default 0,
  min_stock numeric not null default 0,
  max_stock numeric,
  last_restock_date timestamptz,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('entrada', 'salida', 'ajuste', 'transferencia')),
  quantity numeric not null,
  reason text not null default '',
  supplier text not null default '',
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
```

Índices: `products (category)`, `products (sku)` único donde `sku <> ''`,
`stock_movements (product_id)`, `stock_movements (created_at desc)`.

`current_stock` en `products` se recalcula vía un trigger de Postgres en
`stock_movements` (`after insert`): suma la cantidad si el tipo es
`entrada`, resta si es `salida`, y aplica el delta directo si es `ajuste`
o `transferencia`. Se mantiene toda la lógica de consistencia en la base
de datos, no en la capa de aplicación, para que cualquier inserción
(desde la UI o desde SQL directo) mantenga `current_stock` correcto.

## UI / rutas

`apps/rotulos/src/app/inventario` ya existe como pantalla base (según
`PENDING_QA.md`: "Inventario conserva una pantalla base preparada para
conectar stock/movimientos"). Se completa esa ruta para:
- Listar productos con stock actual, filtrable por categoría.
- Alertas de stock bajo/crítico/exceso (mismos umbrales que
  `src/core/inventory.js` legacy: `minStock`/umbrales de "crítico").
- Registrar movimientos (entrada/salida/ajuste/transferencia) y ver
  historial de movimientos por producto.

`apps/rotulos/src/app/reportes` se extiende para incluir métricas de
inventario (valor total de stock, productos con stock bajo, etc.) junto a
lo que ya reporta de pedidos.

## Auth y control de acceso

Se elimina el allowlist por hash SHA-256 de `AuthManager` (era un gate
solo client-side, nunca un límite de seguridad real — ver `CLAUDE.md`).
El control de acceso pasa a ser: solo las personas invitadas explícitamente
en Supabase Auth (por correo, vía magic link) pueden entrar. Esto es
consistente con cómo ya funciona `apps/rotulos` hoy.

## Corte de hosting

1. Validar en producción (`https://rotulos-xi.vercel.app` o dominio
   definitivo) que inventario/reportes funcionan end-to-end.
2. Apagar GitHub Pages (Settings → Pages → "None" en el repo).
3. Si existía algún enlace/marcador al dominio de GitHub Pages fuera del
   repo (documentación, favoritos del negocio), se le informa al usuario
   la nueva URL — esto queda como aviso manual, no una tarea de código.

## Limpieza del repo

Tras validar el corte:
- Borrar `index.html`, `src/`, `css/`, `html/`, `pwa/`, y cualquier otro
  archivo que solo servía a la app legacy servida por GitHub Pages.
- Mantener en la raíz: `README.md` (actualizado para reflejar que la app
  vive en `apps/rotulos`), `CLAUDE.md` (actualizado), `docs/`, `LICENSE`,
  `.gitattributes`/`.gitignore` si siguen aplicando a `apps/rotulos`.
- `CLAUDE.md` se reescribe para describir `apps/rotulos` como la única
  app del repo (arquitectura Next.js/Supabase), retirando toda la sección
  de arquitectura legacy (carga de scripts, EventBus, MSAL, Excel raw
  fetch, etc.) — pasa a ser historia, documentada quizás en un
  `docs/HISTORIA.md` breve si el usuario quiere conservar el contexto de
  por qué existía.

## Pendiente ya anotado, no parte de esta migración pero relacionado

- Revocar el Supabase access token expuesto en el chat de la sesión
  anterior (`NEXT_STEPS.md`) — se recomienda hacerlo ya, no depende de
  esta migración.
- Validar impresión física/PDF de rótulos a escala 100% con la impresora
  final — no relacionado con esta migración, sigue pendiente aparte.

## Fuera de alcance / riesgos aceptados

- Sin período de convivencia GitHub Pages + Vercel: si algo falla tras el
  corte, el rollback es re-activar GitHub Pages (el código legacy solo se
  borra del repo *después* de validar, no antes).
- No se migra el workbook Excel "REFERENCIAS" del gerente porque nunca
  estuvo conectado a esta app — sigue siendo un proceso manual del
  negocio, sin cambios.
