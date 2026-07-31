# 002 — Animación de entrada real para Modal y ConfirmDialog

- **Status**: TODO
- **Commit**: 3c5dd1b
- **Severity**: HIGH
- **Category**: Physicality (3) + Missed opportunity (8)
- **Estimated scope**: 2 archivos (`modal.tsx`, `confirm-dialog.tsx`) + bloque en `globals.css`

## Problem

`src/components/ui/modal.tsx:14-20`, código actual:

```tsx
<Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
<Dialog.Content
  ref={ref}
  className={cn(
    "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
    className,
  )}
  {...props}
>
```

`src/components/ui/confirm-dialog.tsx:30-31`, código actual (mismo patrón, inline):

```tsx
<Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
<Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none">
```

Dos problemas, no uno:
1. **El overlay no anima nada hoy.** Tiene `transition-opacity duration-200` pero ninguna regla cambia su `opacity` según `data-state` — la clase es CSS muerto. El overlay aparece de golpe, ya opaco.
2. **El contenido no tiene ninguna animación.** Aparece centrado, a opacidad y escala finales, sin transición. Combinado con el punto 1, todo el diálogo (fondo + tarjeta) hace "pop" instantáneo.

## Target

```tsx
// modal.tsx y confirm-dialog.tsx — Overlay
<Dialog.Overlay className="dialog-overlay fixed inset-0 z-40 bg-black/40" />
```

```tsx
// modal.tsx — Content (agregar marker class "dialog-content-center", mantener el resto)
className={cn(
  "dialog-content-center fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
  className,
)}
```

```tsx
// confirm-dialog.tsx — Content (mismo marker class)
<Dialog.Content className="dialog-content-center fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none">
```

```css
/* src/app/globals.css — seccion "Animaciones de superposiciones" (compartida con plan 001) */
@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes overlay-out {
  from { opacity: 1; }
  to { opacity: 0; }
}
.dialog-overlay[data-state="open"] {
  animation: overlay-in 200ms var(--ease-out);
}
.dialog-overlay[data-state="closed"] {
  animation: overlay-out 200ms var(--ease-out);
}

@keyframes dialog-center-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes dialog-center-out {
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
}
.dialog-content-center[data-state="open"] {
  animation: dialog-center-in 200ms var(--ease-out);
}
.dialog-content-center[data-state="closed"] {
  animation: dialog-center-out 200ms var(--ease-out);
}
```

Nota: `transform-origin: center` en un modal centrado es correcto por diseño (AUDIT.md categoría 3) — no cambiar el origen, solo agregar la animación de escala+opacidad.

## Repo conventions to follow

- Mismo patrón de `@keyframes` + `[data-state]` que el plan 001 (toast) — reusar la sección `/* ---- Animaciones de superposiciones ---- */` en `globals.css`, no crear una nueva.
- `--ease-out` ya definido por el plan 001. Si este plan se ejecuta antes que el 001, agregar el token igual (ver plan 001, paso 1) — no duplicarlo si ya existe.
- `cn()` para componer clases en `modal.tsx` (ya usado). `confirm-dialog.tsx` no usa `cn()` hoy (className directo) — mantenerlo así, no introducir `cn()` ahí para no ampliar el diff.

## Steps

1. Si el plan 001 no se ejecutó todavía en esta sesión, agregar `--ease-out: cubic-bezier(0.23, 1, 0.32, 1);` en `:root` de `globals.css` (ver plan 001, paso 1). Si ya existe, omitir.
2. En `globals.css`, en la sección `/* ---- Animaciones de superposiciones ---- */` (crearla si no existe por el plan 001), agregar los 4 `@keyframes` y las 4 reglas `[data-state]` del target de arriba.
3. En `src/components/ui/modal.tsx`:
   - Línea 14: agregar clase `dialog-overlay` al `Dialog.Overlay`, quitar `transition-opacity duration-200` (reemplazado por la animación).
   - Línea 17-20: agregar clase `dialog-content-center` al primer elemento del array que recibe `cn(...)`.
4. En `src/components/ui/confirm-dialog.tsx`:
   - Línea 30: mismo cambio que el paso 3 en el `Dialog.Overlay`.
   - Línea 31: agregar clase `dialog-content-center` al `Dialog.Content`.

## Boundaries

- No tocar `drawer.tsx` (plan separado, 003) aunque comparte el mismo patrón de overlay — el drawer entra desde el borde, no centrado, necesita su propio keyframe.
- No tocar la lógica de apertura/cierre (`open`, `onOpenChange`) ni el contenido interno (`Dialog.Title`, `Dialog.Description`, botones).
- No agregar dependencias.
- Si el className citado no coincide con el código actual (drift desde `3c5dd1b`), detenerse y reportar.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — las 4 deben pasar.
- **Feel check**: abrir un modal (ej. "Editar cliente") y un ConfirmDialog (ej. eliminar un cliente).
  - El fondo oscuro debe hacer fade-in real (antes aparecía de golpe).
  - La tarjeta debe crecer levemente desde 95% con fade-in, no aparecer a tamaño completo instantáneamente.
  - Al cerrar (botón X, click afuera, Cancelar), debe verse la animación inversa (fade-out + achicarse a 95%), no un corte seco.
  - En DevTools → Animations panel, bajar playback a 10% y confirmar que la tarjeta escala desde el centro (no desde una esquina) — correcto porque es un modal centrado.
  - Abrir/cerrar varias veces rápido no debe dejar el overlay o la tarjeta en un estado visual roto (opacidad a medias trabada, etc.).
- **Done when**: overlay y tarjeta animan juntos de forma coherente en apertura y cierre, en Modal y en ConfirmDialog, sin regresiones en las 4 validaciones.
