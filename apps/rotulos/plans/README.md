# Planes de animación — apps/rotulos

Generados por `improve-animations` sobre el commit `3c5dd1b`. Alcance recortado
la noche del 2026-07-31 para evitar riesgo antes del arranque del mes de
pedidos de agosto: se aplicaron los hallazgos HIGH/MEDIUM de bajo riesgo
(componentes aislados, sin tocar el layout general). El rework estructural del
sidebar (animar `transform` en vez de `width`) y las mejoras LOW (fade del
label del sidebar, crossfade del ícono de colapso) quedan documentados como
pendientes, no aplicados.

| # | Plan | Severidad | Status |
| --- | --- | --- | --- |
| 001 | [Toast: `transition-all` y animación de entrada](001-toast-transition-all-and-entrance.md) | HIGH | APLICADO |
| 002 | [Modal/ConfirmDialog: entrada real](002-modal-confirm-dialog-entrance.md) | HIGH | APLICADO |
| 003 | [Drawer: entrada real](003-drawer-entrance.md) | HIGH | APLICADO |
| 004 | [DropdownMenu: entrada anclada al trigger](004-dropdown-menu-entrance.md) | HIGH | APLICADO |
| 005 | [Sidebar: token de easing](005-sidebar-easing-token.md) | LOW | APLICADO |

## Orden de ejecución

001 primero (define `--ease-out` y crea la sección `/* Animaciones de
superposiciones */` en `globals.css` que los demás reusan). 002-005 son
independientes entre sí una vez aplicado 001. Todos ya se aplicaron en el
mismo commit.

## Pendiente, no aplicado esta noche (bajo riesgo pero fuera de alcance)

- **Sidebar: `width`/`padding-left` → `transform`** (hallazgo #4 del audit,
  parte de performance). Animar `width` fuerza reflow de toda la página en
  cada toggle. Requiere repensar el layout del sidebar colapsable
  (clip/overflow o mantener ancho fijo y usar `translateX`) — riesgo
  estructural que no se tocó a propósito antes del mes de agosto.
- **Label del sidebar** (`app-shell.tsx`, `{!collapsed && <span>}`) — el texto
  aparece/desaparece de golpe en vez de acompañar los 160ms de la transición
  del ancho. Severidad LOW, deprioritizado.
- **Ícono de colapso** (`PanelLeftOpen`/`PanelLeftClose` en `app-shell.tsx`) —
  swap instantáneo sin crossfade. Missed opportunity, deprioritizado.
- **`prefers-reduced-motion`** — ningún componente lo maneja. No era
  bloqueante antes de estos planes porque nada animaba movimiento; ahora que
  001-004 agregan `transform`/`translate`, vale la pena revisarlo en una
  pasada futura (agregar `@media (prefers-reduced-motion: reduce)` que
  mantenga el fade de opacidad pero anule los `transform` en los keyframes).
