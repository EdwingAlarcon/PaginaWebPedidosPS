import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SettingsForm } from "@/components/settings-form";
import { HistoryTable } from "@/components/history-table";
import { createBlankLabelDraft } from "@/lib/defaults";
import { getLabelStore } from "@/lib/label-store";
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
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates the estimated next order number when its format changes", () => {
    render(<SettingsForm />);

    const format = screen.getByLabelText("Formato");
    expect(screen.getByText("PS-2026-000001")).toBeInTheDocument();

    fireEvent.change(format, { target: { value: "{PREFIX}/{SEQUENCE}" } });

    expect(screen.getByText("PS/000001")).toBeInTheDocument();
  });

  it("blocks saving when sequence digits is less than one", () => {
    render(<SettingsForm />);

    fireEvent.change(screen.getByLabelText("Digitos"), { target: { value: "0" } });

    expect(screen.getByText("Los digitos deben ser al menos 1.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar configuracion" })).toBeDisabled();
  });

  it("loads settings saved in the browser fallback", async () => {
    await getLabelStore().saveSettings({
      ...((await getLabelStore().getSettings())),
      brandPhrase: "Configuracion persistida",
    });

    render(<SettingsForm />);

    expect(await screen.findByDisplayValue("Configuracion persistida")).toBeInTheDocument();
  });
});

describe("HistoryTable", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("filters labels by recipient name", () => {
    render(<HistoryTable labels={[createLabel("1", "Ana Perez", "3001111111"), createLabel("2", "Luis Gomez", "3002222222")]} />);

    fireEvent.change(screen.getByLabelText("Buscar por numero de pedido, cliente o telefono"), { target: { value: "luis" } });

    expect(screen.getByText("Luis Gomez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Perez")).not.toBeInTheDocument();
  });

  it("shows the date column and filters labels by order number and telephone", () => {
    const ana = createLabel("1", "Ana Perez", "3001111111");
    ana.date = "2026-07-15";
    const luis = createLabel("2", "Luis Gomez", "3002222222");
    render(<HistoryTable labels={[ana, luis]} />);

    expect(screen.getByText("Fecha")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07-15")).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Buscar por numero de pedido, cliente o telefono"), { target: { value: ana.orderNumber } });
    expect(screen.getByText("Ana Perez")).toBeInTheDocument();
    expect(screen.queryByText("Luis Gomez")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar por numero de pedido, cliente o telefono"), { target: { value: "3002222222" } });
    expect(screen.getByText("Luis Gomez")).toBeInTheDocument();
    expect(screen.queryByText("Ana Perez")).not.toBeInTheDocument();
  });

  it("removes a deleted label from the local table and announces the action", async () => {
    render(<HistoryTable labels={[createLabel("1", "Ana Perez", "3001111111")]} />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Etiqueta eliminada.");
    expect(screen.queryByText("Ana Perez")).not.toBeInTheDocument();
  });

  it("loads browser labels and persists a duplicated record", async () => {
    const store = getLabelStore();
    const draft = createBlankLabelDraft();
    draft.recipient.fullName = "Ana Perez";
    const saved = await store.saveLabel(draft, await store.getSettings());

    render(<HistoryTable labels={[]} />);

    expect(await screen.findByText("Ana Perez")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Duplicar" }));

    expect(await screen.findByText("Etiqueta PS-2026-000002 duplicada.")).toBeInTheDocument();
    expect(await store.listLabels()).toHaveLength(2);
  });
});
