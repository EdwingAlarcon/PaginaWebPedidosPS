import type { ProductCode } from "@/lib/business-types";

export type ProductCodeCategoryGroup = { category: string; products: ProductCode[] };

export function groupProductCodesByCategory(products: ProductCode[]): ProductCodeCategoryGroup[] {
  const byCategory = new Map<string, ProductCode[]>();
  for (const product of products) {
    const key = product.category.trim();
    const bucket = byCategory.get(key) ?? [];
    bucket.push(product);
    byCategory.set(key, bucket);
  }

  const categories = [...byCategory.keys()].sort((a, b) => {
    if (a === "" && b === "") return 0;
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b, "es", { sensitivity: "base" });
  });

  return categories.map((category) => ({
    category,
    products: [...(byCategory.get(category) ?? [])].sort((a, b) =>
      a.productName.localeCompare(b.productName, "es", { sensitivity: "base" }),
    ),
  }));
}
