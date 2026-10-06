import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, catalogFilterOptions, matchesCategoryFilter } from "./catalog-filter";

describe("matchesCategoryFilter", () => {
  it("matches everything when filter is 'all'", () => {
    expect(matchesCategoryFilter("MUJER", ALL_CATEGORIES)).toBe(true);
    expect(matchesCategoryFilter("JOYAS", ALL_CATEGORIES)).toBe(true);
    expect(matchesCategoryFilter("", ALL_CATEGORIES)).toBe(true);
  });

  it("matches only the exact category, case/space insensitive", () => {
    expect(matchesCategoryFilter("MUJER", "MUJER")).toBe(true);
    expect(matchesCategoryFilter(" mujer ", "MUJER")).toBe(true);
    expect(matchesCategoryFilter("HOMBRE", "MUJER")).toBe(false);
    expect(matchesCategoryFilter("", "HOMBRE")).toBe(false);
  });
});

describe("catalogFilterOptions", () => {
  it("always offers 'all' first, even with no categories", () => {
    expect(catalogFilterOptions([])).toEqual([{ value: ALL_CATEGORIES, label: "Todos los productos" }]);
  });

  it("labels perfumes explicitly and lists them before other categories", () => {
    const options = catalogFilterOptions(["JOYAS", "HOMBRE", "MUJER", "BOLSOS"]);
    expect(options.map((option) => option.value)).toEqual([ALL_CATEGORIES, "MUJER", "HOMBRE", "BOLSOS", "JOYAS"]);
    expect(options.find((option) => option.value === "MUJER")?.label).toBe("Perfumes mujer");
    expect(options.find((option) => option.value === "HOMBRE")?.label).toBe("Perfumes hombre");
  });

  it("title-cases unknown categories and ignores blanks and duplicates", () => {
    const options = catalogFilterOptions(["joyas", " JOYAS ", "", "  ", "Bolsos y carteras"]);
    expect(options.map((option) => option.label)).toEqual(["Todos los productos", "Bolsos y carteras", "Joyas"]);
  });
});
