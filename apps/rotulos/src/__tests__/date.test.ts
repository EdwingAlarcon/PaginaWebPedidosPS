import { describe, expect, it, vi } from "vitest";
import { businessDaysAgo, businessToday, formatDateInTimeZone } from "@/lib/date";

describe("business date helpers", () => {
  it("uses Colombia's date when UTC has already moved to tomorrow", () => {
    const utcSaturday = new Date("2026-08-15T01:00:00.000Z");

    expect(formatDateInTimeZone(utcSaturday)).toBe("2026-08-14");
  });

  it("returns date ranges anchored to the Colombia business day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T01:00:00.000Z"));

    expect(businessToday()).toBe("2026-08-14");
    expect(businessDaysAgo(30)).toBe("2026-07-15");

    vi.useRealTimers();
  });
});
