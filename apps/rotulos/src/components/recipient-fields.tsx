import type { Recipient } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";

const labels: Record<keyof Recipient, string> = {
  fullName: "Nombre y apellidos",
  phone: "Telefono",
  department: "Departamento",
  city: "Ciudad",
  address: "Direccion completa",
  neighborhood: "Barrio / sector",
  reference: "Referencia o indicaciones",
  notes: "Observaciones",
};

const printableHelp: Record<keyof Recipient, string> = {
  fullName: "Maximo 55 caracteres para imprimirlo completo.",
  phone: "Maximo 20 caracteres para imprimirlo completo.",
  department: "Maximo 35 caracteres para imprimirlo completo.",
  city: "Maximo 35 caracteres para imprimirla completa.",
  address: "Maximo 170 caracteres para imprimirla completa.",
  neighborhood: "Maximo 45 caracteres para imprimirlo completo.",
  reference: "Maximo 90 caracteres para imprimirla completa.",
  notes: "Maximo 90 caracteres para imprimirlas completas.",
};

export function RecipientFields({ value, onChange, errors }: { value: Recipient; onChange: (value: Recipient) => void; errors: Record<string, string> }) {
  const set = (key: keyof Recipient, next: string) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Destinatario</legend>
      {(Object.keys(labels) as Array<keyof Recipient>).map((key) => {
        const errorKey = `recipient.${key}`;
        const errorId = `${errorKey}-error`;
        const helperText = printableHelp[key];
        const helperId = `${errorKey}-help`;
        const describedBy = [helperText ? helperId : null, errors[errorKey] ? errorId : null].filter(Boolean).join(" ") || undefined;
        const maxLength = PRINTABLE_LABEL_LIMITS.recipient[key];
        return (
          <label className="field" key={key}>
            <span>{labels[key]}</span>
            {key === "address" || key === "reference" || key === "notes" ? (
              <textarea value={value[key]} aria-describedby={describedBy} maxLength={maxLength} onChange={(event) => set(key, event.target.value)} rows={key === "address" ? 3 : 2} />
            ) : (
              <input value={value[key]} aria-describedby={describedBy} maxLength={maxLength} onChange={(event) => set(key, event.target.value)} />
            )}
            {helperText ? <small className="field-hint" id={helperId}>{helperText}</small> : null}
            {errors[errorKey] ? <small id={errorId}>{errors[errorKey]}</small> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
