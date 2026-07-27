import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/middleware";

describe("isPublicPath", () => {
  it("trata /login y sus subrutas como publicas", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/algo")).toBe(true);
  });

  it("trata /auth/callback y sus subrutas como publicas", () => {
    expect(isPublicPath("/auth/callback")).toBe(true);
  });

  it("trata rutas privadas y rutas parecidas a /login como no publicas", () => {
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/pedidos")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
  });
});
