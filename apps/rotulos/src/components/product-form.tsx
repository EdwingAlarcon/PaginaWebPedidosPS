"use client";

import { useState, type FormEvent } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ProductForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState(0);
  const [minStock, setMinStock] = useState("5");
  const [maxStock, setMaxStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await getInventoryStore().saveProduct({
        name,
        category,
        sku,
        unitPrice,
        minStock: Number(minStock) || 0,
        maxStock: maxStock ? Number(maxStock) : null,
      });
      setName("");
      setCategory("");
      setSku("");
      setUnitPrice(0);
      setMinStock("5");
      setMaxStock("");
      onSaved();
    } catch {
      setError("No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <FormField label="Nombre del producto" required>
        <Input value={name} onChange={(event) => setName(event.target.value)} required />
      </FormField>
      <FormField label="Categoria" required>
        <Input value={category} onChange={(event) => setCategory(event.target.value)} required />
      </FormField>
      <FormField label="SKU">
        <Input value={sku} onChange={(event) => setSku(event.target.value)} />
      </FormField>
      <FormField label="Precio" required>
        <CurrencyInput value={unitPrice} onValueChange={setUnitPrice} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Stock minimo">
          <Input type="number" value={minStock} onChange={(event) => setMinStock(event.target.value)} />
        </FormField>
        <FormField label="Stock maximo">
          <Input type="number" value={maxStock} onChange={(event) => setMaxStock(event.target.value)} />
        </FormField>
      </div>
      <Button type="submit" loading={saving} className="mt-2">
        Guardar producto
      </Button>
    </form>
  );
}
