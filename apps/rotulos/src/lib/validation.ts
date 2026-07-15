import type { LabelDraft, ValidationResult } from "@/lib/types";

// These caps match the fixed 14cm x 11cm printable layout so saved labels retain every field.
export const PRINTABLE_LABEL_LIMITS = {
  sender: {
    name: 50,
    phone: 20,
    department: 35,
    city: 35,
    address: 120,
  },
  recipient: {
    fullName: 55,
    phone: 20,
    department: 35,
    city: 35,
    address: 170,
    neighborhood: 45,
    reference: 90,
    notes: 90,
  },
  orderNumber: 32,
  carrier: 40,
  numeric: {
    packageCount: 99,
    // $9.999.999 COP fits the fixed footer badge without truncation.
    codAmount: 9_999_999,
  },
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
  requirePrintableLength(errors, "sender.name", draft.sender.name, PRINTABLE_LABEL_LIMITS.sender.name, "El nombre del remitente puede tener maximo 50 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "sender.phone", draft.sender.phone, PRINTABLE_LABEL_LIMITS.sender.phone, "El telefono del remitente puede tener maximo 20 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "sender.department", draft.sender.department, PRINTABLE_LABEL_LIMITS.sender.department, "El departamento del remitente puede tener maximo 35 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "sender.city", draft.sender.city, PRINTABLE_LABEL_LIMITS.sender.city, "La ciudad del remitente puede tener maximo 35 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "sender.address", draft.sender.address, PRINTABLE_LABEL_LIMITS.sender.address, "La direccion del remitente puede tener maximo 120 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.fullName", draft.recipient.fullName, PRINTABLE_LABEL_LIMITS.recipient.fullName, "El nombre del destinatario puede tener maximo 55 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "recipient.phone", draft.recipient.phone, PRINTABLE_LABEL_LIMITS.recipient.phone, "El telefono del destinatario puede tener maximo 20 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "recipient.department", draft.recipient.department, PRINTABLE_LABEL_LIMITS.recipient.department, "El departamento del destinatario puede tener maximo 35 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "recipient.city", draft.recipient.city, PRINTABLE_LABEL_LIMITS.recipient.city, "La ciudad del destinatario puede tener maximo 35 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.address", draft.recipient.address, PRINTABLE_LABEL_LIMITS.recipient.address, "La direccion puede tener maximo 170 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.neighborhood", draft.recipient.neighborhood, PRINTABLE_LABEL_LIMITS.recipient.neighborhood, "El barrio puede tener maximo 45 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "recipient.reference", draft.recipient.reference, PRINTABLE_LABEL_LIMITS.recipient.reference, "La referencia puede tener maximo 90 caracteres para imprimirla completa.");
  requirePrintableLength(errors, "recipient.notes", draft.recipient.notes, PRINTABLE_LABEL_LIMITS.recipient.notes, "Las observaciones pueden tener maximo 90 caracteres para imprimirlas completas.");
  requirePrintableLength(errors, "orderNumber", draft.orderNumber, PRINTABLE_LABEL_LIMITS.orderNumber, "El numero de pedido puede tener maximo 32 caracteres para imprimirlo completo.");
  requirePrintableLength(errors, "carrier", draft.carrier, PRINTABLE_LABEL_LIMITS.carrier, "La transportadora puede tener maximo 40 caracteres para imprimirla completa.");

  if (!Number.isInteger(draft.packageCount) || draft.packageCount < 1) {
    errors.packageCount = "Ingresa al menos un paquete.";
  } else if (draft.packageCount > PRINTABLE_LABEL_LIMITS.numeric.packageCount) {
    errors.packageCount = "Ingresa maximo 99 paquetes para imprimirlos completos.";
  }

  if (draft.paymentMethod === "contraentrega") {
    if (!Number.isFinite(draft.codAmount) || draft.codAmount <= 0) {
      errors.codAmount = "Ingresa el valor contraentrega.";
    } else if (draft.codAmount > PRINTABLE_LABEL_LIMITS.numeric.codAmount) {
      errors.codAmount = "Ingresa un valor contraentrega maximo de $9.999.999 para imprimirlo completo.";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
