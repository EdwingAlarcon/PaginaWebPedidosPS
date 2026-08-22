import { describe, expect, it } from "vitest";
import { resolveCustomerAlias } from "@/lib/customer-aliases";

describe("resolveCustomerAlias", () => {
  it.each([
    ["johanna", "JOHANNA CICACHA"],
    ["ZAIDA", "ZAIDA SUAREZ"],
    ["lina", "LINA GONZALEZ"],
    ["paula", "PAULA BAJONERO"],
  ])("maps %s to %s", (input, expected) => {
    expect(resolveCustomerAlias(input)).toBe(expected);
  });

  it("keeps unknown names normalized", () => {
    expect(resolveCustomerAlias("  Andrea Ubaque ")).toBe("ANDREA UBAQUE");
  });
});
