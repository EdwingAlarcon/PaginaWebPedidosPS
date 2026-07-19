import { describe, expect, it } from "vitest";
import {
  normalizeText,
  normalizeSender,
  normalizeRecipient,
  normalizeLabelDraft,
  normalizeLabelSettings,
  normalizeCustomerFields,
  normalizeOrderItem,
  normalizeOrderDraft,
  normalizeProductDraft,
  normalizeStockMovementDraft,
  normalizeProductCode,
} from "@/lib/normalize";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { createBlankOrderDraft } from "@/lib/business-store";

describe("normalizeText", () => {
  it("trims and uppercases, preserving accents", () => {
    expect(normalizeText("  bogotá  ")).toBe("BOGOTÁ");
    expect(normalizeText("Edwing")).toBe("EDWING");
    expect(normalizeText("")).toBe("");
  });
});

describe("normalizeSender", () => {
  it("normalizes text fields but leaves phone untouched", () => {
    const result = normalizeSender({
      name: " Edwing Alarcon ",
      phone: "3001234567",
      department: "cundinamarca",
      city: "bogota",
      address: "calle 1 # 2-3",
    });

    expect(result).toEqual({
      name: "EDWING ALARCON",
      phone: "3001234567",
      department: "CUNDINAMARCA",
      city: "BOGOTA",
      address: "CALLE 1 # 2-3",
    });
  });
});

describe("normalizeRecipient", () => {
  it("normalizes every free-text field but leaves phone untouched", () => {
    const result = normalizeRecipient({
      fullName: "ana perez",
      phone: "3101234567",
      department: "antioquia",
      city: "medellin",
      address: "carrera 45 # 10-20",
      neighborhood: "laureles",
      reference: "porteria principal",
      notes: "entregar en la tarde",
    });

    expect(result.fullName).toBe("ANA PEREZ");
    expect(result.phone).toBe("3101234567");
    expect(result.department).toBe("ANTIOQUIA");
    expect(result.city).toBe("MEDELLIN");
    expect(result.address).toBe("CARRERA 45 # 10-20");
    expect(result.neighborhood).toBe("LAURELES");
    expect(result.reference).toBe("PORTERIA PRINCIPAL");
    expect(result.notes).toBe("ENTREGAR EN LA TARDE");
  });
});

describe("normalizeLabelDraft", () => {
  it("normalizes orderNumber, carrier, sender, and recipient", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = " manual-001 ";
    draft.carrier = "coordinadora";
    draft.recipient.fullName = "ana perez";

    const result = normalizeLabelDraft(draft);

    expect(result.orderNumber).toBe("MANUAL-001");
    expect(result.carrier).toBe("COORDINADORA");
    expect(result.recipient.fullName).toBe("ANA PEREZ");
  });
});

describe("normalizeLabelSettings", () => {
  it("normalizes defaultSender but leaves brandPhrase and instagramUser untouched", () => {
    const settings = {
      ...defaultSettings,
      defaultSender: { ...defaultSettings.defaultSender, city: "bogota" },
      brandPhrase: "Detalles que viajan con amor",
      instagramUser: "@purpleshop.online",
    };

    const result = normalizeLabelSettings(settings);

    expect(result.defaultSender.city).toBe("BOGOTA");
    expect(result.brandPhrase).toBe("Detalles que viajan con amor");
    expect(result.instagramUser).toBe("@purpleshop.online");
  });
});

describe("normalizeCustomerFields", () => {
  it("normalizes text fields but leaves phone and email untouched", () => {
    const result = normalizeCustomerFields({
      fullName: "ana perez",
      phone: "3101234567",
      email: "ana@example.com",
      department: "antioquia",
      city: "medellin",
      address: "carrera 45 # 10-20",
      neighborhood: "laureles",
    });

    expect(result.fullName).toBe("ANA PEREZ");
    expect(result.phone).toBe("3101234567");
    expect(result.email).toBe("ana@example.com");
    expect(result.city).toBe("MEDELLIN");
  });
});

describe("normalizeOrderItem", () => {
  it("normalizes productCode, productName, and category", () => {
    const result = normalizeOrderItem({
      productCode: " med-001 ",
      productName: "medias largas",
      category: "medias",
      quantity: 1,
      unitPrice: 15000,
    });

    expect(result.productCode).toBe("MED-001");
    expect(result.productName).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
  });
});

describe("normalizeOrderDraft", () => {
  it("normalizes customer, notes, and items but leaves email untouched", () => {
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.email = "ana@example.com";
    draft.notes = "entregar en la manana";
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 1, unitPrice: 15000 }];

    const result = normalizeOrderDraft(draft);

    expect(result.customer.fullName).toBe("ANA PEREZ");
    expect(result.customer.email).toBe("ana@example.com");
    expect(result.notes).toBe("ENTREGAR EN LA MANANA");
    expect(result.items[0].productName).toBe("MEDIAS LARGAS");
  });
});

describe("normalizeProductDraft", () => {
  it("normalizes name, category, and sku", () => {
    const result = normalizeProductDraft({
      name: "medias largas",
      category: "medias",
      sku: "med-001",
      unitPrice: 15000,
      minStock: 5,
      maxStock: 200,
    });

    expect(result.name).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
    expect(result.sku).toBe("MED-001");
  });
});

describe("normalizeStockMovementDraft", () => {
  it("normalizes reason and supplier", () => {
    const result = normalizeStockMovementDraft({
      productId: "p1",
      type: "entrada",
      quantity: 10,
      reason: "compra a proveedor",
      supplier: "acme",
    });

    expect(result.reason).toBe("COMPRA A PROVEEDOR");
    expect(result.supplier).toBe("ACME");
  });
});

describe("normalizeProductCode", () => {
  it("normalizes code, productName, and category", () => {
    const result = normalizeProductCode({
      code: "med-001",
      productName: "medias largas",
      category: "medias",
      unitPrice: 15000,
    });

    expect(result.code).toBe("MED-001");
    expect(result.productName).toBe("MEDIAS LARGAS");
    expect(result.category).toBe("MEDIAS");
  });
});
