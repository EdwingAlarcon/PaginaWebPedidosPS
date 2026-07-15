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

  it("posts the loaded browser-fallback label when downloading PDF", async () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000123";
    draft.carrier = "Coordinadora";
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Calle 1 # 2-3",
    };
    draft.recipient = {
      fullName: "Ana Perez",
      phone: "3101234567",
      department: "Antioquia",
      city: "Medellin",
      address: "Carrera 45 # 10-20",
      neighborhood: "Laureles",
      reference: "Porteria principal",
      notes: "Entregar en la tarde",
    };
    const saved = await getLabelStore().saveLabel(draft, defaultSettings);
    window.history.pushState({}, "", `/crear?id=${saved.id}`);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(new Blob(["pdf"], { type: "application/pdf" })));
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:pdf");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<LabelForm />);
    expect(await screen.findByDisplayValue("Ana Perez")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(await screen.findByText("PDF descargado.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/labels/pdf", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.label.id).toBe(saved.id);
    expect(body.label.orderNumber).toBe("PS-2026-000123");
    expect(body.settings.labelSize).toEqual({ widthCm: 14, heightCm: 11 });
    expect(createObjectUrl).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:pdf");
  });
});
