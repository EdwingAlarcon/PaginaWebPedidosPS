# Normalizar texto operativo a MAYÚSCULA antes de guardar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Todo campo de texto libre operativo (nombres, direcciones, ciudades, observaciones, etc.) que el usuario ingresa en `apps/rotulos` queda guardado en la base de datos (Supabase) y en el fallback de `localStorage` como `trim().toUpperCase()`, sin tocar campos sensibles/técnicos (email, URLs, ids, colores hex) ni la UI mientras el usuario escribe.

**Architecture:** Se crea un módulo nuevo `apps/rotulos/src/lib/normalize.ts` con `normalizeText()` (la primitiva reutilizable) y una función normalizadora por tipo de dominio (`normalizeSender`, `normalizeRecipient`, `normalizeLabelDraft`, `normalizeLabelSettings`, `normalizeCustomerFields`, `normalizeOrderItem`, `normalizeOrderDraft`, `normalizeProductDraft`, `normalizeStockMovementDraft`, `normalizeProductCode`). Cada función de guardado en los tres stores (`label-store.ts`, `inventory-store.ts`, `business-store.ts`) llama a la normalizadora correspondiente **al principio de la función**, antes de armar la fila de Supabase o el registro de `localStorage` — así ambas rutas de persistencia (Supabase y fallback local) quedan cubiertas por el mismo punto de normalización. La UI (inputs, `useState`, preview en vivo) no se toca: el usuario sigue viendo lo que escribe tal cual mientras edita; el `UPPERCASE` solo aparece después de guardar y recargar.

**Tech Stack:** Next.js 16 (Turbopack) + TypeScript + Vitest (`@testing-library/react`) + Supabase JS client. Sin dependencias nuevas.

## Global Constraints

- Node/npm: correr todos los comandos con cwd `apps/rotulos/` (tiene su propio `package.json`).
- No cambiar la estructura de la base de datos (nombres de tabla/columna intactos).
- No cambiar nombres de campos en los tipos TypeScript existentes.
- No cambiar validaciones existentes (`src/lib/validation.ts` no se toca — normalizar ocurre en el store, después de que el formulario ya validó).
- No cambiar lógica de negocio (cálculo de totales, generación de número de pedido, control de stock) — solo el casing de los strings que ya fluían por ahí.
- No modificar componentes de UI/formularios — la normalización vive exclusivamente en los tres archivos `*-store.ts`, para cubrir tanto el flujo por UI como cualquier llamada directa (tests, scripts).
- Campos que **SÍ** se normalizan (`trim().toUpperCase()`): `Sender.name/department/city/address`; `Recipient.fullName/department/city/address/neighborhood/reference/notes`; `LabelDraft.orderNumber/carrier`; `LabelSettings.defaultSender` (mismos campos que `Sender`); `Customer.fullName/department/city/address/neighborhood` (vía `OrderDraft.customer`); `OrderDraft.notes`; `OrderItemDraft.productCode/productName/category`; `ProductDraft.name/category/sku`; `StockMovementDraft.reason/supplier`; el `code/productName/category` que recibe `saveProductCode`.
- Campos que **NO** se tocan y por qué: `phone` en `Sender`/`Recipient`/`Customer` (numérico, no es el texto alfabético que pidió el usuario); `Customer.email` (sensible, explícitamente excluido); `LabelSettings.logoUrl`/`qrUrl` (URLs); `LabelSettings.instagramUser` (handle de marca, no dato operativo de un pedido); `LabelSettings.brandPhrase` (frase de marca/branding, no dato operativo); `LabelSettings.orderNumberConfig.prefix/suffix/pattern` (config técnica — `prefix`/`suffix` ya se limpian y mayusculizan en cada generación dentro de `formatOrderNumber`/`cleanToken`, sin mutar lo guardado en settings; `pattern` contiene placeholders literales `{PREFIX}` etc.); `BrandColors.*` (códigos hex); todo `id`/`createdAt`/`updatedAt`/`pdfUrl`/`createdBy`/`productId`/`customerId` (técnicos).
- `normalizeText` usa `.toUpperCase()` nativo de JS — preserva acentos (`"bogotá".toUpperCase() === "BOGOTÁ"`), no los elimina. Esto es intencional y distinto de `cleanToken` en `order-number.ts` (que sí elimina acentos, pero solo para el token de número de pedido autogenerado).
- No se agrega `text-transform: uppercase` en CSS: el usuario pidió evaluarlo, pero forzarlo visualmente mientras el campo tiene foco puede causar saltos de cursor/confusión con inputs controlados de React sin aportar nada (el valor final igual queda en mayúscula al guardar) — se documenta esta decisión aquí en vez de implementarla.
- Comandos de validación (cwd `apps/rotulos/`): `npm run lint`, `npm run typecheck`, `npm run test` (vitest). `npm run test:e2e` (Playwright) es opcional/informativo, no se rompe por este cambio (ver Task 5).

---

### Task 1: Módulo `normalize.ts` con la función reutilizable y normalizadores por dominio

**Files:**
- Create: `apps/rotulos/src/lib/normalize.ts`
- Test: `apps/rotulos/src/__tests__/normalize.test.ts`

**Interfaces:**
- Produces: `normalizeText(value: string): string`; `normalizeSender(sender: Sender): Sender`; `normalizeRecipient(recipient: Recipient): Recipient`; `normalizeLabelDraft(draft: LabelDraft): LabelDraft`; `normalizeLabelSettings(settings: LabelSettings): LabelSettings`; `normalizeCustomerFields<T extends { fullName: string; department: string; city: string; address: string; neighborhood: string }>(customer: T): T`; `normalizeOrderItem(item: OrderItemDraft): OrderItemDraft`; `normalizeOrderDraft(draft: OrderDraft): OrderDraft`; `normalizeProductDraft(draft: ProductDraft): ProductDraft`; `normalizeStockMovementDraft(draft: StockMovementDraft): StockMovementDraft`; `normalizeProductCode<T extends { code: string; productName: string; category: string }>(code: T): T`. Todas exportadas desde `@/lib/normalize`, usadas por las Tasks 2-4.

- [ ] **Step 1: Escribir el test que falla**

Crear `apps/rotulos/src/__tests__/normalize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  normalizeText,
  normalizeSender,
  normalizeRecipient,
  normalizeLabelDraft,
  normalizeLabelSettings,
  normalizeCustomerFields,
  normalizeOrderItem,
  normalizeOrderDraft,
  normalizeProductDraft,
  normalizeStockMovementDraft,
  normalizeProductCode,
} from "@/lib/normalize";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { createBlankOrderDraft } from "@/lib/business-store";

describe("normalizeText", () => {
  it("trims and uppercases, preserving accents", () => {
    expect(normalizeText("  bogotá  ")).toBe("BOGOTÁ");
    expect(normalizeText("Edwing")).toBe("EDWING");
    expect(normalizeText("")).toBe("");
  });
});

describe("normalizeSender", () => {
  it("normalizes text fields but leaves phone untouched", () => {
    const result = normalizeSender({
      name: " Edwing Alarcon ",
      phone: "3001234567",
      department: "cundinamarca",
      city: "bogota",
      address: "calle 1 # 2-3",
    });

    expect(result).toEqual({
      name: "EDWING ALARCON",
      phone: "3001234567",
      department: "CUNDINAMARCA",
      city: "BOGOTA",
      address: "CALLE 1 # 2-3",
    });
  });
});

describe("normalizeRecipient", () => {
  it("normalizes every free-text field but leaves phone untouched", () => {
    const result = normalizeRecipient({
      fullName: "ana perez",
      phone: "3101234567",
      department: "antioquia",
      city: "medellin",
      address: "carrera 45 # 10-20",
      neighborhood: "laureles",
      reference: "porteria principal",
      notes: "entregar en la tarde",
    });

    expect(result.fullName).toBe("ANA PEREZ");
    expect(result.phone).toBe("3101234567");
    expect(result.department).toBe("ANTIOQUIA");
    expect(result.city).toBe("MEDELLIN");
    expect(result.address).toBe("CARRERA 45 # 10-20");
    expect(result.neighborhood).toBe("LAURELES");
    expect(result.reference).toBe("PORTERIA PRINCIPAL");
    expect(result.notes).toBe("ENTREGAR EN LA TARDE");
  });
});

describe("normalizeLabelDraft", () => {
  it("normalizes orderNumber, carrier, sender, and recipient", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = " manual-001 ";
    draft.carrier = "coordinadora";
    draft.recipient.fullName = "ana perez";

    const result = normalizeLabelDraft(draft);

    expect(result.orderNumber).toBe("MANUAL-001");
    expect(result.carrier).toBe("COORDINADORA");
    expect(result.recipient.fullName).toBe("ANA PEREZ");
  });
});

describe("normalizeLabelSettings", () => {
  it("normalizes defaultSender but leaves brandPhrase and instagramUser untouched", () => {
    const settings = {
      ...defaultSettings,
      defaultSender: { ...defaultSettings.defaultSender, city: "bogota" },
      brandPhrase: "Detalles que viajan con amor",
      instagramUser: "@purpleshop.online",
    };

    const result = normalizeLabelSettings(settings);

    expect(result.defaultSender.city).toBe("BOGOTA");
    expect(result.brandPhrase).toBe("Detalles que viajan con amor");
    expect(result.instagramUser).toBe("@purpleshop.online");
  });
});

describe("normalizeCustomerFields", () => {
  it("normalizes text fields but leaves phone and email untouched", () => {
    const result = normalizeCustomerFields({
      fullName: "ana perez",
      phone: "3101234567",
      email: "ana@example.com",
      department: "antioquia",
      city: "medellin",
      address: "carrera 45 # 10-20",
      neighborhood: "laureles",
    });

    expect(result.fullName).toBe("ANA PEREZ");
    expect(result.phone).toBe("3101234567");
    expect(result.email).toBe("ana@example.com");
    expect(result.city).toBe("MEDELLIN");
  });
});

describe("normalizeOrderItem", () => {
  it("normalizes productCode, productName, and category", () => {
    const result = normalizeOrderItem({
      productCode: " med-001 ",
      productName: "medias largas",
      category: "medias",
      quantity: 1,
      unitPrice: 15000,
    });

    expect(result.productCode).toBe("MED-001");
    expect(result.productName).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
  });
});

describe("normalizeOrderDraft", () => {
  it("normalizes customer, notes, and items but leaves email untouched", () => {
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.email = "ana@example.com";
    draft.notes = "entregar en la manana";
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 1, unitPrice: 15000 }];

    const result = normalizeOrderDraft(draft);

    expect(result.customer.fullName).toBe("ANA PEREZ");
    expect(result.customer.email).toBe("ana@example.com");
    expect(result.notes).toBe("ENTREGAR EN LA MANANA");
    expect(result.items[0].productName).toBe("MEDIAS LARGAS");
  });
});

describe("normalizeProductDraft", () => {
  it("normalizes name, category, and sku", () => {
    const result = normalizeProductDraft({
      name: "medias largas",
      category: "medias",
      sku: "med-001",
      unitPrice: 15000,
      minStock: 5,
      maxStock: 200,
    });

    expect(result.name).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
    expect(result.sku).toBe("MED-001");
  });
});

describe("normalizeStockMovementDraft", () => {
  it("normalizes reason and supplier", () => {
    const result = normalizeStockMovementDraft({
      productId: "p1",
      type: "entrada",
      quantity: 10,
      reason: "compra a proveedor",
      supplier: "acme",
    });

    expect(result.reason).toBe("COMPRA A PROVEEDOR");
    expect(result.supplier).toBe("ACME");
  });
});

describe("normalizeProductCode", () => {
  it("normalizes code, productName, and category", () => {
    const result = normalizeProductCode({
      code: "med-001",
      productName: "medias largas",
      category: "medias",
      unitPrice: 15000,
    });

    expect(result.code).toBe("MED-001");
    expect(result.productName).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run (cwd `apps/rotulos/`): `npx vitest run src/__tests__/normalize.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/normalize"` (el archivo no existe todavía).

- [ ] **Step 3: Implementar `apps/rotulos/src/lib/normalize.ts`**

```ts
import type { LabelDraft, LabelSettings, Recipient, Sender } from "@/lib/types";
import type { OrderDraft, OrderItemDraft, ProductCode } from "@/lib/business-types";
import type { ProductDraft, StockMovementDraft } from "@/lib/inventory-types";

export function normalizeText(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeSender(sender: Sender): Sender {
  return {
    ...sender,
    name: normalizeText(sender.name),
    department: normalizeText(sender.department),
    city: normalizeText(sender.city),
    address: normalizeText(sender.address),
  };
}

export function normalizeRecipient(recipient: Recipient): Recipient {
  return {
    ...recipient,
    fullName: normalizeText(recipient.fullName),
    department: normalizeText(recipient.department),
    city: normalizeText(recipient.city),
    address: normalizeText(recipient.address),
    neighborhood: normalizeText(recipient.neighborhood),
    reference: normalizeText(recipient.reference),
    notes: normalizeText(recipient.notes),
  };
}

export function normalizeLabelDraft(draft: LabelDraft): LabelDraft {
  return {
    ...draft,
    orderNumber: normalizeText(draft.orderNumber),
    sender: normalizeSender(draft.sender),
    recipient: normalizeRecipient(draft.recipient),
    carrier: normalizeText(draft.carrier),
  };
}

export function normalizeLabelSettings(settings: LabelSettings): LabelSettings {
  return {
    ...settings,
    defaultSender: normalizeSender(settings.defaultSender),
  };
}

type CustomerTextFields = {
  fullName: string;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
};

export function normalizeCustomerFields<T extends CustomerTextFields>(customer: T): T {
  return {
    ...customer,
    fullName: normalizeText(customer.fullName),
    department: normalizeText(customer.department),
    city: normalizeText(customer.city),
    address: normalizeText(customer.address),
    neighborhood: normalizeText(customer.neighborhood),
  };
}

export function normalizeOrderItem(item: OrderItemDraft): OrderItemDraft {
  return {
    ...item,
    productCode: normalizeText(item.productCode),
    productName: normalizeText(item.productName),
    category: normalizeText(item.category),
  };
}

export function normalizeOrderDraft(draft: OrderDraft): OrderDraft {
  return {
    ...draft,
    customer: normalizeCustomerFields(draft.customer),
    notes: normalizeText(draft.notes),
    items: draft.items.map(normalizeOrderItem),
  };
}

export function normalizeProductDraft(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    name: normalizeText(draft.name),
    category: normalizeText(draft.category),
    sku: normalizeText(draft.sku),
  };
}

export function normalizeStockMovementDraft(draft: StockMovementDraft): StockMovementDraft {
  return {
    ...draft,
    reason: normalizeText(draft.reason),
    supplier: normalizeText(draft.supplier),
  };
}

type ProductCodeTextFields = Pick<ProductCode, "code" | "productName" | "category">;

export function normalizeProductCode<T extends ProductCodeTextFields>(code: T): T {
  return {
    ...code,
    code: normalizeText(code.code),
    productName: normalizeText(code.productName),
    category: normalizeText(code.category),
  };
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npx vitest run src/__tests__/normalize.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/normalize.ts apps/rotulos/src/__tests__/normalize.test.ts
git commit -m "feat(rotulos): agregar normalize.ts para mayusculizar texto operativo antes de guardar"
```

---

### Task 2: Aplicar normalización en `label-store.ts` (rótulos y configuración)

**Files:**
- Modify: `apps/rotulos/src/lib/label-store.ts:1-4` (import), `:139-158` (`saveLabel` Supabase), `:182-186` (`saveSettings` Supabase), `:302-328` (`saveLabel` local), `:349-352` (`saveSettings` local)
- Modify: `apps/rotulos/src/__tests__/label-store.test.ts:99-113`
- Modify: `apps/rotulos/src/__tests__/label-form.test.tsx:48-57`, `:59-88`
- Modify: `apps/rotulos/src/__tests__/settings-history.test.tsx:124-139`

**Interfaces:**
- Consumes: `normalizeLabelDraft(draft: LabelDraft): LabelDraft` y `normalizeLabelSettings(settings: LabelSettings): LabelSettings` de `@/lib/normalize` (Task 1).

- [ ] **Step 1: Actualizar el test que va a fallar primero (assertion sobre `carrier`)**

En `apps/rotulos/src/__tests__/label-store.test.ts`, dentro de `"preserves creation time and status when updating an existing label"` (línea 112):

```diff
-    expect(updated.carrier).toBe("Coordinadora");
+    expect(updated.carrier).toBe("COORDINADORA");
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/__tests__/label-store.test.ts`
Expected: FAIL en `"preserves creation time and status when updating an existing label"` — recibe `"Coordinadora"`, esperaba `"COORDINADORA"` (el store todavía no normaliza).

- [ ] **Step 3: Agregar el import en `label-store.ts`**

En `apps/rotulos/src/lib/label-store.ts`, línea 1-4, agregar el import de normalize:

```diff
 import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
 import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";
 import { createClient } from "@/lib/supabase/client";
+import { normalizeLabelDraft, normalizeLabelSettings } from "@/lib/normalize";
 import type { LabelDraft, LabelRecord, LabelSettings } from "@/lib/types";
```

- [ ] **Step 4: Normalizar en `saveLabel` de `createSupabaseLabelStore()` (líneas 139-158)**

Reemplazar el bloque completo:

```diff
     async saveLabel(draft, settings) {
-      const manual = draft.orderNumber.trim();
+      const normalizedDraft = normalizeLabelDraft(draft);
+      const manual = normalizedDraft.orderNumber.trim();
       if (manual) {
         const { data: duplicates, error: duplicateError } = await supabase
           .from("labels")
           .select("id")
           .eq("order_number", manual)
-          .neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000");
+          .neq("id", normalizedDraft.id ?? "00000000-0000-0000-0000-000000000000");
         if (duplicateError) throw duplicateError;
         if ((duplicates ?? []).length > 0) throw new Error("duplicate_order_number");
       }
-      const orderNumber = manual || await reserveSupabaseOrderNumber(draft, settings);
-      const row = labelToRow(draft, orderNumber);
-      const request = draft.id
-        ? supabase.from("labels").update(row).eq("id", draft.id).select("*").single<LabelRow>()
+      const orderNumber = manual || await reserveSupabaseOrderNumber(normalizedDraft, settings);
+      const row = labelToRow(normalizedDraft, orderNumber);
+      const request = normalizedDraft.id
+        ? supabase.from("labels").update(row).eq("id", normalizedDraft.id).select("*").single<LabelRow>()
         : supabase.from("labels").insert(row).select("*").single<LabelRow>();
       const { data, error } = await request;
       if (error) throw error;
       return rowToLabel(data);
     },
```

- [ ] **Step 5: Normalizar en `saveSettings` de `createSupabaseLabelStore()` (líneas 182-186)**

```diff
     async saveSettings(settings) {
-      const { error } = await supabase.from("settings").insert(settingsToRow(settings));
+      const normalizedSettings = normalizeLabelSettings(settings);
+      const { error } = await supabase.from("settings").insert(settingsToRow(normalizedSettings));
       if (error) throw error;
-      return settings;
+      return normalizedSettings;
     },
```

- [ ] **Step 6: Normalizar en `saveLabel` de `createLocalLabelStore()` (líneas 302-328)**

Reemplazar el bloque completo:

```diff
     async saveLabel(draft, settings) {
+      const normalizedDraft = normalizeLabelDraft(draft);
       const labels = readLabels();
       const sequences = readSequences();
-      const manual = draft.orderNumber.trim();
-      if (manual && labels.some((label) => label.orderNumber === manual && label.id !== draft.id)) {
+      const manual = normalizedDraft.orderNumber.trim();
+      if (manual && labels.some((label) => label.orderNumber === manual && label.id !== normalizedDraft.id)) {
         throw new Error("duplicate_order_number");
       }
-      const index = labels.findIndex((label) => label.id === draft.id);
+      const index = labels.findIndex((label) => label.id === normalizedDraft.id);
       const existing = index >= 0 ? labels[index] : undefined;
-      const nextSequence = manual ? undefined : getNextSequence(settings, draft, sequences);
+      const nextSequence = manual ? undefined : getNextSequence(settings, normalizedDraft, sequences);
       const orderNumber = manual || formatOrderNumber(settings.orderNumberConfig, {
-        date: new Date(`${draft.date}T00:00:00Z`),
+        date: new Date(`${normalizedDraft.date}T00:00:00Z`),
         sequence: nextSequence!.value,
-        city: draft.recipient.city,
-        department: draft.recipient.department,
+        city: normalizedDraft.recipient.city,
+        department: normalizedDraft.recipient.department,
       });
       if (nextSequence) {
         sequences.set(nextSequence.scope, nextSequence.value);
         writeSequences(sequences);
       }
-      const status = existing ? draft.status : draft.status === "borrador" ? "generado" : draft.status;
-      const record = toRecord({ ...draft, orderNumber, status }, existing);
+      const status = existing ? normalizedDraft.status : normalizedDraft.status === "borrador" ? "generado" : normalizedDraft.status;
+      const record = toRecord({ ...normalizedDraft, orderNumber, status }, existing);
       if (index >= 0) labels[index] = record;
       else labels.unshift(record);
       writeLabels(labels);
       return record;
     },
```

- [ ] **Step 7: Normalizar en `saveSettings` de `createLocalLabelStore()` (líneas 349-352)**

```diff
     async saveSettings(settings) {
-      writeSettings(settings);
-      return settings;
+      const normalizedSettings = normalizeLabelSettings(settings);
+      writeSettings(normalizedSettings);
+      return normalizedSettings;
     },
```

- [ ] **Step 8: Correr el test de label-store y verificar que pasa**

Run: `npx vitest run src/__tests__/label-store.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 9: Actualizar `label-form.test.tsx` (2 asserts que van a fallar por el mismo motivo)**

En `apps/rotulos/src/__tests__/label-form.test.tsx`, línea 56:

```diff
-    expect(await screen.findByDisplayValue("Ana Perez")).toBeInTheDocument();
+    expect(await screen.findByDisplayValue("ANA PEREZ")).toBeInTheDocument();
```

(dentro de `"loads an existing browser-fallback label for an edit URL"`, la única aserción de esa prueba)

Y línea 88 (dentro de `"posts the loaded browser-fallback label when downloading PDF"`):

```diff
-    expect(await screen.findByDisplayValue("Ana Perez")).toBeInTheDocument();
+    expect(await screen.findByDisplayValue("ANA PEREZ")).toBeInTheDocument();
```

- [ ] **Step 10: Actualizar `settings-history.test.tsx` (1 assert que va a fallar)**

En `apps/rotulos/src/__tests__/settings-history.test.tsx`, dentro de `"loads browser labels and persists a duplicated record"`, línea 133:

```diff
-    expect(await screen.findByText("Ana Perez")).toBeInTheDocument();
+    expect(await screen.findByText("ANA PEREZ")).toBeInTheDocument();
```

- [ ] **Step 11: Correr toda la suite de vitest y verificar que pasa**

Run: `npm run test`
Expected: PASS, todos los archivos en verde (incluye `label-form.test.tsx`, `settings-history.test.tsx`, `label-preview.test.tsx`, `label-actions.test.tsx` sin cambios porque no pasan por el store).

- [ ] **Step 12: Commit**

```bash
git add apps/rotulos/src/lib/label-store.ts apps/rotulos/src/__tests__/label-store.test.ts apps/rotulos/src/__tests__/label-form.test.tsx apps/rotulos/src/__tests__/settings-history.test.tsx
git commit -m "feat(rotulos): normalizar sender/recipient/carrier/orderNumber a mayuscula al guardar rotulos"
```

---

### Task 3: Aplicar normalización en `inventory-store.ts` (productos y movimientos de stock)

**Files:**
- Modify: `apps/rotulos/src/lib/inventory-store.ts:1-10` (import), `:104-126` (`saveProduct` local), `:136-168` (`recordMovement` local), `:184-199` (`saveProduct` Supabase), `:211-225` (`recordMovement` Supabase)
- Modify: `apps/rotulos/src/__tests__/product-form.test.tsx:30`
- Modify: `apps/rotulos/src/__tests__/stock-movement-form.test.tsx:28`

**Interfaces:**
- Consumes: `normalizeProductDraft(draft: ProductDraft): ProductDraft` y `normalizeStockMovementDraft(draft: StockMovementDraft): StockMovementDraft` de `@/lib/normalize` (Task 1).

- [ ] **Step 1: Actualizar los dos tests que van a fallar primero**

En `apps/rotulos/src/__tests__/product-form.test.tsx`, línea 30:

```diff
-      expect(products[0].name).toBe("Perfume 100ml");
+      expect(products[0].name).toBe("PERFUME 100ML");
```

En `apps/rotulos/src/__tests__/stock-movement-form.test.tsx`, línea 28:

```diff
     await waitFor(() => {
-      expect(screen.getByRole("option", { name: "Medias largas" })).toBeInTheDocument();
+      expect(screen.getByRole("option", { name: "MEDIAS LARGAS" })).toBeInTheDocument();
     });
```

- [ ] **Step 2: Correr ambos tests y verificar que fallan**

Run: `npx vitest run src/__tests__/product-form.test.tsx src/__tests__/stock-movement-form.test.tsx`
Expected: FAIL en ambos (el store todavía guarda `"Perfume 100ml"` / `"Medias largas"` tal cual).

- [ ] **Step 3: Agregar el import en `inventory-store.ts`**

```diff
 import { createClient } from "@/lib/supabase/client";
+import { normalizeProductDraft, normalizeStockMovementDraft } from "@/lib/normalize";
 import type {
   Product,
   ProductDraft,
```

- [ ] **Step 4: Normalizar en `saveProduct` de `createLocalInventoryStore()` (líneas 104-126)**

```diff
     async saveProduct(draft, id) {
+      const normalizedDraft = normalizeProductDraft(draft);
       const now = new Date().toISOString();
       const products = readStorage<Product[]>(storageKeys.products, []);
       const index = id ? products.findIndex((p) => p.id === id) : -1;
       const existing = index >= 0 ? products[index] : undefined;
       const record: Product = {
         id: existing?.id ?? crypto.randomUUID(),
-        name: draft.name,
-        category: draft.category,
-        sku: draft.sku,
-        unitPrice: draft.unitPrice,
+        name: normalizedDraft.name,
+        category: normalizedDraft.category,
+        sku: normalizedDraft.sku,
+        unitPrice: normalizedDraft.unitPrice,
         currentStock: existing?.currentStock ?? 0,
-        minStock: draft.minStock,
-        maxStock: draft.maxStock,
+        minStock: normalizedDraft.minStock,
+        maxStock: normalizedDraft.maxStock,
         lastRestockDate: existing?.lastRestockDate ?? null,
         createdAt: existing?.createdAt ?? now,
         updatedAt: now,
       };
       if (index >= 0) products[index] = record;
       else products.unshift(record);
       writeStorage(storageKeys.products, products);
       return record;
     },
```

- [ ] **Step 5: Normalizar en `recordMovement` de `createLocalInventoryStore()` (líneas 136-168)**

```diff
     async recordMovement(draft) {
+      const normalizedDraft = normalizeStockMovementDraft(draft);
       const products = readStorage<Product[]>(storageKeys.products, []);
-      const index = products.findIndex((p) => p.id === draft.productId);
+      const index = products.findIndex((p) => p.id === normalizedDraft.productId);
       if (index < 0) throw new Error("producto_no_encontrado");
       const product = products[index];

-      const delta = draft.type === "entrada" ? draft.quantity : draft.type === "salida" ? -draft.quantity : draft.quantity;
+      const delta = normalizedDraft.type === "entrada" ? normalizedDraft.quantity : normalizedDraft.type === "salida" ? -normalizedDraft.quantity : normalizedDraft.quantity;

       if (product.currentStock + delta < 0) {
         throw new Error("stock_insuficiente");
       }
       const now = new Date().toISOString();
       products[index] = {
         ...product,
         currentStock: product.currentStock + delta,
-        lastRestockDate: draft.type === "entrada" ? now : product.lastRestockDate,
+        lastRestockDate: normalizedDraft.type === "entrada" ? now : product.lastRestockDate,
         updatedAt: now,
       };
       writeStorage(storageKeys.products, products);

       const movement: StockMovement = {
         id: crypto.randomUUID(),
-        productId: draft.productId,
-        type: draft.type,
-        quantity: draft.quantity,
-        reason: draft.reason,
-        supplier: draft.supplier,
+        productId: normalizedDraft.productId,
+        type: normalizedDraft.type,
+        quantity: normalizedDraft.quantity,
+        reason: normalizedDraft.reason,
+        supplier: normalizedDraft.supplier,
         createdAt: now,
       };
       const movements = readStorage<StockMovement[]>(storageKeys.movements, []);
       writeStorage(storageKeys.movements, [movement, ...movements]);
       return movement;
     },
```

- [ ] **Step 6: Normalizar en `saveProduct` de `createSupabaseInventoryStore()` (líneas 184-199)**

```diff
     async saveProduct(draft, id) {
+      const normalizedDraft = normalizeProductDraft(draft);
       const payload = {
-        name: draft.name,
-        category: draft.category,
-        sku: draft.sku,
-        unit_price: draft.unitPrice,
-        min_stock: draft.minStock,
-        max_stock: draft.maxStock,
+        name: normalizedDraft.name,
+        category: normalizedDraft.category,
+        sku: normalizedDraft.sku,
+        unit_price: normalizedDraft.unitPrice,
+        min_stock: normalizedDraft.minStock,
+        max_stock: normalizedDraft.maxStock,
       };
       const request = id
         ? supabase.from("products").update(payload).eq("id", id).select("*").single<ProductRow>()
         : supabase.from("products").insert(payload).select("*").single<ProductRow>();
       const { data, error } = await request;
       if (error) throw error;
       return rowToProduct(data);
     },
```

- [ ] **Step 7: Normalizar en `recordMovement` de `createSupabaseInventoryStore()` (líneas 211-225)**

```diff
     async recordMovement(draft) {
+      const normalizedDraft = normalizeStockMovementDraft(draft);
       const { data, error } = await supabase
         .from("stock_movements")
         .insert({
-          product_id: draft.productId,
-          type: draft.type,
-          quantity: draft.quantity,
-          reason: draft.reason,
-          supplier: draft.supplier,
+          product_id: normalizedDraft.productId,
+          type: normalizedDraft.type,
+          quantity: normalizedDraft.quantity,
+          reason: normalizedDraft.reason,
+          supplier: normalizedDraft.supplier,
         })
         .select("*")
         .single<StockMovementRow>();
       if (error) throw new Error(error.message.includes("stock_insuficiente") ? "stock_insuficiente" : error.message);
       return rowToMovement(data);
     },
```

- [ ] **Step 8: Correr los tests y verificar que pasan**

Run: `npx vitest run src/__tests__/product-form.test.tsx src/__tests__/stock-movement-form.test.tsx src/__tests__/inventory-store.test.ts src/__tests__/inventory-store-rows.test.ts`
Expected: PASS en los cuatro archivos (los dos últimos no necesitaban cambios — ver Task 5 para confirmación en la corrida completa).

- [ ] **Step 9: Commit**

```bash
git add apps/rotulos/src/lib/inventory-store.ts apps/rotulos/src/__tests__/product-form.test.tsx apps/rotulos/src/__tests__/stock-movement-form.test.tsx
git commit -m "feat(rotulos): normalizar nombre/categoria/sku de productos y motivo/proveedor de movimientos a mayuscula"
```

---

### Task 4: Aplicar normalización en `business-store.ts` (pedidos, clientes y códigos de producto)

**Files:**
- Modify: `apps/rotulos/src/lib/business-store.ts:1-4` (import), `:173-199` (`saveOrder` local), `:206-212` (`saveProductCode` local), `:229-291` (`saveOrder` Supabase), `:303-311` (`saveProductCode` Supabase)
- Create: `apps/rotulos/src/__tests__/business-store.test.ts` (no existía cobertura previa de este store)

**Interfaces:**
- Consumes: `normalizeOrderDraft(draft: OrderDraft): OrderDraft` y `normalizeProductCode<T>(code: T): T` de `@/lib/normalize` (Task 1).

- [ ] **Step 1: Escribir el test que falla (nueva cobertura, este store no tenía tests)**

Crear `apps/rotulos/src/__tests__/business-store.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";

describe("local business store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes customer, notes, and items to uppercase but leaves email and phone untouched", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.email = "ana@example.com";
    draft.customer.phone = "3101234567";
    draft.customer.city = "medellin";
    draft.notes = "entregar en la manana";
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 1, unitPrice: 15000 }];

    const saved = await store.saveOrder(draft);

    expect(saved.customer.fullName).toBe("ANA PEREZ");
    expect(saved.customer.email).toBe("ana@example.com");
    expect(saved.customer.phone).toBe("3101234567");
    expect(saved.customer.city).toBe("MEDELLIN");
    expect(saved.notes).toBe("ENTREGAR EN LA MANANA");
    expect(saved.items[0].productName).toBe("MEDIAS LARGAS");
    expect(saved.items[0].productCode).toBe("MED-001");
  });

  it("saves an auto-created customer already normalized", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "luis gomez";
    draft.customer.city = "cali";

    await store.saveOrder(draft);
    const customers = await store.listCustomers();

    expect(customers).toHaveLength(1);
    expect(customers[0].fullName).toBe("LUIS GOMEZ");
    expect(customers[0].city).toBe("CALI");
  });

  it("normalizes a product code but leaves unitPrice untouched", async () => {
    const store = getBusinessStore();

    const saved = await store.saveProductCode({ code: "med-001", productName: "medias largas", category: "medias", unitPrice: 15000 });

    expect(saved.code).toBe("MED-001");
    expect(saved.productName).toBe("MEDIAS LARGAS");
    expect(saved.category).toBe("MEDIAS");
    expect(saved.unitPrice).toBe(15000);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npx vitest run src/__tests__/business-store.test.ts`
Expected: FAIL — los tres tests fallan porque el store todavía guarda los valores tal cual se escribieron (minúscula).

- [ ] **Step 3: Agregar el import en `business-store.ts`**

```diff
 import { createClient } from "@/lib/supabase/client";
+import { normalizeOrderDraft, normalizeProductCode } from "@/lib/normalize";
 import type { Customer, OrderDraft, OrderItem, OrderRecord, ProductCode } from "@/lib/business-types";
```

- [ ] **Step 4: Normalizar en `saveOrder` de `createLocalBusinessStore()` (líneas 173-199)**

```diff
     async saveOrder(draft) {
+      const normalizedDraft = normalizeOrderDraft(draft);
       const now = new Date().toISOString();
       const current = readStorage<OrderRecord[]>(storageKeys.orders, []);
-      const computed = totals(draft.items, draft.discount, draft.shippingCost);
+      const computed = totals(normalizedDraft.items, normalizedDraft.discount, normalizedDraft.shippingCost);
       const record: OrderRecord = {
         id: crypto.randomUUID(),
         customerId: null,
-        customer: draft.customer,
-        orderDate: draft.orderDate,
-        status: draft.status,
-        notes: draft.notes,
-        discount: draft.discount,
-        shippingCost: draft.shippingCost,
+        customer: normalizedDraft.customer,
+        orderDate: normalizedDraft.orderDate,
+        status: normalizedDraft.status,
+        notes: normalizedDraft.notes,
+        discount: normalizedDraft.discount,
+        shippingCost: normalizedDraft.shippingCost,
         subtotal: computed.subtotal,
         total: computed.total,
-        items: draft.items.map((item) => ({ ...item, id: crypto.randomUUID(), total: item.quantity * item.unitPrice })),
+        items: normalizedDraft.items.map((item) => ({ ...item, id: crypto.randomUUID(), total: item.quantity * item.unitPrice })),
         createdAt: now,
         updatedAt: now,
       };
       writeStorage(storageKeys.orders, [record, ...current]);
       const customers = readStorage<Customer[]>(storageKeys.customers, []);
-      if (draft.customer.fullName && !customers.some((customer) => customer.fullName.toLowerCase() === draft.customer.fullName.toLowerCase())) {
-        customers.unshift({ ...draft.customer, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
+      if (normalizedDraft.customer.fullName && !customers.some((customer) => customer.fullName.toLowerCase() === normalizedDraft.customer.fullName.toLowerCase())) {
+        customers.unshift({ ...normalizedDraft.customer, id: crypto.randomUUID(), createdAt: now, updatedAt: now });
         writeStorage(storageKeys.customers, customers);
       }
       return record;
     },
```

(el `.toLowerCase()` en la comparación de duplicados se deja igual a propósito — sigue detectando duplicados aunque existan clientes viejos guardados antes de este cambio, con casing mixto)

- [ ] **Step 5: Normalizar en `saveProductCode` de `createLocalBusinessStore()` (líneas 206-212)**

```diff
     async saveProductCode(code) {
+      const normalizedCode = normalizeProductCode(code);
       const now = new Date().toISOString();
-      const record = { ...code, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
+      const record = { ...normalizedCode, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
       const current = readStorage<ProductCode[]>(storageKeys.productCodes, []);
-      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== code.code)]);
+      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== normalizedCode.code)]);
       return record;
     },
```

- [ ] **Step 6: Normalizar en `saveOrder` de `createSupabaseBusinessStore()` (líneas 229-291)**

```diff
     async saveOrder(draft) {
-      const computed = totals(draft.items, draft.discount, draft.shippingCost);
-      const { data: existingCustomer, error: lookupError } = draft.customer.phone
-        ? await supabase.from("customers").select("*").eq("phone", draft.customer.phone).maybeSingle<CustomerRow>()
+      const normalizedDraft = normalizeOrderDraft(draft);
+      const computed = totals(normalizedDraft.items, normalizedDraft.discount, normalizedDraft.shippingCost);
+      const { data: existingCustomer, error: lookupError } = normalizedDraft.customer.phone
+        ? await supabase.from("customers").select("*").eq("phone", normalizedDraft.customer.phone).maybeSingle<CustomerRow>()
         : { data: null, error: null };
       if (lookupError) throw lookupError;

       const customerPayload = {
-        full_name: draft.customer.fullName,
-        phone: draft.customer.phone,
-        email: draft.customer.email,
-        department: draft.customer.department,
-        city: draft.customer.city,
-        address: draft.customer.address,
-        neighborhood: draft.customer.neighborhood,
+        full_name: normalizedDraft.customer.fullName,
+        phone: normalizedDraft.customer.phone,
+        email: normalizedDraft.customer.email,
+        department: normalizedDraft.customer.department,
+        city: normalizedDraft.customer.city,
+        address: normalizedDraft.customer.address,
+        neighborhood: normalizedDraft.customer.neighborhood,
       };
       const customerRequest = existingCustomer
         ? supabase
           .from("customers")
           .update(customerPayload)
           .eq("id", existingCustomer.id)
           .select("*")
           .single<CustomerRow>()
         : supabase
           .from("customers")
           .insert(customerPayload)
           .select("*")
           .single<CustomerRow>();
       const { data: customer, error: customerError } = await customerRequest;
       if (customerError) throw customerError;

       const { data: order, error: orderError } = await supabase
         .from("orders")
         .insert({
           customer_id: customer.id,
-          customer_snapshot: draft.customer,
-          order_date: draft.orderDate,
-          status: draft.status,
-          notes: draft.notes,
-          discount: draft.discount,
-          shipping_cost: draft.shippingCost,
+          customer_snapshot: normalizedDraft.customer,
+          order_date: normalizedDraft.orderDate,
+          status: normalizedDraft.status,
+          notes: normalizedDraft.notes,
+          discount: normalizedDraft.discount,
+          shipping_cost: normalizedDraft.shippingCost,
           subtotal: computed.subtotal,
           total: computed.total,
         })
         .select("*")
         .single<OrderRow>();
       if (orderError) throw orderError;

       const { data: items, error: itemsError } = await supabase
         .from("order_items")
-        .insert(draft.items.map((item) => ({
+        .insert(normalizedDraft.items.map((item) => ({
           order_id: order.id,
           product_code: item.productCode,
           product_name: item.productName,
           category: item.category,
           quantity: item.quantity,
           unit_price: item.unitPrice,
           total: item.quantity * item.unitPrice,
         })))
         .select("*")
         .returns<OrderItemRow[]>();
       if (itemsError) throw itemsError;
       return rowToOrder({ ...order, order_items: items ?? [] });
     },
```

- [ ] **Step 7: Normalizar en `saveProductCode` de `createSupabaseBusinessStore()` (líneas 303-311)**

```diff
     async saveProductCode(code) {
+      const normalizedCode = normalizeProductCode(code);
       const { data, error } = await supabase
         .from("product_codes")
-        .upsert({ code: code.code, product_name: code.productName, category: code.category, unit_price: code.unitPrice }, { onConflict: "code" })
+        .upsert({ code: normalizedCode.code, product_name: normalizedCode.productName, category: normalizedCode.category, unit_price: normalizedCode.unitPrice }, { onConflict: "code" })
         .select("*")
         .single<ProductCodeRow>();
       if (error) throw error;
       return rowToProductCode(data);
     },
```

- [ ] **Step 8: Correr el test y verificar que pasa**

Run: `npx vitest run src/__tests__/business-store.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add apps/rotulos/src/lib/business-store.ts apps/rotulos/src/__tests__/business-store.test.ts
git commit -m "feat(rotulos): normalizar cliente/notas/items de pedidos y codigos de producto a mayuscula"
```

---

### Task 5: Validación final completa

**Files:** ninguno (solo verificación, cwd `apps/rotulos/`).

**Interfaces:** ninguna — task de verificación.

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: sin errores.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: sin errores (`tsc --noEmit`).

- [ ] **Step 3: Suite completa de Vitest**

Run: `npm run test`
Expected: PASS en todos los archivos, incluidos los nuevos (`normalize.test.ts`, `business-store.test.ts`) y los modificados (`label-store.test.ts`, `label-form.test.tsx`, `settings-history.test.tsx`, `product-form.test.tsx`, `stock-movement-form.test.tsx`).

- [ ] **Step 4: Build de producción**

Run: `npm run build`
Expected: build exitoso, sin errores de tipos ni de compilación.

- [ ] **Step 5 (opcional/informativo): e2e con Playwright**

Run: `npm run test:e2e`
Expected: PASS — `e2e/rotulos.spec.ts` no necesita cambios porque solo verifica el preview en vivo mientras se escribe (antes de guardar), no el valor persistido.

- [ ] **Step 6: Commit final si Steps 1-4 quedaron limpios sin cambios adicionales**

Si todos los pasos anteriores pasan sin requerir tocar código, no hay nada nuevo que commitear en este task (los commits ya se hicieron en Tasks 1-4). Si algún ajuste fue necesario para que lint/typecheck/build pasaran, commitear ese ajuste puntual:

```bash
git add -A
git commit -m "fix(rotulos): ajustes de lint/typecheck tras normalizar texto a mayuscula"
```

---

## Spec Coverage Check

- Formularios revisados → sí, mapeados los 8 componentes de entrada relevantes (Sender/Recipient/Shipment/Settings/Order/Product/StockMovement fields) — ninguno se modifica, la normalización vive en los stores para cubrir tanto UI como llamadas directas.
- Campos de texto a mayúscula (nombres, apellidos, cliente, dirección, ciudad, barrio, observaciones, referencias, remitente, destinatario, rótulo, productos) → cubiertos en Tasks 2-4, listados explícitamente en Global Constraints.
- `trim().toUpperCase()` antes de guardar → `normalizeText()` en Task 1, usado por todas las normalizadoras de dominio.
- No cambiar estructura de BD/nombres de campo/validaciones/lógica de negocio → respetado en los tres stores (solo se intercepta el valor de los campos string, nunca su forma ni el resto del flujo).
- Función reutilizable + normalizador de objetos → `normalizeText` + una función por dominio en `normalize.ts`, reusadas en ambas implementaciones (Supabase y local) de cada store.
- Excluir email/URL/password/token/id/UUID/filename/QR → documentado campo por campo en Global Constraints; ningún paso de la implementación toca `email`, `logoUrl`, `qrUrl`, ni ningún campo `id`/`createdAt`/`updatedAt`/`pdfUrl`/`createdBy`.
- CSS `text-transform: uppercase` como apoyo visual → evaluado y descartado explícitamente en Global Constraints, con justificación.
- Validaciones: lint, typecheck, build, tests → Task 5.
- Riesgo pendiente (documentar en el resumen final al usuario): los rótulos/pedidos/productos guardados **antes** de este cambio no se re-normalizan retroactivamente — quedan con el casing original hasta que se editen y regraben. No hay tarea de migración de datos históricos en este plan porque no fue pedida y tocar datos ya guardados en Supabase es una operación aparte que merece su propia confirmación explícita del usuario.
