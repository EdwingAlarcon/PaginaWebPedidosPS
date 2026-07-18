"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ProductsTable } from "@/components/products-table";
import { ProductForm } from "@/components/product-form";
import { StockMovementForm } from "@/components/stock-movement-form";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product, StockMovement } from "@/lib/inventory-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [movementDrawerOpen, setMovementDrawerOpen] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getInventoryStore().listMovements().then(setMovements).catch(() => setMovements([]));
    getInventoryStore().listProducts().then(setProducts).catch(() => setProducts([]));
  }, [refreshKey]);

  function handleSaved() {
    setRefreshKey((key) => key + 1);
    setProductDrawerOpen(false);
    setMovementDrawerOpen(false);
  }

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "Producto eliminado";
  const lowStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock);
  const outOfStock = products.filter((p) => p.currentStock === 0);
  const overstocked = products.filter((p) => p.maxStock !== null && p.currentStock > p.maxStock);

  return (
    <main className="page-shell">
      <div className="page-heading">
        <p>Control de stock</p>
        <h1>Inventario</h1>
      </div>

      <Tabs defaultValue="productos">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="alertas">
              Alertas
              {lowStock.length + outOfStock.length > 0 ? (
                <Badge variant="danger" className="ml-1.5">
                  {lowStock.length + outOfStock.length}
                </Badge>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="productos">
          <div className="mb-3 flex justify-end">
            <Drawer open={productDrawerOpen} onOpenChange={setProductDrawerOpen}>
              <DrawerTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  Nuevo producto
                </Button>
              </DrawerTrigger>
              <DrawerContent title="Nuevo producto" description="Agrega un producto al inventario.">
                <ProductForm onSaved={handleSaved} />
              </DrawerContent>
            </Drawer>
          </div>
          <ProductsTable key={refreshKey} />
        </TabsContent>

        <TabsContent value="movimientos">
          <div className="mb-3 flex justify-end">
            <Drawer open={movementDrawerOpen} onOpenChange={setMovementDrawerOpen}>
              <DrawerTrigger asChild>
                <Button size="sm">
                  <Plus className="size-4" aria-hidden="true" />
                  Registrar movimiento
                </Button>
              </DrawerTrigger>
              <DrawerContent title="Registrar movimiento" description="Registra una entrada, salida o ajuste de stock.">
                <StockMovementForm onSaved={handleSaved} />
              </DrawerContent>
            </Drawer>
          </div>
          <Card>
            <CardTitle>Movimientos recientes</CardTitle>
            {movements.length === 0 ? (
              <EmptyState
                title="No hay movimientos todavia"
                description="Los movimientos de entrada, salida o ajuste apareceran aqui."
                className="mt-4"
              />
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {movements.slice(0, 15).map((movement) => (
                  <li key={movement.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <span className="text-foreground">{productName(movement.productId)}</span>
                      <span className="ml-2 text-foreground-muted">{movement.reason || "-"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={movement.type === "salida" ? "danger" : "success"}>{movement.type}</Badge>
                      <span className="font-medium text-foreground">{movement.quantity}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardTitle>Sin stock</CardTitle>
              {outOfStock.length === 0 ? (
                <p className="mt-3 text-sm text-foreground-muted">No hay productos sin stock.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {outOfStock.map((product) => (
                    <li key={product.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{product.name}</span>
                      <Badge variant="danger">0 unidades</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardTitle>Bajo stock</CardTitle>
              {lowStock.length === 0 ? (
                <p className="mt-3 text-sm text-foreground-muted">No hay productos con bajo stock.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {lowStock.map((product) => (
                    <li key={product.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{product.name}</span>
                      <Badge variant="warning">{product.currentStock} unidades</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardTitle>Exceso de stock</CardTitle>
              {overstocked.length === 0 ? (
                <p className="mt-3 text-sm text-foreground-muted">No hay productos con exceso de stock.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {overstocked.map((product) => (
                    <li key={product.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{product.name}</span>
                      <Badge variant="primary">
                        {product.currentStock} / {product.maxStock} {formatCop(product.unitPrice)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
