"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { createBlankOrderDraft, getBusinessStore } from "@/lib/business-store";
import type { OrderDraft } from "@/lib/business-types";

export function OrderForm() {
  const [draft, setDraft] = useState<OrderDraft>(() => createBlankOrderDraft());
  const [status, setStatus] = useState("");
  const subtotal = useMemo(() => draft.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [draft.items]);
  const total = Math.max(0, subtotal - draft.discount + draft.shippingCost);

  function setCustomerField(field: keyof OrderDraft["customer"], value: string) {
    setDraft((current) => ({ ...current, customer: { ...current.customer, [field]: value } }));
  }

  function setItem(index: number, field: keyof OrderDraft["items"][number], value: string | number) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function addItem() {
    setDraft((current) => ({
      ...current,
      items: [...current.items, { productCode: "", productName: "", category: "", quantity: 1, unitPrice: 0 }],
    }));
  }

  function removeItem(index: number) {
    setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    if (!draft.customer.fullName.trim()) {
      setStatus("El cliente es obligatorio.");
      return;
    }
    if (!draft.items.some((item) => item.productName.trim())) {
      setStatus("Agrega al menos un producto.");
      return;
    }
    const saved = await getBusinessStore().saveOrder({
      ...draft,
      items: draft.items.filter((item) => item.productName.trim()),
    });
    setDraft(createBlankOrderDraft());
    setStatus(`Pedido guardado para ${saved.customer.fullName}. Total $${Math.round(saved.total).toLocaleString("es-CO")}.`);
  }

  return (
    <form className="form-stack" onSubmit={saveOrder}>
      <p className="validation-summary" role="status">{status}</p>
      <fieldset className="form-section">
        <legend>Cliente</legend>
        <label className="field"><span>Nombre</span><input value={draft.customer.fullName} onChange={(event) => setCustomerField("fullName", event.target.value)} /></label>
        <label className="field"><span>Telefono</span><input value={draft.customer.phone} onChange={(event) => setCustomerField("phone", event.target.value)} /></label>
        <label className="field"><span>Email</span><input value={draft.customer.email} onChange={(event) => setCustomerField("email", event.target.value)} /></label>
        <label className="field"><span>Ciudad</span><input value={draft.customer.city} onChange={(event) => setCustomerField("city", event.target.value)} /></label>
        <label className="field"><span>Direccion</span><textarea value={draft.customer.address} onChange={(event) => setCustomerField("address", event.target.value)} /></label>
      </fieldset>

      <fieldset className="form-section">
        <legend>Productos</legend>
        {draft.items.map((item, index) => (
          <div className="order-item-grid" key={index}>
            <label className="field"><span>Codigo</span><input value={item.productCode} onChange={(event) => setItem(index, "productCode", event.target.value.toUpperCase())} /></label>
            <label className="field"><span>Producto</span><input value={item.productName} onChange={(event) => setItem(index, "productName", event.target.value)} /></label>
            <label className="field"><span>Categoria</span><input value={item.category} onChange={(event) => setItem(index, "category", event.target.value)} /></label>
            <label className="field"><span>Cantidad</span><input type="number" min="1" value={item.quantity} onChange={(event) => setItem(index, "quantity", Number(event.target.value))} /></label>
            <label className="field"><span>Precio</span><input type="number" min="0" value={item.unitPrice} onChange={(event) => setItem(index, "unitPrice", Number(event.target.value))} /></label>
            <button className="button-secondary order-item-remove" type="button" onClick={() => removeItem(index)} disabled={draft.items.length === 1}>Quitar</button>
          </div>
        ))}
        <button className="button-secondary" type="button" onClick={addItem}>Agregar producto</button>
      </fieldset>

      <fieldset className="form-section">
        <legend>Resumen</legend>
        <label className="field"><span>Fecha</span><input type="date" value={draft.orderDate} onChange={(event) => setDraft((current) => ({ ...current, orderDate: event.target.value }))} /></label>
        <label className="field"><span>Descuento</span><input type="number" min="0" value={draft.discount} onChange={(event) => setDraft((current) => ({ ...current, discount: Number(event.target.value) }))} /></label>
        <label className="field"><span>Envio</span><input type="number" min="0" value={draft.shippingCost} onChange={(event) => setDraft((current) => ({ ...current, shippingCost: Number(event.target.value) }))} /></label>
        <label className="field"><span>Notas</span><textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} /></label>
        <div className="totals-strip">
          <span>Subtotal: ${Math.round(subtotal).toLocaleString("es-CO")}</span>
          <strong>Total: ${Math.round(total).toLocaleString("es-CO")}</strong>
        </div>
      </fieldset>

      <button className="button-primary" type="submit">Guardar pedido</button>
    </form>
  );
}
