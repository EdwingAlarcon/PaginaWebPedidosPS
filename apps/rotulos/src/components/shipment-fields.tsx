import type { LabelDraft } from "@/lib/types";

export function ShipmentFields({ value, onChange, errors, allowManualEdit }: { value: LabelDraft; onChange: (value: LabelDraft) => void; errors: Record<string, string>; allowManualEdit: boolean }) {
  const set = <K extends keyof LabelDraft>(key: K, next: LabelDraft[K]) => onChange({ ...value, [key]: next });
  return (
    <fieldset className="form-section">
      <legend>Datos del envio</legend>
      <label className="field">
        <span>Numero de pedido</span>
        <input value={value.orderNumber} disabled={!allowManualEdit} onChange={(event) => set("orderNumber", event.target.value)} />
        {errors.orderNumber ? <small>{errors.orderNumber}</small> : null}
      </label>
      <label className="field"><span>Fecha</span><input type="date" value={value.date} onChange={(event) => set("date", event.target.value)} /></label>
      <label className="field"><span>Transportadora</span><input value={value.carrier} onChange={(event) => set("carrier", event.target.value)} /></label>
      <label className="field"><span>Metodo de pago</span><select value={value.paymentMethod} onChange={(event) => set("paymentMethod", event.target.value as LabelDraft["paymentMethod"])}><option value="pagado">Pagado</option><option value="contraentrega">Contraentrega</option></select></label>
      <label className="field"><span>Valor contraentrega</span><input type="number" min="0" value={value.codAmount} onChange={(event) => set("codAmount", Number(event.target.value))} />{errors.codAmount ? <small>{errors.codAmount}</small> : null}</label>
      <label className="field"><span>Cantidad de paquetes</span><input type="number" min="1" value={value.packageCount} onChange={(event) => set("packageCount", Number(event.target.value))} />{errors.packageCount ? <small>{errors.packageCount}</small> : null}</label>
    </fieldset>
  );
}
