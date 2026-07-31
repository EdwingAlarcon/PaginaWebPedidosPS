# 005 — Reemplazar `ease` suelto por el token `--ease-in-out` en el colapso del sidebar

- **Status**: TODO
- **Commit**: 3c5dd1b
- **Severity**: LOW (parte segura del hallazgo #4 del audit; la parte de performance —
  migrar `width`/`padding-left` a `transform`— queda fuera de este plan, ver Boundaries)
- **Category**: Easing & duration (2)
- **Estimated scope**: 1 archivo (`globals.css`, 2 líneas)

## Problem

`src/app/globals.css:146` y `:190`, código actual:

```css
.app-shell-sidebar {
  /* ... */
  transition: width 160ms ease;
  /* ... */
}

.app-shell-content-wrap {
  /* ... */
  transition: padding-left 160ms ease;
}
```

`ease` (el built-in de CSS) es una curva débil para movimiento deliberado en UI — AUDIT.md categoría 2 recomienda curvas custom más fuertes. Esto es "moving/morphing on screen" (el sidebar cambia de ancho), corresponde `ease-in-out`.

Nota explícita: el hallazgo original también marcaba que animar `width`/`padding-left` fuerza reflow de toda la página (categoría 5, performance). Ese rework (pasar a `transform`) requiere repensar el layout del sidebar colapsable y es riesgo estructural — se documenta como pendiente en `plans/README.md`, no se aplica en este plan.

## Target

```css
/* src/app/globals.css:146 */
transition: width 160ms var(--ease-in-out);
```

```css
/* src/app/globals.css:190 */
transition: padding-left 160ms var(--ease-in-out);
```

```css
/* src/app/globals.css — agregar junto a --ease-out en :root */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

## Repo conventions to follow

- Mismo bloque de tokens `/* ---- Tokens de movimiento ---- */` que agrega `--ease-out` en el plan 001 — agregar `--ease-in-out` ahí mismo.

## Steps

1. Si el bloque `/* ---- Tokens de movimiento ---- */` no existe todavía en `:root` de `globals.css` (ningún plan anterior corrió), crearlo con `--ease-out` (ver plan 001, paso 1) y agregar `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);` en la misma línea siguiente. Si ya existe (por el plan 001), solo agregar la línea de `--ease-in-out`.
2. En `globals.css:146`, cambiar `transition: width 160ms ease;` por `transition: width 160ms var(--ease-in-out);`.
3. En `globals.css:190`, cambiar `transition: padding-left 160ms ease;` por `transition: padding-left 160ms var(--ease-in-out);`.

## Boundaries

- No cambiar `width: 248px`, la lógica de `collapsed` en `app-shell.tsx`, ni la duración (160ms se mantiene).
- No migrar la animación a `transform` — eso es un rework de layout aparte, no aplicar en este plan.
- No tocar el label del sidebar que aparece/desaparece con `{!collapsed && <span>}` (hallazgo separado, no priorizado esta noche).
- Si las líneas citadas no coinciden con el código actual (drift desde `3c5dd1b`), detenerse y reportar.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — las 4 deben pasar.
- **Feel check**: colapsar/expandir el sidebar varias veces.
  - El movimiento debe sentirse igual de rápido (160ms) pero con una aceleración/desaceleración más definida que antes, no un cambio dramático — es un ajuste sutil de curva, no de duración.
  - No debe haber salto ni parpadeo visual al cambiar de estado.
- **Done when**: las dos `transition` usan `var(--ease-in-out)`, el token está definido, las 4 validaciones pasan.
