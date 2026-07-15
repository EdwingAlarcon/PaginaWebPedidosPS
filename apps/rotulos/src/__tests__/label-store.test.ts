import { describe, expect, it } from "vitest";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { createLocalLabelStore } from "@/lib/label-store";

describe("local label store", () => {
  it("assigns the next generated order number when saving a blank draft", async () => {
    const store = createLocalLabelStore();
    const draft = createBlankLabelDraft();
    draft.date = "2026-07-15";
    draft.recipient.city = "Bogota";
    draft.recipient.department = "Cundinamarca";

    const saved = await store.saveLabel(draft, defaultSettings);

    expect(saved.orderNumber).toBe("PS-2026-000001");
    expect(saved.status).toBe("generado");
    expect(await store.getLabel(saved.id)).toEqual(saved);
  });

  it("rejects duplicate manual order numbers", async () => {
    const store = createLocalLabelStore();
    const first = createBlankLabelDraft();
    first.orderNumber = "MANUAL-001";
    const second = createBlankLabelDraft();
    second.orderNumber = "MANUAL-001";

    await store.saveLabel(first, defaultSettings);

    await expect(store.saveLabel(second, defaultSettings)).rejects.toThrow("duplicate_order_number");
  });
});
