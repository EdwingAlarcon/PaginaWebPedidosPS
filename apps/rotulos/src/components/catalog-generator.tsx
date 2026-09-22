"use client";

import { useEffect, useState } from "react";
import { Download, MessageCircle } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { downloadBlob } from "@/lib/order-summary-image";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/toast";

const CATALOG_FILENAME = "catalogo-purple-shop.pdf";
const WHATSAPP_MESSAGE = "Hola! Te comparto nuestro catalogo de productos.";

export function CatalogGenerator() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  // Un catalogo con tarjetas "SIN FOTO" se ve incompleto al compartirlo: por defecto solo se incluyen productos con foto.
  const [onlyWithPhoto, setOnlyWithPhoto] = useState(true);
  const [counts, setCounts] = useState<{ total: number; withoutPhoto: number } | null>(null);
  const toast = useToast();

  useEffect(() => {
    getBusinessStore()
      .listProductCodes()
      .then((products) => setCounts({ total: products.length, withoutPhoto: products.filter((product) => !product.imageUrl).length }))
      .catch(() => setCounts(null));
  }, []);

  async function generateCatalogPdf(): Promise<Blob> {
    const [allProducts, settings] = await Promise.all([
      getBusinessStore().listProductCodes(),
      getLabelStore().getSettings(),
    ]);
    const products = onlyWithPhoto ? allProducts.filter((product) => product.imageUrl) : allProducts;
    const response = await fetch("/api/catalog/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, settings }),
    });
    if (!response.ok) throw new Error("pdf_failed");
    return response.blob();
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const blob = await generateCatalogPdf();
      await downloadBlob(blob, CATALOG_FILENAME);
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar el PDF del catalogo." });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleShareWhatsApp() {
    setSharingWhatsApp(true);
    try {
      const blob = await generateCatalogPdf();
      const file = new File([blob], CATALOG_FILENAME, { type: "application/pdf" });
      const canShareFile = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

      if (canShareFile) {
        try {
          await navigator.share({ files: [file], text: WHATSAPP_MESSAGE });
          return;
        } catch (shareError) {
          // El usuario cancelo el dialogo de compartir: no es un error, no hacer nada mas.
          if (shareError instanceof Error && shareError.name === "AbortError") return;
        }
      }

      // Sin soporte para compartir archivos (ej. navegador de escritorio): bajamos el PDF
      // y abrimos WhatsApp aclarando que hay que adjuntarlo a mano.
      await downloadBlob(blob, CATALOG_FILENAME);
      window.open(
        buildWhatsAppLink("", `${WHATSAPP_MESSAGE} (Adjunta el PDF "${CATALOG_FILENAME}" que se acaba de descargar)`),
        "_blank",
        "noreferrer",
      );
    } catch {
      toast.push({ variant: "danger", title: "No se pudo preparar el catalogo para compartir." });
    } finally {
      setSharingWhatsApp(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Button onClick={handleDownloadPdf} loading={downloadingPdf}>
        <Download className="size-4" aria-hidden="true" />
        Descargar PDF
      </Button>
      {counts && counts.withoutPhoto > 0 ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <Checkbox
            checked={onlyWithPhoto}
            onCheckedChange={(checked) => setOnlyWithPhoto(checked === true)}
            aria-label="Incluir solo productos con foto"
          />
          <span>
            Solo productos con foto
            <span className="block text-xs text-foreground-muted">
              {onlyWithPhoto
                ? `Se omiten ${counts.withoutPhoto} de ${counts.total} sin foto`
                : `Incluye ${counts.withoutPhoto} tarjetas "SIN FOTO"`}
            </span>
          </span>
        </label>
      ) : null}
      <Button onClick={handleShareWhatsApp} loading={sharingWhatsApp}>
        <MessageCircle className="size-4" aria-hidden="true" />
        Compartir por WhatsApp
      </Button>
    </Card>
  );
}
