import { describe, expect, it } from "vitest";
import { buildReceiptUrl, parseInterrapidisimoReceipt } from "@/lib/interrapidisimo-receipt";

const RECEIPT_URL = "https://www3.interrapidisimo.com/ListaFacturaPreEnvios/Consolidada?Comprobante=MTg5MjY4NTUy";

// Texto tal como lo devuelve la pagina "Ver detalles" sin separadores entre celdas.
const GLUED_PAGE_TEXT = `Apreciado cliente, gracias por utilizar nuestros servicios
Comprobante No.

189268552
Número de guíaDestinatarioDestinoForma de PagoSeguimiento
700209981331ZAIDA SUAREZBOGOTA\\CUND\\COLContado
Seguir envío`;

// Texto copiado desde el celular: celdas separadas por tabulador.
const TABBED_PAGE_TEXT = `Comprobante No.
189268552
Número de guía\tDestinatario\tDestino\tForma de Pago\tSeguimiento
700209981331\tZAIDA SUAREZ\tBOGOTA\\CUND\\COL\tContado\tSeguir envío
700209981342\tANDREA UBAQUE\tSANTA MARTA\\MAG\\COL\tContado\tSeguir envío`;

describe("parseInterrapidisimoReceipt", () => {
  it("reads the receipt number from the shared link", () => {
    const parsed = parseInterrapidisimoReceipt(`Mira esto ${RECEIPT_URL}`);
    expect(parsed.receiptNumber).toBe("189268552");
    expect(parsed.receiptUrl).toBe(RECEIPT_URL);
    expect(parsed.shipments).toEqual([]);
  });

  it("parses shipments from page text without cell separators", () => {
    const parsed = parseInterrapidisimoReceipt(GLUED_PAGE_TEXT);
    expect(parsed.receiptNumber).toBe("189268552");
    expect(parsed.receiptUrl).toBe(RECEIPT_URL);
    expect(parsed.shipments).toEqual([
      { trackingNumber: "700209981331", recipientName: "ZAIDA SUAREZBOGOTA", city: "", department: "CUND" },
    ]);
  });

  it("splits recipient and city when cells are separated", () => {
    const parsed = parseInterrapidisimoReceipt(TABBED_PAGE_TEXT);
    expect(parsed.shipments).toEqual([
      { trackingNumber: "700209981331", recipientName: "ZAIDA SUAREZ", city: "BOGOTA", department: "CUND" },
      { trackingNumber: "700209981342", recipientName: "ANDREA UBAQUE", city: "SANTA MARTA", department: "MAG" },
    ]);
  });

  it("returns nothing useful for the carrier WhatsApp text alone", () => {
    const parsed = parseInterrapidisimoReceipt(
      "¡Hola! Admitimos tus envíos exitosamente. Si encuentras algún dato incorrecto tuyo o del destinatario, puedes comunicarte al 3232554455.",
    );
    expect(parsed).toEqual({ receiptNumber: null, receiptUrl: null, shipments: [] });
  });
});

describe("buildReceiptUrl", () => {
  it("encodes the receipt number like the carrier link", () => {
    expect(buildReceiptUrl("189268552")).toBe(RECEIPT_URL);
  });
});
