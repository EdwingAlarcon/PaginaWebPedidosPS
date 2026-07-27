import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LabelForm } from "@/components/label-form";
import { createBlankLabelDraft, defaultSettings } from "@/lib/defaults";
import * as labelStoreModule from "@/lib/label-store";
import { getLabelStore } from "@/lib/label-store";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

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

  it("lists invalid fields as clickable links that focus the field when clicked", () => {
    vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<LabelForm />);
    fireEvent.click(screen.getByRole("button", { name: "Imprimir" }));

    const link = screen.getByRole("link", { name: "Ingresa el telefono del remitente." });
    fireEvent.click(link);

    const sender = within(screen.getByRole("group", { name: "Remitente" }));
    expect(sender.getByLabelText("Telefono")).toHaveFocus();
  });

  it("automatically focuses the first invalid field after a failed save attempt", async () => {
    render(<LabelForm />);
    fireEvent.click(screen.getByRole("button", { name: "Guardar rotulo" }));

    const sender = within(screen.getByRole("group", { name: "Remitente" }));
    await waitFor(() => expect(sender.getByLabelText("Telefono")).toHaveFocus());
  });


  it("saves a valid draft with an automatically generated order number", async () => {
    render(<LabelForm />);
    const sender = within(screen.getByRole("group", { name: "Remitente" }));
    const recipient = within(screen.getByRole("group", { name: "Destinatario" }));
    const shipment = within(screen.getByRole("group", { name: "Datos del envio" }));

    fireEvent.change(sender.getByLabelText(/Telefono/), { target: { value: "3001234567" } });
    fireEvent.change(sender.getByLabelText(/Departamento/), { target: { value: "VALLE DEL CAUCA" } });
    await waitFor(() => expect(sender.getByRole("option", { name: "SANTIAGO DE CALI" })).toBeInTheDocument());
    fireEvent.change(sender.getByLabelText(/Ciudad/), { target: { value: "SANTIAGO DE CALI" } });
    fireEvent.change(sender.getByLabelText(/Direccion/), { target: { value: "Calle 1 # 2-3" } });
    fireEvent.change(recipient.getByLabelText(/Nombre y apellidos/), { target: { value: "Ana Perez" } });
    fireEvent.change(recipient.getByLabelText(/Telefono/), { target: { value: "3101234567" } });
    fireEvent.change(recipient.getByLabelText(/Departamento/), { target: { value: "ANTIOQUIA" } });
    await waitFor(() => expect(recipient.getByRole("option", { name: "MEDELLÍN" })).toBeInTheDocument());
    fireEvent.change(recipient.getByLabelText(/Ciudad/), { target: { value: "MEDELLÍN" } });
    fireEvent.change(recipient.getByLabelText(/Direccion completa/), { target: { value: "Carrera 45 # 10-20" } });
    fireEvent.change(shipment.getByLabelText(/Transportadora/), { target: { value: "Coordinadora" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar rotulo" }));

    expect(await screen.findByText("Rotulo guardado.")).toBeInTheDocument();
    expect((await getLabelStore().listLabels())[0].orderNumber).toBe("PS-2026-000001");
  });

  it("loads an existing browser-fallback label for an edit URL", async () => {
    const draft = createBlankLabelDraft();
    draft.recipient.fullName = "Ana Perez";
    const saved = await getLabelStore().saveLabel(draft, defaultSettings);
    window.history.pushState({}, "", `/crear?id=${saved.id}`);

    render(<LabelForm />);

    expect(await screen.findByDisplayValue("ANA PEREZ")).toBeInTheDocument();
  });

  it("posts the loaded browser-fallback label when downloading PDF", async () => {
    const draft = createBlankLabelDraft();
    draft.orderNumber = "PS-2026-000123";
    draft.carrier = "Coordinadora";
    draft.sender = {
      name: "PurpleShop",
      phone: "3001234567",
      department: "VALLE DEL CAUCA",
      city: "CALI",
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
    expect(await screen.findByDisplayValue("ANA PEREZ")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));

    expect(await screen.findByText("PDF descargado.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/labels/pdf", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(body.label.id).toBe(saved.id);
    expect(body.label.orderNumber).toBe("PS-2026-000123");
    expect(body.settings.labelSize).toEqual({ widthCm: 14, heightCm: 12 });
    expect(createObjectUrl).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:pdf");
  });

  it("prefills the recipient and links the real order id when opened from an order", async () => {
    const orderDraft = createBlankOrderDraft();
    orderDraft.customer.fullName = "Ana Perez";
    orderDraft.customer.phone = "3101234567";
    orderDraft.customer.department = "Antioquia";
    orderDraft.customer.city = "Medellin";
    orderDraft.customer.address = "Carrera 45 # 10-20";
    orderDraft.customer.neighborhood = "Laureles";
    orderDraft.items = [{ productCode: "SKU1", productName: "Bolso", category: "Bolsos", quantity: 1, unitPrice: 50000 }];
    const savedOrder = await getBusinessStore().saveOrder(orderDraft);
    window.history.pushState({}, "", `/crear?fromOrderId=${savedOrder.id}`);

    render(<LabelForm />);

    expect(await screen.findByDisplayValue("ANA PEREZ")).toBeInTheDocument();
    fireEvent.change(within(screen.getByRole("group", { name: "Remitente" })).getByLabelText(/Telefono/), { target: { value: "3001234567" } });
    fireEvent.change(within(screen.getByRole("group", { name: "Remitente" })).getByLabelText(/Departamento/), { target: { value: "VALLE DEL CAUCA" } });
    await waitFor(() => expect(within(screen.getByRole("group", { name: "Remitente" })).getByRole("option", { name: "SANTIAGO DE CALI" })).toBeInTheDocument());
    fireEvent.change(within(screen.getByRole("group", { name: "Remitente" })).getByLabelText(/Ciudad/), { target: { value: "SANTIAGO DE CALI" } });
    fireEvent.change(within(screen.getByRole("group", { name: "Remitente" })).getByLabelText(/Direccion/), { target: { value: "Calle 1 # 2-3" } });
    fireEvent.change(within(screen.getByRole("group", { name: "Datos del envio" })).getByLabelText(/Transportadora/), { target: { value: "Coordinadora" } });

    fireEvent.click(screen.getByRole("button", { name: "Guardar rotulo" }));

    expect(await screen.findByText("Rotulo guardado.")).toBeInTheDocument();
    expect((await getLabelStore().listLabels())[0].orderId).toBe(savedOrder.id);
  });

  async function fillValidDraft() {
    const sender = within(screen.getByRole("group", { name: "Remitente" }));
    const recipient = within(screen.getByRole("group", { name: "Destinatario" }));
    const shipment = within(screen.getByRole("group", { name: "Datos del envio" }));

    fireEvent.change(sender.getByLabelText(/Telefono/), { target: { value: "3001234567" } });
    fireEvent.change(sender.getByLabelText(/Departamento/), { target: { value: "VALLE DEL CAUCA" } });
    await waitFor(() => expect(sender.getByRole("option", { name: "SANTIAGO DE CALI" })).toBeInTheDocument());
    fireEvent.change(sender.getByLabelText(/Ciudad/), { target: { value: "SANTIAGO DE CALI" } });
    fireEvent.change(sender.getByLabelText(/Direccion/), { target: { value: "Calle 1 # 2-3" } });
    fireEvent.change(recipient.getByLabelText(/Nombre y apellidos/), { target: { value: "Ana Perez" } });
    fireEvent.change(recipient.getByLabelText(/Telefono/), { target: { value: "3101234567" } });
    fireEvent.change(recipient.getByLabelText(/Departamento/), { target: { value: "ANTIOQUIA" } });
    await waitFor(() => expect(recipient.getByRole("option", { name: "MEDELLÍN" })).toBeInTheDocument());
    fireEvent.change(recipient.getByLabelText(/Ciudad/), { target: { value: "MEDELLÍN" } });
    fireEvent.change(recipient.getByLabelText(/Direccion completa/), { target: { value: "Carrera 45 # 10-20" } });
    fireEvent.change(shipment.getByLabelText(/Transportadora/), { target: { value: "Coordinadora" } });
  }

  it("disables the save button while a save request is in flight, to prevent duplicate saves", async () => {
    render(<LabelForm />);
    await fillValidDraft();
    const pending = deferred<import("@/lib/types").LabelRecord>();
    vi.spyOn(labelStoreModule, "getLabelStore").mockReturnValue({
      ...getLabelStore(),
      saveLabel: vi.fn().mockReturnValue(pending.promise),
    });

    fireEvent.click(screen.getByRole("button", { name: "Guardar rotulo" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar rotulo" })).toBeDisabled());
    pending.resolve({ ...createBlankLabelDraft(), id: "label-1", createdAt: "", updatedAt: "", pdfUrl: null, createdBy: null });
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar rotulo" })).toBeEnabled());
  });

  it("disables the download button while a PDF request is in flight, to prevent duplicate downloads", async () => {
    render(<LabelForm />);
    await fillValidDraft();
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);

    fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeDisabled());
    pending.resolve(new Response(new Blob(["pdf"], { type: "application/pdf" })));
    await waitFor(() => expect(screen.getByRole("button", { name: "Descargar PDF" })).toBeEnabled());
  });

  it("autofills the recipient's location when its name matches an existing customer", async () => {
    const orderDraft = createBlankOrderDraft();
    orderDraft.customer.fullName = "Ana Perez";
    orderDraft.customer.phone = "3101234567";
    orderDraft.customer.department = "Antioquia";
    orderDraft.customer.city = "Medellin";
    orderDraft.customer.address = "Carrera 45 # 10-20";
    orderDraft.customer.neighborhood = "Laureles";
    orderDraft.items = [{ productCode: "SKU1", productName: "Bolso", category: "Bolsos", quantity: 1, unitPrice: 50000 }];
    await getBusinessStore().saveOrder(orderDraft);

    const { container } = render(<LabelForm />);
    const recipient = within(screen.getByRole("group", { name: "Destinatario" }));

    await waitFor(() => expect(container.querySelector('option[value="ANA PEREZ"]')).not.toBeNull());
    fireEvent.change(recipient.getByLabelText(/Nombre y apellidos/), { target: { value: "Ana Perez" } });

    await waitFor(() => expect(recipient.getByDisplayValue("3101234567")).toBeInTheDocument());
    expect(recipient.getByDisplayValue("CARRERA 45 # 10-20")).toBeInTheDocument();
  });
});
