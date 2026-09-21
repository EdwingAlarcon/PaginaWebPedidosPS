"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FilePlus2, Printer, RefreshCw } from "lucide-react";
import { getBusinessStore } from "@/lib/business-store";
import type { OrderPayment, OrderRecord } from "@/lib/business-types";
import { completeOrderWithPayment, completionBalance, type CompletionOptions } from "@/lib/order-completion";
import { groupPaymentsByOrder, summarizePayment } from "@/lib/payments";
import { buildLabelDraftFromOrder } from "@/lib/label-from-order";
import { reviewLabelQuality, type LabelQualityIssue } from "@/lib/label-quality";
import { getLabelStore } from "@/lib/label-store";
import { buildDispatchRows, type DispatchRow } from "@/lib/dispatch";
import type { LabelRecord, LabelSettings } from "@/lib/types";
import { Badge, LabelStatusBadge, PaymentBadge, StatusBadge } from "@/components/ui/badge";
import { CompleteOrdersDialog, type CompletionTarget } from "@/components/complete-orders-dialog";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type DispatchFilter = "action" | "missing-label" | "label-ready" | "pending" | "completed" | "all";
type QualityReviewState = { orderId: string; issues: LabelQualityIssue[] } | null;

function currency(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

function rowMatchesFilter(row: DispatchRow, filter: DispatchFilter): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return row.order.status === "pending";
  if (filter === "completed") return row.order.status === "completed";
  if (filter === "missing-label") return !row.label;
  if (filter === "label-ready") return row.label !== null && row.label.status !== "impreso";
  return row.order.status === "pending" || !row.label || row.label.status !== "impreso";
}

function rowMatchesDate(row: DispatchRow, from: string): boolean {
  return !from || row.order.orderDate >= from;
}

function rowMatchesQuery(row: DispatchRow, query: string): boolean {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return (
    row.order.customer.fullName.toLowerCase().includes(normalized) ||
    row.order.customer.phone.includes(normalized) ||
    row.order.items.some((item) => item.productName.toLowerCase().includes(normalized))
  );
}

function dispatchStage(row: DispatchRow): { label: string; variant: "neutral" | "primary" | "success" | "warning" | "danger" } {
  if (row.order.status === "completed" && row.label?.status === "impreso") return { label: "Listo", variant: "success" };
  if (row.issues.length > 0) return { label: "Revisar datos", variant: "danger" };
  if (!row.label) return { label: "Sin rótulo", variant: "warning" };
  if (row.label.status !== "impreso") return { label: "Por imprimir", variant: "primary" };
  return { label: "Por completar", variant: "neutral" };
}

export function DispatchBoard() {
  const [rows, setRows] = useState<DispatchRow[]>([]);
  const [settings, setSettings] = useState<LabelSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qualityReview, setQualityReview] = useState<QualityReviewState>(null);
  const [filter, setFilter] = useState<DispatchFilter>("action");
  const [fromDate, setFromDate] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchBusy, setBatchBusy] = useState(false);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [completeTargets, setCompleteTargets] = useState<CompletionTarget[]>([]);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const businessStore = getBusinessStore();
      const labelStore = getLabelStore();
      const [orders, labels, savedSettings, savedPayments] = await Promise.all([
        businessStore.listOrders(),
        labelStore.listLabels(),
        labelStore.getSettings(),
        businessStore.listPayments().catch(() => []),
      ]);
      setRows(buildDispatchRows(orders, labels));
      setSettings(savedSettings);
      setPayments(savedPayments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      const businessStore = getBusinessStore();
      const labelStore = getLabelStore();
      const [orders, labels, savedSettings, savedPayments] = await Promise.all([
        businessStore.listOrders(),
        labelStore.listLabels(),
        labelStore.getSettings(),
        businessStore.listPayments().catch(() => []),
      ]);
      if (!active) return;
      setRows(buildDispatchRows(orders, labels));
      setSettings(savedSettings);
      setPayments(savedPayments);
      setLoading(false);
    }
    void loadInitial().catch(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesFilter(row, filter) && rowMatchesDate(row, fromDate) && rowMatchesQuery(row, query)),
    [filter, fromDate, query, rows],
  );

  const metrics = useMemo(() => ({
    action: rows.filter((row) => row.order.status === "pending" || !row.label || row.label.status !== "impreso").length,
    missingLabel: rows.filter((row) => !row.label).length,
    withIssues: rows.filter((row) => row.issues.length > 0).length,
    readyToPrint: rows.filter((row) => row.label && row.label.status !== "impreso").length,
  }), [rows]);

  function updateRow(order: OrderRecord, label: LabelRecord | null) {
    setRows((current) => buildDispatchRows(current.map((row) => (row.order.id === order.id ? order : row.order)), current.map((row) => (row.order.id === order.id ? label : row.label)).filter((item): item is LabelRecord => Boolean(item))));
  }

  async function ensureLabel(row: DispatchRow): Promise<LabelRecord> {
    if (row.label) return row.label;
    if (!settings) throw new Error("settings_unavailable");
    const draft = buildLabelDraftFromOrder(row.order, settings.defaultSender);
    const review = reviewLabelQuality(draft);
    if (!review.ready) {
      setQualityReview({ orderId: row.order.id, issues: review.issues });
      throw new Error("label_quality_failed");
    }
    setQualityReview(null);
    const label = await getLabelStore().saveLabel(draft, settings);
    updateRow(row.order, label);
    return label;
  }

  async function generateLabel(row: DispatchRow) {
    setBusyId(row.order.id);
    try {
      const label = await ensureLabel(row);
      toast.push({ variant: "success", title: `Rotulo ${label.orderNumber} generado.` });
    } catch (error) {
      const message = error instanceof Error && error.message === "label_quality_failed"
        ? "Completa los datos del rótulo antes de generarlo."
        : "No se pudo generar el rótulo.";
      toast.push({ variant: "danger", title: message });
    } finally {
      setBusyId(null);
    }
  }

  async function downloadPdf(row: DispatchRow) {
    setBusyId(row.order.id);
    try {
      const label = await ensureLabel(row);
      if (!settings) throw new Error("settings_unavailable");
      const response = await fetch("/api/labels/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, settings }),
      });
      if (!response.ok) throw new Error("pdf_generation_failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rotulo-${label.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.push({ variant: "success", title: "PDF descargado." });
    } catch (error) {
      const message = error instanceof Error && error.message === "label_quality_failed"
        ? "Completa los datos del rótulo antes de descargarlo."
        : "No se pudo descargar el PDF.";
      toast.push({ variant: "danger", title: message });
    } finally {
      setBusyId(null);
    }
  }

  async function printLabel(row: DispatchRow) {
    setBusyId(row.order.id);
    try {
      const label = await ensureLabel(row);
      if (!settings) throw new Error("settings_unavailable");
      const printed = await getLabelStore().saveLabel({ ...label, status: "impreso" }, settings);
      updateRow(row.order, printed);
      window.open(`/crear?id=${printed.id}&print=1`, "_blank", "noopener,noreferrer");
      toast.push({ variant: "success", title: "Rotulo marcado como impreso." });
    } catch (error) {
      const message = error instanceof Error && error.message === "label_quality_failed"
        ? "Completa los datos del rótulo antes de imprimirlo."
        : "No se pudo preparar la impresion.";
      toast.push({ variant: "danger", title: message });
    } finally {
      setBusyId(null);
    }
  }

  const selectedRows = filteredRows.filter((row) => selectedIds.has(row.order.id));
  const allVisibleSelected = filteredRows.length > 0 && selectedRows.length === filteredRows.length;

  function toggleRow(orderId: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds(checked ? new Set(filteredRows.map((row) => row.order.id)) : new Set());
  }

  const paymentsByOrder = useMemo(() => groupPaymentsByOrder(payments), [payments]);

  function requestComplete(targetRows: DispatchRow[]) {
    const targets = targetRows
      .filter((row) => row.order.status !== "completed" && row.order.status !== "cancelled")
      .map((row) => ({ order: row.order, balance: completionBalance(row.order, paymentsByOrder.get(row.order.id) ?? []) }));
    if (targets.length > 0) setCompleteTargets(targets);
  }

  async function confirmComplete(options: CompletionOptions) {
    const targets = completeTargets;
    setBatchBusy(true);
    let done = 0;
    let paid = 0;
    let failed = 0;
    for (const target of targets) {
      const row = rows.find((item) => item.order.id === target.order.id);
      try {
        const result = await completeOrderWithPayment(
          getBusinessStore(),
          target.order,
          paymentsByOrder.get(target.order.id) ?? [],
          options,
        );
        updateRow(result.order, row?.label ?? null);
        const newPayment = result.payment;
        if (newPayment) {
          setPayments((current) => [...current, newPayment]);
          paid += 1;
        }
        done += 1;
      } catch {
        failed += 1;
      }
    }
    setBatchBusy(false);
    setCompleteTargets([]);
    setSelectedIds(new Set());
    toast.push({
      variant: failed > 0 ? "danger" : "success",
      title:
        failed > 0
          ? `${done} completado(s), ${failed} con error (revisa y reintenta).`
          : paid > 0
            ? `${done} pedido(s) completado(s) y ${paid} pago(s) registrado(s).`
            : `${done} pedido(s) marcado(s) como completado(s).`,
    });
  }

  async function generateSelectedLabels() {
    const targets = selectedRows.filter((row) => !row.label);
    if (targets.length === 0 || !settings) return;
    setBatchBusy(true);
    let done = 0;
    let skipped = 0;
    for (const row of targets) {
      const draft = buildLabelDraftFromOrder(row.order, settings.defaultSender);
      if (!reviewLabelQuality(draft).ready) {
        skipped += 1;
        continue;
      }
      try {
        const label = await getLabelStore().saveLabel(draft, settings);
        updateRow(row.order, label);
        done += 1;
      } catch {
        skipped += 1;
      }
    }
    setSelectedIds(new Set());
    setBatchBusy(false);
    toast.push({
      variant: skipped > 0 ? "danger" : "success",
      title: skipped > 0
        ? `${done} rótulo(s) generado(s); ${skipped} omitido(s) por datos incompletos o error.`
        : `${done} rótulo(s) generado(s).`,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardTitle>Accion pendiente</CardTitle>
          <p className="mt-3 text-2xl font-semibold text-foreground">{metrics.action}</p>
        </Card>
        <Card>
          <CardTitle>Sin rótulo</CardTitle>
          <p className="mt-3 text-2xl font-semibold text-warning">{metrics.missingLabel}</p>
        </Card>
        <Card>
          <CardTitle>Datos por revisar</CardTitle>
          <p className="mt-3 text-2xl font-semibold text-danger">{metrics.withIssues}</p>
        </Card>
        <Card>
          <CardTitle>Por imprimir</CardTitle>
          <p className="mt-3 text-2xl font-semibold text-primary">{metrics.readyToPrint}</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid w-full gap-3 md:w-auto md:grid-cols-[220px_160px_160px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cliente, teléfono o producto" aria-label="Buscar despacho" />
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} aria-label="Filtrar desde fecha" />
            <Select value={filter} onChange={(event) => setFilter(event.target.value as DispatchFilter)} aria-label="Filtrar bandeja">
              <option value="action">Con acción pendiente</option>
              <option value="missing-label">Sin rótulo</option>
              <option value="label-ready">Rótulo por imprimir</option>
              <option value="pending">Pedido pendiente</option>
              <option value="completed">Completados recientes</option>
              <option value="all">Todo</option>
            </Select>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Actualizar
          </Button>
        </div>

        {selectedRows.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-muted px-4 py-3">
            <span className="text-sm font-medium text-foreground">{selectedRows.length} pedido(s) seleccionado(s)</span>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={generateSelectedLabels} loading={batchBusy}>
                <FilePlus2 className="size-4" aria-hidden="true" />
                Generar rótulos
              </Button>
              <Button type="button" size="sm" onClick={() => requestComplete(selectedRows)} loading={batchBusy}>
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Marcar completados
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} disabled={batchBusy}>
                Limpiar selección
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[1020px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    aria-label="Seleccionar todos los pedidos visibles"
                    checked={allVisibleSelected}
                    onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                    disabled={filteredRows.length === 0}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Pedido</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Despacho</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Rotulo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-foreground-muted">Alertas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Total</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-foreground-muted">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-4 w-20" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-44" /></td>
                </tr>
              )) : filteredRows.map((row) => {
                const stage = dispatchStage(row);
                const isBusy = busyId === row.order.id;
                return (
                  <tr key={row.order.id} className="border-b border-border align-top last:border-0">
                    <td className="px-4 py-3">
                      <Checkbox
                        aria-label={`Seleccionar pedido de ${row.order.customer.fullName || "cliente sin nombre"}`}
                        checked={selectedIds.has(row.order.id)}
                        onCheckedChange={(checked) => toggleRow(row.order.id, checked === true)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{row.order.customer.fullName || "Cliente sin nombre"}</div>
                      <div className="mt-1 text-xs text-foreground-muted">{row.order.orderDate} · {row.order.items.length} item(s)</div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={row.order.status} />
                        <PaymentBadge status={summarizePayment(row.order, paymentsByOrder.get(row.order.id) ?? []).status} />
                      </div>
                      {completionBalance(row.order, paymentsByOrder.get(row.order.id) ?? []) > 0 ? (
                        <div className="mt-1 text-xs text-foreground-muted">
                          Debe {currency(completionBalance(row.order, paymentsByOrder.get(row.order.id) ?? []))}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={stage.variant}>{stage.label}</Badge>
                      <div className="mt-2 max-w-[220px] text-xs text-foreground-muted">{row.order.customer.city || "Sin ciudad"} · {row.order.customer.neighborhood || row.order.customer.locality || "Sin barrio/localidad"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.label ? (
                        <div className="flex flex-col gap-2">
                          <LabelStatusBadge status={row.label.status} />
                          <Link className="text-xs font-medium text-primary hover:underline" href={`/crear?id=${row.label.id}`}>{row.label.orderNumber}</Link>
                        </div>
                      ) : (
                        <Badge variant="warning">Sin rótulo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {row.issues.length ? (
                        <div className="flex max-w-[260px] flex-wrap gap-1.5">
                          {row.issues.map((issue) => <Badge key={issue.key} variant="danger">{issue.label}</Badge>)}
                        </div>
                      ) : (
                        <Badge variant="success">Datos completos</Badge>
                      )}
                      {qualityReview?.orderId === row.order.id ? (
                        <div className="mt-2 max-w-[260px] rounded-md border border-danger/20 bg-[var(--danger-soft)] p-2 text-xs text-danger">
                          <p className="font-medium">Completa el rótulo</p>
                          <ul className="mt-1 list-disc pl-4">
                            {qualityReview.issues.slice(0, 3).map((issue) => <li key={issue.field}>{issue.message}</li>)}
                          </ul>
                          <Link className="mt-2 inline-block font-medium underline" href={`/crear?fromOrderId=${row.order.id}`}>
                            Abrir formulario
                          </Link>
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{currency(row.order.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {!row.label ? (
                          <IconButton label="Generar rótulo" size="sm" variant="secondary" onClick={() => generateLabel(row)} disabled={isBusy}>
                            <FilePlus2 className="size-4" aria-hidden="true" />
                          </IconButton>
                        ) : null}
                        <IconButton label="Descargar PDF" size="sm" variant="secondary" onClick={() => downloadPdf(row)} disabled={isBusy}>
                          <Download className="size-4" aria-hidden="true" />
                        </IconButton>
                        <IconButton label="Imprimir" size="sm" variant="secondary" onClick={() => printLabel(row)} disabled={isBusy}>
                          <Printer className="size-4" aria-hidden="true" />
                        </IconButton>
                        <IconButton label="Marcar completado" size="sm" variant="secondary" onClick={() => requestComplete([row])} disabled={isBusy || row.order.status === "completed" || row.order.status === "cancelled"}>
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredRows.length === 0 ? (
            <EmptyState title="Sin pedidos para despacho" description="Ajusta los filtros o registra un pedido pendiente para verlo en esta bandeja." className="rounded-none border-0" />
          ) : null}
        </div>
      </Card>

      <CompleteOrdersDialog
        key={completeTargets.map((target) => target.order.id).join(",")}
        targets={completeTargets}
        loading={batchBusy}
        onCancel={() => setCompleteTargets([])}
        onConfirm={confirmComplete}
      />
    </div>
  );
}
