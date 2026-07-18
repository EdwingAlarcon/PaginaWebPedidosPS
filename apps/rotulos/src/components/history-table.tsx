"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Printer, Copy, Pencil, Trash2, Download } from "lucide-react";
import { getLabelStore } from "@/lib/label-store";
import type { LabelRecord } from "@/lib/types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { LabelStatusBadge } from "@/components/ui/badge";
import { Button, IconButton } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

export function HistoryTable({ labels }: { labels: LabelRecord[] }) {
  const [tableLabels, setTableLabels] = useState(labels);
  const [pendingDelete, setPendingDelete] = useState<LabelRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getLabelStore().listLabels().then(setTableLabels);
  }, []);

  async function duplicateLabel(id: string) {
    const store = getLabelStore();
    const draft = await store.duplicateLabel(id);
    if (!draft) {
      toast.push({ variant: "danger", title: "No se pudo duplicar la etiqueta." });
      return;
    }
    const duplicate = await store.saveLabel(draft, await store.getSettings());
    setTableLabels(await store.listLabels());
    toast.push({ variant: "success", title: `Etiqueta ${duplicate.orderNumber} duplicada.` });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    await getLabelStore().deleteLabel(pendingDelete.id);
    setTableLabels((current) => current.filter((label) => label.id !== pendingDelete.id));
    toast.push({ variant: "success", title: "Etiqueta eliminada." });
    setDeleting(false);
    setPendingDelete(null);
  }

  async function downloadPdf(label: LabelRecord) {
    const settings = await getLabelStore().getSettings();
    const response = await fetch("/api/labels/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, settings }),
    });
    if (!response.ok) {
      toast.push({ variant: "danger", title: "No se pudo generar el PDF." });
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rotulo-${label.orderNumber || "purpleshop"}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.push({ variant: "success", title: `PDF ${label.orderNumber} descargado.` });
  }

  const columns: DataTableColumn<LabelRecord>[] = [
    { key: "customer", header: "Cliente", render: (l) => l.recipient.fullName, sortValue: (l) => l.recipient.fullName },
    { key: "phone", header: "Telefono", render: (l) => l.recipient.phone || "-" },
    { key: "city", header: "Ciudad", render: (l) => l.recipient.city || "-" },
    { key: "date", header: "Fecha", render: (l) => l.date, sortValue: (l) => l.date },
    { key: "order", header: "Pedido", render: (l) => l.orderNumber },
    { key: "status", header: "Estado", render: (l) => <LabelStatusBadge status={l.status} /> },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (label) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label={`Acciones para el rotulo ${label.orderNumber}`} size="sm">
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a href={`/crear?id=${label.id}&print=1`}>
                <Printer className="size-4" aria-hidden="true" />
                Imprimir
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => downloadPdf(label)}>
              <Download className="size-4" aria-hidden="true" />
              Descargar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => duplicateLabel(label.id)}>
              <Copy className="size-4" aria-hidden="true" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/crear?id=${label.id}`}>
                <Pencil className="size-4" aria-hidden="true" />
                Editar
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => setPendingDelete(label)}
              className="text-danger data-[highlighted]:bg-[var(--danger-soft)]"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Eliminar
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
        data={tableLabels}
        getRowId={(label) => label.id}
        searchPlaceholder="Buscar por numero de pedido, cliente o telefono"
        searchPredicate={(label, query) =>
          label.orderNumber.toLowerCase().includes(query) ||
          label.recipient.fullName.toLowerCase().includes(query) ||
          label.recipient.phone.toLowerCase().includes(query)
        }
        emptyTitle="No hay rotulos todavia"
        emptyDescription="Genera tu primer rotulo de envio para verlo en el historial."
        emptyAction={
          <Button size="sm" asChild>
            <Link href="/crear">
              <Plus className="size-4" aria-hidden="true" />
              Crear rotulo
            </Link>
          </Button>
        }
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Eliminar rotulo"
        description={
          pendingDelete
            ? `Esta accion eliminara el rotulo ${pendingDelete.orderNumber} de forma permanente.`
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
