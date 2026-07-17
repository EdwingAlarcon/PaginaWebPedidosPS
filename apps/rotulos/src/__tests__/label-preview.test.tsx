import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createBlankLabelDraft } from "@/lib/defaults";
import { LabelPreview } from "@/components/label-preview";

describe("LabelPreview", () => {
  it("renders order number, sender, recipient, and the illustrated canvas marker", () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000001";
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

    render(<LabelPreview draft={draft} />);

    const canvas = screen.getByTestId("label-canvas");
    expect(canvas).toHaveClass("label-canvas");
    expect(canvas).toHaveAttribute("data-size", "14x12");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByText("Laureles")).toHaveClass("lbl-recipient-neighborhood");
  });

  it("reflects the selected label size on the canvas element", () => {
    const draft = createBlankLabelDraft();
    draft.size = "10x9";

    render(<LabelPreview draft={draft} />);

    expect(screen.getByTestId("label-canvas")).toHaveAttribute("data-size", "10x9");
  });

  it("shows the contraentrega value and marks the correct payment checkbox", () => {
    const draft = createBlankLabelDraft();
    draft.paymentMethod = "contraentrega";
    draft.codAmount = 50000;

    render(<LabelPreview draft={draft} />);

    expect(screen.getByText(/\$\s?50\.000/)).toHaveClass("lbl-value");
    expect(document.querySelector(".lbl-check-cod")).toBeInTheDocument();
    expect(document.querySelector(".lbl-check-paid")).not.toBeInTheDocument();
  });

  it("keeps long recipient delivery details inside bounded content areas", () => {
    const draft = createBlankLabelDraft();
    draft.recipient = {
      fullName: "Laura Gomez",
      phone: "3101234567",
      department: "Cundinamarca",
      city: "Bogota",
      address: "Apartamento 1204 Torre 7 Conjunto Residencial Portal de los Andes Entrada por la Calle 170 con Carrera 7 frente al supermercado, usar acceso de visitantes y anunciarse en recepcion",
      neighborhood: "Portal de los Andes",
      reference: "Llamar antes de llegar, registrar la placa del vehiculo en porteria y dejar el paquete con administracion si no hay respuesta.",
      notes: "Entregar unicamente en horario de tarde; confirmar que el empaque este sellado y solicitar nombre de quien recibe.",
    };

    render(<LabelPreview draft={draft} />);

    expect(screen.getByText(draft.recipient.address)).toHaveClass("lbl-recipient-address");
    expect(screen.getByText(/Llamar antes de llegar/)).toHaveClass("lbl-recipient-reference");
    expect(screen.getByText(/Entregar unicamente/)).toHaveClass("lbl-recipient-notes");
  });
});
