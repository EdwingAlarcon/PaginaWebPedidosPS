# Unificar el diseño visual de apps/rotulos con la raíz (Purple Shop)

Fecha: 2026-07-16
Estado: Aprobado por el usuario, listo para plan de implementación.

## Contexto

Tras migrar Inventario a `apps/rotulos` (ver
`docs/superpowers/specs/2026-07-16-migracion-vercel-supabase-design.md`),
el usuario notó que la app Next visualmente no se parece al rediseño
pulido que hoy tiene la raíz en GitHub Pages (trabajo "Bloque 0-8":
sidebar + topbar, modo oscuro real, tipografía Segoe UI, ~4700 líneas de
CSS afinado). `apps/rotulos/src/app/globals.css` (812 líneas) comparte la
misma idea estructural (sidebar + topbar, mismas secciones de nav) pero:

- Usa `Arial, Helvetica, sans-serif` en vez de la pila de fuentes de la
  raíz (`'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`).
- No tiene modo oscuro (`:root { color-scheme: light; }` fijo, sin bloque
  `[data-theme="dark"]` ni botón de toggle).
- Usa un morado (`rgba(124, 58, 237, ...)` = `#7c3aed`) coherente con la
  raíz en las clases `.legacy-*`, pero el `tailwind.config.ts` del mismo
  proyecto define un `purpleShop` distinto (`#6B1FA2`) — confirmado sin
  uso real en ningún componente (`grep -rn "purpleShop" src/` no arroja
  resultados), así que es config muerta, no un conflicto visual real.

Como esta app va a quedar como la única cara pública de Purple Shop tras
el corte de GitHub Pages a Vercel, el salto de pulido visual sería
notorio para el negocio. El usuario pidió portar el sistema de diseño de
la raíz antes de continuar con el corte.

## Decisión

Portar los *design tokens* reales de `css/theme.css` (paleta, tipografía,
modo oscuro) a `apps/rotulos/src/app/globals.css`, y reestilizar con ellos
únicamente el **chrome de la app** (sidebar, topbar, paneles, botones,
formularios, tablas — todas las rutas: dashboard, pedidos, clientes,
inventario, reportes, historial, configuración). Se agrega un botón de
alternar tema, igual en comportamiento al de la raíz.

**Explícitamente fuera de alcance: el diseño del rótulo impreso.** Las
reglas CSS que gobiernan el rótulo renderizado/impreso —
`.label-canvas`, `.label-header`, `.label-brand`, `.label-social`,
`.label-meta`, `.label-grid`, `.label-block`, `.recipient*`,
`.label-footer`, `.cod-badge`/`.paid-badge`, y el bloque
`@media print` en `globals.css` — no se tocan. Ese diseño (fondo
ilustrado de Edwing, logo, QR) ya fue validado con impresión física real
y cambiarlo está fuera de esta tarea. Igual de intocable:
`apps/rotulos/src/lib/pdf.ts` (genera el HTML que se convierte a PDF) y
`apps/rotulos/src/components/label-preview.tsx`.

## Tokens a portar (valores exactos, de `css/theme.css`)

### Modo claro (`:root`)

```css
--color-primary: #7c3aed;
--color-primary-hover: #6d28d9;
--color-primary-active: #5b21b6;
--color-primary-light: #a78bfa;
--color-primary-soft: #f1e9fe;
--color-secondary: #ec4899;
--color-secondary-hover: #db2777;

--danger-color: #ef4444;
--success-color: #10b981;
--warning-color: #f59e0b;
--info-color: #3b82f6;

--background: #f8f7fb;
--background-secondary: #f1eef8;
--surface: #ffffff;
--surface-elevated: #ffffff;

--text-primary: #16121f;
--text-secondary: #635d72;
--text-tertiary: #9993a8;
--text-inverse: #ffffff;

--border-color: #e4dff2;
--border-color-hover: #d3caea;
--focus-outline: var(--color-primary);

--hover-bg: #f4f1fa;

--font-sans: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

(Se omite `'Inter'` del inicio de la pila de fuentes de la raíz porque
esa fuente no está cargada en `apps/rotulos` — agregar una fuente web
nueva no es parte de este alcance; `'Segoe UI'` como primera opción real
ya es la mejora que se busca frente a `Arial`.)

### Modo oscuro (`[data-theme="dark"]`)

```css
--color-primary: #a78bfa;
--color-primary-hover: #c4b5fd;
--color-primary-active: #8b5cf6;
--color-primary-light: #c4b5fd;
--color-primary-soft: #241c33;
--color-secondary: #f472b6;
--color-secondary-hover: #f9a8d4;

--danger-color: #f87171;
--success-color: #34d399;
--warning-color: #fbbf24;
--info-color: #60a5fa;

--background: #0f0b17;
--background-secondary: #171223;
--surface: #1c1728;
--surface-elevated: #241d33;

--text-primary: #f3f0fa;
--text-secondary: #b9b0cc;
--text-tertiary: #857c99;
--text-inverse: #16121f;

--border-color: #322a45;
--border-color-hover: #443a5c;

--hover-bg: #241d33;
```

Igual que la raíz, se agrega el fallback antes de que el JS aplique el
atributo:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
  }
}
[data-theme="dark"] {
  color-scheme: dark;
}
```

## Selectores de `globals.css` a reestilizar con las variables nuevas

Todo lo que gobierna el chrome de la app (líneas aproximadas del archivo
actual, antes de este cambio):

`:root`, `body`, `.legacy-app-shell`, `.legacy-sidebar`, `.legacy-brand`,
`.legacy-nav`, `.legacy-sidebar-footer`, `.legacy-content-wrap`,
`.legacy-topbar`, `.legacy-mobile-header`, `.legacy-main`, `.page-shell`,
`.page-heading`, `.nav-link`/`.mobile-nav-link`, `.auth-panel`, `.panel`,
`.metric-card`, `.primary-action` (+ `.secondary`/`.neutral`),
`.panel-title`, `.dashboard-stack`, `.kpi-grid`/`.quick-actions-grid`,
`.activity-grid`/`.summary-grid`, `.activity-row`, `.empty-copy`,
`.creator-grid`, `.form-stack`, `.form-section`, `.field`,
`.validation-summary`, `.order-preview`, `.button-primary`/
`.button-secondary`, `.preview-rail` (layout only, no colores propios que
tocar), `.settings-grid`, `.history-table`, `.history-row`,
`.history-head`, `.row-actions`, `.order-item-grid`,
`.order-item-remove`, `.totals-strip`, `.business-row`/`.customer-row`,
`.business-head`.

Nota: `.field`, `.form-section`, `.button-primary`/`.button-secondary`,
`.validation-summary`, `.order-preview` también los usa el formulario de
creación de rótulo (`label-form.tsx`) — son controles de **edición**
(inputs, selects, botones de guardar), no el rótulo renderizado en sí, así
que restylearlos es seguro y coherente: el usuario edita con la UI nueva,
pero lo que se imprime no cambia.

## Botón de alternar tema

Nuevo componente `apps/rotulos/src/components/theme-toggle.tsx`:
mismo comportamiento que `src/modules/ui.js` de la raíz (`_setupTheme`,
`_applyTheme`, `toggleTheme`) adaptado a React:
- Al montar, lee `localStorage.getItem('purpleshop.theme')`; si no hay
  valor guardado, usa `window.matchMedia('(prefers-color-scheme: dark)')`.
- Aplica el resultado como `document.documentElement.setAttribute('data-theme', ...)`.
- Al hacer click, alterna el valor, lo persiste en `localStorage` bajo la
  misma clave (`purpleshop.theme` — se reutiliza el mismo nombre que la
  raíz por consistencia de marca, aunque son apps distintas con
  localStorage distinto, así que no hay colisión real de datos).
- Se renderiza en `AppShell` (`apps/rotulos/src/components/app-shell.tsx`),
  junto a `AuthPanel`, tanto en el sidebar como en el topbar (mismos dos
  puntos donde hoy vive `<AuthPanel />`).

## Fuera de alcance / riesgos aceptados

- No se agrega la fuente `Inter` (evita traer una fuente web nueva).
- No se toca `tailwind.config.ts` (el token `purpleShop` no usado se deja
  como está — quitar código muerto no relacionado no es parte de esta
  tarea).
- No se re-audita contraste WCAG más allá de reusar los mismos valores ya
  validados en el QA de la raíz (`badge-*-text`, etc., quedan fuera
  porque `apps/rotulos` no tiene badges de estado equivalentes hoy).
- Ningún test existente depende de colores/CSS (confirmado: los 60 tests
  actuales son de lógica de datos y JSX estructural, no de estilos), así
  que este cambio no debería romper la suite — se valida con
  `npm run test` de todas formas por higiene, no porque se esperen fallos.
