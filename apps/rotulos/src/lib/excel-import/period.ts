const MONTH_BY_TOKEN: Record<string, number> = {
  ENE: 1,
  FEB: 2,
  MAR: 3,
  ABR: 4,
  MAYO: 5,
  JUNIO: 6,
  JULIO: 7,
  AGO: 8,
  SEPT: 9,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DIC: 12,
};

export function parseSheetPeriod(sheetName: string): string {
  const normalized = sheetName.trim().toUpperCase().replace(/\s+/g, " ");
  const match = normalized.match(/^([A-ZÑ]+)\s+(\d{4})$/);
  if (!match) {
    throw new Error(`No se pudo interpretar el periodo de la hoja "${sheetName}"`);
  }
  const [, token, yearStr] = match;
  const month = MONTH_BY_TOKEN[token];
  if (!month) {
    throw new Error(`Mes desconocido "${token}" en hoja "${sheetName}"`);
  }
  return `${yearStr}-${String(month).padStart(2, "0")}-01`;
}
