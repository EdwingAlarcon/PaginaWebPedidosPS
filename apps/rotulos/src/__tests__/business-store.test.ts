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
    draft.customer.locality = "kennedy";
    draft.notes = "entregar en la manana";
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 1, unitPrice: 15000 }];

    const saved = await store.saveOrder(draft);

    expect(saved.customer.fullName).toBe("ANA PEREZ");
    expect(saved.customer.email).toBe("ana@example.com");
    expect(saved.customer.phone).toBe("3101234567");
    expect(saved.customer.city).toBe("MEDELLIN");
    expect(saved.customer.locality).toBe("KENNEDY");
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

  it("updates a customer without touching technical fields and normalizes editable text", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "luis gomez";
    draft.customer.city = "cali";
    await store.saveOrder(draft);
    const [customer] = await store.listCustomers();

    const updated = await store.updateCustomer(customer.id, {
      fullName: "luis gomez tienda",
      phone: "3001234567",
      city: "medellin",
      address: "calle 10",
    });

    expect(updated.id).toBe(customer.id);
    expect(updated.createdAt).toBe(customer.createdAt);
    expect(updated.fullName).toBe("LUIS GOMEZ TIENDA");
    expect(updated.phone).toBe("3001234567");
    expect(updated.city).toBe("MEDELLIN");
    expect(updated.address).toBe("CALLE 10");
  });

  it("normalizes a product code but leaves unitPrice untouched", async () => {
    const store = getBusinessStore();

    const saved = await store.saveProductCode({ code: "med-001", productName: "medias largas", category: "medias", unitPrice: 15000 });

    expect(saved.code).toBe("MED-001");
    expect(saved.productName).toBe("MEDIAS LARGAS");
    expect(saved.category).toBe("MEDIAS");
    expect(saved.unitPrice).toBe(15000);
  });

  it("updates safe order fields, recalculates totals, and keeps items unchanged", async () => {
    const store = getBusinessStore();
    const draft = createBlankOrderDraft();
    draft.customer.fullName = "ana perez";
    draft.notes = "nota inicial";
    draft.shippingCost = 5000;
    draft.items = [{ productCode: "med-001", productName: "medias largas", category: "medias", quantity: 2, unitPrice: 15000 }];
    const saved = await store.saveOrder(draft);

    const updated = await store.updateOrder(saved.id, {
      customer: { ...saved.customer, fullName: "ana tienda", city: "cali" },
      notes: "entregar en porteria",
      discount: 3000,
      shippingCost: 7000,
      status: "completed",
    });

    expect(updated.customer.fullName).toBe("ANA TIENDA");
    expect(updated.customer.city).toBe("CALI");
    expect(updated.notes).toBe("ENTREGAR EN PORTERIA");
    expect(updated.status).toBe("completed");
    expect(updated.subtotal).toBe(30000);
    expect(updated.total).toBe(34000);
    expect(updated.items).toEqual(saved.items);
  });
});
