import { describe, expect, it } from "vitest";
import { parseSheetPeriod } from "@/lib/excel-import/period";

describe("parseSheetPeriod", () => {
  it("interpreta un mes de 3 letras con año", () => {
    expect(parseSheetPeriod("OCT 2025")).toBe("2025-10-01");
  });

  it("interpreta meses con nombre largo (MAYO, JUNIO, JULIO)", () => {
    expect(parseSheetPeriod("MAYO 2026")).toBe("2026-05-01");
    expect(parseSheetPeriod("JUNIO 2026")).toBe("2026-06-01");
    expect(parseSheetPeriod("JULIO 2026")).toBe("2026-07-01");
  });

  it("interpreta SEPT y ENE (casos límite de la lista real de hojas)", () => {
    expect(parseSheetPeriod("SEPT 2025")).toBe("2025-09-01");
    expect(parseSheetPeriod("ENE 2026")).toBe("2026-01-01");
  });

  it("es tolerante a espacios extra y minúsculas", () => {
    expect(parseSheetPeriod("  nov   2025  ")).toBe("2025-11-01");
  });

  it("lanza error si el nombre de hoja no tiene el patrón MES AÑO", () => {
    expect(() => parseSheetPeriod("RESUMEN")).toThrow(/No se pudo interpretar/);
  });

  it("lanza error si el mes no está en el diccionario conocido", () => {
    expect(() => parseSheetPeriod("XYZ 2025")).toThrow(/Mes desconocido/);
  });
});
