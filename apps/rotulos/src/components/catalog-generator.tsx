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

export function CatalogGenerator() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
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

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
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
      const blob = await response.blob();
      await downloadBlob(blob, "catalogo-purple-shop.pdf");
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar el PDF del catalogo." });
    } finally {
      setDownloadingPdf(false);
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
      <Button variant="secondary" asChild>
        <a href={buildWhatsAppLink("", "Hola! Te comparto nuestro catalogo de productos.")} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" aria-hidden="true" />
          Abrir WhatsApp
        </a>
      </Button>
    </Card>
  );
}
