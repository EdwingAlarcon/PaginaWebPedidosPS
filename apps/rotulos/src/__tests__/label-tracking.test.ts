import { describe, expect, it } from "vitest";
import { buildTrackingWhatsAppText } from "@/lib/label-tracking";
import { createBlankLabelDraft } from "@/lib/defaults";
import type { LabelRecord } from "@/lib/types";

function makeLabel(overrides: Partial<LabelRecord> = {}): LabelRecord {
  return {
    ...createBlankLabelDraft(),
    id: "label-1",
    orderNumber: "PS-2026-000001",
    carrier: "COORDINADORA",
    trackingNumber: "123456789",
    trackingUrl: null,
    createdAt: "2026-08-19T00:00:00.000Z",
    updatedAt: "2026-08-19T00:00:00.000Z",
    pdfUrl: null,
    createdBy: null,
    ...overrides,
  };
}

describe("buildTrackingWhatsAppText", () => {
  it("includes the carrier and tracking number", () => {
    const text = buildTrackingWhatsAppText(makeLabel());

    expect(text).toContain("COORDINADORA");
    expect(text).toContain("123456789");
  });

  it("includes the tracking link when present", () => {
    const text = buildTrackingWhatsAppText(makeLabel({ trackingUrl: "https://coordinadora.com/rastreo/123" }));

    expect(text).toContain("https://coordinadora.com/rastreo/123");
  });

  it("omits the link line when there is none", () => {
    const text = buildTrackingWhatsAppText(makeLabel({ trackingUrl: null }));

    expect(text).not.toContain("Rastrealo aqui");
  });
});
