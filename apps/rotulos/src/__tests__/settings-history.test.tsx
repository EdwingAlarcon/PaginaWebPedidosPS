import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsForm } from "@/components/settings-form";
import { HistoryTable } from "@/components/history-table";
import { createBlankLabelDraft } from "@/lib/defaults";
import type { LabelRecord } from "@/lib/types";

function createLabel(id: string, fullName: string, phone: string): LabelRecord {
  return {
    ...createBlankLabelDraft(),
    id,
    orderNumber: `PS-2026-00000${id}`,
    recipient: {
      ...createBlankLabelDraft().recipient,
      fullName,
      phone,
      city: "Bogota",
    },
    status: "generado",
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-07-15T00:00:00Z",
    pdfUrl: null,
    createdBy: null,
  };
}

describe("SettingsForm", () => {
  it("updates the estimated next order number when its format changes", () => {
    render(<SettingsForm />);

    const format = screen.getByLabelText("Formato");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();

    fireEvent.change(format, { target: { value: "{PREFIX}/{SEQUENCE}" } });

    expect(screen.getByText("PS/000001")).toBeInTheDocument();
  });
});

describe("HistoryTable", () => {
  it("filters labels by recipient name", () => {
    render(<HistoryTable labels={[createLabel("1", "Ana Perez", "3001111111"), createLabel("2", "Luis Gomez", "3002222222")]} />);

    fireEvent.change(screen.getByLabelText("Buscar por numero de pedido, cliente o telefono"), { target: { value: "luis" } });

    expect(screen.getByText("Luis Gomez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Perez")).not.toBeInTheDocument();
  });
});
