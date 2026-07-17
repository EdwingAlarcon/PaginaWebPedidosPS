# Recuperar el diseño ilustrado del rótulo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el generador de rótulos actual de `apps/rotulos` (texto/bordes CSS) por el diseño ilustrado (`label-template-bg.png` de fondo + datos superpuestos), recuperando las posiciones ya validadas del commit legacy `a4e68d1` y el selector de tamaño 10x9/14x12 de `acd1160`, con `size` guardado por rótulo.

**Architecture:** Un `LabelDraft.size` nuevo (`"10x9" | "14x12"`) recorre todo el flujo: formulario → preview React → PDF server-side → impresión. `apps/rotulos/src/app/globals.css` reemplaza sus selectores `.label-*` (chrome del rótulo) por un sistema de posicionamiento absoluto en % (`.lbl-f`/`.lbl-*`) sobre una imagen de fondo, reutilizado tal cual en `pdf.ts` (HTML embebido para Playwright) para que preview e impresión/PDF luzcan idénticos.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase, Playwright (generación de PDF).

## Global Constraints

- Las posiciones en `%`/`cqw` de cada campo (`.lbl-sender-name`, `.lbl-recipient-address`, etc.) son las del commit `a4e68d1`, copiadas verbatim — no recalcular a ojo (del spec).
- `LabelSettings.labelSize`, `logoUrl`, `qrUrl` NO se tocan (quedan vestigiales, sin efecto en el rótulo nuevo, pero configurables sin romper nada) (del spec).
- El logo y el QR ya están dibujados en `label-template-bg.png` — el nuevo rótulo no renderiza `<img>` de logo/QR (del spec).
- `size` se guarda por rótulo (`LabelDraft`/`LabelRecord`), no como setting global (del spec).
- Sin base de datos local disponible (sin Docker) — la migración se valida por revisión, se aplica al proyecto Supabase remoto en un paso posterior fuera de este plan (mismo patrón que el plan de migración de inventario).
- Todos los tests que dependan de la estructura DOM/HTML vieja del rótulo se reescriben junto con la implementación (del spec) — no es un efecto colateral a evitar, es parte explícita del alcance.

---

### Task 1: Migración SQL — columna `size` en `labels`

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607162000_add_label_size.sql`

**Interfaces:**
- Produces: columna `public.labels.size` (text, `check (size in ('10x9', '14x12'))`, default `'14x12'`), consumida por `label-store.ts` (Tarea 3).

- [ ] **Step 1: Escribir la migración**

```sql
alter table public.labels
  add column if not exists size text not null default '14x12' check (size in ('10x9', '14x12'));
```

- [ ] **Step 2: Revisar contra el patrón existente**

Confirmar que sigue el estilo de las migraciones previas (minúsculas, `if not exists`). Sin base local disponible en este entorno (sin Docker) — no se ejecuta contra una base, solo se revisa.

- [ ] **Step 3: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607162000_add_label_size.sql
git commit -m "feat(rotulos): agregar columna size a la tabla labels"
```

---

### Task 2: Tipo `LabelSize` + constante `LABEL_SIZES`

**Files:**
- Modify: `apps/rotulos/src/lib/types.ts`
- Modify: `apps/rotulos/src/lib/defaults.ts`

**Interfaces:**
- Produces: `LabelSize` (`"10x9" | "14x12"`), `LABEL_SIZES: Record<LabelSize, { widthCm: number; heightCm: number; label: string }>`, `DEFAULT_LABEL_SIZE: LabelSize`. Consumido por `label-store.ts` (Tarea 3), `label-preview.tsx` (Tarea 5), `shipment-fields.tsx` (Tarea 6), `pdf.ts` (Tarea 7), `label-form.tsx` (Tarea 8).
- Produces: `LabelDraft.size: LabelSize` (nuevo campo, fluye automáticamente a `LabelRecord` porque `LabelRecord = LabelDraft & {...}`).

- [ ] **Step 1: Agregar el tipo y la constante en `types.ts`**

En `apps/rotulos/src/lib/types.ts`, después de la línea `export type DateFormat = "YYYY" | "YYYYMM" | "YYYYMMDD";` (línea 4), agregar:

```typescript
export type LabelSize = "10x9" | "14x12";

export const LABEL_SIZES: Record<LabelSize, { widthCm: number; heightCm: number; label: string }> = {
  "10x9": { widthCm: 10, heightCm: 9, label: "Pequeno (10 x 9 cm)" },
  "14x12": { widthCm: 14, heightCm: 12, label: "Grande (14 x 12 cm)" },
};

export const DEFAULT_LABEL_SIZE: LabelSize = "14x12";
```

En el mismo archivo, en el tipo `LabelDraft` (busca `export type LabelDraft = {`), agregar el campo `size: LabelSize;` justo después de `orderNumber: string;`:

Reemplazar:

```typescript
export type LabelDraft = {
  id?: string;
  orderNumber: string;
  date: string;
```

por:

```typescript
export type LabelDraft = {
  id?: string;
  orderNumber: string;
  size: LabelSize;
  date: string;
```

- [ ] **Step 2: Actualizar `createBlankLabelDraft()` en `defaults.ts`**

En `apps/rotulos/src/lib/defaults.ts`, agregar el import:

```typescript
import type { LabelDraft, LabelSettings, OrderNumberConfig } from "@/lib/types";
import { DEFAULT_LABEL_SIZE } from "@/lib/types";
```

(reemplaza la línea `import type { LabelDraft, LabelSettings, OrderNumberConfig } from "@/lib/types";` existente por las dos líneas de arriba — una es type-only, la otra trae el valor runtime).

Dentro de `createBlankLabelDraft()`, reemplazar:

```typescript
  return {
    orderNumber: "",
    date: new Date().toISOString().slice(0, 10),
```

por:

```typescript
  return {
    orderNumber: "",
    size: DEFAULT_LABEL_SIZE,
    date: new Date().toISOString().slice(0, 10),
```

- [ ] **Step 3: Typecheck**

Run: `npm --prefix apps/rotulos run typecheck`
Expected: **falla** — `label-store.ts` construye objetos `LabelDraft`/`LabelRecord` sin el campo `size` todavía (se corrige en la Tarea 3). Esto es esperado en este punto del plan; no lo intentes arreglar en esta tarea, solo confirma que el error es exactamente por el campo `size` faltante en `label-store.ts` (no por otra causa) y sigue a la Tarea 3.

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/lib/types.ts apps/rotulos/src/lib/defaults.ts
git commit -m "feat(rotulos): agregar tipo LabelSize y campo size a LabelDraft"
```

---

### Task 3: `label-store.ts` — persistir `size`

**Files:**
- Modify: `apps/rotulos/src/lib/label-store.ts`

**Interfaces:**
- Consumes: `LabelDraft["size"]` de `@/lib/types` (Tarea 2).

- [ ] **Step 1: Agregar `size` al tipo `LabelRow`**

Reemplazar:

```typescript
type LabelRow = {
  id: string;
  order_number: string;
```

por:

```typescript
type LabelRow = {
  id: string;
  order_number: string;
  size: LabelDraft["size"];
```

- [ ] **Step 2: Agregar `size` a `rowToLabel`**

Reemplazar:

```typescript
function rowToLabel(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
```

por:

```typescript
function rowToLabel(row: LabelRow): LabelRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    size: row.size,
```

- [ ] **Step 3: Agregar `size` a `labelToRow`**

Reemplazar:

```typescript
function labelToRow(draft: LabelDraft, orderNumber: string) {
  return {
    order_number: orderNumber,
```

por:

```typescript
function labelToRow(draft: LabelDraft, orderNumber: string) {
  return {
    order_number: orderNumber,
    size: draft.size,
```

Nota: el store local (`createLocalLabelStore`) no necesita cambios — su `toRecord()` hace spread de `...draft`, así que `size` ya fluye automáticamente una vez que `LabelDraft` lo incluye (Tarea 2).

- [ ] **Step 4: Typecheck**

Run: `npm --prefix apps/rotulos run typecheck`
Expected: sin errores — el error de la Tarea 2 Step 3 queda resuelto.

- [ ] **Step 5: Lint y suite completa**

Run: `npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run test`
Expected: lint sin errores; la suite pasa completa (ningún test actual referencia `size`, así que el campo nuevo no debería romper nada — confirmar que el conteo de tests no bajó).

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/label-store.ts
git commit -m "feat(rotulos): persistir el campo size en label-store"
```

---

### Task 4: Asset + CSS del rótulo ilustrado

**Files:**
- Create: `apps/rotulos/public/label-template-bg.png` (copia de `assets/images/label-template-bg.png`, sin modificar)
- Modify: `apps/rotulos/src/app/globals.css`

**Interfaces:**
- Produces: selectores `.label-canvas`, `.lbl-f`, `.lbl-sender-*`, `.lbl-recipient-*`, `.lbl-order-number`, `.lbl-date`, `.lbl-carrier`, `.lbl-value`, `.lbl-packages`, `.lbl-check-paid`, `.lbl-check-cod` — consumidos por `label-preview.tsx` (Tarea 5).

- [ ] **Step 1: Copiar el asset**

```bash
cp assets/images/label-template-bg.png apps/rotulos/public/label-template-bg.png
```

Confirmar que el archivo copiado es idéntico byte a byte al original (`cmp assets/images/label-template-bg.png apps/rotulos/public/label-template-bg.png` no debe imprimir nada / debe salir sin diferencias).

- [ ] **Step 2: Reemplazar el bloque `.label-canvas` a `.paid-badge` en `globals.css`**

Localizar el bloque que empieza en `.label-canvas {` y termina en el cierre de la regla `.paid-badge { ... }` (justo antes de `.creator-grid {`). Reemplazar exactamente esto:

```css
.label-canvas {
  width: 14cm;
  height: 11cm;
  overflow: hidden;
  border: 1px solid #111111;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 18px 50px rgba(17, 17, 17, 0.16);
  color: #111111;
  font-family: Arial, Helvetica, sans-serif;
}

.label-header {
  display: flex;
  height: 2.2cm;
  align-items: center;
  justify-content: space-between;
  background: #6b1fa2;
  color: #ffffff;
  padding: 0.22cm 0.35cm;
}

.label-brand {
  display: flex;
  align-items: center;
  gap: 0.22cm;
}

.label-brand img {
  width: 1.38cm;
  height: 1.38cm;
  object-fit: contain;
  border-radius: 4px;
  background: #ffffff;
}

.label-brand strong {
  display: block;
  font-size: 0.48cm;
  line-height: 1;
}

.label-brand span,
.label-social span {
  display: block;
  font-size: 0.24cm;
}

.label-social {
  display: grid;
  justify-items: center;
  gap: 0.08cm;
}

.label-social img {
  width: 1.55cm;
  height: 1.55cm;
  object-fit: contain;
  background: #ffffff;
  padding: 0.05cm;
}

.label-meta {
  display: grid;
  grid-template-columns: 1.7fr repeat(3, 1fr);
  border-bottom: 1px solid #111111;
  font-size: 0.25cm;
}

.label-meta > * {
  min-width: 0;
  border-right: 1px solid #111111;
  padding: 0.12cm 0.16cm;
}

.label-meta > *:last-child {
  border-right: 0;
}

.label-grid {
  display: grid;
  height: 6.7cm;
  min-height: 0;
  grid-template-columns: 0.82fr 1.18fr;
}

.label-block {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-right: 1px solid #111111;
  padding: 0.22cm;
  font-size: 0.25cm;
}

.label-block:last-child {
  border-right: 0;
}

.label-block h2 {
  margin: 0 0 0.12cm;
  color: #3b0a57;
  font-size: 0.26cm;
  text-transform: uppercase;
}

.label-block p {
  margin: 0 0 0.11cm;
  overflow-wrap: anywhere;
}

.label-block .person {
  font-size: 0.36cm;
  font-weight: 800;
}

.recipient .person {
  font-size: 0.48cm;
}

.recipient .address {
  min-height: 0;
  border: 1px solid rgba(17, 17, 17, 0.35);
  border-radius: 4px;
  padding: 0.12cm;
  font-size: 0.34cm;
  font-weight: 700;
  line-height: 1.18;
}

.recipient {
  display: grid;
  grid-template-rows: auto auto auto minmax(1.65cm, 1fr) auto minmax(0.52cm, 0.74cm);
  gap: 0.08cm;
}

.recipient p {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.recipient .recipient-address {
  padding: 0.1cm;
  font-size: 0.29cm;
  line-height: 1.1;
}

.recipient-neighborhood {
  white-space: nowrap;
  text-overflow: ellipsis;
}

.recipient-reference {
  font-size: 0.22cm;
  line-height: 1.1;
}

.label-footer {
  display: flex;
  height: 1.34cm;
  align-items: center;
  justify-content: space-between;
  gap: 0.18cm;
  border-top: 1px solid #111111;
  padding: 0.18cm 0.25cm;
  font-size: 0.27cm;
}

.label-footer .recipient-notes {
  min-width: 0;
  max-width: 8.8cm;
  overflow-wrap: anywhere;
  font-size: 0.22cm;
  line-height: 1.1;
}

.cod-badge,
.paid-badge {
  border-radius: 999px;
  padding: 0.12cm 0.24cm;
  font-weight: 800;
}

.cod-badge {
  background: #111111;
  color: #ffffff;
}

.paid-badge {
  background: #f5f5f7;
  color: #111111;
}
```

por:

```css
.label-canvas {
  position: relative;
  width: 14cm;
  height: 12cm;
  overflow: hidden;
  border-radius: 6px;
  box-shadow: 0 18px 50px rgba(17, 17, 17, 0.16);
  color: #1a0630;
  font-family: Arial, Helvetica, sans-serif;
  container-type: inline-size;
  background-image: url("/label-template-bg.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-color: #ffffff;
}

.label-canvas[data-size="10x9"] {
  width: 10cm;
  height: 9cm;
}

.label-canvas,
.label-canvas * {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Datos superpuestos sobre las lineas en blanco de la plantilla
   (label-template-bg.png). Posiciones en % del contenedor, calculadas
   a partir de los pixeles de esa imagen (1310x1201) - funcionan igual
   para los dos tamanos porque el fondo se estira con background-size:
   100% 100%. */
.lbl-f {
  position: absolute;
  font-weight: 700;
  line-height: 1.15;
  font-size: 2.7cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lbl-f.lbl-multiline {
  white-space: normal;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.lbl-sender-name { top: 40.8%; left: 8.8%; width: 31%; font-size: 3cqw; }
.lbl-sender-phone { top: 47.4%; left: 8.8%; width: 31%; }
.lbl-sender-city { top: 54%; left: 8.8%; width: 31%; }
.lbl-sender-department { top: 60.6%; left: 8.8%; width: 31%; }
.lbl-sender-address { top: 67%; left: 8.8%; width: 31%; height: 9%; }

.lbl-recipient-name { top: 40.2%; left: 52.3%; width: 43.5%; font-size: 3cqw; }
.lbl-recipient-phone { top: 45.2%; left: 52.3%; width: 43.5%; }
.lbl-recipient-department { top: 50.4%; left: 52.3%; width: 19%; }
.lbl-recipient-city { top: 50.4%; left: 78.6%; width: 17%; }
.lbl-recipient-address { top: 55.5%; left: 52.3%; width: 43.5%; height: 9%; }
.lbl-recipient-neighborhood { top: 63%; left: 52.3%; width: 43.5%; }
.lbl-recipient-reference { top: 67.6%; left: 52.3%; width: 43.5%; }
.lbl-recipient-notes { top: 72.1%; left: 52.3%; width: 43.5%; }

.lbl-order-number { top: 87.6%; left: 5%; width: 13%; font-size: 1.9cqw; }
.lbl-date { top: 87.6%; left: 23%; width: 10%; font-size: 1.9cqw; }
.lbl-carrier { top: 87.6%; left: 38.5%; width: 13.7%; font-size: 1.6cqw; }
.lbl-value { top: 87.6%; left: 74%; width: 7%; font-size: 1.9cqw; }
.lbl-packages { top: 87.6%; left: 88%; width: 9%; font-size: 1.9cqw; text-align: center; }
.lbl-check-paid,
.lbl-check-cod {
  top: 88.8%;
  font-size: 2.2cqw;
  width: 3%;
}
.lbl-check-paid { left: 55.2%; }
.lbl-check-cod { left: 62.3%; }
```

- [ ] **Step 3: Actualizar `@media print`**

Reemplazar exactamente esto:

```css
@media print {
  @page {
    size: 14cm 11cm;
    margin: 0;
  }

  body {
    background: #ffffff;
  }

  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: fixed;
    inset: 0;
  }

  .label-canvas {
    width: 14cm;
    height: 11cm;
    border-radius: 0;
    box-shadow: none;
  }
}
```

por:

```css
@media print {
  @page {
    margin: 0;
  }

  body {
    background: #ffffff;
  }

  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: fixed;
    inset: 0;
  }

  .label-canvas {
    width: 14cm;
    height: 12cm;
    border-radius: 0;
    box-shadow: none;
  }

  .label-canvas[data-size="10x9"] {
    width: 10cm;
    height: 9cm;
  }
}
```

(El `size: 14cm 11cm;` fijo del `@page` se quita a propósito — el tamaño real de página se inyecta dinámicamente según `draft.size` en la Tarea 8; este `@page` solo deja `margin: 0` como base.)

- [ ] **Step 4: Typecheck/lint/build**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run build`
Expected: sin errores (este cambio es CSS + un archivo estático, no debería afectar TS/build).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/public/label-template-bg.png apps/rotulos/src/app/globals.css
git commit -m "feat(rotulos): reemplazar el CSS del rotulo por el diseno ilustrado con imagen de fondo"
```

---

### Task 5: `label-preview.tsx` — usar el nuevo diseño

**Files:**
- Modify: `apps/rotulos/src/components/label-preview.tsx`
- Modify: `apps/rotulos/src/__tests__/label-preview.test.tsx`

**Interfaces:**
- Consumes: `LabelDraft` de `@/lib/types` (con `size`, Tarea 2); clases CSS de la Tarea 4.
- Produces: `LabelPreview({ draft }: { draft: LabelDraft })` — **el prop `settings` se elimina** porque el componente ya no renderiza logo/QR/marca (están en la imagen de fondo). Actualiza el único caller en `label-form.tsx` (Tarea 8).

- [ ] **Step 1: Reescribir el componente**

Reemplazar todo el archivo por:

```typescript
import type { LabelDraft } from "@/lib/types";
import { formatCop, formatDate } from "@/lib/format";

export function LabelPreview({ draft }: { draft: LabelDraft }) {
  const isCod = draft.paymentMethod === "contraentrega";

  return (
    <section className="label-canvas" data-testid="label-canvas" data-size={draft.size} aria-label="Vista previa del rotulo">
      <span className="lbl-f lbl-sender-name">{draft.sender.name}</span>
      <span className="lbl-f lbl-sender-phone">{draft.sender.phone}</span>
      <span className="lbl-f lbl-sender-city">{draft.sender.city}</span>
      <span className="lbl-f lbl-sender-department">{draft.sender.department}</span>
      <span className="lbl-f lbl-multiline lbl-sender-address">{draft.sender.address}</span>
      <span className="lbl-f lbl-recipient-name">{draft.recipient.fullName}</span>
      <span className="lbl-f lbl-recipient-phone">{draft.recipient.phone}</span>
      <span className="lbl-f lbl-recipient-department">{draft.recipient.department}</span>
      <span className="lbl-f lbl-recipient-city">{draft.recipient.city}</span>
      <span className="lbl-f lbl-multiline lbl-recipient-address">{draft.recipient.address}</span>
      <span className="lbl-f lbl-recipient-neighborhood">{draft.recipient.neighborhood}</span>
      <span className="lbl-f lbl-recipient-reference">{draft.recipient.reference}</span>
      <span className="lbl-f lbl-recipient-notes">{draft.recipient.notes}</span>
      <span className="lbl-f lbl-order-number">{draft.orderNumber}</span>
      <span className="lbl-f lbl-date">{formatDate(draft.date)}</span>
      <span className="lbl-f lbl-carrier">{draft.carrier}</span>
      <span className="lbl-f lbl-value">{isCod ? formatCop(draft.codAmount) : ""}</span>
      <span className="lbl-f lbl-packages">{draft.packageCount}</span>
      <span className={`lbl-f ${isCod ? "lbl-check-cod" : "lbl-check-paid"}`}>&#10003;</span>
    </section>
  );
}
```

- [ ] **Step 2: Reescribir el test**

Reemplazar todo el archivo `apps/rotulos/src/__tests__/label-preview.test.tsx` por:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import { LabelPreview } from "@/components/label-preview";

describe("LabelPreview", () => {
  it("renders order number, sender, recipient, and the illustrated canvas marker", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000001";
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Calle 1 # 2-3",
    };
    draft.recipient = {
      fullName: "Ana Perez",
      phone: "3101234567",
      department: "Antioquia",
      city: "Medellin",
      address: "Carrera 45 # 10-20",
      neighborhood: "Laureles",
      reference: "Porteria principal",
      notes: "Entregar en la tarde",
    };

    render(<LabelPreview draft={draft} />);

    const canvas = screen.getByTestId("label-canvas");
    expect(canvas).toHaveClass("label-canvas");
    expect(canvas).toHaveAttribute("data-size", "14x12");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Laureles")).toHaveClass("lbl-recipient-neighborhood");
  });

  it("reflects the selected label size on the canvas element", () => {
    const draft = createBlankLabelDraft();
    draft.size = "10x9";

    render(<LabelPreview draft={draft} />);

    expect(screen.getByTestId("label-canvas")).toHaveAttribute("data-size", "10x9");
  });

  it("shows the contraentrega value and marks the correct payment checkbox", () => {
    const draft = createBlankLabelDraft();
    draft.paymentMethod = "contraentrega";
    draft.codAmount = 50000;

    render(<LabelPreview draft={draft} />);

    expect(screen.getByText(/\$\s?50\.000/)).toHaveClass("lbl-value");
    expect(document.querySelector(".lbl-check-cod")).toBeInTheDocument();
    expect(document.querySelector(".lbl-check-paid")).not.toBeInTheDocument();
  });

  it("keeps long recipient delivery details inside bounded content areas", () => {
    const draft = createBlankLabelDraft();
    draft.recipient = {
      fullName: "Laura Gomez",
      phone: "3101234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Apartamento 1204 Torre 7 Conjunto Residencial Portal de los Andes Entrada por la Calle 170 con Carrera 7 frente al supermercado, usar acceso de visitantes y anunciarse en recepcion",
      neighborhood: "Portal de los Andes",
      reference: "Llamar antes de llegar, registrar la placa del vehiculo en porteria y dejar el paquete con administracion si no hay respuesta.",
      notes: "Entregar unicamente en horario de tarde; confirmar que el empaque este sellado y solicitar nombre de quien recibe.",
    };

    render(<LabelPreview draft={draft} />);

    expect(screen.getByText(draft.recipient.address)).toHaveClass("lbl-recipient-address");
    expect(screen.getByText(/Llamar antes de llegar/)).toHaveClass("lbl-recipient-reference");
    expect(screen.getByText(/Entregar unicamente/)).toHaveClass("lbl-recipient-notes");
  });
});
```

- [ ] **Step 3: Correr los tests**

Run: `npm --prefix apps/rotulos run test -- label-preview`
Expected: PASS — 4 tests.

- [ ] **Step 4: Actualizar el único caller (temporal, se completa en Tarea 8)**

`apps/rotulos/src/components/label-form.tsx` todavía llama `<LabelPreview draft={draft} settings={settings} />`, lo que ahora es un error de tipos (el componente ya no acepta `settings`). Esto se corrige explícitamente en la Tarea 8 (que también reescribe `printDraft()` en el mismo archivo) — no lo edites en esta tarea. Confirma con el siguiente typecheck que el único error restante es exactamente ese (prop `settings` sobrante en `label-form.tsx`), para no arrastrar un error distinto sin darte cuenta:

Run: `npm --prefix apps/rotulos run typecheck`
Expected: **falla**, con un error apuntando a `label-form.tsx` sobre la prop `settings` de `LabelPreview`. Si el error es otro, detente y reporta BLOCKED.

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/components/label-preview.tsx apps/rotulos/src/__tests__/label-preview.test.tsx
git commit -m "feat(rotulos): reescribir LabelPreview con el diseno ilustrado"
```

---

### Task 6: Selector de tamaño en el formulario

**Files:**
- Modify: `apps/rotulos/src/components/shipment-fields.tsx`

**Interfaces:**
- Consumes: `LABEL_SIZES` de `@/lib/types` (Tarea 2).

- [ ] **Step 1: Agregar el import**

Reemplazar:

```typescript
import type { LabelDraft } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
```

por:

```typescript
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
```

- [ ] **Step 2: Agregar el selector, junto a Transportadora**

Reemplazar:

```typescript
      <label className="field"><span>Transportadora</span><input value={value.carrier} aria-describedby={["carrier-help", errors.carrier ? "carrier-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.carrier} onInput={(event) => set("carrier", event.currentTarget.value)} onChange={(event) => set("carrier", event.target.value)} /><small className="field-hint" id="carrier-help">Maximo {PRINTABLE_LABEL_LIMITS.carrier} caracteres para imprimirla completa.</small>{errors.carrier ? <small id="carrier-error">{errors.carrier}</small> : null}</label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
```

por:

```typescript
      <label className="field"><span>Transportadora</span><input value={value.carrier} aria-describedby={["carrier-help", errors.carrier ? "carrier-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.carrier} onInput={(event) => set("carrier", event.currentTarget.value)} onChange={(event) => set("carrier", event.target.value)} /><small className="field-hint" id="carrier-help">Maximo {PRINTABLE_LABEL_LIMITS.carrier} caracteres para imprimirla completa.</small>{errors.carrier ? <small id="carrier-error">{errors.carrier}</small> : null}</label>
      <label className="field"><span>Tamano del rotulo</span><select value={value.size} onChange={(event) => set("size", event.target.value as LabelDraft["size"])}>{Object.entries(LABEL_SIZES).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
```

- [ ] **Step 3: Typecheck/lint**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint`
Expected: el error de `label-form.tsx` de la Tarea 5 sigue presente (esperado, se arregla en la Tarea 8); no debe haber ningún error nuevo relacionado con `shipment-fields.tsx`.

- [ ] **Step 4: Levantar en dev y confirmar el selector visualmente**

Run: `npm --prefix apps/rotulos run dev`

Ir a `http://localhost:3001/crear` y confirmar que aparece el campo "Tamano del rotulo" con las opciones "Pequeno (10 x 9 cm)" y "Grande (14 x 12 cm)" junto a Transportadora. Detener el server.

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/components/shipment-fields.tsx
git commit -m "feat(rotulos): agregar selector de tamano de rotulo al formulario"
```

---

### Task 7: `pdf.ts` — PDF con el diseño ilustrado

**Files:**
- Modify: `apps/rotulos/src/lib/pdf.ts`
- Modify: `apps/rotulos/src/__tests__/pdf.test.ts`

**Interfaces:**
- Consumes: `LABEL_SIZES` de `@/lib/types` (Tarea 2).
- Produces: `renderLabelPdfHtml`/`renderLabelPdfBuffer` mantienen su firma actual (`label`, `settings`, `options`) por compatibilidad con `apps/rotulos/src/app/api/labels/pdf/route.ts` y `apps/rotulos/src/app/api/labels/[id]/pdf/route.ts` (ninguno de los dos se modifica en este plan) — el parámetro `settings` queda sin uso dentro de la función (el diseño ya no lee `brandColors`/`logoUrl`/`qrUrl`/`brandPhrase`/`instagramUser`), lo cual es válido bajo la configuración de lint de este proyecto (un parámetro sin usar antes del último parámetro sí usado, `options`, no dispara `@typescript-eslint/no-unused-vars` con la configuración default `args: "after-used"`) — si el lint de todas formas se queja, es la única señal de que hay que ajustar algo, no lo seteés preventivamente.

- [ ] **Step 1: Reescribir el archivo**

Reemplazar todo el contenido de `apps/rotulos/src/lib/pdf.ts` por:

```typescript
import { formatCop, formatDate } from "@/lib/format";
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";

type PdfHtmlOptions = {
  origin?: string;
};

type PdfRenderOptions = PdfHtmlOptions & {
  timeoutMs?: number;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assetUrl(value: string, origin?: string): string {
  const trimmed = value.trim();
  if (!/^\/[a-zA-Z0-9/_\-.]+$/.test(trimmed)) return "";
  if (!origin) return trimmed;
  return new URL(trimmed, origin).toString();
}

export function renderLabelPdfHtml(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfHtmlOptions = {}): string {
  const size = LABEL_SIZES[label.size] ?? LABEL_SIZES["14x12"];
  const widthCm = size.widthCm;
  const heightCm = size.heightCm;
  const isCod = label.paymentMethod === "contraentrega";
  const bgUrl = assetUrl("/label-template-bg.png", options.origin);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Rotulo ${escapeHtml(label.orderNumber)}</title>
  <style>
    @page { size: ${widthCm}cm ${heightCm}cm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: ${widthCm}cm; height: ${heightCm}cm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .label-canvas {
      position: relative;
      width: ${widthCm}cm;
      height: ${heightCm}cm;
      overflow: hidden;
      color: #1a0630;
      font-family: Arial, Helvetica, sans-serif;
      container-type: inline-size;
      background-image: url("${escapeHtml(bgUrl)}");
      background-size: 100% 100%;
      background-repeat: no-repeat;
      background-color: #ffffff;
    }
    .lbl-f {
      position: absolute;
      font-weight: 700;
      line-height: 1.15;
      font-size: 2.7cqw;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lbl-f.lbl-multiline {
      white-space: normal;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
    }
    .lbl-sender-name { top: 40.8%; left: 8.8%; width: 31%; font-size: 3cqw; }
    .lbl-sender-phone { top: 47.4%; left: 8.8%; width: 31%; }
    .lbl-sender-city { top: 54%; left: 8.8%; width: 31%; }
    .lbl-sender-department { top: 60.6%; left: 8.8%; width: 31%; }
    .lbl-sender-address { top: 67%; left: 8.8%; width: 31%; height: 9%; }
    .lbl-recipient-name { top: 40.2%; left: 52.3%; width: 43.5%; font-size: 3cqw; }
    .lbl-recipient-phone { top: 45.2%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-department { top: 50.4%; left: 52.3%; width: 19%; }
    .lbl-recipient-city { top: 50.4%; left: 78.6%; width: 17%; }
    .lbl-recipient-address { top: 55.5%; left: 52.3%; width: 43.5%; height: 9%; }
    .lbl-recipient-neighborhood { top: 63%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-reference { top: 67.6%; left: 52.3%; width: 43.5%; }
    .lbl-recipient-notes { top: 72.1%; left: 52.3%; width: 43.5%; }
    .lbl-order-number { top: 87.6%; left: 5%; width: 13%; font-size: 1.9cqw; }
    .lbl-date { top: 87.6%; left: 23%; width: 10%; font-size: 1.9cqw; }
    .lbl-carrier { top: 87.6%; left: 38.5%; width: 13.7%; font-size: 1.6cqw; }
    .lbl-value { top: 87.6%; left: 74%; width: 7%; font-size: 1.9cqw; }
    .lbl-packages { top: 87.6%; left: 88%; width: 9%; font-size: 1.9cqw; text-align: center; }
    .lbl-check-paid, .lbl-check-cod { top: 88.8%; font-size: 2.2cqw; width: 3%; }
    .lbl-check-paid { left: 55.2%; }
    .lbl-check-cod { left: 62.3%; }
  </style>
</head>
<body>
  <main class="label-canvas">
    <span class="lbl-f lbl-sender-name">${escapeHtml(label.sender.name)}</span>
    <span class="lbl-f lbl-sender-phone">${escapeHtml(label.sender.phone)}</span>
    <span class="lbl-f lbl-sender-city">${escapeHtml(label.sender.city)}</span>
    <span class="lbl-f lbl-sender-department">${escapeHtml(label.sender.department)}</span>
    <span class="lbl-f lbl-multiline lbl-sender-address">${escapeHtml(label.sender.address)}</span>
    <span class="lbl-f lbl-recipient-name">${escapeHtml(label.recipient.fullName)}</span>
    <span class="lbl-f lbl-recipient-phone">${escapeHtml(label.recipient.phone)}</span>
    <span class="lbl-f lbl-recipient-department">${escapeHtml(label.recipient.department)}</span>
    <span class="lbl-f lbl-recipient-city">${escapeHtml(label.recipient.city)}</span>
    <span class="lbl-f lbl-multiline lbl-recipient-address">${escapeHtml(label.recipient.address)}</span>
    <span class="lbl-f lbl-recipient-neighborhood">${escapeHtml(label.recipient.neighborhood)}</span>
    <span class="lbl-f lbl-recipient-reference">${escapeHtml(label.recipient.reference)}</span>
    <span class="lbl-f lbl-recipient-notes">${escapeHtml(label.recipient.notes)}</span>
    <span class="lbl-f lbl-order-number">${escapeHtml(label.orderNumber)}</span>
    <span class="lbl-f lbl-date">${escapeHtml(formatDate(label.date))}</span>
    <span class="lbl-f lbl-carrier">${escapeHtml(label.carrier)}</span>
    <span class="lbl-f lbl-value">${isCod ? escapeHtml(formatCop(label.codAmount)) : ""}</span>
    <span class="lbl-f lbl-packages">${label.packageCount}</span>
    <span class="lbl-f ${isCod ? "lbl-check-cod" : "lbl-check-paid"}">&#10003;</span>
  </main>
</body>
</html>`;
}

export async function renderLabelPdfBuffer(label: LabelDraft | LabelRecord, settings: LabelSettings, options: PdfRenderOptions = {}): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    const size = LABEL_SIZES[label.size] ?? LABEL_SIZES["14x12"];
    const page = await browser.newPage({
      viewport: { width: Math.round(size.widthCm * 37.8), height: Math.round(size.heightCm * 37.8) },
    });
    await page.setContent(renderLabelPdfHtml(label, settings, options), {
      waitUntil: "networkidle",
      timeout: options.timeoutMs ?? 15_000,
    });
    return await page.pdf({
      width: `${size.widthCm}cm`,
      height: `${size.heightCm}cm`,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: true,
      preferCSSPageSize: true,
    });
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 2: Reescribir el test**

Reemplazar todo el contenido de `apps/rotulos/src/__tests__/pdf.test.ts` por:

```typescript
import { describe, expect, it } from "vitest";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { renderLabelPdfHtml } from "@/lib/pdf";

describe("renderLabelPdfHtml", () => {
  it("renders a 14cm x 12cm print document (default size) with key label content", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000777";
    draft.carrier = "Coordinadora";
    draft.packageCount = 2;
    draft.recipient.fullName = "Ana Perez";
    draft.recipient.address = "Carrera 45 # 10-20";

    const html = renderLabelPdfHtml(draft, defaultSettings, { origin: "https://purpleshop.test" });

    expect(html).toContain("@page { size: 14cm 12cm; margin: 0; }");
    expect(html).toContain("width: 14cm;");
    expect(html).toContain("height: 12cm;");
    expect(html).toContain("PS-2026-000777");
    expect(html).toContain("Coordinadora");
    expect(html).toContain('class="lbl-f lbl-packages">2<');
    expect(html).toContain("Ana Perez");
    expect(html).toContain("Carrera 45 # 10-20");
    expect(html).toContain('url("https://purpleshop.test/label-template-bg.png")');
  });

  it("renders a 10cm x 9cm print document for the small label size", () => {
    const draft = createBlankLabelDraft();
    draft.size = "10x9";

    const html = renderLabelPdfHtml(draft, defaultSettings);

    expect(html).toContain("@page { size: 10cm 9cm; margin: 0; }");
    expect(html).toContain("width: 10cm;");
    expect(html).toContain("height: 9cm;");
  });

  it("marks the contraentrega checkbox and shows the formatted value when payment is contraentrega", () => {
    const draft = createBlankLabelDraft();
    draft.paymentMethod = "contraentrega";
    draft.codAmount = 50000;

    const html = renderLabelPdfHtml(draft, defaultSettings);

    expect(html).toContain('class="lbl-f lbl-check-cod"');
    expect(html).not.toContain('class="lbl-f lbl-check-paid"');
    expect(html).toMatch(/lbl-value">\$\s?50\.000</);
  });

  it("escapes user controlled fields before embedding them in HTML", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = `PS-<script>alert("x")</script>`;
    draft.recipient.fullName = `<img src=x onerror=alert("x")>`;
    draft.recipient.notes = "Fragil & urgente";

    const html = renderLabelPdfHtml(draft, defaultSettings);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("PS-&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(&quot;x&quot;)&gt;");
    expect(html).toContain("Fragil &amp; urgente");
  });
});
```

Nota: se quita el test anterior "does not embed remote or data asset URLs in server-rendered PDFs" — verificaba que `settings.logoUrl`/`settings.qrUrl` maliciosos no se embebieran en el HTML. Esa superficie de ataque ya no existe: el nuevo `renderLabelPdfHtml` ni siquiera lee `settings.logoUrl`/`settings.qrUrl` (la única imagen embebida es la ruta fija `/label-template-bg.png`, nunca derivada de `settings`), así que no hace falta un test que cubra un código que ya no existe.

- [ ] **Step 3: Correr los tests**

Run: `npm --prefix apps/rotulos run test -- pdf`
Expected: PASS — 4 tests.

- [ ] **Step 4: Typecheck/lint**

Run: `npm --prefix apps/rotulos run typecheck && npm --prefix apps/rotulos run lint`
Expected: sin errores nuevos relacionados a `pdf.ts`/`pdf.test.ts` (el error de `label-form.tsx` de la Tarea 5 sigue pendiente, se resuelve en la Tarea 8).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/pdf.ts apps/rotulos/src/__tests__/pdf.test.ts
git commit -m "feat(rotulos): generar el PDF del rotulo con el diseno ilustrado y tamano por rotulo"
```

---

### Task 8: `label-form.tsx` — conectar preview y tamaño de impresión

**Files:**
- Modify: `apps/rotulos/src/components/label-form.tsx`

**Interfaces:**
- Consumes: `LABEL_SIZES` de `@/lib/types` (Tarea 2); `LabelPreview` sin prop `settings` (Tarea 5).

- [ ] **Step 1: Actualizar el import y quitar el prop `settings` de `LabelPreview`**

Reemplazar:

```typescript
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
import type { LabelDraft, LabelSettings } from "@/lib/types";
```

por:

```typescript
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
import { formatOrderNumber } from "@/lib/order-number";
import { validateLabelDraft } from "@/lib/validation";
import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft, LabelSettings } from "@/lib/types";
```

Reemplazar:

```typescript
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} settings={settings} />
      </div>
```

por:

```typescript
      <div className="preview-rail print-area">
        <LabelPreview draft={draft} />
      </div>
```

- [ ] **Step 2: Inyectar el tamaño de página antes de imprimir**

Reemplazar:

```typescript
  function printDraft() {
    if (!validateDraft()) return;
    window.print();
  }
```

por:

```typescript
  function printDraft() {
    if (!validateDraft()) return;
    const { widthCm, heightCm } = LABEL_SIZES[draft.size];
    const styleId = "dynamic-page-size";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${widthCm}cm ${heightCm}cm; margin: 0; }`;
    window.print();
  }
```

- [ ] **Step 3: Typecheck**

Run: `npm --prefix apps/rotulos run typecheck`
Expected: **sin errores** — este era el último punto pendiente desde la Tarea 5; confirma que no queda ningún error de tipos en todo el proyecto.

- [ ] **Step 4: Lint y suite completa**

Run: `npm --prefix apps/rotulos run lint && npm --prefix apps/rotulos run test`
Expected: sin errores; la suite completa pasa (incluye `label-form.test.tsx`, que no se modificó en este plan pero debe seguir pasando sin cambios — si algún test de ese archivo falla, es una señal real de romper algo, no lo ajustes sin entender por qué primero).

- [ ] **Step 5: Verificar manualmente que imprimir usa el tamaño correcto**

Run: `npm --prefix apps/rotulos run dev`

En `http://localhost:3001/crear`, completar un rótulo, elegir tamaño "Pequeno (10 x 9 cm)", hacer click en "Imprimir", y en el diálogo de impresión del navegador confirmar que el tamaño de papel calculado/mostrado es 10cm x 9cm (no el tamaño por defecto de la impresora). Repetir con "Grande (14 x 12 cm)". Detener el server.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/components/label-form.tsx
git commit -m "feat(rotulos): conectar LabelPreview sin settings y ajustar el tamano de pagina al imprimir"
```

---

### Task 9: Verificación final

**Files:** ninguno (verificación, no cambios de código).

- [ ] **Step 1: Build de producción y suite completa**

Run: `npm --prefix apps/rotulos run build && npm --prefix apps/rotulos run test`
Expected: build exitoso; todos los tests pasan.

- [ ] **Step 2: Confirmar por HTTP que el asset se sirve**

Run: `npm --prefix apps/rotulos run dev` (en background)
Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/label-template-bg.png`
Expected: `200`. Detener el server.

- [ ] **Step 3: Verificación visual manual (recordatorio para el usuario)**

Esta tarea no puede completarse de forma automatizada — requiere ver la pantalla. En `http://localhost:3001/crear`, completar un rótulo con datos reales, confirmar que el preview se ve igual a la imagen de referencia (fondo ilustrado morado, logo circular, QR, franjas REMITENTE/DESTINATARIO, barra inferior con checkbox de método de pago marcado correctamente), probar ambos tamaños, y descargar el PDF para confirmar que coincide con el preview. Si hay una impresora física disponible, imprimir de prueba antes de dar por validado el diseño (como se hizo con el diseño anterior).

- [ ] **Step 4: No requiere commit** — esta tarea es solo verificación.

---

## Spec Coverage Check

- Tamaño por rótulo (`size` en `LabelDraft`/`LabelRecord`, no en `LabelSettings`) → Tareas 1-3.
- `labelSize`/`logoUrl`/`qrUrl` de `LabelSettings` sin tocar → ninguna tarea los modifica.
- Posiciones exactas del commit `a4e68d1` → Tareas 4 (CSS) y 7 (PDF), copiadas verbatim del spec.
- Logo/QR incluidos en la imagen, sin `<img>` separado → Tarea 5.
- Selector de tamaño en el formulario → Tarea 6.
- PDF con tamaño por rótulo → Tarea 7.
- `@page` dinámico al imprimir → Tarea 8.
- Migración de la columna `size` → Tarea 1.
- Tests reescritos junto con la implementación → Tareas 5 y 7.
- Verificación visual manual → Tarea 9 (explícitamente fuera de lo automatizable).
