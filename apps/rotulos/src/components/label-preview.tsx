import type { LabelDraft } from "@/lib/types";
import { formatCop, formatDate } from "@/lib/format";

export function LabelPreview({ draft }: { draft: LabelDraft }) {
  const isCod = draft.paymentMethod === "contraentrega";

  return (
    <section className="label-canvas" data-testid="label-canvas" data-size={draft.size} aria-label="Vista previa del rotulo">
      <span className="lbl-f lbl-sender-name">{draft.sender.name}</span>
      <span className="lbl-f lbl-sender-phone">{draft.sender.phone}</span>
      <span className="lbl-f lbl-sender-city">{draft.sender.city}</span>
      <span className="lbl-f lbl-sender-department">{draft.sender.department}</span>
      <span className="lbl-f lbl-multiline lbl-sender-address">{draft.sender.address}</span>
      <span className="lbl-f lbl-recipient-name">{draft.recipient.fullName}</span>
      <span className="lbl-f lbl-recipient-phone">{draft.recipient.phone}</span>
      <span className="lbl-f lbl-recipient-department">{draft.recipient.department}</span>
      <span className="lbl-f lbl-recipient-city">{draft.recipient.city}</span>
      <span className="lbl-f lbl-multiline lbl-recipient-address">{draft.recipient.address}</span>
      <span className="lbl-f lbl-recipient-neighborhood">{draft.recipient.neighborhood}</span>
      <span className="lbl-f lbl-recipient-reference">{draft.recipient.reference}</span>
      <span className="lbl-f lbl-recipient-notes">{draft.recipient.notes}</span>
      <span className="lbl-f lbl-order-number">{draft.orderNumber}</span>
      <span className="lbl-f lbl-date">{formatDate(draft.date)}</span>
      <span className="lbl-f lbl-carrier">{draft.carrier}</span>
      <span className="lbl-f lbl-value">{isCod ? formatCop(draft.codAmount) : ""}</span>
      <span className="lbl-f lbl-packages">{draft.packageCount}</span>
      <span className={`lbl-f ${isCod ? "lbl-check-cod" : "lbl-check-paid"}`}>&#10003;</span>
    </section>
  );
}
