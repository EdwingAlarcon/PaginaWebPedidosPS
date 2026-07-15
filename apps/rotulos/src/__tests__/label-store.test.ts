import { beforeEach, describe, expect, it } from "vitest";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { createLocalLabelStore } from "@/lib/label-store";

describe("local label store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists labels and settings in browser localStorage", async () => {
    const store = createLocalLabelStore();
    const settings = { ...defaultSettings, brandPhrase: "Persistida" };
    const draft = createBlankLabelDraft();
    draft.date = "2033-07-15";

    const saved = await store.saveLabel(draft, settings);
    await store.saveSettings(settings);

    expect(localStorage.getItem("purpleshop.rotulos.labels")).toContain(saved.id);
    expect(await createLocalLabelStore().getSettings()).toEqual(settings);
    expect(await createLocalLabelStore().getLabel(saved.id)).toEqual(saved);
  });

  it("persists deletion in browser localStorage", async () => {
    const store = createLocalLabelStore();
    const saved = await store.saveLabel(createBlankLabelDraft(), defaultSettings);

    await store.deleteLabel(saved.id);

    expect(await createLocalLabelStore().getLabel(saved.id)).toBeNull();
  });

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

  it("starts each sequence scope at the configured initial value and estimates without reserving", async () => {
    const store = createLocalLabelStore();
    const settings = {
      ...defaultSettings,
      orderNumberConfig: {
        ...defaultSettings.orderNumberConfig,
        initialSequence: 100,
        sequenceDigits: 2,
      },
    };
    const draft = createBlankLabelDraft();
    draft.date = "2030-07-15";

    expect(await store.estimateNextOrderNumber(settings, draft)).toBe("PS-2030-100");
    expect((await store.saveLabel(draft, settings)).orderNumber).toBe("PS-2030-100");
    expect(await store.estimateNextOrderNumber(settings, draft)).toBe("PS-2030-101");
  });

  it("resets local sequences when the configured scope changes", async () => {
    const store = createLocalLabelStore();
    const settings = {
      ...defaultSettings,
      orderNumberConfig: {
        ...defaultSettings.orderNumberConfig,
        initialSequence: 5,
        resetPolicy: "monthly" as const,
      },
    };
    const january = createBlankLabelDraft();
    january.date = "2031-01-15";
    const januaryNext = createBlankLabelDraft();
    januaryNext.date = "2031-01-20";
    const february = createBlankLabelDraft();
    february.date = "2031-02-01";

    expect((await store.saveLabel(january, settings)).orderNumber).toBe("PS-2031-000005");
    expect((await store.saveLabel(januaryNext, settings)).orderNumber).toBe("PS-2031-000006");
    expect((await store.saveLabel(february, settings)).orderNumber).toBe("PS-2031-000005");
  });

  it("preserves creation time and status when updating an existing label", async () => {
    const store = createLocalLabelStore();
    const draft = createBlankLabelDraft();
    draft.date = "2032-07-15";
    const created = await store.saveLabel(draft, defaultSettings);

    const updated = await store.saveLabel(
      { ...created, carrier: "Coordinadora", status: "impreso" },
      defaultSettings,
    );

    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.status).toBe("impreso");
    expect(updated.carrier).toBe("Coordinadora");
  });
});
