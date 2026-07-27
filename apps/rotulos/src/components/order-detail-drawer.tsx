"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCop } from "@/lib/format";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderEdit, OrderRecord } from "@/lib/business-types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";

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

function latestAdjustment(notes: string): string {
  const line = notes
    .split("\n")
    .map((item) => item.trim())
    .reverse()
    .find((item) => item.startsWith("AJUSTE:"));
  return line?.replace(/^AJUSTE:\s*/, "") ?? "";
}

const FIELD_LABELS: Record<string, string> = {
  customer: "Cliente",
  orderDate: "Fecha",
  status: "Estado",
  notes: "Notas",
  discount: "Descuento",
  shippingCost: "Envio",
  subtotal: "Subtotal",
  total: "Total",
};

const CURRENCY_FIELDS = new Set(["discount", "shippingCost", "subtotal", "total"]);

function formatEditValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (CURRENCY_FIELDS.has(field)) return formatCop(Number(value));
  if (field === "customer" && typeof value === "object") {
    return String((value as { fullName?: string }).fullName ?? "-");
  }
  return String(value);
}

type ItemChange = {
  id: string;
  productName: string;
  removed?: boolean;
  quantity?: { before: number; after: number };
  unitPrice?: { before: number; after: number };
};

function formatItemChange(item: ItemChange): string {
  if (item.removed) return "linea eliminada";
  const parts: string[] = [];
  if (item.quantity) parts.push(`cantidad ${item.quantity.before} -> ${item.quantity.after}`);
  if (item.unitPrice) parts.push(`precio ${formatCop(item.unitPrice.before)} -> ${formatCop(item.unitPrice.after)}`);
  return parts.join(", ");
}

function OrderEditEntry({ edit }: { edit: OrderEdit }) {
  const fieldEntries = Object.entries(edit.changes).filter(([key]) => key !== "items");
  const itemChanges = (edit.changes.items as ItemChange[] | undefined) ?? [];
  return (
    <div className="border-b border-border py-3 text-sm last:border-0">
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>{new Date(edit.changedAt).toLocaleString("es-CO")}</span>
        <span>{edit.changedBy}</span>
      </div>
      <ul className="mt-1 space-y-1">
        {fieldEntries.map(([field, value]) => {
          const { before, after } = value as { before: unknown; after: unknown };
          return (
            <li key={field}>
              <span className="font-medium text-foreground">{FIELD_LABELS[field] ?? field}:</span>{" "}
              {formatEditValue(field, before)} -&gt; {formatEditValue(field, after)}
            </li>
          );
        })}
        {itemChanges.map((item) => (
          <li key={item.id}>
            <span className="font-medium text-foreground">{item.productName}:</span> {formatItemChange(item)}
          </li>
        ))}
      </ul>
      {edit.reason ? <p className="mt-1 text-xs text-foreground-muted">Motivo: {edit.reason}</p> : null}
    </div>
  );
}

export function OrderDetailDrawer({ order, onEdit }: OrderDetailDrawerProps) {
  const adjustment = latestAdjustment(order.notes);
  const [edits, setEdits] = useState<OrderEdit[]>([]);

  useEffect(() => {
    let active = true;
    getBusinessStore()
      .listOrderEdits(order.id)
      .then((result) => {
        if (active) setEdits(result);
      })
      .catch(() => {
        if (active) setEdits([]);
      });
    return () => {
      active = false;
    };
  }, [order.id]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" asChild>
          <Link href={`/crear?fromOrderId=${order.id}`}>Generar rotulo</Link>
        </Button>
        {onEdit ? (
          <Button type="button" size="sm" onClick={onEdit}>
            Editar pedido
          </Button>
        ) : null}
      </div>

      <Card className="shadow-none">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Resumen</CardTitle>
          <div className="flex flex-wrap justify-end gap-2">
            {adjustment ? <Badge variant="primary">Pedido ajustado</Badge> : null}
            <StatusBadge status={order.status} />
          </div>
        </div>
        <dl className="mt-4">
          {adjustment ? <DetailRow label="Ultimo ajuste" value={adjustment} /> : null}
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

      {edits.length > 0 ? (
        <Card className="shadow-none">
          <CardTitle>Historial de cambios</CardTitle>
          <div className="mt-4">
            {edits.map((edit) => (
              <OrderEditEntry key={edit.id} edit={edit} />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
