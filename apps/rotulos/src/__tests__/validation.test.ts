import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import { validateLabelDraft } from "@/lib/validation";

describe("label validation", () => {
  it("accepts a complete paid label", () => {
    const draft = createBlankLabelDraft();
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Calle 1 # 2-3",
    };
    draft.recipient = {
      fullName: "Ana Perez",
      phone: "3101234567",
      department: "Antioquia",
      city: "Medellin",
      address: "Carrera 45 # 10-20",
      neighborhood: "Laureles",
      reference: "Porteria principal",
      notes: "",
    };
    draft.orderNumber = "PS-2026-000001";
    draft.carrier = "Servientrega";
    draft.paymentMethod = "pagado";
    draft.packageCount = 1;

    expect(validateLabelDraft(draft)).toEqual({ valid: true, errors: {} });
  });

  it("requires contraentrega amount for COD labels", () => {
    const draft = createBlankLabelDraft();
    draft.sender.name = "PurpleShop";
    draft.sender.phone = "3001234567";
    draft.sender.department = "Cundinamarca";
    draft.sender.city = "Bogota";
    draft.sender.address = "Calle 1 # 2-3";
    draft.recipient.fullName = "Ana Perez";
    draft.recipient.phone = "3101234567";
    draft.recipient.department = "Antioquia";
    draft.recipient.city = "Medellin";
    draft.recipient.address = "Carrera 45 # 10-20";
    draft.orderNumber = "PS-2026-000001";
    draft.carrier = "Interrapidisimo";
    draft.paymentMethod = "contraentrega";
    draft.codAmount = 0;

    const result = validateLabelDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.codAmount).toBe("Ingresa el valor contraentrega.");
  });

  it.each([NaN, Infinity])("rejects non-finite contraentrega amount: %s", (codAmount) => {
    const draft = createBlankLabelDraft();
    draft.sender.name = "PurpleShop";
    draft.sender.phone = "3001234567";
    draft.sender.department = "Cundinamarca";
    draft.sender.city = "Bogota";
    draft.sender.address = "Calle 1 # 2-3";
    draft.recipient.fullName = "Ana Perez";
    draft.recipient.phone = "3101234567";
    draft.recipient.department = "Antioquia";
    draft.recipient.city = "Medellin";
    draft.recipient.address = "Carrera 45 # 10-20";
    draft.orderNumber = "PS-2026-000001";
    draft.carrier = "Interrapidisimo";
    draft.paymentMethod = "contraentrega";
    draft.codAmount = codAmount;

    const result = validateLabelDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.codAmount).toBe("Ingresa el valor contraentrega.");
  });

  it.each([
    ["address", 171, "recipient.address", "La direccion puede tener maximo 170 caracteres para imprimirla completa."],
    ["reference", 91, "recipient.reference", "La referencia puede tener maximo 90 caracteres para imprimirla completa."],
    ["notes", 91, "recipient.notes", "Las observaciones pueden tener maximo 90 caracteres para imprimirlas completas."],
    ["neighborhood", 46, "recipient.neighborhood", "El barrio puede tener maximo 45 caracteres para imprimirlo completo."],
  ] as const)("rejects printable recipient %s content over its limit", (field, length, errorKey, message) => {
    const draft = createCompleteDraft();
    draft.recipient[field] = "x".repeat(length);

    const result = validateLabelDraft(draft);

    expect(result.valid).toBe(false);
    expect(result.errors[errorKey]).toBe(message);
  });

  it("accepts recipient printable content at each limit", () => {
    const draft = createCompleteDraft();
    draft.sender.name = "s".repeat(50);
    draft.sender.phone = "p".repeat(20);
    draft.sender.department = "d".repeat(35);
    draft.sender.city = "c".repeat(35);
    draft.sender.address = "a".repeat(120);
    draft.recipient.fullName = "f".repeat(55);
    draft.recipient.phone = "p".repeat(20);
    draft.recipient.department = "d".repeat(35);
    draft.recipient.city = "c".repeat(35);
    draft.recipient.address = "a".repeat(170);
    draft.recipient.reference = "r".repeat(90);
    draft.recipient.notes = "n".repeat(90);
    draft.recipient.neighborhood = "b".repeat(45);
    draft.orderNumber = "o".repeat(32);
    draft.carrier = "c".repeat(40);

    expect(validateLabelDraft(draft)).toEqual({ valid: true, errors: {} });
  });

  it.each([
    ["sender name", (draft: ReturnType<typeof createCompleteDraft>) => { draft.sender.name = "x".repeat(51); }, "sender.name", "El nombre del remitente puede tener maximo 50 caracteres para imprimirlo completo."],
    ["sender address", (draft: ReturnType<typeof createCompleteDraft>) => { draft.sender.address = "x".repeat(121); }, "sender.address", "La direccion del remitente puede tener maximo 120 caracteres para imprimirla completa."],
    ["recipient full name", (draft: ReturnType<typeof createCompleteDraft>) => { draft.recipient.fullName = "x".repeat(56); }, "recipient.fullName", "El nombre del destinatario puede tener maximo 55 caracteres para imprimirlo completo."],
    ["order number", (draft: ReturnType<typeof createCompleteDraft>) => { draft.orderNumber = "x".repeat(33); }, "orderNumber", "El numero de pedido puede tener maximo 32 caracteres para imprimirlo completo."],
    ["carrier", (draft: ReturnType<typeof createCompleteDraft>) => { draft.carrier = "x".repeat(41); }, "carrier", "La transportadora puede tener maximo 40 caracteres para imprimirla completa."],
  ] as const)("rejects over-limit %s", (_field, setValue, errorKey, message) => {
    const draft = createCompleteDraft();
    setValue(draft);

    const result = validateLabelDraft(draft);

    expect(result.valid).toBe(false);
    expect(result.errors[errorKey]).toBe(message);
  });
});

function createCompleteDraft() {
  const draft = createBlankLabelDraft();
  draft.sender = {
    name: "PurpleShop",
    phone: "3001234567",
    department: "Cundinamarca",
    city: "Bogota",
    address: "Calle 1 # 2-3",
  };
  draft.recipient = {
    fullName: "Ana Perez",
    phone: "3101234567",
    department: "Antioquia",
    city: "Medellin",
    address: "Carrera 45 # 10-20",
    neighborhood: "Laureles",
    reference: "Porteria principal",
    notes: "Entregar en la tarde",
  };
  draft.orderNumber = "PS-2026-000001";
  draft.carrier = "Servientrega";
  return draft;
}
