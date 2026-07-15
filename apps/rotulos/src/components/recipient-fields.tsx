import type { Recipient } from "@/lib/types";

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

export function RecipientFields({ value, onChange, errors }: { value: Recipient; onChange: (value: Recipient) => void; errors: Record<string, string> }) {
  const set = (key: keyof Recipient, next: string) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Destinatario</legend>
      {(Object.keys(labels) as Array<keyof Recipient>).map((key) => (
        <label className="field" key={key}>
          <span>{labels[key]}</span>
          {key === "address" || key === "reference" || key === "notes" ? (
            <textarea value={value[key]} onChange={(event) => set(key, event.target.value)} rows={key === "address" ? 3 : 2} />
          ) : (
            <input value={value[key]} onChange={(event) => set(key, event.target.value)} />
          )}
          {errors[`recipient.${key}`] ? <small>{errors[`recipient.${key}`]}</small> : null}
        </label>
      ))}
    </fieldset>
  );
}
