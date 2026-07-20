"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";
import type { OrderRecord } from "@/lib/business-types";
import {
  isBogotaLocation,
  isValidBogotaLocality,
  isValidBogotaNeighborhoodForLocality,
  validateDepartmentCity,
} from "@/lib/location";
import { normalizeCustomerFields } from "@/lib/normalize";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LocationFields } from "@/components/location-fields";

type CustomerFormValue = Omit<Customer, "id" | "createdAt" | "updatedAt">;

type CustomerEditFormProps = {
  customer: Customer;
  onSaved: (customer: Customer, syncedOrders?: number) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

function customerToFormValue(customer: Customer): CustomerFormValue {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    department: customer.department,
    city: customer.city,
    locality: customer.locality ?? "",
    address: customer.address,
    neighborhood: customer.neighborhood,
  };
}

function validateCustomer(value: CustomerFormValue): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!value.fullName.trim()) errors.fullName = "El nombre del cliente es obligatorio.";

  const locationError = validateDepartmentCity(value);
  if (locationError === "department") errors["customer.department"] = "Selecciona un departamento valido.";
  if (locationError === "city") errors["customer.city"] = "Selecciona una ciudad que pertenezca al departamento.";

  if (isBogotaLocation(value) && value.locality && !isValidBogotaLocality(value.locality)) {
    errors["customer.locality"] = "Selecciona una localidad valida de Bogota.";
  }
  if (
    isBogotaLocation(value) &&
    value.locality &&
    value.neighborhood &&
    !isValidBogotaNeighborhoodForLocality(value.locality, value.neighborhood)
  ) {
    errors["customer.neighborhood"] = "Selecciona un barrio que pertenezca a la localidad.";
  }
  return errors;
}

function customerSnapshot(customer: Customer): CustomerFormValue {
  return {
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email,
    department: customer.department,
    city: customer.city,
    locality: customer.locality ?? "",
    address: customer.address,
    neighborhood: customer.neighborhood,
  };
}

function isEmpty(value: string | undefined): boolean {
  return !String(value ?? "").trim();
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function isShortNameOf(shortName: string, fullName: string): boolean {
  const short = normalizeName(shortName);
  const full = normalizeName(fullName);
  return Boolean(short) && short !== full && full.startsWith(`${short} `);
}

function isRelatedOrder(order: OrderRecord, customer: Pick<Customer, "id" | "fullName">): boolean {
  return (
    order.customerId === customer.id ||
    normalizeName(order.customer.fullName) === normalizeName(customer.fullName) ||
    isShortNameOf(order.customer.fullName, customer.fullName)
  );
}

function hasMissingCustomerData(order: OrderRecord): boolean {
  return ["fullName", "phone", "email", "department", "city", "locality", "address", "neighborhood"].some((field) =>
    isEmpty(order.customer[field as keyof OrderRecord["customer"]]),
  );
}

function fillMissingCustomerData(orderCustomer: OrderRecord["customer"], customer: Customer): CustomerFormValue {
  const source = customerSnapshot(customer);
  return {
    fullName: orderCustomer.fullName || source.fullName,
    phone: isEmpty(orderCustomer.phone) ? source.phone : orderCustomer.phone,
    email: isEmpty(orderCustomer.email) ? source.email : orderCustomer.email,
    department: isEmpty(orderCustomer.department) ? source.department : orderCustomer.department,
    city: isEmpty(orderCustomer.city) ? source.city : orderCustomer.city,
    locality: isEmpty(orderCustomer.locality) ? source.locality : (orderCustomer.locality ?? ""),
    address: isEmpty(orderCustomer.address) ? source.address : orderCustomer.address,
    neighborhood: isEmpty(orderCustomer.neighborhood) ? source.neighborhood : orderCustomer.neighborhood,
  };
}

export function CustomerEditForm({ customer, onSaved, onCancel, onDirtyChange }: CustomerEditFormProps) {
  const initialValue = useMemo(() => customerToFormValue(customer), [customer]);
  const [value, setValue] = useState<CustomerFormValue>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [missingDataOrderCount, setMissingDataOrderCount] = useState(0);
  const [syncPendingOrders, setSyncPendingOrders] = useState(false);
  const [fillMissingOrderData, setFillMissingOrderData] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(initialValue);
  const actionable = dirty || syncPendingOrders || fillMissingOrderData;

  useEffect(() => {
    onDirtyChange?.(actionable);
  }, [actionable, onDirtyChange]);

  useEffect(() => {
    let mounted = true;
    getBusinessStore()
      .listOrders()
      .then((orders) => {
        if (!mounted) return;
        const related = orders.filter((order) => isRelatedOrder(order, customer));
        setPendingOrderCount(related.filter((order) => order.status === "pending").length);
        setMissingDataOrderCount(related.filter((order) => hasMissingCustomerData(order)).length);
      })
      .catch(() => {
        if (mounted) {
          setPendingOrderCount(0);
          setMissingDataOrderCount(0);
        }
      });
    return () => {
      mounted = false;
    };
  }, [customer]);

  function setField(field: keyof CustomerFormValue, nextValue: string) {
    setValue((current) => ({ ...current, [field]: nextValue }));
  }

  function cancel() {
    if (dirty && !window.confirm("Hay cambios sin guardar. ¿Quieres cerrar sin guardar?")) return;
    onCancel();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    const nextErrors = validateCustomer(value);
    setErrors(nextErrors);
    setStatus(null);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const store = getBusinessStore();
      const normalized = normalizeCustomerFields(value);
      const saved = await store.updateCustomer(customer.id, normalized);
      let syncedOrders = 0;
      let completedMissingDataOrders = 0;
      if (syncPendingOrders) {
        const orders = await store.listOrders();
        const pendingOrders = orders.filter((order) => isRelatedOrder(order, saved) && order.status === "pending");
        await Promise.all(
          pendingOrders.map((order) =>
            store.updateOrder(order.id, {
              customer: customerSnapshot(saved),
            }),
          ),
        );
        syncedOrders = pendingOrders.length;
        setPendingOrderCount(0);
        setSyncPendingOrders(false);
      }
      if (fillMissingOrderData) {
        const orders = await store.listOrders();
        const affectedOrders = orders.filter((order) => isRelatedOrder(order, saved) && hasMissingCustomerData(order));
        if (
          !window.confirm(
            `Se completaran solo campos vacios del cliente en ${affectedOrders.length} pedido(s) relacionado(s). No se modificaran datos ya existentes ni productos, cantidades o totales. ¿Quieres continuar?`,
          )
        ) {
          setSaving(false);
          return;
        }
        await Promise.all(
          affectedOrders.map((order) =>
            store.updateOrder(order.id, {
              customer: fillMissingCustomerData(order.customer, saved),
            }),
          ),
        );
        completedMissingDataOrders = affectedOrders.length;
        setMissingDataOrderCount(0);
        setFillMissingOrderData(false);
      }
      const messages = [
        "Cliente actualizado",
        syncedOrders > 0 ? `${syncedOrders} pedido(s) pendiente(s) sincronizado(s)` : "",
        completedMissingDataOrders > 0 ? `${completedMissingDataOrders} pedido(s) con datos faltantes completado(s)` : "",
      ].filter(Boolean);
      setStatus({
        tone: "success",
        message: `${messages.join(" y ")}.`,
      });
      onSaved(saved, syncedOrders + completedMissingDataOrders);
    } catch {
      setStatus({ tone: "danger", message: "No se pudo actualizar el cliente. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {status ? <Alert variant={status.tone}>{status.message}</Alert> : null}

      <Card className="shadow-none">
        <CardTitle>Datos del cliente</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" required error={errors.fullName} className="sm:col-span-2">
            <Input value={value.fullName} onChange={(event) => setField("fullName", event.target.value)} />
          </FormField>
          <FormField label="Telefono">
            <Input value={value.phone} onChange={(event) => setField("phone", event.target.value)} />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={value.email} onChange={(event) => setField("email", event.target.value)} />
          </FormField>
        </div>
      </Card>

      <Card className="shadow-none">
        <CardTitle>Ubicacion</CardTitle>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <LocationFields
            value={value}
            onChange={(customer) => setValue((current) => (typeof customer === "function" ? customer(current) : customer))}
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

      {pendingOrderCount > 0 ? (
        <Card className="shadow-none">
          <CardTitle>Pedidos relacionados</CardTitle>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-border bg-surface-muted p-3 text-sm">
            <Checkbox
              checked={syncPendingOrders}
              onCheckedChange={(checked) => setSyncPendingOrders(checked === true)}
              aria-label="Aplicar cambios a pedidos pendientes"
            />
            <span>
              <span className="block font-medium text-foreground">Aplicar cambios a pedidos pendientes</span>
              <span className="mt-1 block text-foreground-muted">
                Se actualizaran los datos del cliente en {pendingOrderCount} pedido(s) pendiente(s). Los pedidos completados o cancelados y los rotulos ya creados no se modifican.
              </span>
            </span>
          </label>
        </Card>
      ) : null}

      {missingDataOrderCount > 0 ? (
        <Card className="shadow-none">
          <CardTitle>Datos faltantes</CardTitle>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-border bg-surface-muted p-3 text-sm">
            <Checkbox
              checked={fillMissingOrderData}
              onCheckedChange={(checked) => setFillMissingOrderData(checked === true)}
              aria-label="Completar datos faltantes en pedidos relacionados"
            />
            <span>
              <span className="block font-medium text-foreground">Completar datos faltantes en pedidos relacionados</span>
              <span className="mt-1 block text-foreground-muted">
                Solo se llenaran campos vacios del cliente en {missingDataOrderCount} pedido(s) relacionado(s). No se modificaran datos que ya tengan valor ni se cambiaran productos, cantidades o totales.
                {missingDataOrderCount > 0 ? " Los nombres cortos no se sobrescriben; solo se usan para detectar relacion." : ""}
              </span>
            </span>
          </label>
        </Card>
      ) : null}

      <div className="sticky bottom-0 -mx-5 mt-2 flex justify-end gap-2 border-t border-border bg-surface px-5 py-4">
        <Button type="button" variant="secondary" onClick={cancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={saving} disabled={!actionable}>
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
