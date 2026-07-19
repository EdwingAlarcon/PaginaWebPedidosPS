import { beforeEach, describe, expect, it } from "vitest";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";

describe("local business store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes customer, notes, and items to uppercase but leaves email and phone untouched", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.customer.email = "ana@example.com";
    draft.customer.phone = "3101234567";
    draft.customer.city = "medellin";
    draft.notes = "entregar en la manana";
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 1, unitPrice: 15000 }];

    const saved = await store.saveOrder(draft);

    expect(saved.customer.fullName).toBe("ANA PEREZ");
    expect(saved.customer.email).toBe("ana@example.com");
    expect(saved.customer.phone).toBe("3101234567");
    expect(saved.customer.city).toBe("MEDELLIN");
    expect(saved.notes).toBe("ENTREGAR EN LA MANANA");
    expect(saved.items[0].productName).toBe("MEDIAS LARGAS");
    expect(saved.items[0].productCode).toBe("MED-001");
  });

  it("saves an auto-created customer already normalized", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "luis gomez";
    draft.customer.city = "cali";

    await store.saveOrder(draft);
    const customers = await store.listCustomers();

    expect(customers).toHaveLength(1);
    expect(customers[0].fullName).toBe("LUIS GOMEZ");
    expect(customers[0].city).toBe("CALI");
  });

  it("normalizes a product code but leaves unitPrice untouched", async () => {
    const store = getBusinessStore();

    const saved = await store.saveProductCode({ code: "med-001", productName: "medias largas", category: "medias", unitPrice: 15000 });

    expect(saved.code).toBe("MED-001");
    expect(saved.productName).toBe("MEDIAS LARGAS");
    expect(saved.category).toBe("MEDIAS");
    expect(saved.unitPrice).toBe(15000);
  });
});
