"use client";

import { useState } from "react";
import { Download, MessageCircle } from "lucide-react";
import { formatCop, formatDate } from "@/lib/format";
import { buildCustomerHistoryText, buildWhatsAppLink, downloadOrderSummaryPdf } from "@/lib/order-summary";
import type { Customer, OrderRecord } from "@/lib/business-types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

type CustomerOrderHistoryProps = {
  customer: Customer;
  orders: OrderRecord[];
};

export function CustomerOrderHistory({ customer, orders }: CustomerOrderHistoryProps) {
  const toast = useToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const sorted = [...orders].sort((a, b) => b.orderDate.localeCompare(a.orderDate));
  const grandTotal = orders.reduce((sum, order) => sum + order.total, 0);

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

  return (
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
        </>
      )}
    </Card>
  );
}
