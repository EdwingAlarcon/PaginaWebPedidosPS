import type { Sender } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

const LABELS: Record<keyof Sender, string> = {
  name: "Nombre / Empresa",
  phone: "Telefono",
  department: "Departamento",
  city: "Ciudad",
  address: "Direccion",
};

type SenderChange = Sender | ((current: Sender) => Sender);

export function SenderFields({ value, onChange, errors }: { value: Sender; onChange: (value: SenderChange) => void; errors: Record<string, string> }) {
  const set = (key: keyof Sender, next: string) => onChange((current) => ({ ...current, [key]: next }));
  return (
    <Card role="group" aria-label="Remitente">
      <CardTitle>Remitente</CardTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {(["name", "phone", "department", "city", "address"] as const).map((key) => {
          const errorKey = `sender.${key}`;
          const maxLength = PRINTABLE_LABEL_LIMITS.sender[key];
          return (
            <FormField
              key={key}
              label={LABELS[key]}
              hint={`Maximo ${maxLength} caracteres para imprimirlo completo.`}
              error={errors[errorKey]}
              className={key === "address" ? "sm:col-span-2" : undefined}
            >
              <Input
                value={value[key]}
                maxLength={maxLength}
                onInput={(event) => set(key, event.currentTarget.value)}
                onChange={(event) => set(key, event.target.value)}
              />
            </FormField>
          );
        })}
      </div>
    </Card>
  );
}
