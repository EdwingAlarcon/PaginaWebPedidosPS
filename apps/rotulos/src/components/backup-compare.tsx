"use client";

import { useState } from "react";
import { FileJson, GitCompare } from "lucide-react";
import { compareBackupSnapshots, type BackupCompareReport } from "@/lib/backup-compare";
import type { FullBackupPayload } from "@/lib/backup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function plural(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

export function BackupCompare() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<BackupCompareReport | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    if (!file) return;
    setPending(true);
    setError("");
    try {
      const [beforeText, currentResponse] = await Promise.all([
        file.text(),
        fetch("/api/export?format=json", { credentials: "same-origin" }),
      ]);
      if (!currentResponse.ok) throw new Error("current_export_failed");
      const before = JSON.parse(beforeText) as FullBackupPayload;
      const current = await currentResponse.json() as FullBackupPayload;
      setReport(compareBackupSnapshots(before, current));
    } catch {
      setReport(null);
      setError("No se pudo comparar el backup seleccionado.");
    } finally {
      setPending(false);
    }
  }

  const changedTables = report
    ? Object.entries(report.tables).filter(([, value]) =>
      value.summary.missing + value.summary.extra + value.summary.changed > 0)
    : [];

  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Comparar backup JSON</p>
          <p className="text-xs text-foreground-muted">Selecciona un backup anterior y compara contra el estado actual.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-foreground hover:bg-surface-muted">
            <FileJson className="size-4" aria-hidden="true" />
            Archivo
            <input
              aria-label="Backup JSON anterior"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="button" variant="secondary" size="sm" disabled={!file} loading={pending} onClick={compare}>
            <GitCompare className="size-4" aria-hidden="true" />
            Comparar
          </Button>
        </div>
      </div>
      {file ? <p className="mt-2 text-xs text-foreground-muted">{file.name}</p> : null}
      {error ? <p className="mt-2 text-xs font-medium text-danger">{error}</p> : null}
      {report ? (
        <div className="mt-3 grid gap-2">
          {changedTables.length === 0 ? (
            <Badge variant="success">Sin diferencias</Badge>
          ) : changedTables.map(([table, value]) => (
            <div key={table} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm">
              <span className="font-medium text-foreground">{table}</span>
              <div className="flex flex-wrap gap-2">
                <Badge variant={value.summary.changed > 0 ? "warning" : "neutral"}>{plural(value.summary.changed, "cambiado")}</Badge>
                <Badge variant={value.summary.missing > 0 ? "danger" : "neutral"}>{plural(value.summary.missing, "faltante")}</Badge>
                <Badge variant={value.summary.extra > 0 ? "primary" : "neutral"}>{plural(value.summary.extra, "extra")}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
