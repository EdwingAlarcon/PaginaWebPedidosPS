import { LABEL_SIZES } from "@/lib/types";
import type { LabelDraft } from "@/lib/types";
import { PRINTABLE_LABEL_LIMITS } from "@/lib/validation";

export function ShipmentFields({ value, onChange, errors, allowManualEdit }: { value: LabelDraft; onChange: (value: LabelDraft) => void; errors: Record<string, string>; allowManualEdit: boolean }) {
  const set = <K extends keyof LabelDraft>(key: K, next: LabelDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Datos del envio</legend>
      <label className="field">
        <span>Numero de pedido</span>
        <input value={value.orderNumber} disabled={!allowManualEdit} aria-describedby={["orderNumber-help", errors.orderNumber ? "orderNumber-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.orderNumber} onInput={(event) => set("orderNumber", event.currentTarget.value)} onChange={(event) => set("orderNumber", event.target.value)} />
        <small className="field-hint" id="orderNumber-help">Maximo {PRINTABLE_LABEL_LIMITS.orderNumber} caracteres para imprimirlo completo.</small>
        {errors.orderNumber ? <small id="orderNumber-error">{errors.orderNumber}</small> : null}
      </label>
      <label className="field"><span>Fecha</span><input type="date" value={value.date} aria-describedby={errors.date ? "date-error" : undefined} onChange={(event) => set("date", event.target.value)} />{errors.date ? <small id="date-error">{errors.date}</small> : null}</label>
      <label className="field"><span>Transportadora</span><input value={value.carrier} aria-describedby={["carrier-help", errors.carrier ? "carrier-error" : null].filter(Boolean).join(" ")} maxLength={PRINTABLE_LABEL_LIMITS.carrier} onInput={(event) => set("carrier", event.currentTarget.value)} onChange={(event) => set("carrier", event.target.value)} /><small className="field-hint" id="carrier-help">Maximo {PRINTABLE_LABEL_LIMITS.carrier} caracteres para imprimirla completa.</small>{errors.carrier ? <small id="carrier-error">{errors.carrier}</small> : null}</label>
      <label className="field"><span>Tamano del rotulo</span><select value={value.size} onChange={(event) => set("size", event.target.value as LabelDraft["size"])}>{Object.entries(LABEL_SIZES).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
      <label className="field"><span>Valor contraentrega</span><input type="number" min="0" max={PRINTABLE_LABEL_LIMITS.numeric.codAmount} value={value.codAmount} aria-describedby={["codAmount-help", errors.codAmount ? "codAmount-error" : null].filter(Boolean).join(" ")} onChange={(event) => set("codAmount", Number(event.target.value))} /><small className="field-hint" id="codAmount-help">Maximo $9.999.999 para imprimirlo completo.</small>{errors.codAmount ? <small id="codAmount-error">{errors.codAmount}</small> : null}</label>
      <label className="field"><span>Cantidad de paquetes</span><input type="number" min="1" max={PRINTABLE_LABEL_LIMITS.numeric.packageCount} value={value.packageCount} aria-describedby={["packageCount-help", errors.packageCount ? "packageCount-error" : null].filter(Boolean).join(" ")} onChange={(event) => set("packageCount", Number(event.target.value))} /><small className="field-hint" id="packageCount-help">Maximo {PRINTABLE_LABEL_LIMITS.numeric.packageCount} paquetes para imprimirlos completos.</small>{errors.packageCount ? <small id="packageCount-error">{errors.packageCount}</small> : null}</label>
    </fieldset>
  );
}

