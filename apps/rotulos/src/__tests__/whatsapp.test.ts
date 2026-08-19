import { describe, expect, it } from "vitest";
import { buildWhatsAppLink, normalizePhoneForWhatsApp } from "@/lib/whatsapp";

describe("normalizePhoneForWhatsApp", () => {
  it("adds the Colombia country code to a 10-digit local number", () => {
    expect(normalizePhoneForWhatsApp("300 111 1111")).toBe("573001111111");
  });

  it("keeps a number that already has the country code", () => {
    expect(normalizePhoneForWhatsApp("+57 300 111 1111")).toBe("573001111111");
  });

  it("returns an empty string for an empty phone", () => {
    expect(normalizePhoneForWhatsApp("")).toBe("");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with the normalized phone and encoded text", () => {
    const link = buildWhatsAppLink("3001111111", "Hola & gracias");

    expect(link).toBe("https://wa.me/573001111111?text=Hola%20%26%20gracias");
  });

  it("falls back to a link without a phone when there is none", () => {
    const link = buildWhatsAppLink("", "Hola");

    expect(link).toBe("https://wa.me/?text=Hola");
  });
});
