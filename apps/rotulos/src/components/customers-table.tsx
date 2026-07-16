"use client";

import { useEffect, useMemo, useState } from "react";
import { getBusinessStore } from "@/lib/business-store";
import type { Customer } from "@/lib/business-types";

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Cargando clientes...");

  useEffect(() => {
    getBusinessStore().listCustomers()
      .then((items) => {
        setCustomers(items);
        setStatus(items.length ? "" : "No hay clientes guardados todavia.");
      })
      .catch(() => setStatus("No se pudieron cargar los clientes."));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return customers;
    return customers.filter((customer) =>
      customer.fullName.toLowerCase().includes(needle) ||
      customer.phone.includes(needle) ||
      customer.city.toLowerCase().includes(needle),
    );
  }, [customers, query]);

  return (
    <section className="panel">
      <label className="field">
        <span>Buscar cliente</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p role="status">{status}</p>
      <div className="history-table">
        <div className="customer-row business-head">
          <span>Cliente</span><span>Telefono</span><span>Email</span><span>Ciudad</span><span>Direccion</span>
        </div>
        {filtered.map((customer) => (
          <div className="customer-row" key={customer.id}>
            <span>{customer.fullName}</span>
            <span>{customer.phone}</span>
            <span>{customer.email}</span>
            <span>{customer.city}</span>
            <span>{customer.address}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
