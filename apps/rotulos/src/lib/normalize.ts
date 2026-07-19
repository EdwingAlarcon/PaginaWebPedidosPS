import type { LabelDraft, LabelSettings, Recipient, Sender } from "@/lib/types";
import type { OrderDraft, OrderItemDraft, ProductCode } from "@/lib/business-types";
import type { ProductDraft, StockMovementDraft } from "@/lib/inventory-types";

export function normalizeText(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeSender(sender: Sender): Sender {
  return {
    ...sender,
    name: normalizeText(sender.name),
    department: normalizeText(sender.department),
    city: normalizeText(sender.city),
    ...(sender.locality !== undefined ? { locality: normalizeText(sender.locality) } : {}),
    ...(sender.neighborhood !== undefined ? { neighborhood: normalizeText(sender.neighborhood) } : {}),
    address: normalizeText(sender.address),
  };
}

export function normalizeRecipient(recipient: Recipient): Recipient {
  return {
    ...recipient,
    fullName: normalizeText(recipient.fullName),
    department: normalizeText(recipient.department),
    city: normalizeText(recipient.city),
    ...(recipient.locality !== undefined ? { locality: normalizeText(recipient.locality) } : {}),
    address: normalizeText(recipient.address),
    neighborhood: normalizeText(recipient.neighborhood),
    reference: normalizeText(recipient.reference),
    notes: normalizeText(recipient.notes),
  };
}

export function normalizeLabelDraft(draft: LabelDraft): LabelDraft {
  return {
    ...draft,
    orderNumber: normalizeText(draft.orderNumber),
    sender: normalizeSender(draft.sender),
    recipient: normalizeRecipient(draft.recipient),
    carrier: normalizeText(draft.carrier),
  };
}

export function normalizeLabelSettings(settings: LabelSettings): LabelSettings {
  return {
    ...settings,
    defaultSender: normalizeSender(settings.defaultSender),
  };
}

type CustomerTextFields = {
  fullName: string;
  department: string;
  city: string;
  locality?: string;
  address: string;
  neighborhood: string;
};

export function normalizeCustomerFields<T extends CustomerTextFields>(customer: T): T {
  return {
    ...customer,
    fullName: normalizeText(customer.fullName),
    department: normalizeText(customer.department),
    city: normalizeText(customer.city),
    ...(customer.locality !== undefined ? { locality: normalizeText(customer.locality) } : {}),
    address: normalizeText(customer.address),
    neighborhood: normalizeText(customer.neighborhood),
  };
}

export function normalizeOrderItem(item: OrderItemDraft): OrderItemDraft {
  return {
    ...item,
    productCode: normalizeText(item.productCode),
    productName: normalizeText(item.productName),
    category: normalizeText(item.category),
  };
}

export function normalizeOrderDraft(draft: OrderDraft): OrderDraft {
  return {
    ...draft,
    customer: normalizeCustomerFields(draft.customer),
    notes: normalizeText(draft.notes),
    items: draft.items.map(normalizeOrderItem),
  };
}

export function normalizeProductDraft(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    name: normalizeText(draft.name),
    category: normalizeText(draft.category),
    sku: normalizeText(draft.sku),
  };
}

export function normalizeStockMovementDraft(draft: StockMovementDraft): StockMovementDraft {
  return {
    ...draft,
    reason: normalizeText(draft.reason),
    supplier: normalizeText(draft.supplier),
  };
}

type ProductCodeTextFields = Pick<ProductCode, "code" | "productName" | "category">;

export function normalizeProductCode<T extends ProductCodeTextFields>(code: T): T {
  return {
    ...code,
    code: normalizeText(code.code),
    productName: normalizeText(code.productName),
    category: normalizeText(code.category),
  };
}
