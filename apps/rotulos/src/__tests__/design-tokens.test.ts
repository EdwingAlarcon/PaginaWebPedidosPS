import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf-8");

describe("design tokens de PurpleShop Commerce OS", () => {
  it("define la escala de marca purple-50..950", () => {
    expect(css).toContain("--purple-950: #2E1065");
    expect(css).toContain("--purple-900: #4C1D95");
    expect(css).toContain("--purple-800: #5B21B6");
    expect(css).toContain("--purple-700: #6D28D9");
    expect(css).toContain("--purple-600: #7C3AED");
    expect(css).toContain("--purple-500: #8B5CF6");
    expect(css).toContain("--purple-400: #A78BFA");
    expect(css).toContain("--purple-300: #C4B5FD");
    expect(css).toContain("--purple-200: #DDD6FE");
    expect(css).toContain("--purple-100: #EDE9FE");
    expect(css).toContain("--purple-50: #F5F3FF");
  });

  it("define la escala tipografica de utilidades", () => {
    expect(css).toContain(".text-display {");
    expect(css).toContain(".text-page-title {");
    expect(css).toContain(".text-section-title {");
    expect(css).toContain(".text-card-title {");
  });

  it("define utilidades glass para ambos temas", () => {
    expect(css).toContain(".glass {");
    expect(css).toContain(".glass-strong {");
    expect(css).toContain("--glass-bg: rgba(255, 255, 255, 0.72)");
    expect(css).toContain("--glass-bg: rgba(28, 23, 40, 0.72)");
  });

  it("usa la fuente Plus Jakarta Sans como principal", () => {
    expect(css).toContain("--font-sans: var(--font-plus-jakarta)");
  });
});
