"use client";

import { useState } from "react";
import { ProductsTable } from "@/components/products-table";
import { StockMovementForm } from "@/components/stock-movement-form";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Control de stock</p>
        <h1>Inventario</h1>
      </div>
      <StockMovementForm onSaved={() => setRefreshKey((key) => key + 1)} />
      <ProductsTable key={refreshKey} />
    </main>
  );
}
