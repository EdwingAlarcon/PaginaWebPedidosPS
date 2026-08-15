import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import { reviewLabelQuality } from "@/lib/label-quality";

function validDraft() {
  const draft = createBlankLabelDraft();
  draft.sender = {
    name: "PurpleShop",
    phone: "3001234567",
    department: "VALLE DEL CAUCA",
    city: "SANTIAGO DE CALI",
    address: "CALLE 1 # 2-3",
  };
  draft.recipient = {
    fullName: "ANA PEREZ",
    phone: "3101234567",
    department: "ANTIOQUIA",
    city: "MEDELLIN",
    address: "CARRERA 45 # 10-20",
    neighborhood: "LAURELES",
    reference: "",
    notes: "",
  };
  draft.carrier = "COORDINADORA";
  return draft;
}

describe("reviewLabelQuality", () => {
  it("marks a complete printable label as ready", () => {
    expect(reviewLabelQuality(validDraft())).toEqual({ ready: true, issues: [] });
  });

  it("returns actionable issues for missing or oversized fields", () => {
    const draft = validDraft();
    draft.carrier = "";
    draft.recipient.address = "A".repeat(171);

    const review = reviewLabelQuality(draft);

    expect(review.ready).toBe(false);
    expect(review.issues.map((issue) => issue.field).sort()).toEqual(["carrier", "recipient.address"]);
  });
});
