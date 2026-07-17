"use client";

import { useEffect, useMemo, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product } from "@/lib/inventory-types";

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Cargando productos...");

  useEffect(() => {
    getInventoryStore().listProducts()
      .then((items) => {
        setProducts(items);
        setStatus(items.length ? "" : "No hay productos en el inventario todavia.");
      })
      .catch(() => setStatus("No se pudieron cargar los productos."));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(needle) ||
      product.sku.toLowerCase().includes(needle) ||
      product.category.toLowerCase().includes(needle),
    );
  }, [products, query]);

  function stockLabel(product: Product): string | null {
    if (product.currentStock === 0) return "Stock critico";
    if (product.currentStock <= product.minStock) return "Stock bajo";
    if (product.maxStock !== null && product.currentStock > product.maxStock) return "Exceso de stock";
    return null;
  }

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar producto</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p role="status">{status}</p>
      <div className="history-table">
        <div className="business-row business-head">
          <span>Producto</span><span>SKU</span><span>Categoria</span><span>Precio</span><span>Stock</span><span>Alerta</span>
        </div>
        {filtered.map((product) => {
          const alert = stockLabel(product);
          return (
            <div className="business-row" key={product.id}>
              <span>{product.name}</span>
              <span>{product.sku}</span>
              <span>{product.category}</span>
              <span>{formatCop(product.unitPrice)}</span>
              <span>{product.currentStock}</span>
              <span>{alert ?? "-"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
