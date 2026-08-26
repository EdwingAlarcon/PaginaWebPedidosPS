"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, MessageCircle } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import { getLabelStore } from "@/lib/label-store";
import { renderCatalogImage } from "@/lib/catalog-image";
import { downloadBlob } from "@/lib/order-summary-image";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function CatalogGenerator() {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const toast = useToast();

  async function loadCatalogData() {
    const [products, settings] = await Promise.all([
      getBusinessStore().listProductCodes(),
      getLabelStore().getSettings(),
    ]);
    return { products, settings };
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      const { products, settings } = await loadCatalogData();
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

  async function handleDownloadImage() {
    setDownloadingImage(true);
    try {
      const { products, settings } = await loadCatalogData();
      const blob = await renderCatalogImage(products, settings);
      await downloadBlob(blob, "catalogo-purple-shop.png");
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar la imagen del catalogo." });
    } finally {
      setDownloadingImage(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-center gap-3">
      <Button onClick={handleDownloadPdf} loading={downloadingPdf}>
        <Download className="size-4" aria-hidden="true" />
        Descargar PDF
      </Button>
      <Button variant="secondary" onClick={handleDownloadImage} loading={downloadingImage}>
        <ImageIcon className="size-4" aria-hidden="true" />
        Descargar imagen
      </Button>
      <Button variant="secondary" asChild>
        <a href={buildWhatsAppLink("", "Hola! Te comparto nuestro catalogo de productos.")} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4" aria-hidden="true" />
          Abrir WhatsApp
        </a>
      </Button>
    </Card>
  );
}
