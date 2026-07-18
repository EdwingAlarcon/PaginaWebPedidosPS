"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import type { Product, StockMovementType } from "@/lib/inventory-types";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "ajuste", label: "Ajuste" },
  { value: "transferencia", label: "Transferencia" },
];

export function StockMovementForm({ onSaved }: { onSaved: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockMovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getInventoryStore().listProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await getInventoryStore().recordMovement({
        productId,
        type,
        quantity: Number(quantity) || 0,
        reason,
        supplier,
      });
      setQuantity("");
      setReason("");
      setSupplier("");
      onSaved();
    } catch (movementError) {
      setError(
        movementError instanceof Error && movementError.message === "stock_insuficiente"
          ? "Stock insuficiente para esa salida."
          : "No se pudo registrar el movimiento.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      <FormField label="Producto" required>
        <Select value={productId} onChange={(event) => setProductId(event.target.value)} required>
          <option value="" disabled>
            Selecciona un producto
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Tipo de movimiento">
        <Select value={type} onChange={(event) => setType(event.target.value as StockMovementType)}>
          {MOVEMENT_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Cantidad" required>
        <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
      </FormField>
      <FormField label="Motivo">
        <Input value={reason} onChange={(event) => setReason(event.target.value)} />
      </FormField>
      <FormField label="Proveedor">
        <Input value={supplier} onChange={(event) => setSupplier(event.target.value)} />
      </FormField>
      <Button type="submit" loading={saving} className="mt-2">
        Registrar movimiento
      </Button>
    </form>
  );
}
