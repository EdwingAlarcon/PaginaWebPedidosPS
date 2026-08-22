import { Archive, Package, Users } from "lucide-react";
import type { HistoricalReport } from "@/lib/historical-reports";
import { formatCop } from "@/lib/format";
import { Card, CardTitle, MetricCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

function CompactRows({ rows }: { rows: { label: string; detail: string; value: string }[] }) {
  if (rows.length === 0) return <EmptyState title="Sin datos historicos" className="rounded-none border-0" />;
  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {rows.map((row) => (
        <div key={`${row.label}-${row.detail}`} className="grid grid-cols-[1fr_auto] gap-3 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{row.label}</p>
            <p className="text-xs text-foreground-muted">{row.detail}</p>
          </div>
          <p className="text-right font-medium text-foreground">{row.value}</p>
        </div>
      ))}
    </div>
  );
}

export function HistoricalReportPanel({ report }: { report: HistoricalReport }) {
  const totalOrders = report.totalsByYear.reduce((sum, item) => sum + item.orders, 0);
  const totalUnits = report.totalsByYear.reduce((sum, item) => sum + item.units, 0);
  const totalSales = report.totalsByYear.reduce((sum, item) => sum + item.total, 0);

  return (
    <section className="mt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Histórico importado 2024/2025</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">{report.historicalRefItems.length} refs HIST</Badge>
          <Badge variant={report.missingRefItems.length > 0 ? "warning" : "neutral"}>
            {report.missingRefItems.length} sin ref
          </Badge>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Pedidos importados" value={totalOrders} icon={Archive} />
        <MetricCard label="Unidades" value={totalUnits} icon={Package} />
        <MetricCard label="Ventas historicas" value={formatCop(totalSales)} icon={Users} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Totales por año</CardTitle>
          <div className="mt-4">
            <CompactRows
              rows={report.totalsByYear.map((item) => ({
                label: item.year,
                detail: `${item.orders} pedido(s) · ${item.units} unidad(es)`,
                value: formatCop(item.total),
              }))}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Productos historicos</CardTitle>
          <div className="mt-4">
            <CompactRows
              rows={report.topProducts.map((item) => ({
                label: item.productName,
                detail: item.productCode || "SIN REF",
                value: `${item.quantity} uds`,
              }))}
            />
          </div>
        </Card>
        <Card>
          <CardTitle>Clientes historicos</CardTitle>
          <div className="mt-4">
            <CompactRows
              rows={report.topCustomers.map((item) => ({
                label: item.customer,
                detail: `${item.orders} pedido(s)`,
                value: formatCop(item.total),
              }))}
            />
          </div>
        </Card>
      </div>
      {(report.historicalRefItems.length > 0 || report.missingRefItems.length > 0) ? (
        <Card className="mt-4">
          <CardTitle>Refs para revisar</CardTitle>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.historicalRefItems.slice(0, 12).map((item) => (
              <Badge key={`${item.orderId}-${item.productCode}`} variant="primary">{item.productCode}</Badge>
            ))}
            {report.missingRefItems.slice(0, 12).map((item) => (
              <Badge key={`${item.orderId}-${item.productName}`} variant="warning">{item.productName}</Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
