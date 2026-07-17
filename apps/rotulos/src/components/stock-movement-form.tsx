"use client";

import { useEffect, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import type { Product, StockMovementType } from "@/lib/inventory-types";

export function StockMovementForm({ onSaved }: { onSaved: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [sku, setSku] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [maxStock, setMaxStock] = useState("");

  const [productId, setProductId] = useState("");
  const [type, setType] = useState<StockMovementType>("entrada");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    getInventoryStore().listProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  async function handleCreateProduct(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await getInventoryStore().saveProduct({
        name,
        category,
        sku,
        unitPrice: Number(unitPrice) || 0,
        minStock: Number(minStock) || 0,
        maxStock: maxStock ? Number(maxStock) : null,
      });
      setName(""); setCategory(""); setSku(""); setUnitPrice(""); setMinStock("5"); setMaxStock("");
      setProducts(await getInventoryStore().listProducts());
      onSaved();
    } catch {
      setStatus("No se pudo guardar el producto.");
    }
  }

  async function handleRecordMovement(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");
    try {
      await getInventoryStore().recordMovement({
        productId,
        type,
        quantity: Number(quantity) || 0,
        reason,
        supplier,
      });
      setQuantity(""); setReason(""); setSupplier("");
      onSaved();
    } catch (error) {
      setStatus(error instanceof Error && error.message === "stock_insuficiente" ? "Stock insuficiente para esa salida." : "No se pudo registrar el movimiento.");
    }
  }

  return (
    <div className="business-forms-grid">
      <form className="panel" onSubmit={handleCreateProduct}>
        <div className="panel-title">Nuevo producto</div>
        <label className="field">
          <span>Nombre del producto</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Categoria</span>
          <input value={category} onChange={(event) => setCategory(event.target.value)} required />
        </label>
        <label className="field">
          <span>SKU</span>
          <input value={sku} onChange={(event) => setSku(event.target.value)} />
        </label>
        <label className="field">
          <span>Precio</span>
          <input type="number" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} required />
        </label>
        <label className="field">
          <span>Stock minimo</span>
          <input type="number" value={minStock} onChange={(event) => setMinStock(event.target.value)} />
        </label>
        <label className="field">
          <span>Stock maximo</span>
          <input type="number" value={maxStock} onChange={(event) => setMaxStock(event.target.value)} />
        </label>
        <button type="submit" className="primary-action">Guardar producto</button>
      </form>
      <form className="panel" onSubmit={handleRecordMovement}>
        <div className="panel-title">Registrar movimiento</div>
        <label className="field">
          <span>Producto</span>
          <select value={productId} onChange={(event) => setProductId(event.target.value)} required>
            <option value="" disabled>Selecciona un producto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo de movimiento</span>
          <select value={type} onChange={(event) => setType(event.target.value as StockMovementType)}>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
        <label className="field">
          <span>Cantidad</span>
          <input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="field">
          <span>Motivo</span>
          <input value={reason} onChange={(event) => setReason(event.target.value)} />
        </label>
        <label className="field">
          <span>Proveedor</span>
          <input value={supplier} onChange={(event) => setSupplier(event.target.value)} />
        </label>
        <button type="submit" className="primary-action">Registrar movimiento</button>
      </form>
      {status && <p role="alert">{status}</p>}
    </div>
  );
}
