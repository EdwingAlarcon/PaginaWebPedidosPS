export function normalizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

// Se usa api.whatsapp.com y no wa.me: la redireccion de wa.me cambia cada emoji
// del texto por "�" (U+FFFD) antes de abrir WhatsApp.
export function buildWhatsAppLink(phone: string, text: string): string {
  const normalized = normalizePhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);
  return normalized
    ? `https://api.whatsapp.com/send?phone=${normalized}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}
