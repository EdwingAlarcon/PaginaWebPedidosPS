"use client";

import { useEffect, useState } from "react";
import { History, MoreHorizontal, Trash2 } from "lucide-react";
import { getInventoryStore } from "@/lib/inventory-store";
import { formatCop } from "@/lib/format";
import type { Product, StockMovement } from "@/lib/inventory-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

function stockAlert(product: Product): { label: string; variant: "warning" | "danger" | "primary" } | null {
  if (product.currentStock === 0) return { label: "Stock critico", variant: "danger" };
  if (product.currentStock <= product.minStock) return { label: "Stock bajo", variant: "warning" };
  if (product.maxStock !== null && product.currentStock > product.maxStock) {
    return { label: "Exceso de stock", variant: "primary" };
  }
  return null;
}

export function ProductsTable({
  initialQuery,
  onProductDeleted,
}: { initialQuery?: string; onProductDeleted?: () => void } = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Cargando productos...");
  const [movementsProduct, setMovementsProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

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

  useEffect(() => {
    if (!movementsProduct) return;
    getInventoryStore()
      .listMovements(movementsProduct.id)
      .then(setMovements)
      .catch(() => setMovements([]))
      .finally(() => setMovementsLoading(false));
  }, [movementsProduct]);

  function openMovements(product: Product) {
    setMovementsLoading(true);
    setMovementsProduct(product);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await getInventoryStore().deleteProduct(pendingDelete.id);
      setProducts((current) => current.filter((p) => p.id !== pendingDelete.id));
      toast.push({ variant: "success", title: `${pendingDelete.name} eliminado.` });
      setPendingDelete(null);
      onProductDeleted?.();
    } catch {
      toast.push({ variant: "danger", title: "No se pudo eliminar el producto." });
    } finally {
      setDeleting(false);
    }
  }

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
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Acciones para ${product.name}`} size="sm">
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => openMovements(product)}>
              <History className="size-4" aria-hidden="true" />
              Ver movimientos
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setPendingDelete(product)}
              className="text-danger data-[highlighted]:bg-[var(--danger-soft)]"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar producto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
        initialQuery={initialQuery}
        searchPlaceholder="Buscar por nombre, SKU o categoria"
        searchPredicate={(product, query) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        }
        emptyTitle="No hay productos todavia"
        emptyDescription="Agrega tu primer producto para empezar a llevar el inventario."
      />

      <Drawer open={movementsProduct !== null} onOpenChange={(open) => !open && setMovementsProduct(null)}>
        <DrawerContent
          title="Historial de movimientos"
          description={movementsProduct ? movementsProduct.name : undefined}
        >
          {movementsLoading ? (
            <p className="text-sm text-foreground-muted">Cargando movimientos...</p>
          ) : movements.length === 0 ? (
            <EmptyState
              title="Sin movimientos todavia"
              description="Las entradas, salidas y ajustes de este producto apareceran aqui."
            />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <span className="block font-medium text-foreground">
                      {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(
                        new Date(movement.createdAt),
                      )}
                    </span>
                    <span className="text-foreground-muted">{movement.reason || movement.supplier || "-"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={movement.type === "salida" ? "danger" : "success"}>{movement.type}</Badge>
                    <span className="font-medium text-foreground">{movement.quantity}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DrawerContent>
      </Drawer>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar producto"
        description={
          pendingDelete
            ? `Esta accion eliminara "${pendingDelete.name}" del inventario de forma permanente. El historial de movimientos ya registrado no se vera afectado.`
            : undefined
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
