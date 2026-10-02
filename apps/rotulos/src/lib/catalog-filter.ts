export const CATALOG_GENDER_FILTERS = ["all", "MUJER", "HOMBRE"] as const;
export type CatalogGenderFilter = (typeof CATALOG_GENDER_FILTERS)[number];

export function matchesGenderFilter(category: string, filter: CatalogGenderFilter): boolean {
  if (filter === "all") return true;
  return category.trim().toUpperCase() === filter;
}
