import { describe, expect, it } from "vitest";
import { groupProductCodesByCategory } from "@/lib/catalog";
import type { ProductCode } from "@/lib/business-types";

function makeProduct(overrides: Partial<ProductCode>): ProductCode {
  return {
    id: "id",
    code: "COD",
    productName: "PRODUCTO",
    category: "",
    unitPrice: 1000,
    imageUrl: null,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupProductCodesByCategory", () => {
  it("groups by category, sorts categories and products alphabetically, and puts blank category last", () => {
    const products = [
      makeProduct({ id: "1", productName: "ZAPATO", category: "ROPA" }),
      makeProduct({ id: "2", productName: "PERFUME B", category: "FRAGANCIAS" }),
      makeProduct({ id: "3", productName: "PERFUME A", category: "FRAGANCIAS" }),
      makeProduct({ id: "4", productName: "SIN CATEGORIA", category: "" }),
    ];

    const groups = groupProductCodesByCategory(products);

    expect(groups.map((g) => g.category)).toEqual(["FRAGANCIAS", "ROPA", ""]);
    expect(groups[0].products.map((p) => p.productName)).toEqual(["PERFUME A", "PERFUME B"]);
  });

  it("returns an empty array for an empty catalog", () => {
    expect(groupProductCodesByCategory([])).toEqual([]);
  });
});
