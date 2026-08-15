export const BUSINESS_TIME_ZONE = "America/Bogota";

export function formatDateInTimeZone(date = new Date(), timeZone = BUSINESS_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dateParts = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

export function businessToday(): string {
  return formatDateInTimeZone();
}

export function businessDaysAgo(days: number): string {
  const [year, month, day] = businessToday().split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days, 12));
  return date.toISOString().slice(0, 10);
}
