import { validateLabelDraft } from "@/lib/validation";
import type { LabelDraft } from "@/lib/types";

export type LabelQualityIssue = {
  field: string;
  message: string;
};

export type LabelQualityReview = {
  ready: boolean;
  issues: LabelQualityIssue[];
};

export function reviewLabelQuality(draft: LabelDraft): LabelQualityReview {
  const result = validateLabelDraft(draft);
  const issues = Object.entries(result.errors).map(([field, message]) => ({ field, message }));
  return {
    ready: issues.length === 0,
    issues,
  };
}
