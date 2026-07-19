# Importador de data histórica desde Excel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importar los pedidos históricos de `REFERENCIAS.xlsx` (10 hojas, una por mes, bloques de pedido por cliente) a Supabase (`customers`/`orders`/`order_items`), con un script CLI de dos fases (preview sin escribir nada, luego `--commit`) que es idempotente y reporta advertencias/errores antes de tocar la base de datos.

**Architecture:** Lógica de parseo/validación/mapeo vive como funciones puras y testeables en `apps/rotulos/src/lib/excel-import/` (sin I/O), consumidas por un script CLI delgado (`apps/rotulos/scripts/import-excel.ts`) que hace la lectura del `.xlsx` (con `exceljs`) y la escritura a Supabase (con `@supabase/supabase-js` + service role key). Una migración SQL agrega columnas de trazabilidad/dedupe a `orders`.

**Tech Stack:** TypeScript, Vitest (tests), `exceljs` (lectura xlsx), `tsx` (correr el script TS sin build), `@supabase/supabase-js` (escritura con service role), Supabase Postgres (migración SQL).

## Global Constraints

- Todo texto libre (nombre cliente, descripción de producto, REF) se normaliza a MAYÚSCULA antes de guardar, igual que el resto de la app (`apps/rotulos/src/lib/normalize.ts`, función `normalizeText`).
- No se cruza clientes del import contra clientes reales existentes por nombre — solo se deduplica contra clientes ya creados por el propio importador (identificados por `phone = ''`).
- `PRECIO TOTAL` de cada línea del Excel es la fuente de verdad del total de línea; nunca se recalcula como `cantidad × precio unitario`.
- Desajustes de totales (SUBTOTAL/TOTAL declarados vs. calculados) son advertencias, nunca bloquean el import de un bloque. Solo bloques con datos rotos (cliente vacío, ítem sin cantidad/precio, bloque sin ítems, nombre de cliente inconsistente dentro del bloque) se excluyen.
- El importador nunca escribe en Supabase sin el flag explícito `--commit`.
- El importador debe ser idempotente: correrlo N veces con el mismo archivo produce el mismo resultado final (vía `orders.import_row_key` único).
- No se toca `product_codes` (catálogo vivo) desde este importador.
- No se modifica ningún archivo bajo `apps/rotulos/src/` fuera de `apps/rotulos/src/lib/excel-import/` y los tests nuevos.

Spec completo: `docs/superpowers/specs/2026-07-19-importador-excel-historico-design.md`

---

### Task 1: Migración — columnas de trazabilidad en `orders`

**Files:**
- Create: `apps/rotulos/supabase/migrations/202607190001_add_excel_import_tracking.sql`

**Interfaces:**
- Consumes: nada (primera tarea).
- Produces: columnas `orders.source` (`text`, default `'app'`), `orders.import_batch_id` (`uuid`, nullable), `orders.import_row_key` (`text`, nullable, único parcial donde `source = 'excel_import'`). Todas las tareas siguientes que escriben en `orders` dependen de que estas columnas existan.

- [ ] **Step 1: Escribir la migración**

```sql
alter table public.orders
  add column if not exists source text not null default 'app';

alter table public.orders
  add constraint orders_source_check check (source in ('app', 'excel_import'));

alter table public.orders
  add column if not exists import_batch_id uuid;

alter table public.orders
  add column if not exists import_row_key text;

create unique index if not exists orders_import_row_key_unique_idx
  on public.orders (import_row_key)
  where source = 'excel_import';
```

- [ ] **Step 2: Aplicar la migración**

Run: `supabase db push --workdir apps/rotulos` (o pegar el SQL en el SQL Editor de Supabase si `supabase db push` no está disponible localmente).

- [ ] **Step 3: Verificar que las columnas existen**

Run (en el SQL Editor de Supabase o `psql`):

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('source', 'import_batch_id', 'import_row_key');
```

Expected: 3 filas, `source` con `column_default` = `'app'::text`.

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/supabase/migrations/202607190001_add_excel_import_tracking.sql
git commit -m "feat(rotulos): agregar columnas de trazabilidad para import de Excel"
```

---

### Task 2: Tipos compartidos + parseo de periodo de hoja

**Files:**
- Create: `apps/rotulos/src/lib/excel-import/types.ts`
- Create: `apps/rotulos/src/lib/excel-import/period.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-period.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: tipos `CellValue`, `SheetRow`, `ParsedItem`, `UnexpectedCell`, `ParsedBlock`, `SheetParseResult` (usados por Task 3 en adelante) y función `parseSheetPeriod(sheetName: string): string` (usada por Task 5).

- [ ] **Step 1: Crear los tipos compartidos**

```typescript
// apps/rotulos/src/lib/excel-import/types.ts
export type CellValue = string | number | null;
export type SheetRow = CellValue[];

export interface ParsedItem {
  rowNumber: number;
  ref: string;
  clientName: string;
  description: string;
  quantity: number;
  lineTotal: number;
}

export interface UnexpectedCell {
  rowNumber: number;
  columnIndex: number;
  value: CellValue;
}

export interface ParsedBlock {
  sheetName: string;
  blockIndex: number;
  clientName: string;
  startRow: number;
  endRow: number;
  items: ParsedItem[];
  subtotalDeclared: number | null;
  shippingDeclared: number | null;
  totalDeclared: number | null;
  shippingRowSeen: boolean;
  totalRowSeen: boolean;
  errors: string[];
  warnings: string[];
}

export interface SheetParseResult {
  sheetName: string;
  blocks: ParsedBlock[];
  unexpectedCells: UnexpectedCell[];
}
```

- [ ] **Step 2: Escribir el test de `parseSheetPeriod` (falla primero)**

```typescript
// apps/rotulos/src/__tests__/excel-import-period.test.ts
import { describe, expect, it } from "vitest";
import { parseSheetPeriod } from "@/lib/excel-import/period";

describe("parseSheetPeriod", () => {
  it("interpreta un mes de 3 letras con año", () => {
    expect(parseSheetPeriod("OCT 2025")).toBe("2025-10-01");
  });

  it("interpreta meses con nombre largo (MAYO, JUNIO, JULIO)", () => {
    expect(parseSheetPeriod("MAYO 2026")).toBe("2026-05-01");
    expect(parseSheetPeriod("JUNIO 2026")).toBe("2026-06-01");
    expect(parseSheetPeriod("JULIO 2026")).toBe("2026-07-01");
  });

  it("interpreta SEPT y ENE (casos límite de la lista real de hojas)", () => {
    expect(parseSheetPeriod("SEPT 2025")).toBe("2025-09-01");
    expect(parseSheetPeriod("ENE 2026")).toBe("2026-01-01");
  });

  it("es tolerante a espacios extra y minúsculas", () => {
    expect(parseSheetPeriod("  nov   2025  ")).toBe("2025-11-01");
  });

  it("lanza error si el nombre de hoja no tiene el patrón MES AÑO", () => {
    expect(() => parseSheetPeriod("RESUMEN")).toThrow(/No se pudo interpretar/);
  });

  it("lanza error si el mes no está en el diccionario conocido", () => {
    expect(() => parseSheetPeriod("XYZ 2025")).toThrow(/Mes desconocido/);
  });
});
```

- [ ] **Step 3: Correr el test y verificar que falla**

Run: `npm --prefix apps/rotulos run test -- excel-import-period`
Expected: FAIL con "Cannot find module '@/lib/excel-import/period'" o similar.

- [ ] **Step 4: Implementar `parseSheetPeriod`**

```typescript
// apps/rotulos/src/lib/excel-import/period.ts
const MONTH_BY_TOKEN: Record<string, number> = {
  ENE: 1,
  FEB: 2,
  MAR: 3,
  ABR: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGO: 8,
  SEPT: 9,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DIC: 12,
};

export function parseSheetPeriod(sheetName: string): string {
  const normalized = sheetName.trim().toUpperCase().replace(/\s+/g, " ");
  const match = normalized.match(/^([A-ZÑ]+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`No se pudo interpretar el periodo de la hoja "${sheetName}"`);
  }
  const [, token, yearStr] = match;
  const month = MONTH_BY_TOKEN[token];
  if (!month) {
    throw new Error(`Mes desconocido "${token}" en hoja "${sheetName}"`);
  }
  return `${yearStr}-${String(month).padStart(2, "0")}-01`;
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- excel-import-period`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/excel-import/types.ts apps/rotulos/src/lib/excel-import/period.ts apps/rotulos/src/__tests__/excel-import-period.test.ts
git commit -m "feat(rotulos): tipos y parseo de periodo para import de Excel"
```

---

### Task 3: Detección de bloques (parser)

**Files:**
- Create: `apps/rotulos/src/lib/excel-import/parser.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-parser.test.ts`

**Interfaces:**
- Consumes: tipos de Task 2 (`CellValue`, `SheetRow`, `ParsedBlock`, `SheetParseResult`).
- Produces: `parseSheetRows(sheetName: string, rows: SheetRow[]): SheetParseResult` (usada por Task 4, Task 5 y el CLI).

- [ ] **Step 1: Escribir los tests de detección de bloques (fallan primero)**

Los fixtures reproducen la estructura real observada en `SEPT 2025` (un bloque, columna extra de subtotal pegada al último ítem) y `JUNIO 2026` (múltiples bloques, ENVIO vacío, columna extra J con datos sueltos).

```typescript
// apps/rotulos/src/__tests__/excel-import-parser.test.ts
import { describe, expect, it } from "vitest";
import { parseSheetRows } from "@/lib/excel-import/parser";
import type { SheetRow } from "@/lib/excel-import/types";

const HEADER: SheetRow = ["REF", "CLIENTE", "DESCRIPCION", "CANTIDAD", "TALLA", "PRECIO UNITARIO", "PRECIO TOTAL"];

describe("parseSheetRows", () => {
  it("parsea un bloque único con subtotal, ignorando columna extra pegada al último ítem", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES BAILIN Y PERLA", 1, null, null, 13500],
      ["P778", "ANDREA", "PULSERA PERLAS Y DIJE", 1, null, null, 16500],
      ["ACC448", "ANDREA", "DECORADOR DE CABLES", 2, null, null, 5000, 100000],
      [null, null, null, "SUBTOTAL", null, null, 35000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks).toHaveLength(1);
    const [block] = result.blocks;
    expect(block.clientName).toBe("ANDREA");
    expect(block.items).toHaveLength(3);
    expect(block.subtotalDeclared).toBe(35000);
    expect(block.errors).toEqual([]);
    expect(result.unexpectedCells).toEqual([{ rowNumber: 4, columnIndex: 7, value: 100000 }]);
  });

  it("parsea múltiples bloques en la misma hoja, con ENVIO vacío en uno de ellos", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["J2334", "ZAIDA", "JUEGO HONGUITO Y CORAZON", 1, null, null, 18500],
      [null, null, null, "SUBTOTAL", null, null, 18500],
      [null, null, null, "ENVIO", null, null, 8500],
      [null, null, null, "TOTAL", null, null, 27000],
      HEADER,
      ["Z4133", "ANDREA", "CANDONGA BALINES", 1, null, null, 8500],
      [null, null, null, "SUBTOTAL", null, null, 8500],
      [null, null, null, "ENVIO", null, null, null],
      [null, null, null, "TOTAL", null, null, 8500],
    ];

    const result = parseSheetRows("JUNIO 2026", rows);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].clientName).toBe("ZAIDA");
    expect(result.blocks[0].shippingDeclared).toBe(8500);
    expect(result.blocks[0].totalDeclared).toBe(27000);
    expect(result.blocks[1].clientName).toBe("ANDREA");
    expect(result.blocks[1].shippingRowSeen).toBe(true);
    expect(result.blocks[1].shippingDeclared).toBeNull();
  });

  it("marca error si el nombre de cliente cambia dentro del mismo bloque", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      ["P778", "OTRA", "PULSERA PERLAS", 1, null, null, 16500],
      [null, null, null, "SUBTOTAL", null, null, 30000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].errors.some((e) => e.includes("inconsistente"))).toBe(true);
  });

  it("marca error 'sin ningún ítem' si el bloque no tiene ítems", () => {
    const rows: SheetRow[] = [HEADER, [null, null, null, "SUBTOTAL", null, null, 0]];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].errors).toEqual(["Bloque sin ningún ítem"]);
  });

  it("marca error de ítem inválido cuando falta cantidad o precio total", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", null, null, null, null],
      [null, null, null, "SUBTOTAL", null, null, 0],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks[0].items).toHaveLength(0);
    expect(result.blocks[0].errors.some((e) => e.includes("Ítem inválido"))).toBe(true);
  });

  it("ignora filas completamente vacías sin cerrar el bloque", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      [null, null, null, null, null, null, null],
      ["P778", "ANDREA", "PULSERA PERLAS", 1, null, null, 16500],
      [null, null, null, "SUBTOTAL", null, null, 30000],
    ];

    const result = parseSheetRows("SEPT 2025", rows);

    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].items).toHaveLength(2);
  });

  it("un nuevo header cierra el bloque anterior aunque no haya SUBTOTAL", () => {
    const rows: SheetRow[] = [
      HEADER,
      ["Z1335", "ANDREA", "SET 3 ARETES", 1, null, null, 13500],
      HEADER,
      ["J1652", "CARO", "JUEGO GRANDE CORAZON", 1, null, null, 29000],
      [null, null, null, "SUBTOTAL", null, null, 29000],
    ];

    const result = parseSheetRows("JUNIO 2026", rows);

    expect(result.blocks).toHaveLength(2);
    expect(result.blocks[0].clientName).toBe("ANDREA");
    expect(result.blocks[0].subtotalDeclared).toBeNull();
    expect(result.blocks[1].clientName).toBe("CARO");
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm --prefix apps/rotulos run test -- excel-import-parser`
Expected: FAIL con "Cannot find module '@/lib/excel-import/parser'".

- [ ] **Step 3: Implementar `parseSheetRows`**

```typescript
// apps/rotulos/src/lib/excel-import/parser.ts
import type { CellValue, ParsedBlock, SheetParseResult, SheetRow } from "./types";

const COL_REF = 0;
const COL_CLIENTE = 1;
const COL_DESCRIPCION = 2;
const COL_CANTIDAD = 3;
const COL_PRECIO_TOTAL = 6;

function normCell(value: CellValue): string {
  return (value === null || value === undefined ? "" : String(value)).trim().toUpperCase();
}

function isRowEmpty(row: SheetRow): boolean {
  return row.every((cell) => cell === null || cell === undefined || String(cell).trim() === "");
}

function isHeaderRow(row: SheetRow): boolean {
  return (
    normCell(row[COL_REF]) === "REF" &&
    normCell(row[COL_CLIENTE]) === "CLIENTE" &&
    normCell(row[COL_DESCRIPCION]) === "DESCRIPCION" &&
    normCell(row[COL_CANTIDAD]) === "CANTIDAD"
  );
}

function toNumber(value: CellValue): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "" && !Number.isNaN(Number(value.trim()))) {
    return Number(value.trim());
  }
  return null;
}

function newBlock(sheetName: string, blockIndex: number, rowNumber: number): ParsedBlock {
  return {
    sheetName,
    blockIndex,
    clientName: "",
    startRow: rowNumber,
    endRow: rowNumber,
    items: [],
    subtotalDeclared: null,
    shippingDeclared: null,
    totalDeclared: null,
    shippingRowSeen: false,
    totalRowSeen: false,
    errors: [],
    warnings: [],
  };
}

export function parseSheetRows(sheetName: string, rows: SheetRow[]): SheetParseResult {
  const blocks: ParsedBlock[] = [];
  const unexpectedCells: SheetParseResult["unexpectedCells"] = [];
  let current: ParsedBlock | null = null;
  let phase: "items" | "closed" = "items";
  let blockIndex = 0;

  const closeCurrent = () => {
    if (!current) return;
    if (current.items.length === 0) {
      current.errors.push("Bloque sin ningún ítem");
    } else if (!current.clientName) {
      current.errors.push("Nombre de cliente vacío");
    }
    blocks.push(current);
    current = null;
  };

  const pushUnexpectedCellsFrom = (row: SheetRow, rowNumber: number, fromColumn: number) => {
    for (let columnIndex = fromColumn; columnIndex < row.length; columnIndex++) {
      const value = row[columnIndex];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        unexpectedCells.push({ rowNumber, columnIndex, value });
      }
    }
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;

    if (isHeaderRow(row)) {
      closeCurrent();
      current = newBlock(sheetName, blockIndex++, rowNumber);
      phase = "items";
      return;
    }

    if (!current) return;
    if (isRowEmpty(row)) return;

    const cantidadCell = normCell(row[COL_CANTIDAD]);

    if (cantidadCell === "SUBTOTAL") {
      current.subtotalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      phase = "closed";
      return;
    }
    if (cantidadCell === "ENVIO") {
      current.shippingRowSeen = true;
      current.shippingDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      return;
    }
    if (cantidadCell === "TOTAL") {
      current.totalRowSeen = true;
      current.totalDeclared = toNumber(row[COL_PRECIO_TOTAL]);
      current.endRow = rowNumber;
      return;
    }

    if (phase === "closed") {
      pushUnexpectedCellsFrom(row, rowNumber, 0);
      return;
    }

    const ref = String(row[COL_REF] ?? "").trim();
    const clientName = String(row[COL_CLIENTE] ?? "").trim().toUpperCase();
    const description = String(row[COL_DESCRIPCION] ?? "").trim();
    const quantity = toNumber(row[COL_CANTIDAD]);
    const lineTotal = toNumber(row[COL_PRECIO_TOTAL]);

    if (!current.clientName && clientName) current.clientName = clientName;
    if (clientName && clientName !== current.clientName) {
      current.errors.push(`Nombre de cliente inconsistente en fila ${rowNumber}: "${clientName}" vs "${current.clientName}"`);
    }

    if (!ref || !description || quantity === null || lineTotal === null) {
      current.errors.push(`Ítem inválido en fila ${rowNumber}: falta ref/descripción/cantidad/precio total`);
    } else {
      current.items.push({ rowNumber, ref, clientName, description, quantity, lineTotal });
    }
    current.endRow = rowNumber;

    pushUnexpectedCellsFrom(row, rowNumber, COL_PRECIO_TOTAL + 1);
  });

  closeCurrent();
  return { sheetName, blocks, unexpectedCells };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm --prefix apps/rotulos run test -- excel-import-parser`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/excel-import/parser.ts apps/rotulos/src/__tests__/excel-import-parser.test.ts
git commit -m "feat(rotulos): parser de bloques de pedido para import de Excel"
```

---

### Task 4: Validación de totales por bloque

**Files:**
- Create: `apps/rotulos/src/lib/excel-import/validate.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-validate.test.ts`

**Interfaces:**
- Consumes: `ParsedBlock` (Task 2), salida de `parseSheetRows` (Task 3).
- Produces: `applyTotalValidation(block: ParsedBlock): void` — muta `block.warnings`, y rellena `block.subtotalDeclared`/`shippingDeclared`/`totalDeclared` cuando faltan, dejándolos siempre numéricos para Task 5.

- [ ] **Step 1: Escribir los tests (fallan primero)**

```typescript
// apps/rotulos/src/__tests__/excel-import-validate.test.ts
import { describe, expect, it } from "vitest";
import { applyTotalValidation } from "@/lib/excel-import/validate";
import type { ParsedBlock } from "@/lib/excel-import/types";

function makeBlock(overrides: Partial<ParsedBlock> = {}): ParsedBlock {
  return {
    sheetName: "JUNIO 2026",
    blockIndex: 0,
    clientName: "ZAIDA",
    startRow: 1,
    endRow: 5,
    items: [
      { rowNumber: 2, ref: "J2334", clientName: "ZAIDA", description: "JUEGO HONGUITO", quantity: 1, lineTotal: 18500 },
      { rowNumber: 3, ref: "Z3908", clientName: "ZAIDA", description: "ARETE VAN CLEEF", quantity: 1, lineTotal: 9000 },
    ],
    subtotalDeclared: 27500,
    shippingDeclared: 8500,
    totalDeclared: 36000,
    shippingRowSeen: true,
    totalRowSeen: true,
    errors: [],
    warnings: [],
    ...overrides,
  };
}

describe("applyTotalValidation", () => {
  it("no agrega advertencias cuando todo cuadra", () => {
    const block = makeBlock();
    applyTotalValidation(block);
    expect(block.warnings).toEqual([]);
  });

  it("advierte si el SUBTOTAL declarado no coincide con la suma de ítems", () => {
    const block = makeBlock({ subtotalDeclared: 99999, totalDeclared: 108499 });
    applyTotalValidation(block);
    expect(block.warnings.some((w) => w.includes("SUBTOTAL declarado"))).toBe(true);
  });

  it("usa la suma de ítems y advierte si no hay fila SUBTOTAL", () => {
    const block = makeBlock({ subtotalDeclared: null, totalDeclared: null, shippingDeclared: null, shippingRowSeen: false, totalRowSeen: false });
    applyTotalValidation(block);
    expect(block.subtotalDeclared).toBe(27500);
    expect(block.warnings.some((w) => w.includes("SUBTOTAL no encontrado"))).toBe(true);
  });

  it("advierte y asume $0 si la fila ENVIO existe pero está vacía", () => {
    const block = makeBlock({ shippingRowSeen: true, shippingDeclared: null, totalDeclared: 27500 });
    applyTotalValidation(block);
    expect(block.shippingDeclared).toBe(0);
    expect(block.warnings.some((w) => w.includes("ENVIO vacío"))).toBe(true);
  });

  it("no advierte por ENVIO si la fila directamente no existe en el bloque", () => {
    const block = makeBlock({ shippingRowSeen: false, shippingDeclared: null, totalDeclared: 27500 });
    applyTotalValidation(block);
    expect(block.shippingDeclared).toBe(0);
    expect(block.warnings.some((w) => w.includes("ENVIO"))).toBe(false);
  });

  it("advierte si TOTAL declarado no coincide con SUBTOTAL + ENVIO", () => {
    const block = makeBlock({ totalDeclared: 999999 });
    applyTotalValidation(block);
    expect(block.warnings.some((w) => w.includes("TOTAL declarado"))).toBe(true);
  });

  it("calcula TOTAL si la fila TOTAL no existe", () => {
    const block = makeBlock({ totalDeclared: null, totalRowSeen: false });
    applyTotalValidation(block);
    expect(block.totalDeclared).toBe(36000);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm --prefix apps/rotulos run test -- excel-import-validate`
Expected: FAIL con "Cannot find module '@/lib/excel-import/validate'".

- [ ] **Step 3: Implementar `applyTotalValidation`**

```typescript
// apps/rotulos/src/lib/excel-import/validate.ts
import type { ParsedBlock } from "./types";

const EPSILON = 0.01;

export function applyTotalValidation(block: ParsedBlock): void {
  const itemsTotal = block.items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (block.subtotalDeclared === null) {
    block.warnings.push(`SUBTOTAL no encontrado en la hoja, se usó la suma de ítems ($${itemsTotal})`);
    block.subtotalDeclared = itemsTotal;
  } else if (Math.abs(itemsTotal - block.subtotalDeclared) > EPSILON) {
    const diff = (block.subtotalDeclared - itemsTotal).toFixed(2);
    block.warnings.push(
      `SUBTOTAL declarado ($${block.subtotalDeclared}) no coincide con la suma de ítems ($${itemsTotal}), diferencia $${diff}`,
    );
  }

  if (block.shippingRowSeen && block.shippingDeclared === null) {
    block.warnings.push("ENVIO vacío, asumido $0");
    block.shippingDeclared = 0;
  } else if (block.shippingDeclared === null) {
    block.shippingDeclared = 0;
  }

  const expectedTotal = block.subtotalDeclared + block.shippingDeclared;
  if (block.totalDeclared === null) {
    block.totalDeclared = expectedTotal;
  } else if (Math.abs(expectedTotal - block.totalDeclared) > EPSILON) {
    const diff = (block.totalDeclared - expectedTotal).toFixed(2);
    block.warnings.push(
      `TOTAL declarado ($${block.totalDeclared}) no coincide con SUBTOTAL+ENVIO ($${expectedTotal}), diferencia $${diff}`,
    );
  }
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm --prefix apps/rotulos run test -- excel-import-validate`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/excel-import/validate.ts apps/rotulos/src/__tests__/excel-import-validate.test.ts
git commit -m "feat(rotulos): validacion de totales por bloque en import de Excel"
```

---

### Task 5: Mapeo a payloads de importación (customers/orders/order_items)

**Files:**
- Create: `apps/rotulos/src/lib/excel-import/map-to-db.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-map-to-db.test.ts`

**Interfaces:**
- Consumes: `SheetParseResult`/`ParsedBlock` (Task 2/3), `parseSheetPeriod` (Task 2).
- Produces: `computeImportRowKey(sheetName, clientName, blockIndex, subtotal): string`, `buildImportPlan(sheetResults: SheetParseResult[], runId: string): ImportPlan`, y los tipos `ImportCustomer`, `ImportOrderItem`, `ImportOrder`, `ImportPlan` — consumidos por Task 6 (reporte) y Task 7/8 (CLI).

- [ ] **Step 1: Escribir los tests (fallan primero)**

```typescript
// apps/rotulos/src/__tests__/excel-import-map-to-db.test.ts
import { describe, expect, it } from "vitest";
import { buildImportPlan, computeImportRowKey } from "@/lib/excel-import/map-to-db";
import type { SheetParseResult } from "@/lib/excel-import/types";

function makeSheetResult(overrides: Partial<SheetParseResult> = {}): SheetParseResult {
  return {
    sheetName: "SEPT 2025",
    unexpectedCells: [],
    blocks: [
      {
        sheetName: "SEPT 2025",
        blockIndex: 0,
        clientName: "ANDREA",
        startRow: 1,
        endRow: 5,
        items: [
          { rowNumber: 2, ref: "z1335", clientName: "ANDREA", description: "set 3 aretes", quantity: 1, lineTotal: 13500 },
          { rowNumber: 3, ref: "p778", clientName: "ANDREA", description: "pulsera perlas", quantity: 2, lineTotal: 16000 },
        ],
        subtotalDeclared: 29500,
        shippingDeclared: 0,
        totalDeclared: 29500,
        shippingRowSeen: false,
        totalRowSeen: true,
        errors: [],
        warnings: [],
      },
    ],
    ...overrides,
  };
}

describe("computeImportRowKey", () => {
  it("es determinística para los mismos datos de entrada", () => {
    const a = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    const b = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    expect(a).toBe(b);
  });

  it("cambia si cambia cualquier componente", () => {
    const base = computeImportRowKey("SEPT 2025", "ANDREA", 0, 29500);
    expect(computeImportRowKey("OCT 2025", "ANDREA", 0, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ZAIDA", 0, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ANDREA", 1, 29500)).not.toBe(base);
    expect(computeImportRowKey("SEPT 2025", "ANDREA", 0, 1)).not.toBe(base);
  });
});

describe("buildImportPlan", () => {
  it("mapea un bloque válido a cliente + pedido + ítems, normalizando a mayúscula", () => {
    const plan = buildImportPlan([makeSheetResult()], "run-1");

    expect(plan.customers).toEqual([{ fullName: "ANDREA" }]);
    expect(plan.orders).toHaveLength(1);
    const [order] = plan.orders;
    expect(order.customerFullName).toBe("ANDREA");
    expect(order.orderDate).toBe("2025-09-01");
    expect(order.notes).toBe("HOJA: SEPT 2025");
    expect(order.subtotal).toBe(29500);
    expect(order.shippingCost).toBe(0);
    expect(order.total).toBe(29500);
    expect(order.items).toEqual([
      { productCode: "Z1335", productName: "SET 3 ARETES", quantity: 1, unitPrice: 13500, total: 13500 },
      { productCode: "P778", productName: "PULSERA PERLAS", quantity: 2, unitPrice: 8000, total: 16000 },
    ]);
    expect(plan.skippedBlocks).toEqual([]);
  });

  it("excluye bloques con errores y los reporta en skippedBlocks", () => {
    const sheet = makeSheetResult();
    sheet.blocks[0].errors = ["Bloque sin ningún ítem"];

    const plan = buildImportPlan([sheet], "run-1");

    expect(plan.orders).toEqual([]);
    expect(plan.customers).toEqual([]);
    expect(plan.skippedBlocks).toEqual([
      { sheetName: "SEPT 2025", blockIndex: 0, clientName: "ANDREA", errors: ["Bloque sin ningún ítem"] },
    ]);
  });

  it("deduplica clientes con el mismo nombre entre varios bloques", () => {
    const sheet1 = makeSheetResult();
    const sheet2 = makeSheetResult({ sheetName: "OCT 2025" });
    sheet2.blocks[0].sheetName = "OCT 2025";

    const plan = buildImportPlan([sheet1, sheet2], "run-1");

    expect(plan.customers).toEqual([{ fullName: "ANDREA" }]);
    expect(plan.orders).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm --prefix apps/rotulos run test -- excel-import-map-to-db`
Expected: FAIL con "Cannot find module '@/lib/excel-import/map-to-db'".

- [ ] **Step 3: Implementar `map-to-db.ts`**

```typescript
// apps/rotulos/src/lib/excel-import/map-to-db.ts
import { createHash } from "node:crypto";
import { parseSheetPeriod } from "./period";
import type { ParsedBlock, SheetParseResult } from "./types";

export interface ImportCustomer {
  fullName: string;
}

export interface ImportOrderItem {
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ImportOrder {
  importRowKey: string;
  customerFullName: string;
  orderDate: string;
  notes: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  items: ImportOrderItem[];
  sheetName: string;
  blockIndex: number;
}

export interface SkippedBlock {
  sheetName: string;
  blockIndex: number;
  clientName: string;
  errors: string[];
}

export interface ImportPlan {
  runId: string;
  customers: ImportCustomer[];
  orders: ImportOrder[];
  skippedBlocks: SkippedBlock[];
}

export function computeImportRowKey(sheetName: string, clientName: string, blockIndex: number, subtotal: number): string {
  const raw = `${sheetName}|${clientName}|${blockIndex}|${subtotal}`;
  return createHash("sha256").update(raw).digest("hex");
}

function blockToOrder(block: ParsedBlock): ImportOrder {
  const subtotal = block.subtotalDeclared ?? 0;
  const shippingCost = block.shippingDeclared ?? 0;
  const total = block.totalDeclared ?? subtotal + shippingCost;

  return {
    importRowKey: computeImportRowKey(block.sheetName, block.clientName, block.blockIndex, subtotal),
    customerFullName: block.clientName,
    orderDate: parseSheetPeriod(block.sheetName),
    notes: `HOJA: ${block.sheetName}`,
    subtotal,
    shippingCost,
    total,
    items: block.items.map((item) => ({
      productCode: item.ref.trim().toUpperCase(),
      productName: item.description.trim().toUpperCase(),
      quantity: item.quantity,
      unitPrice: item.lineTotal / item.quantity,
      total: item.lineTotal,
    })),
    sheetName: block.sheetName,
    blockIndex: block.blockIndex,
  };
}

export function buildImportPlan(sheetResults: SheetParseResult[], runId: string): ImportPlan {
  const customerNames = new Set<string>();
  const orders: ImportOrder[] = [];
  const skippedBlocks: SkippedBlock[] = [];

  for (const sheet of sheetResults) {
    for (const block of sheet.blocks) {
      if (block.errors.length > 0) {
        skippedBlocks.push({
          sheetName: block.sheetName,
          blockIndex: block.blockIndex,
          clientName: block.clientName,
          errors: block.errors,
        });
        continue;
      }
      customerNames.add(block.clientName);
      orders.push(blockToOrder(block));
    }
  }

  return {
    runId,
    customers: Array.from(customerNames).map((fullName) => ({ fullName })),
    orders,
    skippedBlocks,
  };
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm --prefix apps/rotulos run test -- excel-import-map-to-db`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/excel-import/map-to-db.ts apps/rotulos/src/__tests__/excel-import-map-to-db.test.ts
git commit -m "feat(rotulos): mapeo de bloques parseados a plan de import"
```

---

### Task 6: Reporte de previsualización

**Files:**
- Create: `apps/rotulos/src/lib/excel-import/report.ts`
- Test: `apps/rotulos/src/__tests__/excel-import-report.test.ts`

**Interfaces:**
- Consumes: `SheetParseResult` (Task 2/3), `ImportPlan` (Task 5).
- Produces: `buildReportText(sheetResults: SheetParseResult[], plan: ImportPlan): string` — usada por el CLI (Task 7).

- [ ] **Step 1: Escribir el test (falla primero)**

```typescript
// apps/rotulos/src/__tests__/excel-import-report.test.ts
import { describe, expect, it } from "vitest";
import { buildReportText } from "@/lib/excel-import/report";
import { buildImportPlan } from "@/lib/excel-import/map-to-db";
import type { SheetParseResult } from "@/lib/excel-import/types";

const sheet: SheetParseResult = {
  sheetName: "SEPT 2025",
  unexpectedCells: [{ rowNumber: 4, columnIndex: 7, value: 100000 }],
  blocks: [
    {
      sheetName: "SEPT 2025",
      blockIndex: 0,
      clientName: "ANDREA",
      startRow: 1,
      endRow: 5,
      items: [{ rowNumber: 2, ref: "Z1335", clientName: "ANDREA", description: "SET 3 ARETES", quantity: 1, lineTotal: 13500 }],
      subtotalDeclared: 13500,
      shippingDeclared: 0,
      totalDeclared: 13500,
      shippingRowSeen: false,
      totalRowSeen: false,
      errors: [],
      warnings: ["SUBTOTAL no encontrado en la hoja, se usó la suma de ítems ($13500)"],
    },
    {
      sheetName: "SEPT 2025",
      blockIndex: 1,
      clientName: "",
      startRow: 6,
      endRow: 6,
      items: [],
      subtotalDeclared: 0,
      shippingDeclared: 0,
      totalDeclared: 0,
      shippingRowSeen: false,
      totalRowSeen: false,
      errors: ["Bloque sin ningún ítem"],
      warnings: [],
    },
  ],
};

describe("buildReportText", () => {
  it("incluye hoja, bloques, advertencias, errores y resumen global", () => {
    const plan = buildImportPlan([sheet], "run-1");
    const text = buildReportText([sheet], plan);

    expect(text).toContain("HOJA: SEPT 2025");
    expect(text).toContain("Bloques detectados: 2");
    expect(text).toContain("ADVERTENCIA Bloque ANDREA (fila 1): SUBTOTAL no encontrado");
    expect(text).toContain("ERROR Bloque SIN NOMBRE (fila 6): Bloque sin ningún ítem");
    expect(text).toContain("ERROR Columna inesperada con dato en fila 4 (columna 8)");
    expect(text).toContain("RESUMEN GLOBAL");
    expect(text).toContain("Pedidos a crear: 1");
    expect(text).toContain("Errores (bloques excluidos): 1");
    expect(text).toContain("Total $ a importar: $13500");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm --prefix apps/rotulos run test -- excel-import-report`
Expected: FAIL con "Cannot find module '@/lib/excel-import/report'".

- [ ] **Step 3: Implementar `buildReportText`**

```typescript
// apps/rotulos/src/lib/excel-import/report.ts
import type { SheetParseResult } from "./types";
import type { ImportPlan } from "./map-to-db";

export function buildReportText(sheetResults: SheetParseResult[], plan: ImportPlan): string {
  const lines: string[] = [];
  let totalWarnings = 0;
  let totalErrors = 0;

  for (const sheet of sheetResults) {
    lines.push(`HOJA: ${sheet.sheetName}`);
    lines.push(`  Bloques detectados: ${sheet.blocks.length} (${sheet.blocks.map((b) => b.clientName || "SIN NOMBRE").join(", ")})`);

    const validBlocks = sheet.blocks.filter((b) => b.errors.length === 0);
    lines.push(`  Clientes nuevos a crear: ${new Set(validBlocks.map((b) => b.clientName)).size}`);

    const sheetItems = sheet.blocks.reduce((sum, b) => sum + b.items.length, 0);
    lines.push(`  Ítems detectados: ${sheetItems}`);

    for (const block of sheet.blocks) {
      const label = block.clientName || "SIN NOMBRE";
      for (const warning of block.warnings) {
        lines.push(`  ADVERTENCIA Bloque ${label} (fila ${block.startRow}): ${warning}`);
        totalWarnings++;
      }
      for (const error of block.errors) {
        lines.push(`  ERROR Bloque ${label} (fila ${block.startRow}): ${error}`);
        totalErrors++;
      }
    }

    for (const cell of sheet.unexpectedCells) {
      lines.push(`  ERROR Columna inesperada con dato en fila ${cell.rowNumber} (columna ${cell.columnIndex + 1}) — ignorada, revisar manualmente`);
      totalErrors++;
    }

    lines.push("");
  }

  const totalAmount = plan.orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = plan.orders.reduce((sum, order) => sum + order.items.length, 0);

  lines.push("RESUMEN GLOBAL");
  lines.push(`  Hojas leídas: ${sheetResults.length}`);
  lines.push(`  Clientes nuevos: ${plan.customers.length}`);
  lines.push(`  Pedidos a crear: ${plan.orders.length}`);
  lines.push(`  Ítems a crear: ${totalItems}`);
  lines.push(`  Advertencias: ${totalWarnings}`);
  lines.push(`  Errores (bloques excluidos): ${plan.skippedBlocks.length}`);
  lines.push(`  Total $ a importar: $${totalAmount}`);

  return lines.join("\n");
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm --prefix apps/rotulos run test -- excel-import-report`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/excel-import/report.ts apps/rotulos/src/__tests__/excel-import-report.test.ts
git commit -m "feat(rotulos): reporte de previsualizacion del import de Excel"
```

---

### Task 7: Script CLI — modo preview

**Files:**
- Modify: `apps/rotulos/package.json` (agregar dependencias `exceljs`, `tsx` y script `import:excel`)
- Modify: `apps/rotulos/.gitignore` (ignorar el JSON de preview)
- Create: `apps/rotulos/scripts/import-excel.ts`

**Interfaces:**
- Consumes: `parseSheetRows` (Task 3), `applyTotalValidation` (Task 4), `buildImportPlan` (Task 5), `buildReportText` (Task 6).
- Produces: comando `npm run import:excel -- <ruta.xlsx>` (preview) y `npm run import:excel -- <ruta.xlsx> --commit` (Task 8 lo extiende).

- [ ] **Step 1: Instalar dependencias**

Run: `npm --prefix apps/rotulos install --save-dev exceljs tsx`
Expected: `apps/rotulos/package.json` y `apps/rotulos/package-lock.json` (o el lockfile que use el repo) actualizados con `exceljs` y `tsx` en `devDependencies`.

- [ ] **Step 2: Agregar el script `import:excel` a `package.json`**

En `apps/rotulos/package.json`, dentro de `"scripts"`, agregar:

```json
"import:excel": "tsx scripts/import-excel.ts"
```

(junto a los scripts existentes como `"qa:final": "node scripts/qa-final.mjs"`).

- [ ] **Step 3: Ignorar el archivo de preview generado**

En `apps/rotulos/.gitignore`, agregar una línea:

```
scripts/.import-preview.json
```

- [ ] **Step 4: Implementar el script CLI (modo preview)**

```typescript
// apps/rotulos/scripts/import-excel.ts
import path from "node:path";
import crypto from "node:crypto";
import { writeFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { parseSheetRows } from "../src/lib/excel-import/parser";
import { applyTotalValidation } from "../src/lib/excel-import/validate";
import { buildImportPlan } from "../src/lib/excel-import/map-to-db";
import { buildReportText } from "../src/lib/excel-import/report";
import type { CellValue, SheetParseResult } from "../src/lib/excel-import/types";

async function readWorkbookRows(filePath: string): Promise<{ sheetName: string; rows: CellValue[][] }[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook.worksheets.map((worksheet) => {
    const rows: CellValue[][] = [];
    worksheet.eachRow({ includeEmpty: true }, (row) => {
      const values: CellValue[] = [];
      for (let col = 1; col <= worksheet.columnCount; col++) {
        const raw = row.getCell(col).value;
        const value =
          raw !== null && typeof raw === "object" && "result" in (raw as Record<string, unknown>)
            ? ((raw as { result: CellValue }).result ?? null)
            : ((raw as CellValue) ?? null);
        values.push(value);
      }
      rows.push(values);
    });
    return { sheetName: worksheet.name, rows };
  });
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args.find((arg) => !arg.startsWith("--"));
  const commit = args.includes("--commit");

  if (!filePath) {
    console.error("Uso: npm run import:excel -- <ruta-al-excel.xlsx> [--commit]");
    process.exit(1);
  }

  const sheets = await readWorkbookRows(path.resolve(filePath));
  const sheetResults: SheetParseResult[] = sheets.map(({ sheetName, rows }) => parseSheetRows(sheetName, rows));
  sheetResults.forEach((sheet) => sheet.blocks.forEach(applyTotalValidation));

  const runId = crypto.randomUUID();
  const plan = buildImportPlan(sheetResults, runId);

  console.log(buildReportText(sheetResults, plan));

  const previewPath = path.resolve(__dirname, ".import-preview.json");
  await writeFile(previewPath, JSON.stringify({ runId, sheetResults, plan }, null, 2), "utf-8");
  console.log(`\nPreview escrito en ${previewPath}`);

  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribió nada en Supabase.");
    return;
  }

  console.log("\n--commit todavía no está implementado en esta versión del script.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: Correr el script en modo preview contra el Excel real**

Run: `npm --prefix apps/rotulos run import:excel -- "C:\Users\bdp_u\Downloads\REFERENCIAS.xlsx"`
Expected: imprime el reporte de las 10 hojas en consola (sin errores de parseo no manejados), termina con "Modo preview (sin --commit)...", y crea `apps/rotulos/scripts/.import-preview.json`. Revisar a mano el reporte contra el Excel: si algún bloque real no calza con lo esperado (columnas en otro orden, header con typo), es señal de ajustar el parser (Task 3) antes de seguir — no de forzar el dato.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/package.json apps/rotulos/package-lock.json apps/rotulos/.gitignore apps/rotulos/scripts/import-excel.ts
git commit -m "feat(rotulos): script CLI de preview para import de Excel historico"
```

---

### Task 8: Script CLI — modo `--commit` (escritura a Supabase, idempotente)

**Files:**
- Modify: `apps/rotulos/scripts/import-excel.ts`

**Interfaces:**
- Consumes: `ImportPlan`/`ImportOrder` (Task 5), variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Produces: comando `npm run import:excel -- <ruta.xlsx> --commit` que escribe en Supabase de forma idempotente.

- [ ] **Step 1: Reemplazar el bloque final de `main()` para implementar `--commit`**

En `apps/rotulos/scripts/import-excel.ts`, reemplazar:

```typescript
  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribió nada en Supabase.");
    return;
  }

  console.log("\n--commit todavía no está implementado en esta versión del script.");
}
```

por:

```typescript
  if (!commit) {
    console.log("\nModo preview (sin --commit). No se escribió nada en Supabase.");
    return;
  }

  await commitImportPlan(plan);
}
```

Y agregar antes de `main()`:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { ImportPlan } from "../src/lib/excel-import/map-to-db";

async function commitImportPlan(plan: ImportPlan): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el entorno.");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: existingRows, error: existingError } = await supabase
    .from("orders")
    .select("import_row_key")
    .eq("source", "excel_import");
  if (existingError) throw existingError;
  const existingKeys = new Set((existingRows ?? []).map((row) => row.import_row_key as string));

  const customerIdByName = new Map<string, string>();
  let createdOrders = 0;
  let skippedExisting = 0;

  for (const order of plan.orders) {
    if (existingKeys.has(order.importRowKey)) {
      skippedExisting++;
      continue;
    }

    let customerId = customerIdByName.get(order.customerFullName);
    if (!customerId) {
      const { data: existingCustomer, error: lookupError } = await supabase
        .from("customers")
        .select("id")
        .eq("full_name", order.customerFullName)
        .eq("phone", "")
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (existingCustomer) {
        customerId = existingCustomer.id as string;
      } else {
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({ full_name: order.customerFullName })
          .select("id")
          .single();
        if (insertError) throw insertError;
        customerId = newCustomer.id as string;
      }
      customerIdByName.set(order.customerFullName, customerId);
    }

    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        customer_snapshot: { fullName: order.customerFullName },
        order_date: order.orderDate,
        status: "completed",
        notes: order.notes,
        subtotal: order.subtotal,
        shipping_cost: order.shippingCost,
        total: order.total,
        source: "excel_import",
        import_batch_id: plan.runId,
        import_row_key: order.importRowKey,
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("order_items").insert(
      order.items.map((item) => ({
        order_id: newOrder.id,
        product_code: item.productCode,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })),
    );
    if (itemsError) throw itemsError;

    createdOrders++;
  }

  console.log(`\nImportación completada. Pedidos creados: ${createdOrders}. Ya existentes (omitidos): ${skippedExisting}.`);
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm --prefix apps/rotulos run typecheck`
Expected: sin errores de tipos.

- [ ] **Step 3: Correr en modo preview de nuevo (regresión)**

Run: `npm --prefix apps/rotulos run import:excel -- "C:\Users\bdp_u\Downloads\REFERENCIAS.xlsx"`
Expected: mismo comportamiento que Task 7 Step 5 (sin `--commit`, no debe tocar Supabase).

- [ ] **Step 4: Correr en modo `--commit` contra el Excel real**

Confirmar antes con el usuario que `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SUPABASE_URL` en el entorno local apuntan al proyecto correcto (`purpleshop`, ver `apps/rotulos/README.md`).

Run: `npm --prefix apps/rotulos run import:excel -- "C:\Users\bdp_u\Downloads\REFERENCIAS.xlsx" --commit`
Expected: imprime "Importación completada. Pedidos creados: N. Ya existentes (omitidos): 0."

- [ ] **Step 5: Verificar idempotencia — correr de nuevo con el mismo archivo**

Run: `npm --prefix apps/rotulos run import:excel -- "C:\Users\bdp_u\Downloads\REFERENCIAS.xlsx" --commit`
Expected: "Pedidos creados: 0. Ya existentes (omitidos): N" (mismo N que se creó en el Step 4) — confirma que no se duplican pedidos al re-correr.

- [ ] **Step 6: Verificación visual en la app**

Abrir `Historial` en la app (local o producción según contra qué proyecto se corrió) y confirmar que aparecen pedidos con fecha en los meses esperados y status `completed`.

- [ ] **Step 7: Commit**

```bash
git add apps/rotulos/scripts/import-excel.ts
git commit -m "feat(rotulos): commit idempotente del import de Excel a Supabase"
```

---

## Self-Review

**Cobertura del spec:**
- Detección de bloques, headers repetidos, filas vacías/SUBTOTAL/ENVIO/TOTAL → Task 3.
- Normalización a mayúscula → Task 5 (`.trim().toUpperCase()` en `productCode`/`productName`, `clientName` ya normalizado en el parser).
- Mes/año de hoja como fecha → Task 2 (`parseSheetPeriod`) + Task 5.
- Anti-duplicados (`import_row_key`) → Task 2/5 (cálculo) + Task 8 (chequeo contra Supabase antes de insertar).
- Validación de totales → Task 4.
- Preview antes de escribir, reporte de errores/advertencias → Task 6 + Task 7 (modo preview por defecto).
- Confirmación explícita antes de escribir (`--commit`) → Task 7/8.
- Trazabilidad (`source`/`import_batch_id`) → Task 1 + Task 8.
- No tocar `product_codes` → confirmado, ningún task lo toca.
- No modificar estructura sin explicar → migración documentada y aprobada en el spec (Task 1).

**Placeholders:** ninguno — cada step tiene código completo o comando+resultado esperado.

**Consistencia de tipos:** `ParsedBlock`/`SheetParseResult` (Task 2) se usan idénticos en Task 3, 4, 5, 6. `ImportPlan`/`ImportOrder` (Task 5) se usan idénticos en Task 6 y Task 8. `computeImportRowKey` firma consistente entre Task 5 y su uso interno.
