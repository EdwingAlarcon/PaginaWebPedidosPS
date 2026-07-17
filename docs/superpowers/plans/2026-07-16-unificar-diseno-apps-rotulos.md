# Unificar diseño visual de apps/rotulos con la raíz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Portar los design tokens (paleta, tipografía, modo oscuro) de la raíz de Purple Shop a `apps/rotulos/src/app/globals.css`, reestilizando el chrome de la app (sidebar, topbar, paneles, formularios, tablas) en todas las rutas, con un botón de alternar tema — sin tocar ni un solo selector del diseño del rótulo impreso.

**Architecture:** Edición quirúrgica de un único archivo CSS (`globals.css`, 812 líneas) por bloques de selectores, más un componente React nuevo (`ThemeToggle`) que replica en React la lógica de `src/modules/ui.js` de la raíz (atributo `data-theme` en `<html>`, persistido en `localStorage`). Cada tarea toca un rango de selectores disjunto del anterior; ninguna tarea toca los selectores de rótulo (`.label-*`, `.cod-badge`, `.paid-badge`, `@media print`).

**Tech Stack:** CSS custom properties (variables), React 19 (componente cliente), Next.js 16.

## Global Constraints

- **Nunca modificar** estos selectores de `apps/rotulos/src/app/globals.css`: `.label-canvas`, `.label-header`, `.label-brand`, `.label-social`, `.label-meta`, `.label-grid`, `.label-block`, `.recipient` (y sus variantes `.recipient-*`), `.label-footer`, `.cod-badge`, `.paid-badge`, y el bloque `@media print`. Corresponden al diseño del rótulo impreso, ya validado con impresión física real (del spec).
- **Nunca modificar** `apps/rotulos/src/lib/pdf.ts` ni `apps/rotulos/src/components/label-preview.tsx` (del spec).
- Los valores exactos de color/tipografía a usar están en la sección "Tokens" de cada tarea — son los mismos valores reales de `css/theme.css` de la raíz, no aproximaciones.
- No agregar la fuente `Inter` (no está cargada en `apps/rotulos`; usar `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` como la mejora real) (del spec).
- No tocar `apps/rotulos/tailwind.config.ts` (el token `purpleShop` no usado se deja igual — fuera de alcance) (del spec).
- Ningún test existente depende de CSS — la suite debe seguir en 60/60 después de cada tarea, sin necesidad de tests nuevos para estilos.

---

### Task 1: Tokens de diseño (`:root`, modo oscuro, fuente, fallback SO)

**Files:**
- Modify: `apps/rotulos/src/app/globals.css:1-18`

**Interfaces:**
- Produces: variables CSS (`--color-primary`, `--color-secondary`, `--danger-color`, `--success-color`, `--warning-color`, `--info-color`, `--background`, `--background-secondary`, `--surface`, `--surface-elevated`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-inverse`, `--border-color`, `--border-color-hover`, `--focus-outline`, `--hover-bg`, `--font-sans`) en modo claro y sus overrides en `[data-theme="dark"]`. Todas las tareas siguientes consumen estas variables por nombre.

- [ ] **Step 1: Reemplazar el bloque inicial del archivo**

Reemplazar exactamente esto (líneas 1-18 actuales):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f5f5f7;
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
}
```

por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;

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
}

[data-theme="dark"] {
  color-scheme: dark;

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
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--text-primary);
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Verificar que el build sigue pasando**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: los tres comandos terminan sin errores (este cambio es CSS puro, no debería afectar TypeScript/ESLint/build, pero se corre por higiene).

- [ ] **Step 3: Confirmar que no se tocó ningún selector de rótulo**

Run: `grep -c "label-canvas\|label-header\|label-brand\|label-social\|label-meta\|label-grid\|label-block\|recipient\|label-footer\|cod-badge\|paid-badge" apps/rotulos/src/app/globals.css`
Expected: el mismo número que antes del cambio (este paso solo tocó las líneas 1-18, muy por encima de donde empiezan esos selectores en la línea ~314+ del archivo original) — confirma que el conteo no cambió respecto al archivo antes de este commit (`git show HEAD:apps/rotulos/src/app/globals.css | grep -c "..."` con el mismo patrón, comparar ambos números).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/globals.css
git commit -m "feat(diseno): portar tokens de color, tipografia y modo oscuro de la raiz"
```

---

### Task 2: Sidebar, topbar y navegación

**Files:**
- Modify: `apps/rotulos/src/app/globals.css` (selectores `.legacy-app-shell` hasta `.auth-panel button`, aproximadamente lo que eran las líneas 20-189 del archivo original — los números de línea se corrieron tras la Tarea 1, ubicar por contenido de selector, no por número de línea)

**Interfaces:**
- Consumes: variables de la Tarea 1 (`--background`, `--surface`, `--text-primary`, `--text-secondary`, `--border-color`, `--hover-bg`, `--color-primary`, `--color-primary-active`, `--color-primary-hover`).

- [ ] **Step 1: Reemplazar los selectores de sidebar/topbar/nav/auth-panel**

Reemplazar exactamente esto:

```css
.legacy-app-shell {
  min-height: 100vh;
  background: #f8fafc;
  color: #111827;
}

.legacy-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  display: flex;
  width: 286px;
  flex-direction: column;
  border-right: 1px solid rgba(124, 58, 237, 0.16);
  background: #ffffff;
  box-shadow: 10px 0 30px rgba(17, 24, 39, 0.06);
  padding: 22px 18px;
  z-index: 30;
}

.legacy-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5b21b6;
}

.legacy-brand img {
  border-radius: 14px;
  object-fit: contain;
  box-shadow: 0 10px 24px rgba(91, 33, 182, 0.18);
}

.legacy-brand strong {
  display: block;
  color: #3b0a57;
  font-size: 1.2rem;
  line-height: 1.1;
}

.legacy-brand span {
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 700;
}

.legacy-brand.compact strong {
  font-size: 1rem;
}

.legacy-nav {
  display: grid;
  gap: 8px;
  margin-top: 28px;
}

.legacy-sidebar-footer {
  margin-top: auto;
  padding-top: 22px;
}

.legacy-content-wrap {
  min-height: 100vh;
  padding-left: 286px;
}

.legacy-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface);
  padding: 18px 28px;
  backdrop-filter: blur(14px);
}

.legacy-topbar p {
  margin: 0 0 4px;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.legacy-topbar h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.05rem;
}

.legacy-mobile-header {
  display: none;
}

.legacy-main {
  padding: 0;
}

.page-shell {
  min-height: 100vh;
  padding: 28px;
}

.page-heading {
  margin-bottom: 24px;
}

.page-heading p {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: var(--color-primary-active);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
}

.nav-link,
.mobile-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--color-primary-active);
  font-weight: 700;
  text-decoration: none;
}

.nav-link:hover,
.mobile-nav-link:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-active);
}

.auth-panel {
  display: grid;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  padding: 10px;
  color: var(--color-primary-active);
  font-size: 0.82rem;
  font-weight: 700;
}

.auth-panel input {
  min-width: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  background: var(--surface);
  color: var(--text-primary);
}

.auth-panel button {
  border: 0;
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--text-inverse);
  padding: 8px;
  font-weight: 800;
}
```

por:

```css
.legacy-app-shell {
  min-height: 100vh;
  background: var(--background);
  color: var(--text-primary);
}

.legacy-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  display: flex;
  width: 286px;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
  background: var(--surface);
  box-shadow: 10px 0 30px rgba(17, 24, 39, 0.06);
  padding: 22px 18px;
  z-index: 30;
}

.legacy-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-primary-active);
}

.legacy-brand img {
  border-radius: 14px;
  object-fit: contain;
  box-shadow: 0 10px 24px rgba(91, 33, 182, 0.18);
}

.legacy-brand strong {
  display: block;
  color: var(--color-primary-active);
  font-size: 1.2rem;
  line-height: 1.1;
}

.legacy-brand span {
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.legacy-brand.compact strong {
  font-size: 1rem;
}

.legacy-nav {
  display: grid;
  gap: 8px;
  margin-top: 28px;
}

.legacy-sidebar-footer {
  margin-top: auto;
  padding-top: 22px;
  display: grid;
  gap: 10px;
}

.legacy-content-wrap {
  min-height: 100vh;
  padding-left: 286px;
}

.legacy-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid var(--border-color);
  background: var(--surface);
  padding: 18px 28px;
  backdrop-filter: blur(14px);
}

.legacy-topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legacy-topbar p {
  margin: 0 0 4px;
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.legacy-topbar h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.05rem;
}

.legacy-mobile-header {
  display: none;
}

.legacy-main {
  padding: 0;
}

.page-shell {
  min-height: 100vh;
  padding: 28px;
}

.page-heading {
  margin-bottom: 24px;
}

.page-heading p {
  margin: 0 0 6px;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 0;
  color: var(--color-primary-active);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
}

.nav-link,
.mobile-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--color-primary-active);
  font-weight: 700;
  text-decoration: none;
}

.nav-link:hover,
.mobile-nav-link:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-active);
}

.auth-panel {
  display: grid;
  gap: 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  padding: 10px;
  color: var(--color-primary-active);
  font-size: 0.82rem;
  font-weight: 700;
}

.auth-panel input {
  min-width: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px;
  background: var(--surface);
  color: var(--text-primary);
}

.auth-panel button {
  border: 0;
  border-radius: 6px;
  background: var(--color-primary);
  color: var(--text-inverse);
  padding: 8px;
  font-weight: 800;
}
```

(Nota: se agregó `.legacy-topbar-actions` — un contenedor flex nuevo, vacío de momento, para alinear el botón de tema junto a `AuthPanel` en el topbar; lo usa la Tarea 5. Se agregó `display: grid; gap: 10px;` a `.legacy-sidebar-footer` por la misma razón, del lado del sidebar.)

- [ ] **Step 2: Verificar visualmente en dev**

Run: `npm --prefix apps/rotulos run dev` (en background), luego confirmar por HTTP que la página carga:
Run: `curl -s http://localhost:3001/ | grep -o "legacy-sidebar" | head -1`
Expected: imprime `legacy-sidebar` (la clase sigue presente y el server responde 200). Detener el server.

- [ ] **Step 3: Typecheck/lint/build**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/globals.css
git commit -m "feat(diseno): reestilizar sidebar, topbar y navegacion con los tokens nuevos"
```

---

### Task 3: Paneles, dashboard y grids

**Files:**
- Modify: `apps/rotulos/src/app/globals.css` (selectores desde `.panel, .metric-card` hasta `.summary-grid strong` — todo lo que está inmediatamente antes de `.label-canvas` en el archivo)

**Interfaces:**
- Consumes: variables de la Tarea 1.

- [ ] **Step 1: Reemplazar los selectores de panel/dashboard**

Reemplazar exactamente esto:

```css
.panel,
.metric-card {
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.06);
}

.metric-card span {
  display: block;
  color: #666666;
  font-size: 0.85rem;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: #3b0a57;
  font-size: 2.1rem;
}

.primary-action {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
  color: #ffffff;
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.18);
}

.primary-action.secondary {
  background: linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%);
}

.primary-action.neutral {
  background: #ffffff;
  color: #3b0a57;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.panel-title {
  margin-bottom: 12px;
  color: #3b0a57;
  font-size: 1.1rem;
  font-weight: 800;
}

.dashboard-stack {
  display: grid;
  gap: 22px;
}

.kpi-grid,
.quick-actions-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quick-actions-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.activity-grid,
.summary-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.activity-grid h3 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 0.95rem;
}

.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  padding: 10px 0;
}

.activity-row a {
  color: #6b1fa2;
  font-weight: 800;
  text-decoration: none;
}

.empty-copy {
  color: #6b7280;
}

.summary-grid div {
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
}

.summary-grid span {
  display: block;
  color: #6b7280;
  font-size: 0.82rem;
}

.summary-grid strong {
  display: block;
  margin-top: 6px;
  color: #3b0a57;
}
```

por:

```css
.panel,
.metric-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  padding: 18px;
  box-shadow: 0 12px 30px rgba(17, 24, 39, 0.06);
}

.metric-card span {
  display: block;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.metric-card strong {
  display: block;
  margin-top: 8px;
  color: var(--color-primary-active);
  font-size: 2.1rem;
}

.primary-action {
  display: flex;
  min-height: 112px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: var(--text-inverse);
  font-size: 1.1rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 14px 28px rgba(124, 58, 237, 0.18);
}

.primary-action.secondary {
  background: linear-gradient(135deg, var(--color-primary-active) 0%, var(--color-primary) 100%);
}

.primary-action.neutral {
  background: var(--surface);
  color: var(--color-primary-active);
  border: 1px solid var(--border-color);
}

.panel-title {
  margin-bottom: 12px;
  color: var(--color-primary-active);
  font-size: 1.1rem;
  font-weight: 800;
}

.dashboard-stack {
  display: grid;
  gap: 22px;
}

.kpi-grid,
.quick-actions-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quick-actions-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.activity-grid,
.summary-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.activity-grid h3 {
  margin: 0 0 10px;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.activity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding: 10px 0;
}

.activity-row a {
  color: var(--color-primary-active);
  font-weight: 800;
  text-decoration: none;
}

.empty-copy {
  color: var(--text-secondary);
}

.summary-grid div {
  border-radius: 8px;
  background: var(--background-secondary);
  padding: 14px;
}

.summary-grid span {
  display: block;
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.summary-grid strong {
  display: block;
  margin-top: 6px;
  color: var(--color-primary-active);
}
```

- [ ] **Step 2: Typecheck/lint/build**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: sin errores.

- [ ] **Step 3: Confirmar que `.label-canvas` y el resto de selectores de rótulo no cambiaron**

Run: `git diff apps/rotulos/src/app/globals.css | grep -A2 -B2 "label-canvas\|cod-badge\|paid-badge\|recipient"`
Expected: sin salida (ninguna línea de esos selectores aparece en el diff de este commit).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/app/globals.css
git commit -m "feat(diseno): reestilizar paneles, dashboard y grids con los tokens nuevos"
```

---

### Task 4: Formularios, botones y tablas de negocio

**Files:**
- Modify: `apps/rotulos/src/app/globals.css` (selectores desde `.creator-grid` hasta `.form-section legend` — bloque inmediatamente después del `@media print`/`.cod-badge`/`.paid-badge`; y desde `.settings-grid` hasta el final del archivo)

**Interfaces:**
- Consumes: variables de la Tarea 1.

- [ ] **Step 1: Reemplazar el primer bloque (formularios/creator-grid)**

Reemplazar exactamente esto (aparece justo después de `.paid-badge { ... }` y antes de `@media print`):

```css
.creator-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(320px, 0.82fr) minmax(530px, 1fr);
  align-items: start;
}

.form-stack {
  display: grid;
  gap: 14px;
}

.form-section,
.order-preview,
.label-actions {
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
}

.form-section legend {
  color: #3b0a57;
  font-weight: 800;
}

.field {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.field span {
  font-size: 0.82rem;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid rgba(17, 17, 17, 0.18);
  border-radius: 6px;
  padding: 10px 11px;
  font: inherit;
}

.field small {
  color: #b00020;
}

.field .field-hint {
  color: #666666;
}

.validation-summary {
  min-height: 0;
  color: #b00020;
  font-size: 0.88rem;
  font-weight: 700;
}

.order-preview span {
  display: block;
  color: #666666;
  font-size: 0.8rem;
  font-weight: 700;
}

.order-preview strong {
  display: block;
  margin-top: 4px;
  color: #3b0a57;
  font-size: 1.45rem;
}

.label-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-primary,
.button-secondary {
  border: 0;
  border-radius: 7px;
  padding: 11px 14px;
  font-weight: 800;
  cursor: pointer;
}

.button-primary {
  background: #6b1fa2;
  color: #ffffff;
}

.button-secondary {
  background: #f5f5f7;
  color: #111111;
}

.button-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

por:

```css
.creator-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(320px, 0.82fr) minmax(530px, 1fr);
  align-items: start;
}

.form-stack {
  display: grid;
  gap: 14px;
}

.form-section,
.order-preview,
.label-actions {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--surface);
  padding: 16px;
}

.form-section legend {
  color: var(--color-primary-active);
  font-weight: 800;
}

.field {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.field span {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px 11px;
  font: inherit;
  background: var(--surface);
  color: var(--text-primary);
}

.field small {
  color: var(--danger-color);
}

.field .field-hint {
  color: var(--text-secondary);
}

.validation-summary {
  min-height: 0;
  color: var(--danger-color);
  font-size: 0.88rem;
  font-weight: 700;
}

.order-preview span {
  display: block;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.order-preview strong {
  display: block;
  margin-top: 4px;
  color: var(--color-primary-active);
  font-size: 1.45rem;
}

.label-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.button-primary,
.button-secondary {
  border: 0;
  border-radius: 7px;
  padding: 11px 14px;
  font-weight: 800;
  cursor: pointer;
}

.button-primary {
  background: var(--color-primary);
  color: var(--text-inverse);
}

.button-secondary {
  background: var(--background-secondary);
  color: var(--text-primary);
}

.button-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
```

- [ ] **Step 2: Reemplazar el segundo bloque (settings/history/business tables)**

Reemplazar exactamente esto (aparece después del `@media (max-width: 1100px)` y el `@media print`, empieza en `.settings-grid`):

```css
.settings-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.history-table {
  margin-top: 16px;
  overflow-x: auto;
}

.history-row {
  display: grid;
  min-width: 1040px;
  grid-template-columns: 1.3fr 0.9fr 0.9fr 0.8fr 1fr 0.7fr 2fr;
  gap: 12px;
  border-top: 1px solid rgba(17, 17, 17, 0.1);
  padding: 12px 0;
  align-items: center;
}

.history-head {
  color: #3b0a57;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row-actions button,
.row-actions a {
  color: #111111;
  text-decoration: none;
  border: 1px solid rgba(17, 17, 17, 0.14);
  border-radius: 6px;
  background: #ffffff;
  padding: 6px 8px;
  font-weight: 700;
}
```

por:

```css
.settings-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.history-table {
  margin-top: 16px;
  overflow-x: auto;
}

.history-row {
  display: grid;
  min-width: 1040px;
  grid-template-columns: 1.3fr 0.9fr 0.9fr 0.8fr 1fr 0.7fr 2fr;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding: 12px 0;
  align-items: center;
}

.history-head {
  color: var(--color-primary-active);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.row-actions button,
.row-actions a {
  color: var(--text-primary);
  text-decoration: none;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--surface);
  padding: 6px 8px;
  font-weight: 700;
}
```

- [ ] **Step 3: Reemplazar el tercer bloque (mobile nav + order-item + business/customer rows)**

Reemplazar exactamente esto (dentro y después del `@media (max-width: 1024px)`, hasta el final del archivo):

```css
@media (max-width: 1024px) {
  .legacy-sidebar,
  .legacy-topbar {
    display: none;
  }

  .legacy-content-wrap {
    padding-left: 0;
  }

  .legacy-mobile-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: block;
    border-bottom: 1px solid rgba(17, 24, 39, 0.08);
    background: rgba(255, 255, 255, 0.96);
    padding: 12px;
    backdrop-filter: blur(14px);
  }

  .legacy-mobile-nav {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .mobile-nav-link {
    flex: 0 0 auto;
    background: #f8fafc;
  }
}

.order-item-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 0.8fr 1.4fr 1fr 0.7fr 0.8fr auto;
  align-items: end;
  border-top: 1px solid rgba(17, 17, 17, 0.08);
  margin-top: 12px;
  padding-top: 12px;
}

.order-item-remove {
  min-height: 40px;
  margin-bottom: 0;
}

.totals-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: #3b0a57;
  font-weight: 800;
}

.business-row,
.customer-row {
  display: grid;
  gap: 12px;
  border-top: 1px solid rgba(17, 17, 17, 0.1);
  padding: 12px 0;
  align-items: center;
}

.business-row {
  min-width: 860px;
  grid-template-columns: 0.8fr 1.4fr 0.9fr 0.5fr 0.8fr 0.8fr;
}

.customer-row {
  min-width: 900px;
  grid-template-columns: 1.2fr 0.8fr 1.1fr 0.9fr 1.6fr;
}

.business-head {
  color: #3b0a57;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
```

por:

```css
@media (max-width: 1024px) {
  .legacy-sidebar,
  .legacy-topbar {
    display: none;
  }

  .legacy-content-wrap {
    padding-left: 0;
  }

  .legacy-mobile-header {
    position: sticky;
    top: 0;
    z-index: 20;
    display: block;
    border-bottom: 1px solid var(--border-color);
    background: var(--surface);
    padding: 12px;
    backdrop-filter: blur(14px);
  }

  .legacy-mobile-nav {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .mobile-nav-link {
    flex: 0 0 auto;
    background: var(--background);
  }
}

.order-item-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 0.8fr 1.4fr 1fr 0.7fr 0.8fr auto;
  align-items: end;
  border-top: 1px solid var(--border-color);
  margin-top: 12px;
  padding-top: 12px;
}

.order-item-remove {
  min-height: 40px;
  margin-bottom: 0;
}

.totals-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: var(--color-primary-active);
  font-weight: 800;
}

.business-row,
.customer-row {
  display: grid;
  gap: 12px;
  border-top: 1px solid var(--border-color);
  padding: 12px 0;
  align-items: center;
}

.business-row {
  min-width: 860px;
  grid-template-columns: 0.8fr 1.4fr 0.9fr 0.5fr 0.8fr 0.8fr;
}

.customer-row {
  min-width: 900px;
  grid-template-columns: 1.2fr 0.8fr 1.1fr 0.9fr 1.6fr;
}

.business-head {
  color: var(--color-primary-active);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Typecheck/lint/build**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: sin errores.

- [ ] **Step 5: Confirmar que los selectores de rótulo siguen intactos**

Run: `git diff apps/rotulos/src/app/globals.css | grep -A2 -B2 "label-canvas\|label-header\|label-brand\|label-social\|label-meta\|label-grid\|label-block\|recipient\|label-footer\|cod-badge\|paid-badge\|@media print"`
Expected: sin salida.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/app/globals.css
git commit -m "feat(diseno): reestilizar formularios, botones y tablas de negocio con los tokens nuevos"
```

---

### Task 5: Botón de alternar tema

**Files:**
- Create: `apps/rotulos/src/components/theme-toggle.tsx`
- Test: `apps/rotulos/src/__tests__/theme-toggle.test.tsx`
- Modify: `apps/rotulos/src/components/app-shell.tsx`
- Modify: `apps/rotulos/src/app/globals.css` (agregar estilos del botón nuevo)

**Interfaces:**
- Produces: componente `ThemeToggle` exportado, sin props, usado por `AppShell`.

- [ ] **Step 1: Escribir el test**

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ThemeToggle } from "@/components/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("aplica el tema guardado en localStorage al montar", () => {
    localStorage.setItem("purpleshop.theme", "dark");

    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("por defecto usa tema claro si no hay preferencia guardada", () => {
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("alterna el tema al hacer click y lo persiste en localStorage", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("purpleshop.theme")).toBe("dark");

    await user.click(screen.getByRole("button"));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("purpleshop.theme")).toBe("light");
  });
});
```

Nota: este test no cubre la rama de `window.matchMedia('(prefers-color-scheme: dark)')` porque jsdom (el entorno de test) no simula preferencias de SO de forma consistente entre versiones — se confía en que es una API estándar del navegador y se cubre la lógica que sí depende del código propio (localStorage, toggle).

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `npm --prefix apps/rotulos run test -- theme-toggle`
Expected: FAIL — `Cannot find module '@/components/theme-toggle'`

- [ ] **Step 3: Implementar el componente**

```typescript
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "purpleshop.theme";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  return prefersDark ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const initial = readInitialTheme();
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button type="button" className="theme-toggle-btn" onClick={toggle} aria-label="Cambiar tema claro/oscuro">
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- theme-toggle`
Expected: PASS — 3 tests.

- [ ] **Step 5: Agregar los estilos del botón a `globals.css`**

Agregar al final del archivo (después de todo lo existente, sin tocar nada anterior):

```css

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 1.15rem;
  cursor: pointer;
}

.theme-toggle-btn:hover {
  background: var(--hover-bg);
  border-color: var(--border-color-hover);
  color: var(--color-primary);
}

.theme-toggle-btn:focus-visible {
  outline: 2px solid var(--focus-outline);
  outline-offset: 2px;
}
```

- [ ] **Step 6: Insertar `ThemeToggle` en `AppShell`**

En `apps/rotulos/src/components/app-shell.tsx`, agregar el import:

```typescript
import { ThemeToggle } from "@/components/theme-toggle";
```

(junto al import existente de `AuthPanel`).

Reemplazar:

```typescript
        <div className="legacy-sidebar-footer">
          <AuthPanel />
        </div>
```

por:

```typescript
        <div className="legacy-sidebar-footer">
          <ThemeToggle />
          <AuthPanel />
        </div>
```

Reemplazar:

```typescript
          <div>
            <p>Purple Shop Online</p>
            <h1>Sistema de Gestion de Pedidos e Inventario</h1>
          </div>
          <AuthPanel />
        </header>
```

por:

```typescript
          <div>
            <p>Purple Shop Online</p>
            <h1>Sistema de Gestion de Pedidos e Inventario</h1>
          </div>
          <div className="legacy-topbar-actions">
            <ThemeToggle />
            <AuthPanel />
          </div>
        </header>
```

- [ ] **Step 7: Typecheck, lint, build, suite completa**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build && npm --prefix apps/rotulos run test`
Expected: sin errores; la suite pasa completa (60 tests previos + 3 nuevos = 63).

- [ ] **Step 8: Commit**

```bash
git add apps/rotulos/src/components/theme-toggle.tsx apps/rotulos/src/__tests__/theme-toggle.test.tsx apps/rotulos/src/components/app-shell.tsx apps/rotulos/src/app/globals.css
git commit -m "feat(diseno): agregar boton de alternar tema claro/oscuro"
```

---

### Task 6: Verificación manual end-to-end

**Files:** ninguno (verificación, no cambios de código).

- [ ] **Step 1: Levantar en dev y recorrer todas las rutas en ambos temas**

Run: `npm --prefix apps/rotulos run dev`

En el navegador, visitar en modo claro y luego con el botón de tema activado (modo oscuro):
1. `/` (Dashboard)
2. `/pedidos/nuevo`
3. `/pedidos`
4. `/clientes`
5. `/inventario`
6. `/reportes`
7. `/historial`
8. `/configuracion`

Confirmar en cada una: texto legible (sin texto oscuro sobre fondo oscuro ni claro sobre claro), sidebar/topbar consistentes, botones con el morado de marca, sin colores que quedaron hardcodeados en gris genérico.

- [ ] **Step 2: Confirmar que `/crear` (el generador de rótulos) es visualmente idéntico a antes de este plan**

Visitar `/crear`, generar un rótulo de prueba y comparar visualmente contra una captura conocida previa (o contra el PDF ya validado) — el rótulo debe verse exactamente igual, sin importar el tema claro/oscuro activo en el resto de la app (el rótulo en sí no debe reaccionar al `data-theme`, porque ninguno de sus selectores usa las variables nuevas).

Detener el server con Ctrl+C al terminar.

- [ ] **Step 3: Confirmar la suite completa una última vez**

Run: `npm --prefix apps/rotulos run test`
Expected: 63/63 passing.

- [ ] **Step 4: No requiere commit** — esta tarea es solo verificación manual.

---

## Spec Coverage Check

- Tokens de color/tipografía portados de `css/theme.css` → Task 1.
- Modo oscuro con fallback `prefers-color-scheme` → Task 1.
- Chrome de toda la app reestilizado (sidebar, topbar, paneles, dashboard, formularios, tablas) → Tasks 2-4.
- Selectores de rótulo (`.label-*`, `.cod-badge`, `.paid-badge`, `@media print`) explícitamente no tocados → verificado con `git diff | grep` al final de cada tarea que los rodea (Tasks 1, 3, 4).
- Botón de alternar tema, mismo comportamiento que la raíz (`localStorage` + `data-theme` en `<html>`) → Task 5.
- No se agrega `Inter`, no se toca `tailwind.config.ts` → ninguna tarea los menciona ni los modifica.
- Verificación manual de que el rótulo impreso no cambió → Task 6.
