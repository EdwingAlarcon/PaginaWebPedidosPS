import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LabelForm } from "@/components/label-form";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";

describe("LabelForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    window.history.pushState({}, "", "/crear");
  });

  it("blocks printing and displays validation feedback for an invalid draft", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<LabelForm />);
    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    expect(print).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Revisa");
  });

  it("loads an existing browser-fallback label for an edit URL", async () => {
    const draft = createBlankLabelDraft();
    draft.recipient.fullName = "Ana Perez";
    const saved = await getLabelStore().saveLabel(draft, defaultSettings);
    window.history.pushState({}, "", `/crear?id=${saved.id}`);

    render(<LabelForm />);

    expect(await screen.findByDisplayValue("Ana Perez")).toBeInTheDocument();
  });
});
