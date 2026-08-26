import { describe, expect, it, vi } from "vitest";
import { renderCatalogPdfBuffer } from "@/lib/catalog-pdf";
import type { ProductCode } from "@/lib/business-types";
import type { LabelSettings } from "@/lib/types";
import { defaultSettings } from "@/lib/defaults";

function makeProduct(overrides: Partial<ProductCode>): ProductCode {
  return {
    id: "id",
    code: "COD",
    productName: "PERFUME X",
    category: "FRAGANCIAS",
    unitPrice: 90000,
    supplierPrice: 0,
    imageUrl: null,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    ...overrides,
  };
}

function makeSettings(overrides: Partial<LabelSettings> = {}): LabelSettings {
  return { ...defaultSettings, email: "hola@purpleshop.co", facebookUser: "@purpleshop", ...overrides };
}

describe("renderCatalogPdfBuffer", () => {
  it("renders a PDF with an empty catalog without throwing", async () => {
    const buffer = await renderCatalogPdfBuffer([], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("renders a PDF for products without photos", async () => {
    const buffer = await renderCatalogPdfBuffer([makeProduct({})], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("falls back to a placeholder when a product photo fails to download", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const buffer = await renderCatalogPdfBuffer([makeProduct({ imageUrl: "https://x.test/foto.png" })], makeSettings());
    expect(buffer.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("never fetches an imageUrl outside the Supabase product-images bucket (SSRF guard)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const buffer = await renderCatalogPdfBuffer(
      [makeProduct({ imageUrl: "http://169.254.169.254/latest/meta-data" })],
      makeSettings(),
    );
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
