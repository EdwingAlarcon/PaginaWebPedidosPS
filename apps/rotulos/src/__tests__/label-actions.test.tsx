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

  it("labels the save button 'Guardar rótulo' for a new label by default", () => {
    render(<LabelActions onSave={vi.fn()} onPrint={vi.fn()} onDownloadPdf={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Guardar rótulo" })).toBeInTheDocument();
  });

  it("labels the save button 'Guardar cambios' when editing an existing label", () => {
    render(<LabelActions onSave={vi.fn()} onPrint={vi.fn()} onDownloadPdf={vi.fn()} isEditing />);
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument();
  });
});
