# 001 — Corregir `transition-all` del toast y agregar animación de entrada

- **Status**: TODO
- **Commit**: 3c5dd1b
- **Severity**: HIGH
- **Category**: Performance (5) + Interruptibility/Missed opportunity (4/8)
- **Estimated scope**: 1 archivo (`src/components/ui/toast.tsx`) + 1 bloque en `src/app/globals.css`

## Problem

`src/components/ui/toast.tsx:48-51`, código actual:

```tsx
className={cn(
  "flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-popover data-[state=closed]:opacity-0 data-[swipe=end]:translate-x-full",
  "transition-all duration-200",
)}
```

Dos problemas:
1. `transition-all` anima TODAS las propiedades (incluyendo layout como `padding`/`border-width` si algún estado las tocara), no solo `opacity`/`transform` — animar de más cuesta compositing innecesario.
2. El toast se monta ya en `data-state="open"`. Una `transition` de CSS solo dispara cuando una propiedad CAMBIA de valor; como no hay un estado previo distinto, la entrada nunca anima — el toast aparece de golpe. Solo la salida (`data-state=closed`) funciona porque sí hay cambio de estado.

## Target

```tsx
// src/components/ui/toast.tsx — target
className={cn(
  "toast-root flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-popover data-[state=closed]:opacity-0 data-[swipe=end]:translate-x-full",
  "transition-[opacity,transform] duration-200 ease-out",
)}
```

```css
/* src/app/globals.css — agregar junto a los demás tokens en :root */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

```css
/* src/app/globals.css — nueva seccion "Animaciones de superposiciones" */
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-root[data-state="open"] {
  animation: toast-in 200ms var(--ease-out);
}
```

La entrada usa `@keyframes` (CSS Animation) en vez de `transition` porque las animaciones SÍ corren en el montaje sin necesitar un estado previo — evita pelear con el problema de "transition no dispara en mount". La salida sigue usando la `transition` existente (ya funciona porque `data-[state=closed]` sí es un cambio de estado real).

## Repo conventions to follow

- Tokens semánticos viven en `:root` de `globals.css` (ver bloque `/* ---- Tokens semanticos (fuente de verdad) ---- */`, línea 21). Agregar `--ease-out` ahí, en una subsección nueva `/* ---- Tokens de movimiento ---- */`.
- El repo ya mezcla CSS plano en `globals.css` (ej. `.app-shell-sidebar`, línea 136) con clases Tailwind en los componentes — este patrón (marker class + reglas en `globals.css`) es consistente con eso.
- `cn()` de `@/lib/cn` para componer clases (ya usado en el archivo).

## Steps

1. En `apps/rotulos/src/app/globals.css`, dentro de `:root` (después del bloque de tokens semánticos, antes de "Tintes translucidos"), agregar:
   ```css
   /* ---- Tokens de movimiento ---- */
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   ```
2. En `apps/rotulos/src/app/globals.css`, agregar al final del archivo una sección `/* ---- Animaciones de superposiciones ---- */` con el bloque `@keyframes toast-in` y la regla `.toast-root[data-state="open"]` del target de arriba.
3. En `apps/rotulos/src/components/ui/toast.tsx`, reemplazar el `className` del `RadixToast.Root` (líneas 48-51) por el target de arriba: agregar clase marcador `toast-root`, cambiar `transition-all` por `transition-[opacity,transform]` y agregar `ease-out`.

## Boundaries

- No tocar `RadixToast.Provider`, `duration={4000}`, ni la lógica de `push`/`remove` en el mismo archivo.
- No agregar dependencias (nada de `tailwindcss-animate` ni librerías de animación).
- No tocar otros componentes en este plan (dropdown, modal, drawer se cubren en planes separados).
- Si el className actual no coincide exactamente con el citado arriba (código cambió desde el commit `3c5dd1b`), detenerse y reportar en vez de improvisar.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — las 4 deben pasar sin nuevos errores/warnings.
- **Feel check**: correr la app, disparar un toast (ej. guardar un cliente/pedido).
  - El toast debe entrar con un fade + leve desplazamiento hacia arriba (8px → 0), no aparecer de golpe.
  - Al cerrarlo (botón X o que expire a los 4s), debe seguir haciendo fade-out normal (sin regresión).
  - Deslizar el toast hacia la derecha (swipe) debe seguir funcionando igual que antes (no roto por el cambio de `transition-all` a propiedades específicas).
  - En DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce": el toast puede seguir animando (200ms es corto, no es una animación de movimiento agresiva) — no es bloqueante para este plan.
- **Done when**: toast entra con fade+translateY visible, sale igual que antes, swipe sigue funcionando, las 4 validaciones pasan.
