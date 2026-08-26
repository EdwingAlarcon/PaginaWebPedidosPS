import { describe, expect, it } from "vitest";
import { paginateProductsForImages } from "@/lib/catalog-image";
import type { ProductCode } from "@/lib/business-types";

// No se agrega test de canvas: jsdom no simula canvas.toBlob de forma util
// (mismo motivo documentado en el plan de la Task 9 del catalogo). La
// paginacion, que es la parte con logica real, se testea aqui aislada del
// canvas.

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

describe("paginateProductsForImages", () => {
  it("splits a large catalog into multiple pages instead of one oversized image", () => {
    const products = Array.from({ length: 319 }, (_, i) => makeProduct({ id: `${i}`, code: `COD-${i}` }));
    const pages = paginateProductsForImages(products);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.flat()).toHaveLength(319);
    for (const page of pages) {
      expect(page.length).toBeLessThanOrEqual(40);
    }
  });

  it("returns a single page for a small catalog", () => {
    const products = Array.from({ length: 5 }, (_, i) => makeProduct({ id: `${i}`, code: `COD-${i}` }));
    expect(paginateProductsForImages(products)).toHaveLength(1);
  });

  it("returns one empty page for an empty catalog", () => {
    expect(paginateProductsForImages([])).toEqual([[]]);
  });
});
