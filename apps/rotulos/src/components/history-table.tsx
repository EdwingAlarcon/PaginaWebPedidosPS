"use client";

import { useMemo, useState } from "react";
import type { LabelRecord } from "@/lib/types";

export function HistoryTable({ labels }: { labels: LabelRecord[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return labels;
    return labels.filter((label) =>
      label.orderNumber.toLowerCase().includes(needle) ||
      label.recipient.fullName.toLowerCase().includes(needle) ||
      label.recipient.phone.toLowerCase().includes(needle),
    );
  }, [labels, query]);

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar por numero de pedido, cliente o telefono</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="history-table">
        <div className="history-row history-head">
          <span>Cliente</span><span>Telefono</span><span>Ciudad</span><span>Pedido</span><span>Estado</span><span>Acciones</span>
        </div>
        {filtered.map((label) => (
          <div className="history-row" key={label.id}>
            <span>{label.recipient.fullName}</span>
            <span>{label.recipient.phone}</span>
            <span>{label.recipient.city}</span>
            <span>{label.orderNumber}</span>
            <span>{label.status}</span>
            <span className="row-actions">
              <button type="button">Imprimir</button>
              <button type="button">PDF</button>
              <button type="button">Duplicar</button>
              <button type="button">Editar</button>
              <button type="button">Eliminar</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
