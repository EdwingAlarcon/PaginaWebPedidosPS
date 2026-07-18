import type { Recipient } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const LABELS: Record<keyof Recipient, string> = {
  fullName: "Nombre y apellidos",
  phone: "Telefono",
  department: "Departamento",
  city: "Ciudad",
  address: "Direccion completa",
  neighborhood: "Barrio / sector",
  reference: "Referencia o indicaciones",
  notes: "Observaciones",
};

const PRINTABLE_HELP: Record<keyof Recipient, string> = {
  fullName: "Maximo 55 caracteres para imprimirlo completo.",
  phone: "Maximo 20 caracteres para imprimirlo completo.",
  department: "Maximo 35 caracteres para imprimirlo completo.",
  city: "Maximo 35 caracteres para imprimirla completa.",
  address: "Maximo 170 caracteres para imprimirla completa.",
  neighborhood: "Maximo 45 caracteres para imprimirlo completo.",
  reference: "Maximo 90 caracteres para imprimirla completa.",
  notes: "Maximo 90 caracteres para imprimirlas completas.",
};

const TEXTAREA_FIELDS = new Set<keyof Recipient>(["address", "reference", "notes"]);

type RecipientChange = Recipient | ((current: Recipient) => Recipient);

export function RecipientFields({ value, onChange, errors }: { value: Recipient; onChange: (value: RecipientChange) => void; errors: Record<string, string> }) {
  const set = (key: keyof Recipient, next: string) => onChange((current) => ({ ...current, [key]: next }));
  return (
    <Card role="group" aria-label="Destinatario">
      <CardTitle>Destinatario</CardTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(Object.keys(LABELS) as Array<keyof Recipient>).map((key) => {
          const errorKey = `recipient.${key}`;
          const maxLength = PRINTABLE_LABEL_LIMITS.recipient[key];
          const isTextarea = TEXTAREA_FIELDS.has(key);
          return (
            <FormField
              key={key}
              label={LABELS[key]}
              hint={PRINTABLE_HELP[key]}
              error={errors[errorKey]}
              className={key === "address" ? "sm:col-span-2" : undefined}
            >
              {isTextarea ? (
                <Textarea
                  value={value[key]}
                  maxLength={maxLength}
                  rows={key === "address" ? 3 : 2}
                  onInput={(event) => set(key, event.currentTarget.value)}
                  onChange={(event) => set(key, event.target.value)}
                />
              ) : (
                <Input
                  value={value[key]}
                  maxLength={maxLength}
                  onInput={(event) => set(key, event.currentTarget.value)}
                  onChange={(event) => set(key, event.target.value)}
                />
              )}
            </FormField>
          );
        })}
      </div>
    </Card>
  );
}
