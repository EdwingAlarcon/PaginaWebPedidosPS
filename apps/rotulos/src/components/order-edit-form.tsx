"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderDraft, OrderRecord } from "@/lib/business-types";
import {
  isBogotaLocation,
  isValidBogotaLocality,
  isValidBogotaNeighborhoodForLocality,
  validateDepartmentCity,
} from "@/lib/location";
import { normalizeOrderDraft } from "@/lib/normalize";
import { formatCop } from "@/lib/format";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { LocationFields } from "@/components/location-fields";

type OrderEditValue = Pick<OrderDraft, "customer" | "orderDate" | "status" | "notes" | "discount" | "shippingCost">;

type OrderEditFormProps = {
  order: OrderRecord;
  onSaved: (order: OrderRecord) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function orderToFormValue(order: OrderRecord): OrderEditValue {
  return {
    customer: {
      fullName: order.customer.fullName,
      phone: order.customer.phone,
      email: order.customer.email,
      department: order.customer.department,
      city: order.customer.city,
      locality: order.customer.locality ?? "",
      address: order.customer.address,
      neighborhood: order.customer.neighborhood,
    },
    orderDate: order.orderDate,
    status: order.status,
    notes: order.notes,
    discount: order.discount,
    shippingCost: order.shippingCost,
  };
}

function validateOrder(value: OrderEditValue): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.customer.fullName.trim()) errors.customer = "El nombre del cliente es obligatorio.";
  if (!value.orderDate.trim()) errors.orderDate = "La fecha es obligatoria.";
  if (value.discount < 0) errors.discount = "El descuento no puede ser negativo.";
  if (value.shippingCost < 0) errors.shippingCost = "El envio no puede ser negativo.";

  const locationError = validateDepartmentCity(value.customer);
  if (locationError === "department") errors["customer.department"] = "Selecciona un departamento valido.";
  if (locationError === "city") errors["customer.city"] = "Selecciona una ciudad que pertenezca al departamento.";
  if (isBogotaLocation(value.customer) && value.customer.locality && !isValidBogotaLocality(value.customer.locality)) {
    errors["customer.locality"] = "Selecciona una localidad valida de Bogota.";
  }
  if (
    isBogotaLocation(value.customer) &&
    value.customer.locality &&
    value.customer.neighborhood &&
    !isValidBogotaNeighborhoodForLocality(value.customer.locality, value.customer.neighborhood)
  ) {
    errors["customer.neighborhood"] = "Selecciona un barrio que pertenezca a la localidad.";
  }
  return errors;
}

export function OrderEditForm({ order, onSaved, onCancel, onDirtyChange }: OrderEditFormProps) {
  const initialValue = useMemo(() => orderToFormValue(order), [order]);
  const [value, setValue] = useState<OrderEditValue>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(initialValue);
  const subtotal = order.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - value.discount + value.shippingCost);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  function setCustomerField(field: keyof OrderEditValue["customer"], nextValue: string) {
    setValue((current) => ({ ...current, customer: { ...current.customer, [field]: nextValue } }));
  }

  function cancel() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres cerrar sin guardar?")) return;
    onCancel();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validateOrder(value);
    setErrors(nextErrors);
    setStatus(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const normalized = normalizeOrderDraft({ ...value, items: order.items });
      const saved = await getBusinessStore().updateOrder(order.id, {
        customer: normalized.customer,
        orderDate: normalized.orderDate,
        status: normalized.status,
        notes: normalized.notes,
        discount: normalized.discount,
        shippingCost: normalized.shippingCost,
      });
      setStatus({ tone: "success", message: "Pedido actualizado." });
      onSaved(saved);
    } catch {
      setStatus({ tone: "danger", message: "No se pudo actualizar el pedido. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {status ? <Alert variant={status.tone}>{status.message}</Alert> : null}
      <Alert variant="info">
        Los productos, cantidades y precios quedan solo en consulta por ahora para no afectar inventario ni trazabilidad.
      </Alert>

      <Card className="shadow-none">
        <CardTitle>Cliente</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" required error={errors.customer} className="sm:col-span-2">
            <Input value={value.customer.fullName} onChange={(event) => setCustomerField("fullName", event.target.value)} />
          </FormField>
          <FormField label="Telefono">
            <Input value={value.customer.phone} onChange={(event) => setCustomerField("phone", event.target.value)} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={value.customer.email} onChange={(event) => setCustomerField("email", event.target.value)} />
          </FormField>
          <LocationFields
            value={value.customer}
            onChange={(customer) =>
              setValue((current) => ({
                ...current,
                customer: typeof customer === "function" ? customer(current.customer) : customer,
              }))
            }
            errors={errors}
            prefix="customer"
            addressLabel="Direccion"
            addressAsTextarea
            addressRows={2}
            includeNeighborhood
            required={false}
          />
        </div>
      </Card>

      <Card className="shadow-none">
        <CardTitle>Pedido</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Fecha" required error={errors.orderDate}>
            <DatePicker value={value.orderDate} onChange={(event) => setValue((current) => ({ ...current, orderDate: event.target.value }))} />
          </FormField>
          <FormField label="Estado">
            <Select value={value.status} onChange={(event) => setValue((current) => ({ ...current, status: event.target.value as OrderRecord["status"] }))}>
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </Select>
          </FormField>
          <FormField label="Descuento" error={errors.discount}>
            <CurrencyInput value={value.discount} onValueChange={(discount) => setValue((current) => ({ ...current, discount }))} />
          </FormField>
          <FormField label="Envio" error={errors.shippingCost}>
            <CurrencyInput value={value.shippingCost} onValueChange={(shippingCost) => setValue((current) => ({ ...current, shippingCost }))} />
          </FormField>
          <FormField label="Notas" className="sm:col-span-2">
            <Textarea value={value.notes} rows={4} onChange={(event) => setValue((current) => ({ ...current, notes: event.target.value }))} />
          </FormField>
        </div>
      </Card>

      <Card className="shadow-none">
        <CardTitle>Totales</CardTitle>
        <dl className="mt-4 flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Subtotal</dt>
            <dd className="text-foreground">{formatCop(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Descuento</dt>
            <dd className="text-foreground">-{formatCop(value.discount)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground-muted">Envio</dt>
            <dd className="text-foreground">{formatCop(value.shippingCost)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCop(total)}</dd>
          </div>
        </dl>
      </Card>

      <div className="sticky bottom-0 -mx-5 mt-2 flex justify-end gap-2 border-t border-border bg-surface px-5 py-4">
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={!dirty}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
