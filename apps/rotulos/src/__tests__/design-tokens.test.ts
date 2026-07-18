import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf-8");

describe("design tokens de PurpleShop", () => {
  it("define los tokens semanticos en :root", () => {
    expect(css).toContain("--background:");
    expect(css).toContain("--surface:");
    expect(css).toContain("--surface-muted:");
    expect(css).toContain("--foreground:");
    expect(css).toContain("--foreground-muted:");
    expect(css).toContain("--border:");
    expect(css).toContain("--primary:");
    expect(css).toContain("--primary-hover:");
    expect(css).toContain("--primary-foreground:");
    expect(css).toContain("--success:");
    expect(css).toContain("--warning:");
    expect(css).toContain("--danger:");
    expect(css).toContain("--focus-ring:");
  });

  it("redefine los tokens semanticos para [data-theme=dark]", () => {
    const darkBlock = css.split('[data-theme="dark"] {')[1] ?? "";
    expect(darkBlock).toContain("--background: #0f0b17");
    expect(darkBlock).toContain("--primary: #a78bfa");
    expect(darkBlock).toContain("--focus-ring:");
  });

  it("define la escala tipografica de utilidades", () => {
    expect(css).toContain(".text-display {");
    expect(css).toContain(".text-page-title {");
    expect(css).toContain(".text-section-title {");
    expect(css).toContain(".text-card-title {");
  });

  it("no usa utilidades glassmorphism", () => {
    expect(css).not.toContain(".glass {");
    expect(css).not.toContain(".glass-strong {");
    expect(css).not.toContain("--glass-bg");
  });

  it("usa Inter como fuente principal", () => {
    expect(css).toContain("--font-sans: var(--font-inter)");
  });
});
