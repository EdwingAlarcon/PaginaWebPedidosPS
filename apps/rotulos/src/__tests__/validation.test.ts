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
});
