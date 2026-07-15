import type { Sender } from "@/lib/types";

export function SenderFields({ value, onChange, errors }: { value: Sender; onChange: (value: Sender) => void; errors: Record<string, string> }) {
  const set = (key: keyof Sender, next: string) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Remitente</legend>
      {(["name", "phone", "department", "city", "address"] as const).map((key) => {
        const errorKey = `sender.${key}`;
        const errorId = `${errorKey}-error`;
        return (
          <label className="field" key={key}>
            <span>{key === "name" ? "Nombre / Empresa" : key === "phone" ? "Telefono" : key === "department" ? "Departamento" : key === "city" ? "Ciudad" : "Direccion"}</span>
            <input value={value[key]} aria-describedby={errors[errorKey] ? errorId : undefined} onChange={(event) => set(key, event.target.value)} />
            {errors[errorKey] ? <small id={errorId}>{errors[errorKey]}</small> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
