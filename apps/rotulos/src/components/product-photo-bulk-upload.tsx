"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { Upload, CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { uploadProductImage, validateProductImageFile } from "@/lib/product-image-upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type RowStatus = "pending" | "uploading" | "success" | "not_found" | "error";
type Row = { code: string; fileName: string; status: RowStatus; message?: string };

function codeFromFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").trim().toUpperCase();
}

export function ProductPhotoBulkUpload() {
  const [rows, setRows] = useState<Row[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  async function processFiles(files: File[]) {
    if (!files.length || processing) return;
    setProcessing(true);

    const initialRows: Row[] = files.map((file) => ({
      code: codeFromFileName(file.name),
      fileName: file.name,
      status: "pending",
    }));
    setRows(initialRows);

    try {
      const store = getBusinessStore();
      const products = await store.listProductCodes();
      const byCode = new Map(products.map((product) => [product.code.trim().toUpperCase(), product]));

      let uploaded = 0;
      let notFound = 0;
      let failed = 0;

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const code = initialRows[index].code;

        setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "uploading" } : row)));

        const product = byCode.get(code);
        if (!product) {
          notFound += 1;
          setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "not_found" } : row)));
          continue;
        }

        const validationError = validateProductImageFile(file);
        if (validationError) {
          failed += 1;
          setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "error", message: validationError } : row)));
          continue;
        }

        try {
          const url = await uploadProductImage(product.id, file);
          await store.updateProductCode(product.id, { imageUrl: url });
          uploaded += 1;
          setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "success" } : row)));
        } catch {
          failed += 1;
          setRows((prev) => prev.map((row, i) => (i === index ? { ...row, status: "error", message: "Fallo al subir." } : row)));
        }
      }

      toast.push({
        variant: notFound || failed ? "danger" : "success",
        title: `Fotos subidas: ${uploaded}. Codigo no encontrado: ${notFound}. Fallidas: ${failed}.`,
      });
    } finally {
      setProcessing(false);
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void processFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    void processFiles(files);
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-card-title">Subir fotos de producto en lote</h2>
        <p className="text-sm text-foreground-muted">
          Arrastra o selecciona varias fotos a la vez. Cada archivo debe llamarse exactamente como el codigo
          del producto (ej. <code className="rounded bg-surface-muted px-1">PS-H-064.jpg</code>). Formato JPG o PNG,
          maximo 5MB, cuadrada de 750x750px recomendado.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-primary bg-surface-muted" : "border-border"
        }`}
      >
        <Upload className="size-6 text-foreground-muted" aria-hidden="true" />
        <p className="text-sm text-foreground-muted">Arrastra las fotos aqui, o</p>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-muted">
          <span>Elegir archivos</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            multiple
            disabled={processing}
            className="sr-only"
            onChange={handleInputChange}
          />
        </label>
      </div>

      {rows.length > 0 ? (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.fileName} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{row.code}</p>
                <p className="truncate text-xs text-foreground-muted">{row.fileName}</p>
              </div>
              <RowStatusBadge status={row.status} message={row.message} />
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function RowStatusBadge({ status, message }: { status: RowStatus; message?: string }) {
  switch (status) {
    case "pending":
      return <span className="text-xs text-foreground-muted">En espera</span>;
    case "uploading":
      return (
        <span className="flex items-center gap-1 text-xs text-foreground-muted">
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Subiendo
        </span>
      );
    case "success":
      return (
        <span className="flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="size-3.5" aria-hidden="true" /> Subida
        </span>
      );
    case "not_found":
      return (
        <span className="flex items-center gap-1 text-xs text-warning" title="El codigo no existe en el catalogo">
          <HelpCircle className="size-3.5" aria-hidden="true" /> Codigo no encontrado
        </span>
      );
    case "error":
      return (
        <span className="flex items-center gap-1 text-xs text-danger" title={message}>
          <XCircle className="size-3.5" aria-hidden="true" /> Error
        </span>
      );
  }
}
