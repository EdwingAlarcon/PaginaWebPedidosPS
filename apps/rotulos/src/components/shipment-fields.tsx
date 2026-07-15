import type { LabelDraft } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";

export function ShipmentFields({ value, onChange, errors, allowManualEdit }: { value: LabelDraft; onChange: (value: LabelDraft) => void; errors: Record<string, string>; allowManualEdit: boolean }) {
  const set = <K extends keyof LabelDraft>(key: K, next: LabelDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Datos del envio</legend>
      <label className="field">
        <span>Numero de pedido</span>
        <input value={value.orderNumber} disabled={!allowManualEdit} aria-describedby={["orderNumber-help", errors.orderNumber ? "orderNumber-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.orderNumber} onChange={(event) => set("orderNumber", event.target.value)} />
        <small className="field-hint" id="orderNumber-help">Maximo {PRINTABLE_LABEL_LIMITS.orderNumber} caracteres para imprimirlo completo.</small>
        {errors.orderNumber ? <small id="orderNumber-error">{errors.orderNumber}</small> : null}
      </label>
      <label className="field"><span>Fecha</span><input type="date" value={value.date} aria-describedby={errors.date ? "date-error" : undefined} onChange={(event) => set("date", event.target.value)} />{errors.date ? <small id="date-error">{errors.date}</small> : null}</label>
      <label className="field"><span>Transportadora</span><input value={value.carrier} aria-describedby={["carrier-help", errors.carrier ? "carrier-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.carrier} onChange={(event) => set("carrier", event.target.value)} /><small className="field-hint" id="carrier-help">Maximo {PRINTABLE_LABEL_LIMITS.carrier} caracteres para imprimirla completa.</small>{errors.carrier ? <small id="carrier-error">{errors.carrier}</small> : null}</label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
      <label className="field"><span>Valor contraentrega</span><input type="number" min="0" value={value.codAmount} aria-describedby={errors.codAmount ? "codAmount-error" : undefined} onChange={(event) => set("codAmount", Number(event.target.value))} />{errors.codAmount ? <small id="codAmount-error">{errors.codAmount}</small> : null}</label>
      <label className="field"><span>Cantidad de paquetes</span><input type="number" min="1" value={value.packageCount} aria-describedby={errors.packageCount ? "packageCount-error" : undefined} onChange={(event) => set("packageCount", Number(event.target.value))} />{errors.packageCount ? <small id="packageCount-error">{errors.packageCount}</small> : null}</label>
    </fieldset>
  );
}
