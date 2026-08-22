import { useEffect, useId, useMemo, useState } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";
import { mergeCustomerIntoRecipient } from "@/lib/recipient-from-customer";
import type { Recipient } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { LocationFields } from "@/components/location-fields";

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

const LABELS: Record<"fullName" | "phone" | "reference" | "notes", string> = {
  fullName: "Nombre y apellidos",
  phone: "Teléfono",
  reference: "Referencia o indicaciones",
  notes: "Observaciones",
};

const PRINTABLE_HELP: Record<keyof Recipient, string> = {
  fullName: "Maximo 55 caracteres para imprimirlo completo.",
  phone: "Maximo 20 caracteres para imprimirlo completo.",
  department: "Maximo 35 caracteres para imprimirlo completo.",
  city: "Maximo 35 caracteres para imprimirla completa.",
  locality: "Solo se pide para entregas en Bogotá.",
  address: "Maximo 170 caracteres para imprimirla completa.",
  neighborhood: "Maximo 45 caracteres para imprimirlo completo.",
  reference: "Maximo 90 caracteres para imprimirla completa.",
  notes: "Maximo 90 caracteres para imprimirlas completas.",
};

const TEXTAREA_FIELDS = new Set<keyof Recipient>(["address", "reference", "notes"]);

type RecipientChange = Recipient | ((current: Recipient) => Recipient);

export function RecipientFields({ value, onChange, errors }: { value: Recipient; onChange: (value: RecipientChange) => void; errors: Record<string, string> }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const customerListId = useId();
  const fullNameFieldId = "recipient.fullName";

  useEffect(() => {
    getBusinessStore().listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  const customerOptions = useMemo(() => {
    const byName = new Map<string, Customer>();
    for (const customer of customers) {
      const key = normalizeName(customer.fullName);
      if (key) byName.set(key, customer);
    }
    return [...byName.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
  }, [customers]);

  const set = (key: keyof Recipient, next: string) => onChange((current) => ({ ...current, [key]: next }));

  function setFullName(next: string) {
    const match = customerOptions.find((customer) => normalizeName(customer.fullName) === normalizeName(next));
    onChange((current) => (match ? mergeCustomerIntoRecipient(current, match) : { ...current, fullName: next }));
  }

  return (
    <Card role="group" aria-label="Destinatario">
      <CardTitle>Destinatario</CardTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(Object.keys(LABELS) as Array<keyof typeof LABELS>).map((key) => {
          const errorKey = `recipient.${key}`;
          const maxLength = PRINTABLE_LABEL_LIMITS.recipient[key];
          const isTextarea = TEXTAREA_FIELDS.has(key);
          if (key === "fullName") {
            return (
              <FormField key={key} label={LABELS[key]} htmlFor={fullNameFieldId} hint={PRINTABLE_HELP[key]} error={errors[errorKey]}>
                <Input
                  id={fullNameFieldId}
                  value={value.fullName}
                  maxLength={maxLength}
                  list={customerListId}
                  aria-describedby={`${fullNameFieldId}-hint`}
                  onChange={(event) => setFullName(event.target.value)}
                />
                <datalist id={customerListId}>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.fullName} />
                  ))}
                </datalist>
              </FormField>
            );
          }
          return (
            <FormField
              key={key}
              label={LABELS[key]}
              htmlFor={errorKey}
              hint={PRINTABLE_HELP[key]}
              error={errors[errorKey]}
            >
              {isTextarea ? (
                <Textarea
                  id={errorKey}
                  value={value[key]}
                  maxLength={maxLength}
                  rows={2}
                  onChange={(event) => set(key, event.target.value)}
                />
              ) : (
                <Input
                  id={errorKey}
                  value={value[key]}
                  maxLength={maxLength}
                  onChange={(event) => set(key, event.target.value)}
                />
              )}
            </FormField>
          );
        })}
        <LocationFields
          value={value}
          onChange={onChange}
          errors={errors}
          prefix="recipient"
          addressLabel="Dirección completa"
          addressAsTextarea
          addressRows={3}
          includeNeighborhood
          required
          limits={{
            department: PRINTABLE_LABEL_LIMITS.recipient.department,
            city: PRINTABLE_LABEL_LIMITS.recipient.city,
            locality: PRINTABLE_LABEL_LIMITS.location.locality,
            neighborhood: PRINTABLE_LABEL_LIMITS.recipient.neighborhood,
            address: PRINTABLE_LABEL_LIMITS.recipient.address,
          }}
        />
      </div>
    </Card>
  );
}
