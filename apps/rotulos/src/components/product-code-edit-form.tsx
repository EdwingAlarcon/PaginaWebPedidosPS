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
