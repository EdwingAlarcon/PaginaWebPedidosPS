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
