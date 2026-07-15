import { describe, expect, it } from "vitest";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { renderLabelPdfHtml } from "@/lib/pdf";

describe("renderLabelPdfHtml", () => {
  it("renders a 14cm x 11cm print document with key label content", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000777";
    draft.carrier = "Coordinadora";
    draft.packageCount = 2;
    draft.recipient.fullName = "Ana Perez";
    draft.recipient.address = "Carrera 45 # 10-20";

    const html = renderLabelPdfHtml(draft, defaultSettings, { origin: "https://purpleshop.test" });

    expect(html).toContain("@page { size: 14cm 11cm; margin: 0; }");
    expect(html).toContain("width: 14cm;");
    expect(html).toContain("height: 11cm;");
    expect(html).toContain("PS-2026-000777");
    expect(html).toContain("Coordinadora");
    expect(html).toContain("2 paquetes");
    expect(html).toContain("Ana Perez");
    expect(html).toContain("Carrera 45 # 10-20");
    expect(html).toContain('src="https://purpleshop.test/purple-shop-logo.png"');
    expect(html).toContain('src="https://purpleshop.test/purple-shop-qr.png"');
  });

  it("escapes user controlled fields before embedding them in HTML", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = `PS-<script>alert("x")</script>`;
    draft.recipient.fullName = `<img src=x onerror=alert("x")>`;
    draft.recipient.notes = "Fragil & urgente";

    const html = renderLabelPdfHtml(draft, defaultSettings);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("PS-&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=alert(&quot;x&quot;)&gt;");
    expect(html).toContain("Fragil &amp; urgente");
  });
});
