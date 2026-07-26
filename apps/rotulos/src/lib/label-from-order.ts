import { createBlankLabelDraft } from "@/lib/defaults";
import type { OrderRecord } from "@/lib/business-types";
import type { LabelDraft, Sender } from "@/lib/types";

export function buildLabelDraftFromOrder(order: OrderRecord, defaultSender: Sender): LabelDraft {
  const draft = createBlankLabelDraft();
  return {
    ...draft,
    sender: defaultSender,
    orderId: order.id,
    recipient: {
      ...draft.recipient,
      fullName: order.customer.fullName,
      phone: order.customer.phone,
      department: order.customer.department,
      city: order.customer.city,
      locality: order.customer.locality,
      address: order.customer.address,
      neighborhood: order.customer.neighborhood,
      notes: order.notes,
    },
  };
}
