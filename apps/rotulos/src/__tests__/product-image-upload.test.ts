import { describe, expect, it } from "vitest";
import { validateProductImageFile } from "@/lib/product-image-upload";

function makeFile(type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], "foto.jpg", { type });
}

describe("validateProductImageFile", () => {
  it("accepts jpeg and png under 5MB", () => {
    expect(validateProductImageFile(makeFile("image/jpeg", 1024))).toBeNull();
    expect(validateProductImageFile(makeFile("image/png", 1024))).toBeNull();
  });

  it("rejects other file types", () => {
    expect(validateProductImageFile(makeFile("application/pdf", 1024))).toBe("Solo se permiten fotos JPG o PNG.");
  });

  it("rejects files over 5MB", () => {
    expect(validateProductImageFile(makeFile("image/jpeg", 6 * 1024 * 1024))).toBe("La foto no puede pesar mas de 5MB.");
  });
});
