import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultSettings, createBlankLabelDraft } from "@/lib/defaults";
import { LabelPreview } from "@/components/label-preview";

describe("LabelPreview", () => {
  it("renders QR, order number, sender, recipient, and exact canvas marker", () => {
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

    render(<LabelPreview draft={draft} settings={defaultSettings} />);

    expect(screen.getByTestId("label-canvas")).toHaveClass("label-canvas");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();
    expect(screen.getAllByText("PurpleShop")).toHaveLength(2);
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.getByAltText("QR de Instagram PurpleShop")).toBeInTheDocument();
  });
});
