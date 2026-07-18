"use client";

import { useEffect, useState } from "react";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product } from "@/lib/inventory-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

function stockAlert(product: Product): { label: string; variant: "warning" | "danger" | "primary" } | null {
  if (product.currentStock === 0) return { label: "Stock critico", variant: "danger" };
  if (product.currentStock <= product.minStock) return { label: "Stock bajo", variant: "warning" };
  if (product.maxStock !== null && product.currentStock > product.maxStock) {
    return { label: "Exceso de stock", variant: "primary" };
  }
  return null;
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Cargando productos...");

  useEffect(() => {
    getInventoryStore()
      .listProducts()
      .then((items) => {
        setProducts(items);
        setStatus(items.length ? "" : "No hay productos en el inventario todavia.");
      })
      .catch(() => setStatus("No se pudieron cargar los productos."))
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<Product>[] = [
    { key: "name", header: "Producto", render: (p) => p.name, sortValue: (p) => p.name },
    { key: "sku", header: "SKU", render: (p) => p.sku || "-" },
    { key: "category", header: "Categoria", render: (p) => p.category },
    {
      key: "price",
      header: "Precio",
      render: (p) => formatCop(p.unitPrice),
      sortValue: (p) => p.unitPrice,
      align: "right",
    },
    {
      key: "stock",
      header: "Stock",
      render: (p) => p.currentStock,
      sortValue: (p) => p.currentStock,
      align: "right",
    },
    {
      key: "alert",
      header: "Alerta",
      render: (p) => {
        const alert = stockAlert(p);
        return alert ? <Badge variant={alert.variant}>{alert.label}</Badge> : <span className="text-foreground-muted">-</span>;
      },
    },
  ];

  return (
    <>
      <p role="status" className="sr-only">
        {status}
      </p>
      <DataTable
        columns={columns}
        data={products}
        getRowId={(product) => product.id}
        loading={loading}
        searchPlaceholder="Buscar por nombre, SKU o categoria"
        searchPredicate={(product, query) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        }
        emptyTitle="No hay productos todavia"
        emptyDescription="Agrega tu primer producto para empezar a llevar el inventario."
      />
    </>
  );
}
