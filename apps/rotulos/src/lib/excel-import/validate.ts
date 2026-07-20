import type { ParsedBlock } from "./types";

const EPSILON = 0.01;

export function applyTotalValidation(block: ParsedBlock): void {
  const itemsTotal = block.items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (block.subtotalDeclared === null) {
    block.warnings.push(`SUBTOTAL no encontrado en la hoja, se usó la suma de ítems ($${itemsTotal})`);
    block.subtotalDeclared = itemsTotal;
  } else if (Math.abs(itemsTotal - block.subtotalDeclared) > EPSILON) {
    const diff = (block.subtotalDeclared - itemsTotal).toFixed(2);
    block.warnings.push(
      `SUBTOTAL declarado ($${block.subtotalDeclared}) no coincide con la suma de ítems ($${itemsTotal}), diferencia $${diff}`,
    );
  }

  if (block.shippingRowSeen && block.shippingDeclared === null) {
    block.warnings.push("ENVIO vacío, asumido $0");
    block.shippingDeclared = 0;
  } else if (block.shippingDeclared === null) {
    block.shippingDeclared = 0;
  }

  const expectedTotal = block.subtotalDeclared + block.shippingDeclared;
  if (block.totalDeclared === null) {
    block.totalDeclared = expectedTotal;
  } else if (Math.abs(expectedTotal - block.totalDeclared) > EPSILON) {
    const diff = (block.totalDeclared - expectedTotal).toFixed(2);
    block.warnings.push(
      `TOTAL declarado ($${block.totalDeclared}) no coincide con SUBTOTAL+ENVIO ($${expectedTotal}), diferencia $${diff}`,
    );
  }
}
