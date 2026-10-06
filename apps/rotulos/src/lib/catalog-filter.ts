export const ALL_CATEGORIES = "all";

export interface CatalogFilterOption {
  value: string;
  label: string;
}

// MUJER y HOMBRE son los valores guardados en el catalogo de perfumes; se
// muestran con una etiqueta explicita para no confundirlos con accesorios.
const PERFUME_LABELS: Record<string, string> = {
  MUJER: "Perfumes mujer",
  HOMBRE: "Perfumes hombre",
};
const PERFUME_ORDER = Object.keys(PERFUME_LABELS);

function normalizeCategory(category: string): string {
  return category.trim().toUpperCase();
}

function titleCase(category: string): string {
  const lower = category.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function matchesCategoryFilter(category: string, filter: string): boolean {
  if (filter === ALL_CATEGORIES) return true;
  return normalizeCategory(category) === filter;
}

// Las opciones salen de las categorias que existen en el catalogo, asi una
// categoria nueva (joyas, bolsos...) aparece sin tocar codigo.
export function catalogFilterOptions(categories: string[]): CatalogFilterOption[] {
  const present = new Set(categories.map(normalizeCategory).filter(Boolean));
  const perfumes = PERFUME_ORDER.filter((value) => present.has(value));
  const others = [...present].filter((value) => !(value in PERFUME_LABELS)).sort((a, b) => a.localeCompare(b, "es"));
  return [
    { value: ALL_CATEGORIES, label: "Todos los productos" },
    ...perfumes.map((value) => ({ value, label: PERFUME_LABELS[value] })),
    ...others.map((value) => ({ value, label: titleCase(value) })),
  ];
}
