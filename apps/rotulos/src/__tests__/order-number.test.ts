import { describe, expect, it } from "vitest";
import { defaultOrderNumberConfig } from "@/lib/defaults";
import { formatOrderNumber, getSequenceScope } from "@/lib/order-number";

describe("order numbering", () => {
  it("formats the PurpleShop default number", () => {
    expect(
      formatOrderNumber(defaultOrderNumberConfig, {
        date: new Date("2026-07-15T12:00:00Z"),
        sequence: 1,
        city: "Bogota",
        department: "Cundinamarca",
      }),
    ).toBe("PS-2026-000001");
  });

  it("supports date and four-digit sequence formats", () => {
    expect(
      formatOrderNumber(
        {
          ...defaultOrderNumberConfig,
          pattern: "{PREFIX}-{DATE}-{SEQUENCE}",
          sequenceDigits: 4,
          dateFormat: "YYYYMMDD",
        },
        {
          date: new Date("2026-07-15T12:00:00Z"),
          sequence: 23,
          city: "Cali",
          department: "Valle",
        },
      ),
    ).toBe("PS-20260715-0023");
  });

  it("normalizes city and suffix variables", () => {
    expect(
      formatOrderNumber(
        {
          ...defaultOrderNumberConfig,
          suffix: "ONLINE",
          pattern: "{PREFIX}-{CITY}-{SEQUENCE}-{SUFFIX}",
          sequenceDigits: 6,
        },
        {
          date: new Date("2026-07-15T12:00:00Z"),
          sequence: 245,
          city: "Bogota D.C.",
          department: "Cundinamarca",
        },
      ),
    ).toBe("PS-BOGOTA-000245-ONLINE");
  });

  it("returns scope keys for reset policies", () => {
    const date = new Date("2026-07-15T12:00:00Z");
    expect(getSequenceScope("never", date)).toBe("never");
    expect(getSequenceScope("annual", date)).toBe("2026");
    expect(getSequenceScope("monthly", date)).toBe("202607");
    expect(getSequenceScope("daily", date)).toBe("20260715");
  });
});
