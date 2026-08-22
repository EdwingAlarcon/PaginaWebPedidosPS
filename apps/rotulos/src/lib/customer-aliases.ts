import { normalizeText } from "@/lib/normalize";

const CUSTOMER_ALIASES: Record<string, string> = {
  JOHANNA: "JOHANNA CICACHA",
  ZAIDA: "ZAIDA SUAREZ",
  LINA: "LINA GONZALEZ",
  PAULA: "PAULA BAJONERO",
};

export function resolveCustomerAlias(name: string): string {
  const normalized = normalizeText(name);
  return CUSTOMER_ALIASES[normalized] ?? normalized;
}
