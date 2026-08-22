# Operacion Post Importacion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear herramientas para auditar pedidos historicos importados, prevenir clientes duplicados y comparar backups JSON sin escribir datos en produccion.

**Architecture:** El sprint se implementa por capas pequenas: funciones puras en `src/lib`, tests unitarios primero, componentes cliente para vistas operativas y APIs protegidas solo cuando se requiera acceder a backups completos. La restauracion de JSON queda fuera del sprint; el comparador produce evidencia para decidir despues.

**Tech Stack:** Next.js App Router, TypeScript, Supabase, Vitest, Testing Library, lucide-react, stores existentes de `apps/rotulos/src/lib`.

**Spec:** `docs/superpowers/specs/2026-08-22-operacion-post-importacion-design.md`

## Global Constraints

- No implementar restauracion automatica desde JSON en este sprint.
- No automatizar lectura del Excel real del negocio.
- Mantener idempotencia del importador por `orders.import_row_key`.
- Normalizar alias de clientes a mayuscula antes de usarlos.
- Toda API nueva bajo `src/app/api/` debe llamar `requireSession()` al inicio.
- Cerrar cada tarea de codigo con `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Cerrar cambios con commit, push y deploy, salvo instruccion contraria explicita de Edwing.

---

## File Structure

- `apps/rotulos/src/lib/imported-orders.ts`: filtros, metricas y ordenamiento para pedidos historicos.
- `apps/rotulos/src/components/imported-orders-table.tsx`: tabla filtrable de pedidos `excel_import`.
- `apps/rotulos/src/app/(app)/pedidos/importados/page.tsx`: vista operativa de pedidos importados.
- `apps/rotulos/src/lib/customer-aliases.ts`: normalizacion y resolucion de alias canonicos.
- `apps/rotulos/src/lib/customer-duplicates.ts`: heuristicas de duplicados por nombre, telefono y tokens.
- `apps/rotulos/src/components/customer-duplicate-alerts.tsx`: sugerencias en `Clientes`.
- `apps/rotulos/src/lib/historical-reports.ts`: agregados 2024/2025 por anio, mes, cliente y producto.
- `apps/rotulos/src/components/historical-report-panel.tsx`: panel nuevo dentro de `Reportes`.
- `apps/rotulos/src/lib/backup-compare.ts`: comparacion pura de backup JSON contra snapshot actual.
- `apps/rotulos/src/components/backup-compare.tsx`: carga local de JSON y visualizacion de diferencias.
- `CLAUDE.md` y `NEXT_STEPS.md`: handoff actualizado al cerrar sprint.

---

### Task 1: Vista Pedidos Importados

**Files:**
- Create: `apps/rotulos/src/lib/imported-orders.ts`
- Create: `apps/rotulos/src/components/imported-orders-table.tsx`
- Create: `apps/rotulos/src/app/(app)/pedidos/importados/page.tsx`
- Modify: `apps/rotulos/src/components/app-shell.tsx`
- Test: `apps/rotulos/src/__tests__/imported-orders.test.ts`
- Test: `apps/rotulos/src/__tests__/imported-orders-table.test.tsx`

**Interfaces:**
- Consumes: `OrderRecord` from `@/lib/business-types`.
- Produces: `getImportedOrders(orders: OrderRecord[]): OrderRecord[]`.
- Produces: `getImportedOrderSummary(orders: OrderRecord[]): { orders: number; items: number; total: number; customers: number; years: string[] }`.

- [ ] **Step 1: Write pure tests**

```ts
import { describe, expect, it } from "vitest";
import { getImportedOrders, getImportedOrderSummary } from "@/lib/imported-orders";
import type { OrderRecord } from "@/lib/business-types";

function order(id: string, source: OrderRecord["source"], orderDate: string, customer: string, total = 100): OrderRecord {
  return {
    id,
    orderNumber: id,
    customerId: null,
    customer: { fullName: customer, phone: "", address: "", department: "", city: "", locality: "", neighborhood: "" },
    orderDate,
    status: "completed",
    notes: "",
    items: [{ id: `${id}-item`, productCode: "REF", productName: "Producto", quantity: 2, unitPrice: total / 2, total }],
    subtotal: total,
    discount: 0,
    shippingCost: 0,
    total,
    source,
    importBatchId: source === "excel_import" ? "batch" : null,
    importRowKey: source === "excel_import" ? `${id}:row` : null,
    createdAt: `${orderDate}T00:00:00.000Z`,
    updatedAt: `${orderDate}T00:00:00.000Z`,
  };
}

describe("imported orders", () => {
  it("keeps only excel imports ordered newest first", () => {
    expect(getImportedOrders([
      order("a", "app", "2026-01-01", "ZAIDA"),
      order("b", "excel_import", "2024-03-01", "JOHANNA"),
      order("c", "excel_import", "2025-08-01", "LINA"),
    ]).map((o) => o.id)).toEqual(["c", "b"]);
  });

  it("summarizes imported orders", () => {
    expect(getImportedOrderSummary([
      order("b", "excel_import", "2024-03-01", "JOHANNA", 200),
      order("c", "excel_import", "2025-08-01", "LINA", 300),
    ])).toEqual({ orders: 2, items: 4, total: 500, customers: 2, years: ["2024", "2025"] });
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/__tests__/imported-orders.test.ts`
Expected: FAIL because `@/lib/imported-orders` does not exist.

- [ ] **Step 3: Implement pure helpers**

Create `imported-orders.ts` with source filter, newest-first ordering and summary totals. Count items by sum of quantities, not by number of rows.

- [ ] **Step 4: Add page and table**

Implement a compact table with filters for year, customer text and status. Page loads `getBusinessStore().listOrders()`, calls helpers, and renders metric cards plus the table. Add nav item `"/pedidos/importados"` labelled `"Importados"` and `PAGE_META`.

- [ ] **Step 5: Add component tests**

Test that only imported rows render, customer filtering works, and `importRowKey` appears when present.

- [ ] **Step 6: Verify and commit**

Run full validation, then commit:

```bash
git add apps/rotulos/src/lib/imported-orders.ts apps/rotulos/src/components/imported-orders-table.tsx apps/rotulos/src/app/(app)/pedidos/importados/page.tsx apps/rotulos/src/components/app-shell.tsx apps/rotulos/src/__tests__/imported-orders.test.ts apps/rotulos/src/__tests__/imported-orders-table.test.tsx
git commit -m "feat(rotulos): agregar vista de pedidos importados"
```

---

### Task 2: Mapa De Alias Para Importacion

**Files:**
- Create: `apps/rotulos/src/lib/customer-aliases.ts`
- Modify: `apps/rotulos/src/lib/excel-import/map-to-db.ts`
- Test: `apps/rotulos/src/__tests__/customer-aliases.test.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-map-to-db.test.ts`

**Interfaces:**
- Produces: `resolveCustomerAlias(name: string): string`.
- Consumes in import mapping before customer lookup/create.

- [ ] **Step 1: Write alias tests**

```ts
import { describe, expect, it } from "vitest";
import { resolveCustomerAlias } from "@/lib/customer-aliases";

describe("resolveCustomerAlias", () => {
  it.each([
    ["johanna", "JOHANNA CICACHA"],
    ["ZAIDA", "ZAIDA SUAREZ"],
    ["lina", "LINA GONZALEZ"],
    ["paula", "PAULA BAJONERO"],
  ])("maps %s to %s", (input, expected) => {
    expect(resolveCustomerAlias(input)).toBe(expected);
  });

  it("keeps unknown names normalized", () => {
    expect(resolveCustomerAlias("  Andrea Ubaque ")).toBe("ANDREA UBAQUE");
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/__tests__/customer-aliases.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement alias resolver**

Use `normalizeText` and this initial map: `JOHANNA -> JOHANNA CICACHA`, `ZAIDA -> ZAIDA SUAREZ`, `LINA -> LINA GONZALEZ`, `PAULA -> PAULA BAJONERO`.

- [ ] **Step 4: Apply alias in Excel mapping**

In `map-to-db.ts`, normalize parsed customer names through `resolveCustomerAlias()` before building the customer snapshot or lookup key. Preserve `import_row_key`; do not modify item refs.

- [ ] **Step 5: Extend map-to-db tests**

Add a test that imported `JOHANNA` maps to customer name `JOHANNA CICACHA` and does not produce a second customer key.

- [ ] **Step 6: Verify and commit**

Run full validation, then commit:

```bash
git add apps/rotulos/src/lib/customer-aliases.ts apps/rotulos/src/lib/excel-import/map-to-db.ts apps/rotulos/src/__tests__/customer-aliases.test.ts apps/rotulos/src/__tests__/excel-import-map-to-db.test.ts
git commit -m "fix(rotulos): aplicar alias de clientes al importar excel"
```

---

### Task 3: Detector De Clientes Duplicados

**Files:**
- Create: `apps/rotulos/src/lib/customer-duplicates.ts`
- Create: `apps/rotulos/src/components/customer-duplicate-alerts.tsx`
- Modify: `apps/rotulos/src/components/customers-table.tsx`
- Test: `apps/rotulos/src/__tests__/customer-duplicates.test.ts`
- Test: `apps/rotulos/src/__tests__/customer-duplicate-alerts.test.tsx`

**Interfaces:**
- Produces: `findCustomerDuplicateCandidates(customers: Customer[]): CustomerDuplicateCandidate[]`.
- Produces type: `{ reason: "same_name" | "same_phone" | "alias"; primary: Customer; duplicates: Customer[] }`.

- [ ] **Step 1: Write duplicate tests**

Cover exact same name, same non-empty phone and known aliases (`JOHANNA` with `JOHANNA CICACHA`). Assert results are sorted by `primary.fullName`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/__tests__/customer-duplicates.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement duplicate finder**

Use `normalizeText`, `resolveCustomerAlias` and non-empty phone normalization. Choose primary by: non-`excel_import` first, more complete contact fields second, newest `updatedAt` third.

- [ ] **Step 4: Render suggestions in Clientes**

Add `CustomerDuplicateAlerts` above the customers table. It should show compact rows with primary, candidates and reason, plus reuse the existing "Unificar" flow entry point if available. It must not auto-merge.

- [ ] **Step 5: Add component tests**

Test that duplicate suggestions render and that no alert appears for an already clean list.

- [ ] **Step 6: Verify and commit**

Run full validation, then commit:

```bash
git add apps/rotulos/src/lib/customer-duplicates.ts apps/rotulos/src/components/customer-duplicate-alerts.tsx apps/rotulos/src/components/customers-table.tsx apps/rotulos/src/__tests__/customer-duplicates.test.ts apps/rotulos/src/__tests__/customer-duplicate-alerts.test.tsx
git commit -m "feat(rotulos): detectar posibles clientes duplicados"
```

---

### Task 4: Reporte Historico 2024/2025

**Files:**
- Create: `apps/rotulos/src/lib/historical-reports.ts`
- Create: `apps/rotulos/src/components/historical-report-panel.tsx`
- Modify: `apps/rotulos/src/app/(app)/reportes/page.tsx`
- Test: `apps/rotulos/src/__tests__/historical-reports.test.ts`
- Test: `apps/rotulos/src/__tests__/historical-report-panel.test.tsx`

**Interfaces:**
- Produces: `buildHistoricalReport(orders: OrderRecord[], years?: string[]): HistoricalReport`.
- `HistoricalReport` includes `totalsByYear`, `topProducts`, `topCustomers`, `missingRefItems`, and `historicalRefItems`.

- [ ] **Step 1: Write report tests**

Use 2024, 2025 and 2026 orders. Assert the default report includes only 2024/2025, excludes cancelled orders from sales totals, counts `HIST_` product refs separately and lists blank/missing refs if any remain.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/__tests__/historical-reports.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement report builder**

Aggregate only `orders.source === "excel_import"` and years `["2024", "2025"]` by default. Sort top products by quantity, then sales, then name. Sort top customers by total, then order count, then name.

- [ ] **Step 4: Render panel in Reportes**

Add a compact panel after existing monthly report or below metrics. Include totals by year, top 10 products, top 10 customers and count/list of `HIST_` refs. Avoid a new route unless the page gets visually overloaded.

- [ ] **Step 5: Add component tests**

Test that the panel displays 2024/2025 totals and historical refs.

- [ ] **Step 6: Verify and commit**

Run full validation, then commit:

```bash
git add apps/rotulos/src/lib/historical-reports.ts apps/rotulos/src/components/historical-report-panel.tsx apps/rotulos/src/app/(app)/reportes/page.tsx apps/rotulos/src/__tests__/historical-reports.test.ts apps/rotulos/src/__tests__/historical-report-panel.test.tsx
git commit -m "feat(rotulos): agregar reporte historico importado"
```

---

### Task 5: Comparador De Backup JSON

**Files:**
- Create: `apps/rotulos/src/lib/backup-compare.ts`
- Create: `apps/rotulos/src/components/backup-compare.tsx`
- Modify: `apps/rotulos/src/components/data-export.tsx`
- Test: `apps/rotulos/src/__tests__/backup-compare.test.ts`
- Test: `apps/rotulos/src/__tests__/backup-compare-component.test.tsx`

**Interfaces:**
- Produces: `compareBackupSnapshots(before: BackupSnapshot, current: BackupSnapshot): BackupCompareReport`.
- `BackupCompareReport` includes table summaries and row-level differences keyed by stable ids.

- [ ] **Step 1: Write comparator tests**

Build two snapshots with changed customer name, missing order, extra order and unchanged item. Assert grouped counts by table and row-level details.

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- --run src/__tests__/backup-compare.test.ts`
Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement pure comparator**

Compare known backup arrays by `id` where available. For `settings`, compare by `key`. Ignore key order inside JSON objects by stable-stringifying sorted object keys before comparing.

- [ ] **Step 4: Add Configuracion UI**

Add a "Comparar backup JSON" section to `DataExport`. The user selects a local `.json` backup file; the component fetches `/api/export?format=json` for current state, runs `compareBackupSnapshots`, and renders counts plus expandable row ids. Do not upload the selected file to any server.

- [ ] **Step 5: Add component tests**

Mock `fetch` for current backup, simulate file upload, assert changed/missing/extra counts appear.

- [ ] **Step 6: Verify and commit**

Run full validation, then commit:

```bash
git add apps/rotulos/src/lib/backup-compare.ts apps/rotulos/src/components/backup-compare.tsx apps/rotulos/src/components/data-export.tsx apps/rotulos/src/__tests__/backup-compare.test.ts apps/rotulos/src/__tests__/backup-compare-component.test.tsx
git commit -m "feat(rotulos): comparar backups json"
```

---

### Task 6: Cierre Del Sprint

**Files:**
- Modify: `CLAUDE.md`
- Modify: `NEXT_STEPS.md`

**Interfaces:**
- Produces: handoff actualizado con features terminadas, limitaciones y pendientes.

- [ ] **Step 1: Run final validation**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git status --short --branch
```

- [ ] **Step 2: Push and deploy**

Run:

```bash
git push origin main
```

Then confirm Vercel production deploy from the pushed `main` commit. If auto-deploy is delayed, verify with production `/login` returning HTTP 200 and inspect deployment status.

- [ ] **Step 3: Update docs**

Update `CLAUDE.md` and `NEXT_STEPS.md` with exact completed commits, production verification and any manual checks not possible.

- [ ] **Step 4: Commit docs**

```bash
git add CLAUDE.md NEXT_STEPS.md
git commit -m "docs(rotulos): cerrar sprint post importacion"
git push origin main
```

---

## Suggested Sprint Order And Estimate

1. Pedidos importados: 1-2 horas.
2. Alias de importacion: 2-4 horas.
3. Detector de duplicados: 2-3 horas.
4. Reporte historico: 2-4 horas.
5. Comparador JSON solo lectura: 2-4 horas.
6. Cierre, deploy y handoff: 30-60 minutos.

Estimacion total: 1.5 a 2 dias de trabajo cuidadoso, o 1 dia largo si se acepta hacer menos refinamiento visual.

## Self-Review

- Spec coverage: las cinco mejoras propuestas tienen una tarea propia y cierre de sprint.
- Placeholder scan: no hay marcadores pendientes; cada tarea define archivos, interfaces y pruebas.
- Risk review: la restauracion JSON queda fuera de alcance a proposito; el sprint solo compara y sugiere.
