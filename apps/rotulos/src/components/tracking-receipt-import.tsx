"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, ScanText } from "lucide-react";
import { getLabelStore } from "@/lib/label-store";
import { buildTrackingWhatsAppText } from "@/lib/label-tracking";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { INTERRAPIDISIMO_CARRIER, parseInterrapidisimoReceipt } from "@/lib/interrapidisimo-receipt";
import { listRecentPendingLabels, matchReceiptShipments, type ShipmentMatch } from "@/lib/tracking-match";
import type { LabelRecord } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type RowOrigin = "existing" | "saved" | null;

type Row = {
  match: ShipmentMatch;
  saved: LabelRecord | null;
  origin: RowOrigin;
  selectedId: string;
  saving: boolean;
};

type Notice = { variant: "warning" | "danger"; title: string; body: string };

function rowBadge(row: Row): { label: string; variant: BadgeProps["variant"] } {
  if (row.origin === "existing") return { label: "Ya estaba guardada", variant: "neutral" };
  if (row.origin === "saved") return { label: "Guía guardada", variant: "success" };
  if (row.match.confidence === "ninguna") return { label: "Sin coincidencia", variant: "danger" };
  return { label: "Confirma el rótulo", variant: "warning" };
}

function labelOptionText(label: LabelRecord): string {
  return `${label.recipient.fullName || "SIN NOMBRE"} · ${label.recipient.city || "-"} · ${label.orderNumber} · ${label.date}`;
}

// Si la pagina vino sin separadores ("ZAIDA SUAREZBOGOTA"), usa el nombre del
// rotulo asignado para mostrar destinatario y ciudad por separado.
function describeRecipient(row: Row): string {
  const { recipientName, city, department } = row.match.shipment;
  const suffix = department ? ` (${department})` : "";
  if (city) return `${recipientName} · ${city}${suffix}`;
  const name = row.saved?.recipient.fullName ?? "";
  const compact = recipientName.replace(/ /g, "");
  const compactName = name.replace(/ /g, "");
  if (compactName && compact.startsWith(compactName) && compact.length > compactName.length) {
    return `${name} · ${compact.slice(compactName.length)}${suffix}`;
  }
  return `${recipientName}${suffix}`;
}

function sendByWhatsApp(label: LabelRecord) {
  window.open(buildWhatsAppLink(label.recipient.phone, buildTrackingWhatsAppText(label)), "_blank", "noopener,noreferrer");
}

async function saveTracking(label: LabelRecord, trackingNumber: string, trackingUrl: string | null) {
  const store = getLabelStore();
  const settings = await store.getSettings();
  return store.saveLabel(
    {
      ...label,
      trackingNumber,
      trackingUrl: trackingUrl ?? label.trackingUrl ?? null,
      carrier: label.carrier.trim() ? label.carrier : INTERRAPIDISIMO_CARRIER,
    },
    settings,
  );
}

export function TrackingReceiptImport({ initialText }: { initialText: string }) {
  const [text, setText] = useState(initialText);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [pendingLabels, setPendingLabels] = useState<LabelRecord[]>([]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [processing, setProcessing] = useState(false);
  const autoProcessed = useRef(false);
  const toast = useToast();

  async function processText(value: string) {
    setProcessing(true);
    setNotice(null);
    try {
      const parsed = parseInterrapidisimoReceipt(value);
      setReceiptUrl(parsed.receiptUrl);
      if (parsed.shipments.length === 0) {
        setRows(null);
        setNotice(
          parsed.receiptUrl
            ? {
                variant: "warning",
                title: "Solo encontré el link del comprobante",
                body: "Ábrelo, mantén presionado el texto de la página, toca Seleccionar todo y compártelo a Purple Shop (o pégalo aquí).",
              }
            : {
                variant: "danger",
                title: "No encontré guías en el texto",
                body: "Comparte o pega el texto de la página \"Ver detalles\" del mensaje de Interrapidísimo.",
              },
        );
        return;
      }

      const labels = await getLabelStore().listLabels();
      const matches = matchReceiptShipments(parsed.shipments, labels);
      const nextRows: Row[] = [];
      for (const match of matches) {
        if (match.assigned) {
          nextRows.push({ match, saved: match.assigned, origin: "existing", selectedId: "", saving: false });
        } else if (match.confidence === "alta" && match.suggested) {
          const saved = await saveTracking(match.suggested, match.shipment.trackingNumber, parsed.receiptUrl);
          nextRows.push({ match, saved, origin: "saved", selectedId: saved.id, saving: false });
        } else {
          nextRows.push({ match, saved: null, origin: null, selectedId: match.suggested?.id ?? "", saving: false });
        }
      }
      const savedIds = new Set(nextRows.flatMap((row) => (row.saved ? [row.saved.id] : [])));
      setPendingLabels(listRecentPendingLabels(labels).filter((label) => !savedIds.has(label.id)));
      setRows(nextRows);
    } catch {
      setNotice({
        variant: "danger",
        title: "No se pudo guardar la guía",
        body: "Revisa tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setProcessing(false);
    }
  }

  useEffect(() => {
    if (autoProcessed.current || !initialText.trim()) return;
    autoProcessed.current = true;
    void processText(initialText);
    // Solo se procesa automaticamente el texto compartido al abrir la pantalla.
  }, [initialText]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((current) => current?.map((row, i) => (i === index ? { ...row, ...patch } : row)) ?? current);
  }

  async function assignManually(index: number, row: Row) {
    const label = [...row.match.candidates, ...pendingLabels].find((item) => item.id === row.selectedId);
    if (!label) return;
    updateRow(index, { saving: true });
    try {
      const saved = await saveTracking(label, row.match.shipment.trackingNumber, receiptUrl);
      updateRow(index, { saved, origin: "saved", saving: false });
      setPendingLabels((current) => current.filter((item) => item.id !== saved.id));
      toast.push({ variant: "success", title: `Guía guardada en ${saved.orderNumber}.` });
    } catch {
      updateRow(index, { saving: false });
      toast.push({ variant: "danger", title: "No se pudo guardar la guía." });
    }
  }

  const assignedIds = new Set(rows?.flatMap((row) => (row.saved ? [row.saved.id] : [])) ?? []);

  return (
    <div className="grid gap-4">
      <Card className="grid gap-3">
        <p className="text-sm text-foreground-muted">
          En el mensaje de Interrapidísimo toca <strong>Ver detalles</strong>. En la página, mantén presionado el
          texto, toca <strong>Seleccionar todo</strong> y luego <strong>Compartir → Purple Shop</strong>. También puedes
          copiarlo y pegarlo aquí.
        </p>
        <FormField label="Texto del comprobante">
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Pega aquí el texto de la página del comprobante"
            rows={5}
          />
        </FormField>
        <div className="flex justify-end">
          <Button type="button" size="sm" loading={processing} disabled={!text.trim()} onClick={() => processText(text)}>
            <ScanText className="size-4" aria-hidden="true" />
            Leer comprobante
          </Button>
        </div>
      </Card>

      {notice ? (
        <Alert variant={notice.variant} title={notice.title}>
          {notice.body}
        </Alert>
      ) : null}

      {rows?.map((row, index) => {
        const { shipment } = row.match;
        const badge = rowBadge(row);
        const options = [...row.match.candidates, ...pendingLabels].filter(
          (label, i, all) => all.findIndex((item) => item.id === label.id) === i && !assignedIds.has(label.id),
        );
        return (
          <Card key={shipment.trackingNumber} className="grid gap-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs text-foreground-muted">Guía</p>
                <p className="font-mono text-base font-semibold">{shipment.trackingNumber}</p>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <p className="text-sm text-foreground-muted">
              En la guía: <span className="text-foreground">{describeRecipient(row)}</span>
            </p>

            {row.saved ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-muted p-3">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{row.saved.recipient.fullName}</p>
                  <p className="text-foreground-muted">
                    Pedido {row.saved.orderNumber} · {row.saved.recipient.city || "-"} · {row.saved.date}
                  </p>
                  {!row.saved.recipient.phone ? (
                    <p className="text-xs text-warning">El rótulo no tiene teléfono para enviar por WhatsApp.</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => row.saved && sendByWhatsApp(row.saved)}
                  disabled={!row.saved.recipient.phone}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Enviar por WhatsApp
                </Button>
              </div>
            ) : options.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <FormField label="Rótulo para esta guía">
                  <Select value={row.selectedId} onChange={(event) => updateRow(index, { selectedId: event.target.value })}>
                    <option value="">Elige un rótulo</option>
                    {options.map((label) => (
                      <option key={label.id} value={label.id}>
                        {labelOptionText(label)}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <Button
                  type="button"
                  size="sm"
                  loading={row.saving}
                  disabled={!row.selectedId}
                  onClick={() => assignManually(index, row)}
                >
                  Guardar guía
                </Button>
              </div>
            ) : (
              <Alert variant="warning" title="No hay rótulos sin guía de los últimos 30 días">
                Crea el rótulo del pedido y vuelve a compartir el comprobante.
              </Alert>
            )}
          </Card>
        );
      })}
    </div>
  );
}
