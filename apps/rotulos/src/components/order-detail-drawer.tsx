"use client";

import { formatCop } from "@/lib/format";
import type { OrderRecord } from "@/lib/business-types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

type OrderDetailDrawerProps = {
  order: OrderRecord;
  onEdit?: () => void;
};

function valueOrDash(value: string | number | null | undefined): string {
  const text = String(value ?? "").trim();
  return text || "-";
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <dt className="text-foreground-muted">{label}</dt>
      <dd className="text-right font-medium text-foreground">{valueOrDash(value)}</dd>
    </div>
  );
}

export function OrderDetailDrawer({ order, onEdit }: OrderDetailDrawerProps) {
  return (
    <div className="flex flex-col gap-4">
      {onEdit ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={onEdit}>
            Editar pedido
          </Button>
        </div>
      ) : null}

      <Card className="shadow-none">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Resumen</CardTitle>
          <StatusBadge status={order.status} />
        </div>
        <dl className="mt-4">
          <DetailRow label="Fecha" value={order.orderDate} />
          <DetailRow label="Subtotal" value={formatCop(order.subtotal)} />
          <DetailRow label="Descuento" value={formatCop(order.discount)} />
          <DetailRow label="Envio" value={formatCop(order.shippingCost)} />
          <DetailRow label="Total" value={formatCop(order.total)} />
          <DetailRow label="Notas" value={order.notes} />
        </dl>
      </Card>

      <Card className="shadow-none">
        <CardTitle>Cliente</CardTitle>
        <dl className="mt-4">
          <DetailRow label="Nombre" value={order.customer.fullName} />
          <DetailRow label="Telefono" value={order.customer.phone} />
          <DetailRow label="Email" value={order.customer.email} />
          <DetailRow label="Departamento" value={order.customer.department} />
          <DetailRow label="Ciudad" value={order.customer.city} />
          <DetailRow label="Localidad" value={order.customer.locality} />
          <DetailRow label="Barrio / sector" value={order.customer.neighborhood} />
          <DetailRow label="Direccion" value={order.customer.address} />
        </dl>
      </Card>

      <Card className="shadow-none">
        <CardTitle>Productos</CardTitle>
        {order.items.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">Este pedido no tiene productos registrados.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-foreground-muted">
                  <th className="py-2 pr-3 text-left font-semibold">Producto</th>
                  <th className="px-3 py-2 text-left font-semibold">Codigo</th>
                  <th className="px-3 py-2 text-right font-semibold">Cant.</th>
                  <th className="px-3 py-2 text-right font-semibold">Precio</th>
                  <th className="py-2 pl-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-3">
                      <span className="block font-medium text-foreground">{item.productName}</span>
                      <span className="text-xs text-foreground-muted">{valueOrDash(item.category)}</span>
                    </td>
                    <td className="px-3 py-2 text-foreground-muted">{valueOrDash(item.productCode)}</td>
                    <td className="px-3 py-2 text-right text-foreground">{item.quantity}</td>
                    <td className="px-3 py-2 text-right text-foreground">{formatCop(item.unitPrice)}</td>
                    <td className="py-2 pl-3 text-right font-medium text-foreground">{formatCop(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
