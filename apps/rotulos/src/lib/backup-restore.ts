import type { SupabaseClient } from "@supabase/supabase-js";
import type { FullBackupPayload } from "@/lib/backup";
import {
  BACKUP_TABLES,
  compareBackupSnapshots,
  getBackupRowKey,
  type BackupCompareReport,
  type BackupTableName,
} from "@/lib/backup-compare";

export type RestoreAction = "insert_missing" | "update_changed";

export type RestoreSelection = {
  table: BackupTableName;
  key: string;
  action: RestoreAction;
};

type RestoreTableConfig = {
  apiTable: string;
  keyColumn: string;
};

export const RESTORE_TABLE_ORDER: BackupTableName[] = [
  "customers",
  "productCodes",
  "products",
  "orders",
  "orderItems",
  "orderEdits",
  "stockMovements",
  "labels",
  "settings",
];

export const RESTORABLE_TABLES = ["customers", "labels", "settings"] as const satisfies readonly BackupTableName[];

const RESTORE_TABLE_CONFIG: Partial<Record<BackupTableName, RestoreTableConfig>> = {
  customers: { apiTable: "customers", keyColumn: "id" },
  labels: { apiTable: "labels", keyColumn: "id" },
  settings: { apiTable: "settings", keyColumn: "key" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBackupTableName(value: string): value is BackupTableName {
  return (BACKUP_TABLES as readonly string[]).includes(value);
}

function rowArray(snapshot: FullBackupPayload, table: BackupTableName): unknown[] {
  return Array.isArray(snapshot[table]) ? snapshot[table] : [];
}

function findBackupRow(snapshot: FullBackupPayload, table: BackupTableName, key: string): Record<string, unknown> | null {
  const rows = rowArray(snapshot, table);
  const row = rows.find((candidate, index) => getBackupRowKey(table, candidate, index) === key);
  return isRecord(row) ? row : null;
}

export function validateFullBackupPayload(value: unknown): { ok: true; payload: FullBackupPayload } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: "El backup debe ser un objeto JSON." };
  if (typeof value.generatedAt !== "string") return { ok: false, error: "Falta generatedAt en el backup." };
  if (typeof value.generatedBy !== "string") return { ok: false, error: "Falta generatedBy en el backup." };

  const allowedKeys = new Set<string>(["generatedAt", "generatedBy", ...BACKUP_TABLES]);
  const unknownKey = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unknownKey) return { ok: false, error: `Tabla desconocida en el backup: ${unknownKey}.` };

  const missingTable = BACKUP_TABLES.find((table) => !Array.isArray(value[table]));
  if (missingTable) return { ok: false, error: `Falta la tabla ${missingTable} en el backup.` };

  return { ok: true, payload: value as FullBackupPayload };
}

export function buildRestorePlan(sourceBackup: FullBackupPayload, currentBackup: FullBackupPayload) {
  const report = compareBackupSnapshots(sourceBackup, currentBackup);
  const restorableTables = [...RESTORABLE_TABLES];
  const unsupportedTables = BACKUP_TABLES.filter((table) => {
    if ((RESTORABLE_TABLES as readonly BackupTableName[]).includes(table)) return false;
    const summary = report.tables[table].summary;
    return summary.missing + summary.changed > 0;
  });

  return {
    report,
    restorableTables,
    unsupportedTables,
  };
}

export function normalizeRestoreSelection(
  report: BackupCompareReport,
  selectedChanges: unknown,
): { ok: true; selection: RestoreSelection[] } | { ok: false; error: string } {
  if (!Array.isArray(selectedChanges)) return { ok: false, error: "selectedChanges debe ser una lista." };

  const normalized: RestoreSelection[] = [];
  const seen = new Set<string>();

  for (const item of selectedChanges) {
    if (!isRecord(item)) return { ok: false, error: "Cada cambio seleccionado debe ser un objeto." };
    if (typeof item.table !== "string" || !isBackupTableName(item.table)) return { ok: false, error: "Tabla seleccionada inválida." };
    if (typeof item.key !== "string" || item.key.trim() === "") return { ok: false, error: "Llave seleccionada inválida." };
    if (item.action !== "insert_missing" && item.action !== "update_changed") return { ok: false, error: "Acción de restauración inválida." };
    if (!(RESTORABLE_TABLES as readonly BackupTableName[]).includes(item.table)) continue;

    const candidates = item.action === "insert_missing" ? report.tables[item.table].missing : report.tables[item.table].changed;
    if (!candidates.some((candidate) => candidate.key === item.key)) continue;

    const dedupeKey = `${item.table}:${item.key}:${item.action}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    normalized.push({ table: item.table, key: item.key, action: item.action });
  }

  normalized.sort((a, b) => RESTORE_TABLE_ORDER.indexOf(a.table) - RESTORE_TABLE_ORDER.indexOf(b.table));
  return { ok: true, selection: normalized };
}

export function assertRestoreAllowed(email: string): { ok: true } | { ok: false; status: number; error: string; detail?: string } {
  if (process.env.BACKUP_RESTORE_ENABLED !== "true") {
    return { ok: false, status: 403, error: "restore_disabled" };
  }

  const allowedEmails = (process.env.BACKUP_RESTORE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!allowedEmails.includes(email.toLowerCase())) {
    return { ok: false, status: 403, error: "restore_not_allowed" };
  }

  return { ok: true };
}

export async function recordRestoreRun(
  supabase: SupabaseClient,
  values: {
    requestedBy: string;
    mode: "dry_run" | "execute";
    sourceBackupGeneratedAt: string;
    preRestoreBackupFilename?: string;
    status: "planned" | "completed" | "failed";
    summary: unknown;
    selectedChanges?: RestoreSelection[];
    error?: string;
  },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase
    .from("backup_restore_runs")
    .insert({
      requested_by: values.requestedBy,
      mode: values.mode,
      source_backup_generated_at: values.sourceBackupGeneratedAt,
      pre_restore_backup_filename: values.preRestoreBackupFilename ?? null,
      status: values.status,
      summary: values.summary,
      selected_changes: values.selectedChanges ?? [],
      error: values.error ?? null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: String((data as { id?: unknown } | null)?.id ?? "") };
}

export async function updateRestoreRunStatus(
  supabase: SupabaseClient,
  runId: string,
  values: { status: "completed" | "failed"; summary?: unknown; error?: string },
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from("backup_restore_runs")
    .update({ status: values.status, summary: values.summary, error: values.error ?? null })
    .eq("id", runId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function uploadPreRestoreBackup(
  supabase: SupabaseClient,
  payload: FullBackupPayload,
): Promise<{ filename: string } | { error: string }> {
  const filename = `backup-before-restore-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const { error } = await supabase.storage
    .from("backups")
    .upload(filename, JSON.stringify(payload, null, 2), { contentType: "application/json" });
  if (error) return { error: error.message };
  return { filename };
}

function updatePayload(table: BackupTableName, row: Record<string, unknown>): Record<string, unknown> {
  const config = RESTORE_TABLE_CONFIG[table];
  if (!config) return row;
  const { [config.keyColumn]: _key, ...payload } = row;
  return payload;
}

export async function applyRestoreSelection(
  supabase: SupabaseClient,
  sourceBackup: FullBackupPayload,
  selection: RestoreSelection[],
): Promise<{ applied: { table: BackupTableName; inserted: number; updated: number }[] } | { error: string }> {
  const counts = new Map<BackupTableName, { table: BackupTableName; inserted: number; updated: number }>();

  for (const item of selection) {
    const config = RESTORE_TABLE_CONFIG[item.table];
    if (!config) continue;

    const row = findBackupRow(sourceBackup, item.table, item.key);
    if (!row) return { error: `No se encontró la fila ${item.key} en ${item.table}.` };

    const tableCount = counts.get(item.table) ?? { table: item.table, inserted: 0, updated: 0 };
    if (item.action === "insert_missing") {
      const { error } = await supabase.from(config.apiTable).insert(row);
      if (error) return { error: error.message };
      tableCount.inserted += 1;
    } else {
      const { error } = await supabase.from(config.apiTable).update(updatePayload(item.table, row)).eq(config.keyColumn, item.key);
      if (error) return { error: error.message };
      tableCount.updated += 1;
    }
    counts.set(item.table, tableCount);
  }

  return { applied: RESTORE_TABLE_ORDER.map((table) => counts.get(table)).filter((value): value is { table: BackupTableName; inserted: number; updated: number } => Boolean(value)) };
}
