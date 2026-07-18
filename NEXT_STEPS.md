# Purple Shop — Próximos pasos / handoff

> Última actualización: 2026-07-18.

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

## Pendiente

- **Revocar el Supabase access token** que quedó expuesto en el chat de
  una sesión anterior (2026-07-16) — hacerlo desde Supabase Account
  Settings → Access Tokens.
- **Push del commit que retira la raíz legacy** (`8f52271`) a
  `origin/main` — pendiente de confirmación explícita del usuario antes
  de correrlo (repo de un solo dev sin PRs, pero este cambio es grande).
- Impresión física real del rótulo con impresora final todavía no
  probada (solo validación en pantalla/PDF hasta ahora).

## Cosas explícitamente fuera de alcance / no tocar sin permiso

- **No sincronizar contra el workbook Excel real del negocio**
  ("REFERENCIAS") — nunca estuvo conectado a esta app, y no cambia con
  la migración. Ver advertencia en `CLAUDE.md` de la raíz.
- **No hacer push sin confirmación explícita del usuario**, salvo que ya
  lo haya pedido explícitamente (Edwing pidió el 2026-07-16 que se
  commitee y pushee sin repreguntar tras cada fix verificado — repo de un
  solo dev, sin PRs de por medio; este commit de retiro de legacy es la
  excepción que sí pide confirmación explícita por su tamaño).
