import { formatCop, formatDate } from "@/lib/format";
import type { LabelDraft, LabelSettings } from "@/lib/types";

export function LabelPreview({ draft, settings }: { draft: LabelDraft; settings: LabelSettings }) {
  return (
    <section className="label-canvas" data-testid="label-canvas" aria-label="Vista previa del rotulo">
      <header className="label-header">
        <div className="label-brand">
          <img src={settings.logoUrl} alt="Logo PurpleShop" />
          <div>
            <strong>PurpleShop</strong>
            <span>{settings.brandPhrase}</span>
          </div>
        </div>
        <div className="label-social">
          <img src={settings.qrUrl} alt="QR de Instagram PurpleShop" />
          <span>{settings.instagramUser}</span>
        </div>
      </header>

      <div className="label-meta">
        <strong>{draft.orderNumber || "PS-2026-000001"}</strong>
        <span>{formatDate(draft.date)}</span>
        <span>{draft.carrier || "Transportadora"}</span>
        <span>{draft.packageCount} paquete{draft.packageCount === 1 ? "" : "s"}</span>
      </div>

      <div className="label-grid">
        <section className="label-block sender">
          <h2>Remitente</h2>
          <p className="person">{draft.sender.name || "PurpleShop"}</p>
          <p>Tel: {draft.sender.phone || "300 000 0000"}</p>
          <p>{draft.sender.city || "Ciudad"}, {draft.sender.department || "Departamento"}</p>
          <p>{draft.sender.address || "Direccion del remitente"}</p>
        </section>
        <section className="label-block recipient">
          <h2>Destinatario</h2>
          <p className="person">{draft.recipient.fullName || "Nombre del cliente"}</p>
          <p className="phone">Tel: {draft.recipient.phone || "310 000 0000"}</p>
          <p>{draft.recipient.city || "Ciudad"}, {draft.recipient.department || "Departamento"}</p>
          <p className="address recipient-address">{draft.recipient.address || "Direccion completa del destinatario"}</p>
          <p className="recipient-neighborhood">Barrio: {draft.recipient.neighborhood || "Sector"}</p>
          <p className="recipient-reference">Ref: {draft.recipient.reference || "Indicaciones de entrega"}</p>
        </section>
      </div>

      <footer className="label-footer">
        <span className={draft.paymentMethod === "contraentrega" ? "cod-badge" : "paid-badge"}>
          {draft.paymentMethod === "contraentrega" ? `Contraentrega ${formatCop(draft.codAmount)}` : "Pagado"}
        </span>
        <span className="recipient-notes">{draft.recipient.notes || "Gracias por comprar en PurpleShop"}</span>
      </footer>
    </section>
  );
}
