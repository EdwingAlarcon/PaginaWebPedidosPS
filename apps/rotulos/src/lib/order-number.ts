import type { OrderNumberConfig, ResetPolicy } from "@/lib/types";

type NumberContext = {
  date: Date;
  sequence: number;
  city: string;
  department: string;
};

function pad(value: number, digits: number): string {
  return String(value).padStart(digits, "0");
}

function cleanToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function cleanCityToken(value: string): string {
  return cleanToken(value.replace(/[,\s]+D\.?\s*C\.?$/i, ""));
}

function datePart(date: Date, part: "year" | "month" | "day"): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  if (part === "year") return year;
  if (part === "month") return month;
  return day;
}

export function formatDateToken(date: Date, format: OrderNumberConfig["dateFormat"]): string {
  const year = datePart(date, "year");
  const month = datePart(date, "month");
  const day = datePart(date, "day");
  if (format === "YYYY") return year;
  if (format === "YYYYMM") return `${year}${month}`;
  return `${year}${month}${day}`;
}

export function formatOrderNumber(config: OrderNumberConfig, context: NumberContext): string {
  const year = datePart(context.date, "year");
  const month = datePart(context.date, "month");
  const day = datePart(context.date, "day");
  const replacements: Record<string, string> = {
    PREFIX: cleanToken(config.prefix),
    SUFFIX: cleanToken(config.suffix),
    YEAR: year,
    MONTH: month,
    DAY: day,
    DATE: formatDateToken(context.date, config.dateFormat),
    SEQUENCE: pad(context.sequence, config.sequenceDigits),
    CITY: cleanCityToken(context.city),
    DEPARTMENT: cleanToken(context.department),
  };

  return config.pattern.replace(/\{([A-Z]+)\}/g, (_match, token: string) => replacements[token] ?? "");
}

export function getSequenceScope(resetPolicy: ResetPolicy, date: Date): string {
  const year = datePart(date, "year");
  const month = datePart(date, "month");
  const day = datePart(date, "day");
  if (resetPolicy === "never") return "never";
  if (resetPolicy === "annual") return year;
  if (resetPolicy === "monthly") return `${year}${month}`;
  return `${year}${month}${day}`;
}
