# 003 — Animación de entrada real para Drawer

- **Status**: TODO
- **Commit**: 3c5dd1b
- **Severity**: HIGH
- **Category**: Physicality (3) + Missed opportunity (8)
- **Estimated scope**: 1 archivo (`drawer.tsx`) + bloque en `globals.css`

## Problem

`src/components/ui/drawer.tsx:14-20`, código actual:

```tsx
<Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
<Dialog.Content
  ref={ref}
  className={cn(
    "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
    className,
  )}
  {...props}
>
```

Mismo par de problemas que el plan 002 (overlay con `transition-opacity` muerto + contenido sin ninguna animación), pero el drawer entra desde el borde derecho, no centrado — necesita su propio keyframe de traslación en vez de escala.

## Target

```tsx
// drawer.tsx — Overlay
<Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/40" />
```

```tsx
// drawer.tsx — Content
className={cn(
  "drawer-content fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
  className,
)}
```

```css
/* src/app/globals.css — seccion "Animaciones de superposiciones" (compartida con planes 001/002) */
@keyframes drawer-in {
  from {
    opacity: 0;
    transform: translateX(2%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes drawer-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(2%);
  }
}
.drawer-content[data-state="open"] {
  animation: drawer-in 250ms var(--ease-out);
}
.drawer-content[data-state="closed"] {
  animation: drawer-out 200ms var(--ease-out);
}
```

`translateX(2%)` en vez de un valor fijo en px — usa el ancho del propio drawer como referencia (AUDIT.md categoría 8: preferir porcentajes/`translate` relativos sobre offsets hardcodeados en px). 2% es sutil a propósito: el drawer ya entra desde fuera de la pantalla visualmente por su posición `right-0`, este desplazamiento es solo el remate final del movimiento, no todo el recorrido.

`.dialog-overlay` reusa exactamente las mismas reglas `overlay-in`/`overlay-out` que el plan 002 — si el plan 002 ya se ejecutó, este paso ya está hecho, no duplicar.

## Repo conventions to follow

- Mismo patrón `@keyframes` + `[data-state]` de los planes 001/002 — todo vive en la sección `/* ---- Animaciones de superposiciones ---- */` de `globals.css`.
- `--ease-out` definido por el plan 001 (o por este mismo plan si se ejecuta primero, ver Steps).
- `cn()` ya usado en este archivo, mantener el patrón.

## Steps

1. Si `--ease-out` no existe todavía en `:root` de `globals.css` (ningún plan anterior corrió), agregarlo (ver plan 001, paso 1).
2. Si la clase `.dialog-overlay` con `overlay-in`/`overlay-out` no existe todavía en `globals.css` (el plan 002 no corrió), agregarla (ver plan 002, target). Si ya existe, omitir este paso.
3. En `globals.css`, agregar los 2 `@keyframes` (`drawer-in`, `drawer-out`) y las 2 reglas `[data-state]` del target de arriba a la sección `/* ---- Animaciones de superposiciones ---- */`.
4. En `src/components/ui/drawer.tsx`:
   - Línea 14: agregar clase `dialog-overlay`, quitar `transition-opacity duration-200`.
   - Línea 17-20: agregar clase `drawer-content` al primer elemento del array en `cn(...)`.

## Boundaries

- No tocar `modal.tsx` ni `confirm-dialog.tsx` (plan 002).
- No cambiar el lado desde el que entra el drawer (`right-0`) ni su ancho (`max-w-md`).
- No agregar dependencias.
- Si el className citado no coincide con el código actual (drift desde `3c5dd1b`), detenerse y reportar.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — las 4 deben pasar.
- **Feel check**: abrir un drawer en la app (buscar el uso real de `Drawer`/`DrawerContent` en `src/components` antes de probar — si no hay ningún caso de uso todavía, verificar al menos que compila y que no rompe el patrón visual de modal.tsx al compararlos en DevTools).
  - El overlay debe hacer fade-in igual que en modal/confirm-dialog.
  - El panel debe deslizarse suavemente desde la derecha con un remate de opacidad, no aparecer ya en su posición final.
  - Cerrar debe verse como el proceso inverso.
- **Done when**: drawer entra/sale con transición visible desde el borde derecho, overlay hace fade real, las 4 validaciones pasan.
