import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";

export function ShipmentFields({ value, onChange, errors, allowManualEdit }: { value: LabelDraft; onChange: (value: LabelDraft) => void; errors: Record<string, string>; allowManualEdit: boolean }) {
  const set = <K extends keyof LabelDraft>(key: K, next: LabelDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <Card role="group" aria-label="Datos del envio">
      <CardTitle>Datos del envio</CardTitle>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FormField
          label="Numero de pedido"
          hint={`Maximo ${PRINTABLE_LABEL_LIMITS.orderNumber} caracteres para imprimirlo completo.`}
          error={errors.orderNumber}
        >
          <Input
            value={value.orderNumber}
            disabled={!allowManualEdit}
            maxLength={PRINTABLE_LABEL_LIMITS.orderNumber}
            onInput={(event) => set("orderNumber", event.currentTarget.value)}
            onChange={(event) => set("orderNumber", event.target.value)}
          />
        </FormField>
        <FormField label="Fecha" error={errors.date}>
          <Input type="date" value={value.date} onChange={(event) => set("date", event.target.value)} />
        </FormField>
        <FormField
          label="Transportadora"
          hint={`Maximo ${PRINTABLE_LABEL_LIMITS.carrier} caracteres para imprimirla completa.`}
          error={errors.carrier}
        >
          <Input
            value={value.carrier}
            maxLength={PRINTABLE_LABEL_LIMITS.carrier}
            onInput={(event) => set("carrier", event.currentTarget.value)}
            onChange={(event) => set("carrier", event.target.value)}
          />
        </FormField>
        <FormField label="Tamano del rotulo">
          <Select value={value.size} onChange={(event) => set("size", event.target.value as LabelDraft["size"])}>
            {Object.entries(LABEL_SIZES).map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Metodo de pago">
          <Select
            value={value.paymentMethod}
            onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}
          >
            <option value="pagado">Pagado</option>
            <option value="contraentrega">Contraentrega</option>
          </Select>
        </FormField>
        <FormField
          label="Valor contraentrega"
          hint="Maximo $9.999.999 para imprimirlo completo."
          error={errors.codAmount}
        >
          <Input
            type="number"
            min="0"
            max={PRINTABLE_LABEL_LIMITS.numeric.codAmount}
            value={value.codAmount}
            onChange={(event) => set("codAmount", Number(event.target.value))}
          />
        </FormField>
        <FormField
          label="Cantidad de paquetes"
          hint={`Maximo ${PRINTABLE_LABEL_LIMITS.numeric.packageCount} paquetes para imprimirlos completos.`}
          error={errors.packageCount}
        >
          <Input
            type="number"
            min="1"
            max={PRINTABLE_LABEL_LIMITS.numeric.packageCount}
            value={value.packageCount}
            onChange={(event) => set("packageCount", Number(event.target.value))}
          />
        </FormField>
      </div>
    </Card>
  );
}
