import { describe, expect, it } from "vitest";
import { matchesGenderFilter } from "./catalog-filter";

describe("matchesGenderFilter", () => {
  it("matches everything when filter is 'all'", () => {
    expect(matchesGenderFilter("MUJER", "all")).toBe(true);
    expect(matchesGenderFilter("HOMBRE", "all")).toBe(true);
    expect(matchesGenderFilter("", "all")).toBe(true);
  });

  it("matches only the exact category, case/space insensitive", () => {
    expect(matchesGenderFilter("MUJER", "MUJER")).toBe(true);
    expect(matchesGenderFilter(" mujer ", "MUJER")).toBe(true);
    expect(matchesGenderFilter("HOMBRE", "MUJER")).toBe(false);
    expect(matchesGenderFilter("", "HOMBRE")).toBe(false);
  });
});
