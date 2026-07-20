import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/export-csv";

describe("toCsv", () => {
  it("genera encabezado y filas en el orden de columnas dado", () => {
    const csv = toCsv(
      [{ id: "1", full_name: "ANA PEREZ" }, { id: "2", full_name: "LUIS GOMEZ" }],
      ["id", "full_name"],
    );
    expect(csv).toBe("id,full_name\r\n1,ANA PEREZ\r\n2,LUIS GOMEZ");
  });

  it("escapa comas, comillas y saltos de linea", () => {
    const csv = toCsv([{ note: 'Calle 1, "casa azul"\ncerca al parque' }], ["note"]);
    expect(csv).toBe('note\r\n"Calle 1, ""casa azul""\ncerca al parque"');
  });

  it("serializa objetos anidados como JSON y trata null/undefined como vacio", () => {
    const csv = toCsv(
      [{ snapshot: { fullName: "ANA" }, missing: null, absent: undefined }],
      ["snapshot", "missing", "absent"],
    );
    expect(csv).toBe('snapshot,missing,absent\r\n"{""fullName"":""ANA""}",,');
  });
});
