import type { FullBackupPayload } from "@/lib/backup";

export type BackupTableName = Exclude<keyof FullBackupPayload, "generatedAt" | "generatedBy">;

export type BackupRowDifference = {
  key: string;
};

export type BackupTableCompare = {
  summary: {
    missing: number;
    extra: number;
    changed: number;
    unchanged: number;
  };
  missing: BackupRowDifference[];
  extra: BackupRowDifference[];
  changed: BackupRowDifference[];
};

export type BackupCompareReport = {
  tables: Record<BackupTableName, BackupTableCompare>;
};

export const BACKUP_TABLES: BackupTableName[] = [
  "customers",
  "orders",
  "orderItems",
  "orderEdits",
  "productCodes",
  "products",
  "stockMovements",
  "labels",
  "settings",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getBackupRowKey(table: BackupTableName, row: unknown, index: number): string {
  if (!isRecord(row)) return String(index);
  if (table === "settings" && typeof row.key === "string") return row.key;
  if (typeof row.id === "string") return row.id;
  return String(index);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
}

function tableRows(snapshot: FullBackupPayload, table: BackupTableName): unknown[] {
  const rows = snapshot[table];
  return Array.isArray(rows) ? rows : [];
}

export function compareBackupSnapshots(before: FullBackupPayload, current: FullBackupPayload): BackupCompareReport {
  const tables = {} as Record<BackupTableName, BackupTableCompare>;

  for (const table of BACKUP_TABLES) {
    const beforeRows = new Map(tableRows(before, table).map((row, index) => [getBackupRowKey(table, row, index), stableStringify(row)]));
    const currentRows = new Map(tableRows(current, table).map((row, index) => [getBackupRowKey(table, row, index), stableStringify(row)]));
    const missing: BackupRowDifference[] = [];
    const extra: BackupRowDifference[] = [];
    const changed: BackupRowDifference[] = [];
    let unchanged = 0;

    for (const [key, beforeValue] of beforeRows) {
      const currentValue = currentRows.get(key);
      if (currentValue === undefined) missing.push({ key });
      else if (currentValue !== beforeValue) changed.push({ key });
      else unchanged += 1;
    }

    for (const key of currentRows.keys()) {
      if (!beforeRows.has(key)) extra.push({ key });
    }

    tables[table] = {
      summary: { missing: missing.length, extra: extra.length, changed: changed.length, unchanged },
      missing,
      extra,
      changed,
    };
  }

  return { tables };
}
