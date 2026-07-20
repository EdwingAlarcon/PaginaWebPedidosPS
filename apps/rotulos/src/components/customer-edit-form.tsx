"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";
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
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { LocationFields } from "@/components/location-fields";

type CustomerFormValue = Omit<Customer, "id" | "createdAt" | "updatedAt">;

type CustomerEditFormProps = {
  customer: Customer;
  onSaved: (customer: Customer) => void;
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

export function CustomerEditForm({ customer, onSaved, onCancel, onDirtyChange }: CustomerEditFormProps) {
  const initialValue = useMemo(() => customerToFormValue(customer), [customer]);
  const [value, setValue] = useState<CustomerFormValue>(initialValue);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(value) !== JSON.stringify(initialValue);

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

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
      const normalized = normalizeCustomerFields(value);
      const saved = await getBusinessStore().updateCustomer(customer.id, normalized);
      setStatus({ tone: "success", message: "Cliente actualizado." });
      onSaved(saved);
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
