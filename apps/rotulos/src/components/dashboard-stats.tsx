"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLabelStore } from "@/lib/label-store";
import type { LabelRecord } from "@/lib/types";

function isToday(value: string): boolean {
  return value.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

export function DashboardStats({ labels }: { labels: LabelRecord[] }) {
  const [dashboardLabels, setDashboardLabels] = useState(labels);

  useEffect(() => {
    getLabelStore().listLabels().then(setDashboardLabels).catch(() => setDashboardLabels(labels));
  }, [labels]);

  const todayCount = dashboardLabels.filter((label) => isToday(label.createdAt)).length;
  const latest = dashboardLabels.slice(0, 5);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="metric-card"><span>Total rotulos</span><strong>{dashboardLabels.length}</strong></div>
        <div className="metric-card"><span>Generados hoy</span><strong>{todayCount}</strong></div>
        <Link className="primary-action" href="/crear">Crear rotulo</Link>
      </div>
      <section className="panel">
        <div className="panel-title">Ultimos rotulos</div>
        <div className="divide-y divide-black/10">
          {latest.length === 0 ? (
            <p className="py-8 text-sm text-neutral-500">Aun no hay rotulos guardados.</p>
          ) : latest.map((label) => (
            <div className="flex items-center justify-between py-3" key={label.id}>
              <div>
                <div className="font-semibold">{label.recipient.fullName}</div>
                <div className="text-sm text-neutral-500">{label.orderNumber} · {label.recipient.city}</div>
              </div>
              <Link className="text-sm font-semibold text-purpleShop" href={`/crear?id=${label.id}`}>Editar</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
