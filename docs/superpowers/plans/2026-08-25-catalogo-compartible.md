# Catálogo compartible (PDF + imagen WhatsApp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a Edwing un catálogo de perfumes (foto + precio + datos del negocio y redes) que pueda descargar en PDF o como imagen para compartir por WhatsApp, generado desde el catálogo de productos (`product_codes`) que ya usa en pedidos.

**Architecture:** Se agrega `image_url` a `product_codes` (foto sube a un bucket público nuevo `product-images` de Supabase Storage) y tres campos de contacto (`email`, `facebook_user`, `tiktok_user`) a `settings`. Una página nueva `/catalogo` gestiona el catálogo (tabla + alta + edición con foto) reusando `DataTable`/`Drawer`/`ConfirmDialog` ya existentes. La generación reutiliza el patrón ya probado de `order-summary-pdf.ts` (pdf-lib, server-side vía API route) y `order-summary-image.ts` (canvas 2D, client-side).

**Tech Stack:** Next.js 16 App Router, TypeScript, Supabase (Postgres + Storage + Auth), pdf-lib, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-25-catalogo-compartible-design.md`

## Global Constraints

- Todo texto de usuario se normaliza a MAYÚSCULA vía `normalizeText` en `src/lib/normalize.ts` — **excepto** `email`, `facebookUser`, `tiktokUser` e `imageUrl`, que siguen el mismo criterio que `instagramUser`/`Customer.email` hoy (no se normalizan).
- Cualquier ruta nueva bajo `/api` debe llamar `requireSession()` al inicio (`src/lib/require-session.ts`).
- No modificar el diseño del rótulo (`globals.css` / `src/lib/pdf.ts`) — este trabajo es independiente.
- No tocar `customers.source` ni automatizar el importador de Excel — fuera de alcance de esta feature.
- Ejecutar `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` (los 4) antes de dar la feature por terminada.
- Cerrar con commit, push y deploy al final, salvo que Edwing diga lo contrario en esa conversación.

---

## File Structure

Nuevos:
- `apps/rotulos/supabase/migrations/202608250001_add_product_codes_image.sql`
- `apps/rotulos/supabase/migrations/202608250002_add_catalog_contact_settings.sql`
- `apps/rotulos/src/lib/catalog.ts` — helper puro: agrupar/ordenar productos por categoría (compartido por PDF e imagen, es la única lógica realmente testable sin mockear canvas/pdf-lib).
- `apps/rotulos/src/lib/catalog-pdf.ts` — render server-side (pdf-lib), mismo patrón que `order-summary-pdf.ts`.
- `apps/rotulos/src/lib/catalog-image.ts` — render client-side (canvas), mismo patrón que `order-summary-image.ts`.
- `apps/rotulos/src/lib/product-image-upload.ts` — sube una foto al bucket `product-images` y devuelve la URL pública.
- `apps/rotulos/src/app/api/catalog/pdf/route.ts` — API route protegida, genera el PDF a partir del payload.
- `apps/rotulos/src/components/product-code-edit-form.tsx` — alta/edición de un producto del catálogo (nombre, categoría, precio, foto).
- `apps/rotulos/src/components/product-codes-table.tsx` — tabla + drawer de alta/edición + borrado.
- `apps/rotulos/src/components/catalog-generator.tsx` — botones "Descargar PDF" / "Descargar imagen" / "Enviar por WhatsApp".
- `apps/rotulos/src/app/(app)/catalogo/page.tsx` — página nueva.
- `apps/rotulos/src/__tests__/catalog.test.ts`
- `apps/rotulos/src/__tests__/catalog-pdf.test.ts`

Modificados:
- `apps/rotulos/src/lib/business-types.ts` — `ProductCode.imageUrl`, `ProductCodePatch`.
- `apps/rotulos/src/lib/business-store.ts` — `updateProductCode`/`deleteProductCode` (local + Supabase), `image_url` en filas.
- `apps/rotulos/src/lib/normalize.ts` — `normalizeProductCodePatch`.
- `apps/rotulos/src/lib/types.ts` — `LabelSettings.email/facebookUser/tiktokUser`.
- `apps/rotulos/src/lib/defaults.ts` — defaults de los tres campos nuevos.
- `apps/rotulos/src/lib/label-store.ts` — mapeo Supabase de los tres campos nuevos.
- `apps/rotulos/src/components/settings-form.tsx` — inputs para los tres campos nuevos.
- `apps/rotulos/src/components/app-shell.tsx` — entrada de menú y `PAGE_META` para `/catalogo`.
- `apps/rotulos/src/__tests__/business-store.test.ts` — casos de `updateProductCode`/`deleteProductCode`.

---

### Task 1: Migraciones — foto de producto, bucket público y contacto del negocio

**Files:**
- Create: `apps/rotulos/supabase/migrations/202608250001_add_product_codes_image.sql`
- Create: `apps/rotulos/supabase/migrations/202608250002_add_catalog_contact_settings.sql`

**Interfaces:**
- Produces: columna `product_codes.image_url text` (nullable), bucket `product-images` (público, políticas de storage), columnas `settings.email/facebook_user/tiktok_user text not null default ''`.

- [ ] **Step 1: Migración de `product_codes` y bucket de fotos**

```sql
-- 202608250001_add_product_codes_image.sql
alter table public.product_codes
  add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Authenticated users can upload product images."
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated users can update product images."
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated users can delete product images."
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images');

create policy "Anyone can read product images."
  on storage.objects for select to public
  using (bucket_id = 'product-images');
```

- [ ] **Step 2: Migración de datos de contacto en `settings`**

```sql
-- 202608250002_add_catalog_contact_settings.sql
alter table public.settings
  add column if not exists email text not null default '',
  add column if not exists facebook_user text not null default '',
  add column if not exists tiktok_user text not null default '';
```

- [ ] **Step 3: Aplicar en Supabase remoto**

Correr `supabase db push --workdir apps/rotulos` (o pegar el SQL a mano en el SQL Editor de Supabase si el CLI falla por sesión vencida, como pasó antes — dejar constancia en el commit/handoff si se aplicó manualmente).

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/supabase/migrations/202608250001_add_product_codes_image.sql apps/rotulos/supabase/migrations/202608250002_add_catalog_contact_settings.sql
git commit -m "feat(rotulos): agregar foto de producto y contacto de negocio a la base de datos"
```

---

### Task 2: Tipos y normalización — `ProductCode.imageUrl`

**Files:**
- Modify: `apps/rotulos/src/lib/business-types.ts:66-74`
- Modify: `apps/rotulos/src/lib/normalize.ts:108-117`
- Test: `apps/rotulos/src/__tests__/normalize.test.ts`

**Interfaces:**
- Produces: `ProductCode.imageUrl: string | null`, `ProductCodePatch`, `normalizeProductCodePatch(patch)`.
- Consumes: nada nuevo (usa `normalizeText` ya existente).

- [ ] **Step 1: Escribir el test que falla**

Agregar a `apps/rotulos/src/__tests__/normalize.test.ts`:

```ts
import { normalizeProductCodePatch } from "@/lib/normalize";

describe("normalizeProductCodePatch", () => {
  it("uppercases text fields present in the patch and leaves imageUrl untouched", () => {
    const result = normalizeProductCodePatch({
      productName: "chanel no 5",
      imageUrl: "https://example.com/foto.png",
    });
    expect(result.productName).toBe("CHANEL NO 5");
    expect(result.imageUrl).toBe("https://example.com/foto.png");
    expect(result.category).toBeUndefined();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- normalize.test.ts`
Expected: FAIL — `normalizeProductCodePatch` no existe.

- [ ] **Step 3: Extender el tipo `ProductCode` y agregar `ProductCodePatch`**

En `apps/rotulos/src/lib/business-types.ts`, reemplazar el bloque `ProductCode`:

```ts
export type ProductCode = {
  id: string;
  code: string;
  productName: string;
  category: string;
  unitPrice: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductCodePatch = Partial<
  Pick<ProductCode, "productName" | "category" | "unitPrice" | "imageUrl">
>;
```

- [ ] **Step 4: Implementar `normalizeProductCodePatch`**

En `apps/rotulos/src/lib/normalize.ts`, junto a `normalizeProductCode`:

```ts
import type { ProductCodePatch } from "@/lib/business-types";

export function normalizeProductCodePatch(patch: ProductCodePatch): ProductCodePatch {
  return {
    ...patch,
    ...(patch.productName !== undefined ? { productName: normalizeText(patch.productName) } : {}),
    ...(patch.category !== undefined ? { category: normalizeText(patch.category) } : {}),
  };
}
```

- [ ] **Step 5: Correr el test y verificar que pasa**

Run: `npm test -- normalize.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/business-types.ts apps/rotulos/src/lib/normalize.ts apps/rotulos/src/__tests__/normalize.test.ts
git commit -m "feat(rotulos): agregar imageUrl al tipo ProductCode y su normalizacion"
```

---

### Task 3: `business-store` — editar y borrar productos del catálogo

Hoy `BusinessStore` solo tiene `saveProductCode` (alta/upsert por código); no existe edición ni borrado. Se agregan ambos, en las dos implementaciones (local y Supabase).

**Files:**
- Modify: `apps/rotulos/src/lib/business-store.ts`
- Modify: `apps/rotulos/src/__tests__/business-store.test.ts`

**Interfaces:**
- Consumes: `ProductCode`, `ProductCodePatch` (Task 2), `normalizeProductCodePatch`.
- Produces: `BusinessStore.updateProductCode(id: string, patch: ProductCodePatch): Promise<ProductCode>`, `BusinessStore.deleteProductCode(id: string): Promise<void>`.

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `apps/rotulos/src/__tests__/business-store.test.ts` (junto al test existente de `saveProductCode`, línea ~153):

```ts
  it("updates a product code and normalizes the patch", async () => {
    const store = getBusinessStore();
    const saved = await store.saveProductCode({ code: "med-001", productName: "medias largas", category: "medias", unitPrice: 15000, imageUrl: null });

    const updated = await store.updateProductCode(saved.id, { unitPrice: 18000, imageUrl: "https://x.test/foto.png" });

    expect(updated.unitPrice).toBe(18000);
    expect(updated.imageUrl).toBe("https://x.test/foto.png");
    expect(updated.productName).toBe("MEDIAS LARGAS");
  });

  it("deletes a product code", async () => {
    const store = getBusinessStore();
    const saved = await store.saveProductCode({ code: "med-002", productName: "medias cortas", category: "medias", unitPrice: 10000, imageUrl: null });

    await store.deleteProductCode(saved.id);

    const remaining = await store.listProductCodes();
    expect(remaining.find((item) => item.id === saved.id)).toBeUndefined();
  });
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

Run: `npm test -- business-store.test.ts`
Expected: FAIL — `updateProductCode`/`deleteProductCode` no existen, y `saveProductCode` no acepta `imageUrl`.

- [ ] **Step 3: Extender el tipo `BusinessStore` y `Omit<ProductCode, ...>` de alta**

En `apps/rotulos/src/lib/business-store.ts:17-18`:

```ts
  listProductCodes(): Promise<ProductCode[]>;
  saveProductCode(code: Omit<ProductCode, "id" | "createdAt" | "updatedAt">): Promise<ProductCode>;
  updateProductCode(id: string, patch: ProductCodePatch): Promise<ProductCode>;
  deleteProductCode(id: string): Promise<void>;
```

Import `ProductCodePatch` en la línea 6 junto a los demás tipos de `business-types`.

- [ ] **Step 4: Actualizar `ProductCodeRow` y los mapeos**

En `apps/rotulos/src/lib/business-store.ts:66-74` y `189-199`:

```ts
type ProductCodeRow = {
  id: string;
  code: string;
  product_name: string;
  category: string;
  unit_price: number | string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

function rowToProductCode(row: ProductCodeRow): ProductCode {
  return {
    id: row.id,
    code: row.code,
    productName: row.product_name,
    category: row.category,
    unitPrice: Number(row.unit_price),
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

- [ ] **Step 5: Implementar en el store local (`createLocalBusinessStore`)**

Reemplazar el bloque `saveProductCode` (línea ~466-473) por:

```ts
    async saveProductCode(code) {
      const normalizedCode = normalizeProductCode(code);
      const now = new Date().toISOString();
      const record: ProductCode = { ...normalizedCode, imageUrl: normalizedCode.imageUrl ?? null, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
      const current = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, [record, ...current.filter((item) => item.code !== normalizedCode.code)]);
      return record;
    },
    async updateProductCode(id, patch) {
      const products = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      const index = products.findIndex((item) => item.id === id);
      if (index < 0) throw new Error("product_code_not_found");
      const normalizedPatch = normalizeProductCodePatch(patch);
      const updated = { ...products[index], ...normalizedPatch, updatedAt: new Date().toISOString() };
      products[index] = updated;
      writeStorage(storageKeys.productCodes, products);
      return updated;
    },
    async deleteProductCode(id) {
      const products = readStorage<ProductCode[]>(storageKeys.productCodes, []);
      writeStorage(storageKeys.productCodes, products.filter((item) => item.id !== id));
    },
```

Importar `normalizeProductCodePatch` junto a `normalizeProductCode` en la línea 5.

- [ ] **Step 6: Implementar en el store Supabase (`createSupabaseBusinessStore`)**

Reemplazar el bloque `saveProductCode` (línea ~572-581) por:

```ts
    async saveProductCode(code) {
      const normalizedCode = normalizeProductCode(code);
      const { data, error } = await supabase
        .from("product_codes")
        .upsert(
          { code: normalizedCode.code, product_name: normalizedCode.productName, category: normalizedCode.category, unit_price: normalizedCode.unitPrice, image_url: normalizedCode.imageUrl ?? null },
          { onConflict: "code" },
        )
        .select("*")
        .single<ProductCodeRow>();
      if (error) throw error;
      return rowToProductCode(data);
    },
    async updateProductCode(id, patch) {
      const normalizedPatch = normalizeProductCodePatch(patch);
      const payload = {
        ...(normalizedPatch.productName !== undefined ? { product_name: normalizedPatch.productName } : {}),
        ...(normalizedPatch.category !== undefined ? { category: normalizedPatch.category } : {}),
        ...(normalizedPatch.unitPrice !== undefined ? { unit_price: normalizedPatch.unitPrice } : {}),
        ...(normalizedPatch.imageUrl !== undefined ? { image_url: normalizedPatch.imageUrl } : {}),
      };
      const { data, error } = await supabase
        .from("product_codes")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single<ProductCodeRow>();
      if (error) throw error;
      return rowToProductCode(data);
    },
    async deleteProductCode(id) {
      const { error } = await supabase.from("product_codes").delete().eq("id", id);
      if (error) throw error;
    },
```

- [ ] **Step 7: Correr los tests y verificar que pasan**

Run: `npm test -- business-store.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add apps/rotulos/src/lib/business-store.ts apps/rotulos/src/__tests__/business-store.test.ts
git commit -m "feat(rotulos): permitir editar y borrar productos del catalogo"
```

---

### Task 4: Datos de contacto del negocio en `Configuración`

**Files:**
- Modify: `apps/rotulos/src/lib/types.ts:57-67`
- Modify: `apps/rotulos/src/lib/defaults.ts:17-44`
- Modify: `apps/rotulos/src/lib/label-store.ts:49-111`
- Modify: `apps/rotulos/src/components/settings-form.tsx`

**Interfaces:**
- Produces: `LabelSettings.email: string`, `LabelSettings.facebookUser: string`, `LabelSettings.tiktokUser: string`, persistidos en `settings.email/facebook_user/tiktok_user`.

- [ ] **Step 1: Extender `LabelSettings`**

En `apps/rotulos/src/lib/types.ts:57-67`:

```ts
export type LabelSettings = {
  defaultSender: Sender;
  logoUrl: string;
  qrUrl: string;
  instagramUser: string;
  facebookUser: string;
  tiktokUser: string;
  email: string;
  brandPhrase: string;
  brandColors: BrandColors;
  labelSize: { widthCm: number; heightCm: number };
  defaultTemplate: "purpleshop-classic";
  orderNumberConfig: OrderNumberConfig;
};
```

- [ ] **Step 2: Extender `defaultSettings`**

En `apps/rotulos/src/lib/defaults.ts:17-44`, agregar tras `instagramUser`:

```ts
  instagramUser: "@PURPLESHOP.ONLINE",
  facebookUser: "",
  tiktokUser: "",
  email: "",
```

- [ ] **Step 3: Extender el mapeo Supabase en `label-store.ts`**

En `SettingsRow` (línea 49-59):

```ts
type SettingsRow = {
  default_sender: LabelSettings["defaultSender"];
  logo_url: string;
  qr_url: string;
  instagram_user: string;
  facebook_user: string;
  tiktok_user: string;
  email: string;
  brand_phrase: string;
  brand_colors: LabelSettings["brandColors"];
  label_size: LabelSettings["labelSize"];
  default_template: LabelSettings["defaultTemplate"];
  order_number_config: LabelSettings["orderNumberConfig"];
};
```

En `settingsToRow` (línea 84-96):

```ts
function settingsToRow(settings: LabelSettings) {
  return {
    default_sender: settings.defaultSender,
    logo_url: settings.logoUrl,
    qr_url: settings.qrUrl,
    instagram_user: settings.instagramUser,
    facebook_user: settings.facebookUser,
    tiktok_user: settings.tiktokUser,
    email: settings.email,
    brand_phrase: settings.brandPhrase,
    brand_colors: settings.brandColors,
    label_size: settings.labelSize,
    default_template: settings.defaultTemplate,
    order_number_config: settings.orderNumberConfig,
  };
}
```

En `rowToSettings` (línea 98-111):

```ts
function rowToSettings(row: SettingsRow | null): LabelSettings {
  if (!row) return defaultSettings;
  return {
    defaultSender: row.default_sender,
    logoUrl: row.logo_url,
    qrUrl: row.qr_url,
    instagramUser: row.instagram_user,
    facebookUser: row.facebook_user ?? "",
    tiktokUser: row.tiktok_user ?? "",
    email: row.email ?? "",
    brandPhrase: row.brand_phrase,
    brandColors: row.brand_colors,
    labelSize: row.label_size,
    defaultTemplate: row.default_template,
    orderNumberConfig: row.order_number_config,
  };
}
```

(`?? ""` cubre filas viejas de `settings` guardadas antes de esta migración, que no tienen estas columnas en el `select("*")` hasta que la migración corra — evita que `Configuración` explote con `undefined`.)

- [ ] **Step 4: Agregar los campos al formulario**

En `apps/rotulos/src/components/settings-form.tsx`, dentro de `TabsContent value="marca"` (línea ~111-116), después del campo Instagram:

```tsx
              <FormField label="Instagram">
                <Input value={settings.instagramUser} onChange={(event) => setSettings({ ...settings, instagramUser: event.target.value })} />
              </FormField>
              <FormField label="Facebook">
                <Input value={settings.facebookUser} onChange={(event) => setSettings({ ...settings, facebookUser: event.target.value })} />
              </FormField>
              <FormField label="TikTok">
                <Input value={settings.tiktokUser} onChange={(event) => setSettings({ ...settings, tiktokUser: event.target.value })} />
              </FormField>
              <FormField label="Correo del negocio">
                <Input type="email" value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} />
              </FormField>
```

- [ ] **Step 5: Verificar manualmente**

Correr `npm run dev`, entrar a `Configuración` → pestaña Marca, llenar Facebook/TikTok/correo, guardar, recargar la página y confirmar que los valores persisten.

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/types.ts apps/rotulos/src/lib/defaults.ts apps/rotulos/src/lib/label-store.ts apps/rotulos/src/components/settings-form.tsx
git commit -m "feat(rotulos): agregar correo, Facebook y TikTok a la configuracion del negocio"
```

---

### Task 5: Subida de fotos de producto

**Files:**
- Create: `apps/rotulos/src/lib/product-image-upload.ts`
- Test: `apps/rotulos/src/__tests__/product-image-upload.test.ts`

**Interfaces:**
- Consumes: `createClient` de `@/lib/supabase/client`.
- Produces: `uploadProductImage(productCodeId: string, file: File): Promise<string>` (URL pública), `validateProductImageFile(file: File): string | null` (mensaje de error o `null` si es válida).

- [ ] **Step 1: Escribir el test que falla**

```ts
// apps/rotulos/src/__tests__/product-image-upload.test.ts
import { describe, expect, it } from "vitest";
import { validateProductImageFile } from "@/lib/product-image-upload";

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "foto.jpg", { type });
}

describe("validateProductImageFile", () => {
  it("accepts jpeg and png under 5MB", () => {
    expect(validateProductImageFile(makeFile("image/jpeg", 1024))).toBeNull();
    expect(validateProductImageFile(makeFile("image/png", 1024))).toBeNull();
  });

  it("rejects other file types", () => {
    expect(validateProductImageFile(makeFile("application/pdf", 1024))).toBe("Solo se permiten fotos JPG o PNG.");
  });

  it("rejects files over 5MB", () => {
    expect(validateProductImageFile(makeFile("image/jpeg", 6 * 1024 * 1024))).toBe("La foto no puede pesar mas de 5MB.");
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- product-image-upload.test.ts`
Expected: FAIL — el módulo no existe.

- [ ] **Step 3: Implementar**

```ts
// apps/rotulos/src/lib/product-image-upload.ts
"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"]);

export function validateProductImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return "Solo se permiten fotos JPG o PNG.";
  if (file.size > MAX_BYTES) return "La foto no puede pesar mas de 5MB.";
  return null;
}

export async function uploadProductImage(productCodeId: string, file: File): Promise<string> {
  const error = validateProductImageFile(file);
  if (error) throw new Error(error);

  const supabase = createClient();
  if (!supabase) throw new Error("supabase_unavailable");

  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `${productCodeId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- product-image-upload.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/product-image-upload.ts apps/rotulos/src/__tests__/product-image-upload.test.ts
git commit -m "feat(rotulos): subir fotos de producto al bucket product-images"
```

---

### Task 6: Página `/catalogo` — alta, edición y borrado de productos con foto

No existe hoy pantalla para editar `product_codes` fuera del alta implícita en `Nuevo pedido`. Esta tarea la agrega, siguiendo el patrón de `CustomersTable`/`customer-edit-form.tsx`.

**Files:**
- Create: `apps/rotulos/src/components/product-code-edit-form.tsx`
- Create: `apps/rotulos/src/components/product-codes-table.tsx`
- Create: `apps/rotulos/src/app/(app)/catalogo/page.tsx`
- Modify: `apps/rotulos/src/components/app-shell.tsx`

**Interfaces:**
- Consumes: `getBusinessStore()` (Task 3), `uploadProductImage`/`validateProductImageFile` (Task 5), `ProductCode`/`ProductCodePatch` (Task 2), `CurrencyInput`, `DataTable`, `Drawer`, `ConfirmDialog`, `useToast` (ya existentes).
- Produces: `ProductCodesTable` (componente por defecto usado en `/catalogo`).

- [ ] **Step 1: Formulario de alta/edición**

```tsx
// apps/rotulos/src/components/product-code-edit-form.tsx
"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { getBusinessStore } from "@/lib/business-store";
import { uploadProductImage, validateProductImageFile } from "@/lib/product-image-upload";
import type { ProductCode } from "@/lib/business-types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type ProductCodeFormValue = { code: string; productName: string; category: string; unitPrice: number };

function toFormValue(product?: ProductCode | null): ProductCodeFormValue {
  return {
    code: product?.code ?? "",
    productName: product?.productName ?? "",
    category: product?.category ?? "",
    unitPrice: product?.unitPrice ?? 0,
  };
}

export function ProductCodeEditForm({
  product,
  onSaved,
  onCancel,
}: {
  product: ProductCode | null;
  onSaved: (product: ProductCode) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<ProductCodeFormValue>(toFormValue(product));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(file: File | undefined) {
    if (!file) return;
    const validationError = validateProductImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const url = await uploadProductImage(product?.id ?? crypto.randomUUID(), file);
      setImageUrl(url);
    } catch {
      setError("No se pudo subir la foto. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.productName.trim() || !value.code.trim()) {
      setError("Codigo y nombre son obligatorios.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const store = getBusinessStore();
      const saved = product
        ? await store.updateProductCode(product.id, { productName: value.productName, category: value.category, unitPrice: value.unitPrice, imageUrl })
        : await store.saveProductCode({ code: value.code, productName: value.productName, category: value.category, unitPrice: value.unitPrice, imageUrl });
      onSaved(saved);
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <div className="flex items-center gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Foto del producto" className="size-20 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-md border border-dashed border-border text-xs text-foreground-muted">
            Sin foto
          </div>
        )}
        <FormField label="Foto (JPG o PNG, maximo 5MB)" hint={uploading ? "Subiendo..." : undefined}>
          <input
            type="file"
            accept="image/jpeg,image/png"
            disabled={uploading}
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </FormField>
      </div>
      <FormField label="Codigo" required>
        <Input value={value.code} disabled={Boolean(product)} onChange={(event) => setValue({ ...value, code: event.target.value })} />
      </FormField>
      <FormField label="Nombre del producto" required>
        <Input value={value.productName} onChange={(event) => setValue({ ...value, productName: event.target.value })} />
      </FormField>
      <FormField label="Categoria">
        <Input value={value.category} onChange={(event) => setValue({ ...value, category: event.target.value })} />
      </FormField>
      <FormField label="Precio">
        <CurrencyInput value={value.unitPrice} onValueChange={(unitPrice) => setValue({ ...value, unitPrice })} />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={uploading}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Tabla del catálogo**

```tsx
// apps/rotulos/src/components/product-codes-table.tsx
"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { formatCop } from "@/lib/format";
import type { ProductCode } from "@/lib/business-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Button, IconButton } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProductCodeEditForm } from "@/components/product-code-edit-form";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";

export function ProductCodesTable() {
  const [products, setProducts] = useState<ProductCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProductCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductCode | null>(null);
  const [working, setWorking] = useState(false);
  const toast = useToast();

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function refresh() {
    const items = await getBusinessStore().listProductCodes();
    setProducts(items);
  }

  function closeDrawer() {
    setEditing(null);
    setCreating(false);
  }

  function handleSaved(product: ProductCode) {
    refresh();
    closeDrawer();
    toast.push({ variant: "success", title: `${product.productName} guardado.` });
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setWorking(true);
    try {
      await getBusinessStore().deleteProductCode(pendingDelete.id);
      await refresh();
      setPendingDelete(null);
      toast.push({ variant: "success", title: "Producto eliminado del catalogo." });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo eliminar el producto." });
    } finally {
      setWorking(false);
    }
  }

  const columns: DataTableColumn<ProductCode>[] = [
    {
      key: "photo",
      header: "Foto",
      render: (product) =>
        product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt={product.productName} className="size-10 rounded-md border border-border object-cover" />
        ) : (
          <div className="size-10 rounded-md border border-dashed border-border" aria-hidden="true" />
        ),
    },
    { key: "productName", header: "Producto", render: (p) => p.productName, sortValue: (p) => p.productName },
    { key: "code", header: "Codigo", render: (p) => p.code },
    { key: "category", header: "Categoria", render: (p) => p.category || "-", sortValue: (p) => p.category },
    { key: "unitPrice", header: "Precio", align: "right", render: (p) => formatCop(p.unitPrice), sortValue: (p) => p.unitPrice },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Acciones para ${product.productName}`} size="sm" onClick={(event) => event.stopPropagation()}>
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(product)}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onSelect={() => setPendingDelete(product)}>
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar del catalogo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={products}
        getRowId={(product) => product.id}
        loading={loading}
        onRowClick={setEditing}
        searchPlaceholder="Buscar por nombre, codigo o categoria"
        searchPredicate={(product, query) =>
          product.productName.toLowerCase().includes(query) ||
          product.code.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        }
        emptyTitle="No hay productos en el catalogo todavia"
        emptyAction={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar producto
          </Button>
        }
        toolbar={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Agregar producto
          </Button>
        }
      />

      <Drawer open={editing !== null || creating} onOpenChange={(open) => !open && closeDrawer()}>
        <DrawerContent title={editing ? "Editar producto" : "Agregar producto"} description={editing?.productName}>
          <ProductCodeEditForm product={editing} onSaved={handleSaved} onCancel={closeDrawer} />
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar producto del catalogo"
        description={pendingDelete ? `Se eliminara "${pendingDelete.productName}" del catalogo. Los pedidos ya registrados con este producto no se ven afectados.` : undefined}
        confirmLabel="Eliminar"
        variant="danger"
        loading={working}
        onConfirm={handleDelete}
      />
    </>
  );
}
```

- [ ] **Step 3: Página `/catalogo`**

```tsx
// apps/rotulos/src/app/(app)/catalogo/page.tsx
import { CatalogGenerator } from "@/components/catalog-generator";
import { ProductCodesTable } from "@/components/product-codes-table";
import { PageHeading } from "@/components/ui/page-heading";

export default function CatalogPage() {
  return (
    <main className="page-shell">
      <PageHeading eyebrow="Ventas" title="Catálogo" />
      <CatalogGenerator />
      <ProductCodesTable />
    </main>
  );
}
```

(`CatalogGenerator` se implementa en la Task 9 — este archivo queda referenciándolo desde ya para no reescribir la página después.)

- [ ] **Step 4: Agregar al menú**

En `apps/rotulos/src/components/app-shell.tsx`, importar el ícono `BookImage` de `lucide-react` (agregar a la lista de imports línea 7-23) y agregar al grupo "Gestión" (línea 43-49):

```ts
      { href: "/inventario", label: "Inventario", icon: Archive },
      { href: "/catalogo", label: "Catálogo", icon: BookImage },
      { href: "/reportes", label: "Reportes", icon: BarChart3 },
```

Y en `PAGE_META` (línea 64-76):

```ts
  "/catalogo": { title: "Catálogo", description: "Productos, fotos y precios para compartir con clientes" },
```

- [ ] **Step 5: Verificar manualmente**

`npm run dev`, entrar a `/catalogo`, agregar un producto con foto, editarlo, borrarlo, confirmar que la tabla se actualiza y que el menú lateral muestra "Catálogo".

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/components/product-code-edit-form.tsx apps/rotulos/src/components/product-codes-table.tsx apps/rotulos/src/app/"(app)"/catalogo/page.tsx apps/rotulos/src/components/app-shell.tsx
git commit -m "feat(rotulos): pagina de catalogo con alta, edicion y borrado de productos"
```

---

### Task 7: Helper de agrupación por categoría

**Files:**
- Create: `apps/rotulos/src/lib/catalog.ts`
- Create: `apps/rotulos/src/__tests__/catalog.test.ts`

**Interfaces:**
- Consumes: `ProductCode` (Task 2).
- Produces: `groupProductCodesByCategory(products: ProductCode[]): { category: string; products: ProductCode[] }[]` — usado por `catalog-pdf.ts` y `catalog-image.ts`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// apps/rotulos/src/__tests__/catalog.test.ts
import { describe, expect, it } from "vitest";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";

function makeProduct(overrides: Partial<ProductCode>): ProductCode {
  return {
    id: "id",
    code: "COD",
    productName: "PRODUCTO",
    category: "",
    unitPrice: 1000,
    imageUrl: null,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupProductCodesByCategory", () => {
  it("groups by category, sorts categories and products alphabetically, and puts blank category last", () => {
    const products = [
      makeProduct({ id: "1", productName: "ZAPATO", category: "ROPA" }),
      makeProduct({ id: "2", productName: "PERFUME B", category: "FRAGANCIAS" }),
      makeProduct({ id: "3", productName: "PERFUME A", category: "FRAGANCIAS" }),
      makeProduct({ id: "4", productName: "SIN CATEGORIA", category: "" }),
    ];

    const groups = groupProductCodesByCategory(products);

    expect(groups.map((g) => g.category)).toEqual(["FRAGANCIAS", "ROPA", ""]);
    expect(groups[0].products.map((p) => p.productName)).toEqual(["PERFUME A", "PERFUME B"]);
  });

  it("returns an empty array for an empty catalog", () => {
    expect(groupProductCodesByCategory([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- catalog.test.ts`
Expected: FAIL — el módulo no existe.

- [ ] **Step 3: Implementar**

```ts
// apps/rotulos/src/lib/catalog.ts
import type { ProductCode } from "@/lib/business-types";

export type ProductCodeCategoryGroup = { category: string; products: ProductCode[] };

export function groupProductCodesByCategory(products: ProductCode[]): ProductCodeCategoryGroup[] {
  const byCategory = new Map<string, ProductCode[]>();
  for (const product of products) {
    const key = product.category.trim();
    const bucket = byCategory.get(key) ?? [];
    bucket.push(product);
    byCategory.set(key, bucket);
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    if (a === "" && b === "") return 0;
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b, "es", { sensitivity: "base" });
  });

  return categories.map((category) => ({
    category,
    products: [...(byCategory.get(category) ?? [])].sort((a, b) =>
      a.productName.localeCompare(b.productName, "es", { sensitivity: "base" }),
    ),
  }));
}
```

- [ ] **Step 4: Correr el test y verificar que pasa**

Run: `npm test -- catalog.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/rotulos/src/lib/catalog.ts apps/rotulos/src/__tests__/catalog.test.ts
git commit -m "feat(rotulos): agrupar catalogo de productos por categoria"
```

---

### Task 8: Generador de PDF del catálogo

**Files:**
- Create: `apps/rotulos/src/lib/catalog-pdf.ts`
- Create: `apps/rotulos/src/app/api/catalog/pdf/route.ts`
- Test: `apps/rotulos/src/__tests__/catalog-pdf.test.ts`

**Interfaces:**
- Consumes: `groupProductCodesByCategory` (Task 7), `ProductCode`, `LabelSettings`, `formatCop`, mismo patrón de `PdfContext`/`ensureSpace`/`drawWrapped` que `order-summary-pdf.ts`.
- Produces: `renderCatalogPdfBuffer(products: ProductCode[], settings: LabelSettings): Promise<Buffer>`, `POST /api/catalog/pdf`.

- [ ] **Step 1: Escribir el test que falla**

```ts
// apps/rotulos/src/__tests__/catalog-pdf.test.ts
import { describe, expect, it, vi } from "vitest";
import { renderCatalogPdfBuffer } from "@/lib/catalog-pdf";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

function makeProduct(overrides: Partial<ProductCode>): ProductCode {
  return {
    id: "id",
    code: "COD",
    productName: "PERFUME X",
    category: "FRAGANCIAS",
    unitPrice: 90000,
    imageUrl: null,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<LabelSettings> = {}): LabelSettings {
  return { ...defaultSettings, email: "hola@purpleshop.co", facebookUser: "@purpleshop", ...overrides };
}

describe("renderCatalogPdfBuffer", () => {
  it("renders a PDF with an empty catalog without throwing", async () => {
    const buffer = await renderCatalogPdfBuffer([], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("renders a PDF for products without photos", async () => {
    const buffer = await renderCatalogPdfBuffer([makeProduct({})], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("falls back to a placeholder when a product photo fails to download", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const buffer = await renderCatalogPdfBuffer([makeProduct({ imageUrl: "https://x.test/foto.png" })], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Correr el test y verificar que falla**

Run: `npm test -- catalog-pdf.test.ts`
Expected: FAIL — el módulo no existe.

- [ ] **Step 3: Implementar `catalog-pdf.ts`**

```ts
// apps/rotulos/src/lib/catalog-pdf.ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { formatCop } from "@/lib/format";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const HEADER_HEIGHT = 160;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLUMNS = 3;
const CARD_GAP = 14;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (COLUMNS - 1)) / COLUMNS;
const PHOTO_HEIGHT = CARD_WIDTH * 0.8;
const CARD_HEIGHT = PHOTO_HEIGHT + 46;

const PURPLE_900 = rgb(0.298, 0.114, 0.584);
const PURPLE_600 = rgb(0.486, 0.227, 0.929);
const PURPLE_100 = rgb(0.929, 0.914, 0.996);
const PURPLE_50 = rgb(0.961, 0.953, 1);
const BORDER = rgb(0.894, 0.875, 0.949);
const TEXT_COLOR = rgb(0.086, 0.071, 0.122);
const MUTED_COLOR = rgb(0.388, 0.365, 0.447);
const WHITE = rgb(1, 1, 1);

function sanitize(value: string): string {
  return value.normalize("NFKD").replace(/[^\x20-\x7E]/g, "");
}

type PdfContext = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  logo: PDFImage | null;
  y: number;
  column: number;
};

async function createContext(): Promise<Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">> {
  const doc = await PDFDocument.create();
  const [font, boldFont] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold)]);
  let logo: PDFImage | null = null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "purple-shop-logo.png"));
    logo = await doc.embedPng(bytes);
  } catch {
    logo = null;
  }
  return { doc, font, boldFont, logo };
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

async function embedProductImage(doc: PDFDocument, url: string | null): Promise<PDFImage | null> {
  if (!url) return null;
  const bytes = await fetchImageBytes(url);
  if (!bytes) return null;
  const isPng = bytes.length > 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  try {
    return isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

function newPage(ctx: Pick<PdfContext, "doc" | "font" | "boldFont" | "logo">): PdfContext {
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  return { ...ctx, page, y: PAGE_HEIGHT - MARGIN, column: 0 };
}

function drawCoverHeader(ctx: PdfContext, settings: LabelSettings): PdfContext {
  ctx.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT, width: PAGE_WIDTH, height: HEADER_HEIGHT, color: PURPLE_600 });

  const logoSize = 56;
  const logoY = PAGE_HEIGHT - HEADER_HEIGHT / 2 - logoSize / 2;
  if (ctx.logo) ctx.page.drawImage(ctx.logo, { x: MARGIN, y: logoY, width: logoSize, height: logoSize });

  const textX = MARGIN + (ctx.logo ? logoSize + 16 : 0);
  ctx.page.drawText("CATALOGO", { x: textX, y: PAGE_HEIGHT - 52, size: 22, font: ctx.boldFont, color: WHITE });
  ctx.page.drawText(sanitize(settings.brandPhrase).toUpperCase(), { x: textX, y: PAGE_HEIGHT - 74, size: 10, font: ctx.font, color: PURPLE_100 });

  const contactLines = [
    settings.defaultSender.phone ? `WhatsApp: ${settings.defaultSender.phone}` : "",
    settings.instagramUser ? `Instagram: ${settings.instagramUser}` : "",
    settings.facebookUser ? `Facebook: ${settings.facebookUser}` : "",
    settings.tiktokUser ? `TikTok: ${settings.tiktokUser}` : "",
    settings.email ? `Correo: ${settings.email}` : "",
  ].filter(Boolean);

  let contactY = PAGE_HEIGHT - HEADER_HEIGHT + 34;
  for (const line of contactLines) {
    ctx.page.drawText(sanitize(line), { x: textX, y: contactY, size: 9.5, font: ctx.font, color: WHITE });
    contactY -= 15;
  }

  return { ...ctx, y: PAGE_HEIGHT - HEADER_HEIGHT - 30, column: 0 };
}

function drawCategoryTitle(ctx: PdfContext, category: string): PdfContext {
  let next = ctx;
  if (next.column !== 0) next = { ...newPage(next), column: 0 };
  if (next.y - 26 < MARGIN) next = newPage(next);
  next.page.drawText(sanitize(category || "OTROS"), { x: MARGIN, y: next.y - 16, size: 13, font: next.boldFont, color: PURPLE_900 });
  return { ...next, y: next.y - 30, column: 0 };
}

async function drawProductCard(ctx: PdfContext, product: ProductCode): Promise<PdfContext> {
  let next = ctx;
  if (next.y - CARD_HEIGHT < MARGIN) next = { ...newPage(next), column: 0 };

  const cardX = MARGIN + next.column * (CARD_WIDTH + CARD_GAP);
  const cardTop = next.y;

  next.page.drawRectangle({
    x: cardX,
    y: cardTop - CARD_HEIGHT,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    color: PURPLE_50,
    borderColor: BORDER,
    borderWidth: 1,
  });

  const image = await embedProductImage(next.doc, product.imageUrl);
  const photoY = cardTop - PHOTO_HEIGHT - 6;
  if (image) {
    const scale = Math.min(CARD_WIDTH / image.width, PHOTO_HEIGHT / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    next.page.drawImage(image, { x: cardX + (CARD_WIDTH - width) / 2, y: photoY + (PHOTO_HEIGHT - height) / 2, width, height });
  } else {
    next.page.drawRectangle({ x: cardX + 6, y: photoY, width: CARD_WIDTH - 12, height: PHOTO_HEIGHT, color: PURPLE_100 });
    const label = "SIN FOTO";
    const width = next.font.widthOfTextAtSize(label, 8);
    next.page.drawText(label, { x: cardX + (CARD_WIDTH - width) / 2, y: photoY + PHOTO_HEIGHT / 2 - 3, size: 8, font: next.font, color: MUTED_COLOR });
  }

  const name = sanitize(product.productName);
  next.page.drawText(name.length > 26 ? `${name.slice(0, 26)}...` : name, {
    x: cardX + 8,
    y: cardTop - CARD_HEIGHT + 28,
    size: 9.5,
    font: next.boldFont,
    color: TEXT_COLOR,
  });
  next.page.drawText(formatCop(product.unitPrice), {
    x: cardX + 8,
    y: cardTop - CARD_HEIGHT + 12,
    size: 10,
    font: next.boldFont,
    color: PURPLE_900,
  });

  const column = (next.column + 1) % COLUMNS;
  const y = column === 0 ? next.y - CARD_HEIGHT - CARD_GAP : next.y;
  return { ...next, column, y };
}

export async function renderCatalogPdfBuffer(products: ProductCode[], settings: LabelSettings): Promise<Buffer> {
  const base = await createContext();
  let ctx = drawCoverHeader(newPage(base), settings);

  const groups = groupProductCodesByCategory(products);
  if (groups.length === 0) {
    ctx.page.drawText("Aun no hay productos en el catalogo.", { x: MARGIN, y: ctx.y - 14, size: 11, font: ctx.font, color: MUTED_COLOR });
  }

  for (const group of groups) {
    ctx = drawCategoryTitle(ctx, group.category);
    for (const product of group.products) {
      ctx = await drawProductCard(ctx, product);
    }
    if (ctx.column !== 0) ctx = { ...ctx, column: 0, y: ctx.y - CARD_HEIGHT - CARD_GAP };
  }

  const bytes = await ctx.doc.save();
  return Buffer.from(bytes);
}
```

- [ ] **Step 4: Correr los tests y verificar que pasan**

Run: `npm test -- catalog-pdf.test.ts`
Expected: PASS

- [ ] **Step 5: API route**

```ts
// apps/rotulos/src/app/api/catalog/pdf/route.ts
import { NextRequest } from "next/server";
import { renderCatalogPdfBuffer } from "@/lib/catalog-pdf";
import { requireSession } from "@/lib/require-session";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

export const runtime = "nodejs";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isValidProduct(value: unknown): value is ProductCode {
  return isObject(value) && typeof value.productName === "string" && typeof value.unitPrice === "number";
}

function isValidSettings(value: unknown): value is LabelSettings {
  return isObject(value) && isObject(value.defaultSender);
}

export async function POST(request: NextRequest) {
  const session = await requireSession();
  if (!session) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!isObject(payload) || !Array.isArray(payload.products) || !payload.products.every(isValidProduct) || !isValidSettings(payload.settings)) {
    return Response.json({ error: "invalid_payload" }, { status: 400 });
  }

  const pdf = await renderCatalogPdfBuffer(payload.products, payload.settings);
  const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="catalogo-purple-shop.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/rotulos/src/lib/catalog-pdf.ts apps/rotulos/src/app/api/catalog/pdf/route.ts apps/rotulos/src/__tests__/catalog-pdf.test.ts
git commit -m "feat(rotulos): generar PDF del catalogo de productos"
```

---

### Task 9: Imagen para WhatsApp y botones de descarga/envío

Sigue el mismo patrón que `order-summary-image.ts`; no se agrega test de canvas porque el repo tampoco lo hace para `order-summary-image.ts` (jsdom no simula `canvas.toBlob` de forma útil) — la cobertura de la lógica de agrupación ya vive en `catalog.test.ts` (Task 7).

**Files:**
- Create: `apps/rotulos/src/lib/catalog-image.ts`
- Create: `apps/rotulos/src/components/catalog-generator.tsx`

**Interfaces:**
- Consumes: `groupProductCodesByCategory` (Task 7), `downloadBlob`-equivalent, `buildWhatsAppLink` (`@/lib/whatsapp`), `getBusinessStore().listProductCodes()`, `getLabelStore().getSettings()`.
- Produces: `renderCatalogImage(products: ProductCode[], settings: LabelSettings): Promise<Blob>`, `<CatalogGenerator />`.

- [ ] **Step 1: Implementar `catalog-image.ts`**

```ts
// apps/rotulos/src/lib/catalog-image.ts
"use client";

import { formatCop } from "@/lib/format";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";

const WIDTH = 720;
const MARGIN = 28;
const HEADER_HEIGHT = 150;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;
const COLUMNS = 2;
const CARD_GAP = 16;
const CARD_WIDTH = (CONTENT_WIDTH - CARD_GAP * (COLUMNS - 1)) / COLUMNS;
const PHOTO_HEIGHT = CARD_WIDTH * 0.8;
const CARD_HEIGHT = PHOTO_HEIGHT + 56;
const EXPORT_SCALE = 2;

const COLORS = {
  purple900: "#4C1D95",
  purple600: "#7C3AED",
  purple100: "#EDE9FE",
  purple50: "#F5F3FF",
  border: "#E4DFF2",
  text: "#16121F",
  muted: "#635D72",
  white: "#FFFFFF",
};

const FONT_FAMILY = "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
const boldFont = (size: number) => `700 ${size}px ${FONT_FAMILY}`;
const regularFont = (size: number) => `400 ${size}px ${FONT_FAMILY}`;

function loadImage(url: string | null): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function computeHeight(products: ProductCode[]): number {
  const groups = groupProductCodesByCategory(products);
  let height = HEADER_HEIGHT + 30;
  for (const group of groups) {
    height += 34;
    const rows = Math.ceil(group.products.length / COLUMNS);
    height += rows * (CARD_HEIGHT + CARD_GAP);
  }
  return Math.max(height, HEADER_HEIGHT + 80);
}

export async function renderCatalogImage(products: ProductCode[], settings: LabelSettings): Promise<Blob> {
  const height = computeHeight(products);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * EXPORT_SCALE;
  canvas.height = height * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unsupported");
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, WIDTH, height);

  ctx.fillStyle = COLORS.purple600;
  ctx.fillRect(0, 0, WIDTH, HEADER_HEIGHT);
  ctx.fillStyle = COLORS.white;
  ctx.font = boldFont(24);
  ctx.textAlign = "left";
  ctx.fillText("CATALOGO", MARGIN, 46);
  ctx.font = regularFont(11);
  ctx.fillText(settings.brandPhrase.toUpperCase(), MARGIN, 68);

  const contactLines = [
    settings.defaultSender.phone ? `WhatsApp: ${settings.defaultSender.phone}` : "",
    settings.instagramUser ? `Instagram: ${settings.instagramUser}` : "",
    settings.facebookUser ? `Facebook: ${settings.facebookUser}` : "",
    settings.tiktokUser ? `TikTok: ${settings.tiktokUser}` : "",
    settings.email ? `Correo: ${settings.email}` : "",
  ].filter(Boolean);
  let contactY = 92;
  for (const line of contactLines) {
    ctx.fillText(line, MARGIN, contactY);
    contactY += 16;
  }

  let y = HEADER_HEIGHT + 30;
  const groups = groupProductCodesByCategory(products);

  if (groups.length === 0) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = regularFont(13);
    ctx.fillText("Aun no hay productos en el catalogo.", MARGIN, y);
  }

  for (const group of groups) {
    ctx.fillStyle = COLORS.purple900;
    ctx.font = boldFont(15);
    ctx.fillText(group.category || "OTROS", MARGIN, y);
    y += 24;

    for (let index = 0; index < group.products.length; index += 1) {
      const product = group.products[index];
      const column = index % COLUMNS;
      if (column === 0 && index > 0) y += CARD_HEIGHT + CARD_GAP;
      const cardX = MARGIN + column * (CARD_WIDTH + CARD_GAP);
      const cardTop = y;

      ctx.fillStyle = COLORS.purple50;
      ctx.strokeStyle = COLORS.border;
      ctx.fillRect(cardX, cardTop, CARD_WIDTH, CARD_HEIGHT);
      ctx.strokeRect(cardX, cardTop, CARD_WIDTH, CARD_HEIGHT);

      const image = await loadImage(product.imageUrl);
      const photoY = cardTop + 8;
      if (image) {
        const scale = Math.min(CARD_WIDTH / image.width, PHOTO_HEIGHT / image.height);
        const width = image.width * scale;
        const drawHeight = image.height * scale;
        ctx.drawImage(image, cardX + (CARD_WIDTH - width) / 2, photoY + (PHOTO_HEIGHT - drawHeight) / 2, width, drawHeight);
      } else {
        ctx.fillStyle = COLORS.purple100;
        ctx.fillRect(cardX + 6, photoY, CARD_WIDTH - 12, PHOTO_HEIGHT);
        ctx.fillStyle = COLORS.muted;
        ctx.font = regularFont(10);
        ctx.textAlign = "center";
        ctx.fillText("SIN FOTO", cardX + CARD_WIDTH / 2, photoY + PHOTO_HEIGHT / 2);
        ctx.textAlign = "left";
      }

      ctx.fillStyle = COLORS.text;
      ctx.font = boldFont(12);
      const name = product.productName.length > 30 ? `${product.productName.slice(0, 30)}...` : product.productName;
      ctx.fillText(name, cardX + 10, photoY + PHOTO_HEIGHT + 20);
      ctx.fillStyle = COLORS.purple900;
      ctx.font = boldFont(13);
      ctx.fillText(formatCop(product.unitPrice), cardX + 10, photoY + PHOTO_HEIGHT + 40);
    }
    y += CARD_HEIGHT + CARD_GAP;
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob_failed"));
    }, "image/png");
  });
}
```

- [ ] **Step 2: Componente de descarga/envío**

```tsx
// apps/rotulos/src/components/catalog-generator.tsx
"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, MessageCircle } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { renderCatalogImage } from "@/lib/catalog-image";
import { downloadBlob } from "@/lib/order-summary-image";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function CatalogGenerator() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const toast = useToast();

  async function loadCatalogData() {
    const [products, settings] = await Promise.all([
      getBusinessStore().listProductCodes(),
      getLabelStore().getSettings(),
    ]);
    return { products, settings };
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const { products, settings } = await loadCatalogData();
      const response = await fetch("/api/catalog/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, settings }),
      });
      if (!response.ok) throw new Error("pdf_failed");
      const blob = await response.blob();
      await downloadBlob(blob, "catalogo-purple-shop.pdf");
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar el PDF del catalogo." });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDownloadImage() {
    setDownloadingImage(true);
    try {
      const { products, settings } = await loadCatalogData();
      const blob = await renderCatalogImage(products, settings);
      await downloadBlob(blob, "catalogo-purple-shop.png");
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar la imagen del catalogo." });
    } finally {
      setDownloadingImage(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Button onClick={handleDownloadPdf} loading={downloadingPdf}>
        <Download className="size-4" aria-hidden="true" />
        Descargar PDF
      </Button>
      <Button variant="secondary" onClick={handleDownloadImage} loading={downloadingImage}>
        <ImageIcon className="size-4" aria-hidden="true" />
        Descargar imagen
      </Button>
      <Button variant="secondary" asChild>
        <a href={buildWhatsAppLink("", "Hola! Te comparto nuestro catalogo de productos.")} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" aria-hidden="true" />
          Abrir WhatsApp
        </a>
      </Button>
    </Card>
  );
}
```

(El botón de WhatsApp abre el chat con el texto — descargar la imagen/PDF y adjuntarla es manual, igual que hoy con el resumen de compra: WhatsApp Web no permite adjuntar archivos por enlace.)

- [ ] **Step 3: Verificar manualmente**

`npm run dev`, en `/catalogo` con al menos un producto con foto y otro sin foto: descargar PDF y abrirlo (fotos correctas, placeholder "SIN FOTO" donde falta), descargar imagen y abrirla, click en "Abrir WhatsApp" y confirmar que abre con el texto prellenado.

- [ ] **Step 4: Commit**

```bash
git add apps/rotulos/src/lib/catalog-image.ts apps/rotulos/src/components/catalog-generator.tsx
git commit -m "feat(rotulos): generar imagen del catalogo y botones de descarga/whatsapp"
```

---

### Task 10: Validación final

**Files:** ninguno (solo comandos).

- [ ] **Step 1: Suite completa**

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected: los 4 en verde.

- [ ] **Step 2: Prueba manual end-to-end**

En `/catalogo`: agregar 2-3 productos (con y sin foto, en al menos 2 categorías), generar PDF e imagen, confirmar que ambos muestran portada con datos de contacto, agrupación por categoría y precios correctos. En `Configuración`, confirmar que Facebook/TikTok/correo se guardan y aparecen en el catálogo generado.

- [ ] **Step 3: Cerrar el ciclo**

Si Edwing no dice lo contrario: commit final si queda algo suelto, `git push`, y deploy (`vercel deploy --prod` o el flujo de auto-deploy por push a `main` ya vigente desde 2026-07-26).
