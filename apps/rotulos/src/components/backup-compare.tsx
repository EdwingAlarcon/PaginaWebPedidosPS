"use client";

import { useState } from "react";
import { FileJson, GitCompare, RotateCcw, ShieldCheck } from "lucide-react";
import { compareBackupSnapshots, type BackupCompareReport, type BackupTableName } from "@/lib/backup-compare";
import type { FullBackupPayload } from "@/lib/backup";
import type { RestoreAction, RestoreSelection } from "@/lib/backup-restore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function plural(value: number, label: string): string {
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

const RESTORABLE_TABLES: BackupTableName[] = ["customers", "labels", "settings"];

function selectionId(item: RestoreSelection): string {
  return `${item.table}:${item.key}:${item.action}`;
}

function restoreCandidates(report: BackupCompareReport): RestoreSelection[] {
  return RESTORABLE_TABLES.flatMap((table) => [
    ...report.tables[table].missing.map((row) => ({ table, key: row.key, action: "insert_missing" as RestoreAction })),
    ...report.tables[table].changed.map((row) => ({ table, key: row.key, action: "update_changed" as RestoreAction })),
  ]);
}

export function BackupCompare() {
  const [file, setFile] = useState<File | null>(null);
  const [backupPayload, setBackupPayload] = useState<FullBackupPayload | null>(null);
  const [report, setReport] = useState<BackupCompareReport | null>(null);
  const [restoreReport, setRestoreReport] = useState<BackupCompareReport | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmation, setConfirmation] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [restorePending, setRestorePending] = useState(false);
  const [error, setError] = useState("");

  async function compare() {
    if (!file) return;
    setPending(true);
    setError("");
    setRestoreReport(null);
    setSelected(new Set());
    setConfirmation("");
    setRestoreMessage("");
    try {
      const [beforeText, currentResponse] = await Promise.all([
        file.text(),
        fetch("/api/export?format=json", { credentials: "same-origin" }),
      ]);
      if (!currentResponse.ok) throw new Error("current_export_failed");
      const before = JSON.parse(beforeText) as FullBackupPayload;
      const current = await currentResponse.json() as FullBackupPayload;
      setBackupPayload(before);
      setReport(compareBackupSnapshots(before, current));
    } catch {
      setBackupPayload(null);
      setReport(null);
      setError("No se pudo comparar el backup seleccionado.");
    } finally {
      setPending(false);
    }
  }

  async function prepareRestore() {
    if (!backupPayload) return;
    setRestorePending(true);
    setError("");
    setRestoreMessage("");
    try {
      const response = await fetch("/api/backups/restore/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ backup: backupPayload }),
      });
      if (!response.ok) throw new Error("restore_preview_failed");
      const body = await response.json() as { report: BackupCompareReport };
      setRestoreReport(body.report);
      setSelected(new Set());
      setConfirmation("");
    } catch {
      setError("No se pudo preparar la restauración.");
    } finally {
      setRestorePending(false);
    }
  }

  function toggleSelection(item: RestoreSelection) {
    const id = selectionId(item);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function executeRestore() {
    if (!backupPayload || !restoreReport || confirmation !== "RESTAURAR") return;
    const candidates = restoreCandidates(restoreReport);
    const selectedChanges = candidates.filter((item) => selected.has(selectionId(item)));
    if (selectedChanges.length === 0) return;

    setRestorePending(true);
    setError("");
    setRestoreMessage("");
    try {
      const response = await fetch("/api/backups/restore/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ backup: backupPayload, selectedChanges, confirmation }),
      });
      if (!response.ok) throw new Error("restore_execute_failed");
      setRestoreMessage("Restauración aplicada.");
      setSelected(new Set());
      setConfirmation("");
    } catch {
      setError("No se pudo ejecutar la restauración.");
    } finally {
      setRestorePending(false);
    }
  }

  const changedTables = report
    ? Object.entries(report.tables).filter(([, value]) =>
      value.summary.missing + value.summary.extra + value.summary.changed > 0)
    : [];
  const candidates = restoreReport ? restoreCandidates(restoreReport) : [];
  const selectedCount = selected.size;

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
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setReport(null);
                setBackupPayload(null);
                setRestoreReport(null);
                setSelected(new Set());
                setConfirmation("");
                setRestoreMessage("");
              }}
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
      {restoreMessage ? <p className="mt-2 text-xs font-medium text-success">{restoreMessage}</p> : null}
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
          {changedTables.length > 0 ? (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" disabled={!backupPayload} loading={restorePending} onClick={prepareRestore}>
                <ShieldCheck className="size-4" aria-hidden="true" />
                Preparar restauración
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {restoreReport ? (
        <div className="mt-3 rounded-md border border-border bg-surface-muted p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-foreground">Restauración controlada</p>
            <Badge variant={selectedCount > 0 ? "primary" : "neutral"}>{plural(selectedCount, "seleccionado")}</Badge>
          </div>
          {candidates.length === 0 ? (
            <p className="mt-2 text-xs text-foreground-muted">No hay filas restaurables en esta fase.</p>
          ) : (
            <div className="mt-2 max-h-52 overflow-auto rounded-md border border-border bg-surface">
              {candidates.map((item) => {
                const id = selectionId(item);
                return (
                  <label key={id} className="flex min-h-10 items-center gap-3 border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={selected.has(id)}
                      aria-label={`Restaurar ${item.table} ${item.key}`}
                      onChange={() => toggleSelection(item)}
                    />
                    <span className="min-w-24 font-medium text-foreground">{item.table}</span>
                    <span className="flex-1 truncate text-foreground-muted">{item.key}</span>
                    <Badge variant={item.action === "insert_missing" ? "danger" : "warning"}>
                      {item.action === "insert_missing" ? "faltante" : "cambiado"}
                    </Badge>
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-xs font-medium text-foreground">
              Confirmación
              <input
                className="h-8 rounded-md border border-border bg-surface px-2 text-sm"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                aria-label="Confirmación"
                placeholder="RESTAURAR"
              />
            </label>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={selectedCount === 0 || confirmation !== "RESTAURAR"}
              loading={restorePending}
              onClick={executeRestore}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Ejecutar restauración
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
