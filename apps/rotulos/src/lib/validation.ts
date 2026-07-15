import type { LabelDraft, ValidationResult } from "@/lib/types";

// These caps match the fixed 14cm x 11cm printable layout so saved labels retain every field.
export const PRINTABLE_RECIPIENT_LIMITS = {
  address: 170,
  neighborhood: 45,
  reference: 90,
  notes: 90,
} as const;

function requireText(errors: Record<string, string>, key: string, value: string, message: string): void {
  if (!value.trim()) errors[key] = message;
}

function requirePrintableLength(
  errors: Record<string, string>,
  key: string,
  value: string,
  limit: number,
  message: string,
): void {
  if (value.length > limit) errors[key] = message;
}

export function validateLabelDraft(draft: LabelDraft): ValidationResult {
  const errors: Record<string, string> = {};

  requireText(errors, "sender.name", draft.sender.name, "Ingresa el nombre del remitente.");
  requireText(errors, "sender.phone", draft.sender.phone, "Ingresa el telefono del remitente.");
  requireText(errors, "sender.department", draft.sender.department, "Ingresa el departamento del remitente.");
  requireText(errors, "sender.city", draft.sender.city, "Ingresa la ciudad del remitente.");
  requireText(errors, "sender.address", draft.sender.address, "Ingresa la direccion del remitente.");
  requireText(errors, "recipient.fullName", draft.recipient.fullName, "Ingresa el nombre del destinatario.");
  requireText(errors, "recipient.phone", draft.recipient.phone, "Ingresa el telefono del destinatario.");
  requireText(errors, "recipient.department", draft.recipient.department, "Ingresa el departamento del destinatario.");
  requireText(errors, "recipient.city", draft.recipient.city, "Ingresa la ciudad del destinatario.");
  requireText(errors, "recipient.address", draft.recipient.address, "Ingresa la direccion del destinatario.");
  requireText(errors, "orderNumber", draft.orderNumber, "Ingresa el numero de pedido.");
  requireText(errors, "date", draft.date, "Ingresa la fecha.");
  requireText(errors, "carrier", draft.carrier, "Ingresa la transportadora.");
  requirePrintableLength(errors, "recipient.address", draft.recipient.address, PRINTABLE_RECIPIENT_LIMITS.address, "La direccion puede tener maximo 170 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.neighborhood", draft.recipient.neighborhood, PRINTABLE_RECIPIENT_LIMITS.neighborhood, "El barrio puede tener maximo 45 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "recipient.reference", draft.recipient.reference, PRINTABLE_RECIPIENT_LIMITS.reference, "La referencia puede tener maximo 90 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.notes", draft.recipient.notes, PRINTABLE_RECIPIENT_LIMITS.notes, "Las observaciones pueden tener maximo 90 caracteres para imprimirlas completas.");

  if (!Number.isInteger(draft.packageCount) || draft.packageCount < 1) {
    errors.packageCount = "Ingresa al menos un paquete.";
  }

  if (
    draft.paymentMethod === "contraentrega" &&
    (!Number.isFinite(draft.codAmount) || draft.codAmount <= 0)
  ) {
    errors.codAmount = "Ingresa el valor contraentrega.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
