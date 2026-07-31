# 004 — Animación de entrada para DropdownMenu, anclada al trigger

- **Status**: TODO
- **Commit**: 3c5dd1b
- **Severity**: HIGH
- **Category**: Physicality (3) + Missed opportunity (8)
- **Estimated scope**: 1 archivo (`dropdown-menu.tsx`) + bloque en `globals.css`

## Problem

`src/components/ui/dropdown-menu.tsx:14-20`, código actual:

```tsx
<RadixDropdown.Content
  ref={ref}
  sideOffset={sideOffset}
  className={cn(
    "z-50 min-w-40 rounded-md border border-border bg-surface p-1 shadow-popover",
    className,
  )}
  {...props}
/>
```

Sin ninguna animación ni `transform-origin`. Radix expone `--radix-dropdown-menu-content-transform-origin` específicamente para que los menús escalen desde el punto donde tocan a su trigger (arriba, abajo, izquierda o derecha según el espacio disponible) — no usarlo hace que, si se animara con un origen fijo, se vería mal en algunos lados. Hoy ni siquiera anima: aparece y desaparece de golpe.

## Target

```tsx
// dropdown-menu.tsx — Content
className={cn(
  "dropdown-content z-50 min-w-40 rounded-md border border-border bg-surface p-1 shadow-popover",
  className,
)}
```

```css
/* src/app/globals.css — seccion "Animaciones de superposiciones" */
@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
.dropdown-content {
  transform-origin: var(--radix-dropdown-menu-content-transform-origin);
}
.dropdown-content[data-state="open"] {
  animation: dropdown-in 150ms var(--ease-out);
}
.dropdown-content[data-state="closed"] {
  animation: dropdown-out 150ms var(--ease-out);
}
```

150ms (no 200ms) porque AUDIT.md categoría 2 marca 150-250ms como rango para dropdowns/selects, y este es un menú simple de pocos ítems — el extremo corto del rango es correcto (feedback debe sentirse inmediato en un elemento que probablemente se abre varias veces por sesión).

## Repo conventions to follow

- Mismo patrón `@keyframes` + `[data-state]` de los planes 001-003.
- `--ease-out` ya definido (por plan 001, o agregarlo si este plan corre primero).
- `cn()` ya usado en el archivo.

## Steps

1. Si `--ease-out` no existe todavía en `:root` de `globals.css`, agregarlo (ver plan 001, paso 1).
2. En `globals.css`, agregar los 2 `@keyframes` (`dropdown-in`, `dropdown-out`) y las 3 reglas (`transform-origin`, `[data-state=open]`, `[data-state=closed]`) del target de arriba, en la sección `/* ---- Animaciones de superposiciones ---- */`.
3. En `src/components/ui/dropdown-menu.tsx`, línea 17-20: agregar clase `dropdown-content` al primer elemento del array en `cn(...)` de `DropdownMenuContent`.

## Boundaries

- No tocar `DropdownMenuItem`, `DropdownMenuCheckboxItem`, ni `DropdownMenuSeparator` — sus `transition-colors` en hover/highlight ya son correctos, sin hallazgo.
- No tocar el componente `Popover` si existe uno separado en el repo (verificar con `grep -r "react-popover"` antes de tocar nada fuera de `dropdown-menu.tsx` — si hay un `popover.tsx` separado, queda fuera de este plan).
- No agregar dependencias.
- Si el className citado no coincide con el código actual (drift desde `3c5dd1b`), detenerse y reportar.

## Verification

- **Mechanical**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — las 4 deben pasar.
- **Feel check**: abrir el menú de usuario (`user-menu.tsx` lo usa) y cualquier otro dropdown en la app (ej. menú por fila en Clientes).
  - El menú debe crecer desde el punto donde toca al botón que lo abrió (no desde el centro ni desde una esquina fija) — probar abriéndolo con el trigger arriba, abajo, a la izquierda y a la derecha de la pantalla si es posible, y confirmar que el origen de escala cambia según el lado.
  - Duración debe sentirse rápida/inmediata (150ms), no lenta.
  - Cerrar (click afuera, Escape, seleccionar un ítem) debe verse como el proceso inverso, no un corte.
- **Done when**: el dropdown escala desde su trigger en cualquier posición de pantalla, entra y sale con animación visible, las 4 validaciones pasan.
