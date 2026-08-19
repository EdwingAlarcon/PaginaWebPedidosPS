"use client";

import { useState } from "react";
import { Download, ImageDown, MessageCircle } from "lucide-react";
import { formatCop, formatDate } from "@/lib/format";
import { buildCustomerHistoryText, buildWhatsAppLink, downloadOrderSummaryPdf } from "@/lib/order-summary";
import { downloadBlob, renderCustomerHistoryImage } from "@/lib/order-summary-image";
import { collectAlternateContacts } from "@/lib/customer-orders";
import type { Customer, OrderRecord } from "@/lib/business-types";
import type { LabelRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type CustomerOrderHistoryProps = {
  customer: Customer;
  orders: OrderRecord[];
  labels?: LabelRecord[];
};

export function CustomerOrderHistory({ customer, orders, labels = [] }: CustomerOrderHistoryProps) {
  const toast = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const sorted = [...orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);
  const orderIds = new Set(orders.map((order) => order.id));
  const labelCount = labels.filter((label) => label.orderId && orderIds.has(label.orderId)).length;
  const alternateContacts = collectAlternateContacts(customer, orders);

  function handleSendWhatsApp() {
    const text = buildCustomerHistoryText(customer, orders);
    window.open(buildWhatsAppLink(customer.phone, text), "_blank", "noopener,noreferrer");
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true);
    try {
      await downloadOrderSummaryPdf({ customer, orders }, `historial-${customer.fullName}.pdf`);
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar el PDF del historial." });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleDownloadImage() {
    setDownloadingImage(true);
    try {
      const blob = await renderCustomerHistoryImage(customer, orders);
      await downloadBlob(blob, `historial-${customer.fullName}.png`);
    } catch {
      toast.push({ variant: "danger", title: "No se pudo generar la imagen del historial." });
    } finally {
      setDownloadingImage(false);
    }
  }

  return (
    <div className="grid gap-4">
      {alternateContacts.length > 0 ? (
        <Card className="shadow-none">
          <CardTitle>Otros datos usados</CardTitle>
          <p className="mt-1 text-xs text-foreground-muted">
            Telefonos o direcciones distintos al dato actual, encontrados en pedidos de este cliente.
          </p>
          <dl className="mt-3 grid gap-3">
            {alternateContacts.map((contact) => (
              <div key={contact.key} className="flex justify-between gap-4 border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                <dt className="text-foreground">
                  {contact.phone ? <span className="block font-medium">{contact.phone}</span> : null}
                  {contact.address ? (
                    <span className="block text-foreground-muted">
                      {contact.address}
                      {contact.city ? `, ${contact.city}` : ""}
                    </span>
                  ) : null}
                </dt>
                <dd className="whitespace-nowrap text-right text-xs text-foreground-muted">
                  {contact.count} pedido{contact.count === 1 ? "" : "s"}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      <Card className="shadow-none">
      <CardTitle>Historial de compras</CardTitle>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-muted">Este cliente todavia no tiene pedidos registrados.</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleSendWhatsApp} disabled={!customer.phone}>
              <MessageCircle className="size-4" aria-hidden="true" />
              Enviar por WhatsApp
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleDownloadPdf} loading={downloadingPdf}>
              <Download className="size-4" aria-hidden="true" />
              Descargar PDF
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleDownloadImage} loading={downloadingImage}>
              <ImageDown className="size-4" aria-hidden="true" />
              Descargar imagen
            </Button>
          </div>
          <dl className="mt-4">
            {sorted.map((order) => (
              <div key={order.id} className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
                <dt className="text-foreground-muted">
                  {formatDate(order.orderDate)} - {order.items.length} producto(s)
                </dt>
                <dd className="text-right font-medium text-foreground">{formatCop(order.total)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-semibold text-foreground">
            <span>Total comprado</span>
            <span>{formatCop(grandTotal)}</span>
          </div>
          {labelCount > 0 ? (
            <p className="mt-2 text-xs text-foreground-muted">
              {labelCount} rotulo{labelCount === 1 ? "" : "s"} generado{labelCount === 1 ? "" : "s"} para este cliente.
            </p>
          ) : null}
        </>
      )}
      </Card>
    </div>
  );
}
