"use client";

import { useMemo, useState } from "react";
import { getLabelStore } from "@/lib/label-store";
import type { LabelRecord } from "@/lib/types";

export function HistoryTable({ labels }: { labels: LabelRecord[] }) {
  const [query, setQuery] = useState("");
  const [tableLabels, setTableLabels] = useState(labels);
  const [actionStatus, setActionStatus] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tableLabels;
    return tableLabels.filter((label) =>
      label.orderNumber.toLowerCase().includes(needle) ||
      label.recipient.fullName.toLowerCase().includes(needle) ||
      label.recipient.phone.toLowerCase().includes(needle),
    );
  }, [query, tableLabels]);

  async function duplicateLabel(id: string) {
    const draft = await getLabelStore().duplicateLabel(id);
    setActionStatus(draft ? "Etiqueta duplicada. Abrela en Crear para completarla." : "No se pudo duplicar la etiqueta.");
  }

  async function deleteLabel(id: string) {
    await getLabelStore().deleteLabel(id);
    setTableLabels((current) => current.filter((label) => label.id !== id));
    setActionStatus("Etiqueta eliminada.");
  }

  function printLabel() {
    window.print();
    setActionStatus("Se abrio el dialogo de impresion.");
  }

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar por numero de pedido, cliente o telefono</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p role="status">{actionStatus}</p>
      <div className="history-table">
        <div className="history-row history-head">
          <span>Cliente</span><span>Telefono</span><span>Ciudad</span><span>Fecha</span><span>Pedido</span><span>Estado</span><span>Acciones</span>
        </div>
        {filtered.map((label) => (
          <div className="history-row" key={label.id}>
            <span>{label.recipient.fullName}</span>
            <span>{label.recipient.phone}</span>
            <span>{label.recipient.city}</span>
            <span>{label.date}</span>
            <span>{label.orderNumber}</span>
            <span>{label.status}</span>
            <span className="row-actions">
              <button type="button" onClick={printLabel}>Imprimir</button>
              <button type="button" disabled title="La descarga de PDF se habilitara en el siguiente paso.">PDF</button>
              <button type="button" onClick={() => duplicateLabel(label.id)}>Duplicar</button>
              <a href={`/crear?id=${label.id}`}>Editar</a>
              <button type="button" onClick={() => deleteLabel(label.id)}>Eliminar</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
