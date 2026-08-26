import { describe, expect, it } from "vitest";
import { MAX_CATALOG_IMAGE_PRODUCTS, renderCatalogImage } from "@/lib/catalog-image";
import type { ProductCode } from "@/lib/business-types";
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

describe("renderCatalogImage", () => {
  it("rejects catalogs larger than the canvas can safely render", async () => {
    const products = Array.from({ length: MAX_CATALOG_IMAGE_PRODUCTS + 1 }, (_, i) => makeProduct({ id: `${i}`, code: `COD-${i}` }));
    await expect(renderCatalogImage(products, defaultSettings)).rejects.toThrow("catalog_too_large_for_image");
  });
});
