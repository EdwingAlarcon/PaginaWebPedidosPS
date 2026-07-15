import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabelActions } from "@/components/label-actions";

describe("LabelActions", () => {
  it("enables PDF download action", () => {
    const onDownloadPdf = vi.fn();

    render(<LabelActions onSave={vi.fn()} onPrint={vi.fn()} onDownloadPdf={onDownloadPdf} />);
    fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(onDownloadPdf).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeEnabled();
  });
});
