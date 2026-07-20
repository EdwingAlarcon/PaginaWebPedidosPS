"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type CsvExportOption = {
  key: string;
  label: string;
  description: string;
  table: string;
  filePrefix: string;
};

const CSV_OPTIONS: CsvExportOption[] = [
  { key: "customers", label: "Clientes", description: "Todos los clientes registrados.", table: "customers", filePrefix: "export-clientes" },
  { key: "orders", label: "Pedidos", description: "Cabeceras de pedidos: cliente, fechas y totales.", table: "orders", filePrefix: "export-pedidos" },
  { key: "order-items", label: "Líneas de pedido", description: "Detalle de productos por pedido.", table: "order-items", filePrefix: "export-order-items" },
  { key: "productos", label: "Catálogo de productos", description: "Productos y precios usados en pedidos.", table: "productos", filePrefix: "export-productos" },
];

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function DataExport() {
  const [pending, setPending] = useState<string | null>(null);
  const toast = useToast();

  async function downloadFile(url: string, filename: string, key: string) {
    setPending(key);
    try {
      const response = await fetch(url, { credentials: "same-origin" });
      if (!response.ok) {
        toast.push({ variant: "danger", title: "No se pudo generar la exportación." });
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      toast.push({ variant: "success", title: `${filename} descargado.` });
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-card-title">Exportar datos</h2>
        <p className="text-sm text-foreground-muted">
          Descarga un snapshot antes de operaciones masivas (unificar clientes, importar Excel) o como respaldo periodico.
          Requiere sesion activa; no se puede descargar sin haber iniciado sesion.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {CSV_OPTIONS.map((option) => (
          <div key={option.key} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{option.label}</p>
              <p className="text-xs text-foreground-muted">{option.description}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={pending === option.key}
              onClick={() =>
                downloadFile(`/api/export?table=${option.table}`, `${option.filePrefix}-${todayStamp()}.csv`, option.key)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Backup completo (JSON)</p>
          <p className="text-xs text-foreground-muted">
            Incluye clientes, pedidos, catalogo, inventario, rotulos y configuracion. Para restauracion o diagnostico tecnico.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={pending === "full-backup"}
          onClick={() => downloadFile(`/api/export?format=json`, `backup-rotulos-${todayStamp()}.json`, "full-backup")}
        >
          <Download className="size-4" aria-hidden="true" />
          JSON
        </Button>
      </div>
    </Card>
  );
}
