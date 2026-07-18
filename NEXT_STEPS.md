# Purple Shop — Próximos pasos / handoff

> Última actualización: 2026-07-17.

## Estado actual: migración de GitHub Pages a Vercel/Supabase en curso

`apps/rotulos/` (Next.js/TypeScript/Supabase) va camino a convertirse en la
**única** app del repo, reemplazando por completo la raíz legacy
(HTML/CSS/JS + MSAL/Excel, servida hoy en GitHub Pages). Ver
`docs/superpowers/specs/2026-07-16-migracion-vercel-supabase-design.md`
y los tres planes en `docs/superpowers/plans/` de esa fecha para el detalle
completo de lo decidido y hecho.

**Producción:** `https://purpleshoponline.vercel.app` — ya incluye pedidos,
clientes, inventario (con alertas de stock), reportes, y el generador de
rótulos con el diseño ilustrado aprobado (fondo `label-template-bg.png` +
datos superpuestos). Validado visualmente por Edwing el 2026-07-17
("se ve igual a la imagen").

**Supabase:** proyecto `purpleshop` (ref `enrruhuzlnqqjnsabgzq`). Las tres
migraciones existentes ya están aplicadas en remoto:
`202607150001_create_rotulos_schema.sql`,
`202607161000_create_inventory_schema.sql`,
`202607162000_add_label_size.sql`.

## Lo que falta para cerrar la migración (en este orden)

1. **Apagar GitHub Pages** — Settings → Pages → "None" en el repo de
   GitHub. Sin convivencia planeada: una vez apagado, `apps/rotulos` en
   Vercel es la única versión real. Rollback disponible = reactivar Pages
   (el código legacy de la raíz todavía no se borra en este paso).
2. **Borrar el código legacy de la raíz** — `index.html`, `src/`, `css/`,
   `html/`, `pwa/`, `tests/` (los que sirven la app legacy, no
   `apps/rotulos/src/__tests__`). Reescribir `README.md`/`CLAUDE.md` para
   describir solo `apps/rotulos`. Ver Tarea 12 del plan
   `2026-07-16-migracion-vercel-supabase.md` para el detalle exacto
   (incluye qué conservar del `package.json` raíz).
   **Solo hacer esto después del paso 1, nunca antes.**

## Deuda técnica menor, no bloqueante

- Vista de historial de movimientos por producto y botón de eliminar
  producto en Inventario: la lógica ya existe en `inventory-store.ts`
  (`listMovements()`, `deleteProduct()`), falta conectarla a un componente.
- Impresión física real del rótulo con impresora final todavía no probada
  (solo validación en pantalla/PDF hasta ahora).
- `duplicateLabel()` en `label-store.ts` corregido (2026-07-17) para copiar
  también el tamaño de rótulo — sin test de regresión dedicado (bajo riesgo).

## Cosas explícitamente fuera de alcance / no tocar sin permiso

- **No sincronizar contra el workbook Excel real del negocio**
  ("REFERENCIAS") — nunca estuvo conectado a esta app, y no cambia con
  la migración. Ver advertencia completa en `CLAUDE.md` de la raíz
  (mientras siga existiendo).
- **Revocar el Supabase access token** que quedó expuesto en el chat de
  una sesión anterior (2026-07-16) — pendiente, hacerlo desde Supabase
  Account Settings → Access Tokens cuando se pueda.
- **No hacer push sin confirmación explícita del usuario**, salvo que ya
  lo haya pedido explícitamente (Edwing pidió el 2026-07-16 que se
  commitee y pushee sin repreguntar tras cada fix verificado — repo de un
  solo dev, sin PRs de por medio).
