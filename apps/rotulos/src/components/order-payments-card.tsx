"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Trash2, Wallet } from "lucide-react";
import { businessToday } from "@/lib/date";
import { formatCop } from "@/lib/format";
import { getBusinessStore } from "@/lib/business-store";
import { PAYMENT_METHODS } from "@/lib/business-types";
import type { OrderPayment, OrderRecord, PaymentMethod } from "@/lib/business-types";
import { PAYMENT_METHOD_LABELS, summarizePayment } from "@/lib/payments";
import { Button, IconButton } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { PaymentBadge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type OrderPaymentsCardProps = {
  order: OrderRecord;
  payments: OrderPayment[];
  onPaymentAdded: (payment: OrderPayment) => void;
  onPaymentDeleted: (paymentId: string) => void;
};

export function OrderPaymentsCard({ order, payments, onPaymentAdded, onPaymentDeleted }: OrderPaymentsCardProps) {
  const summary = summarizePayment(order, payments);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [paidAt, setPaidAt] = useState(() => businessToday());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const sortedPayments = [...payments].sort((a, b) => a.paidAt.localeCompare(b.paidAt) || a.createdAt.localeCompare(b.createdAt));
  const canAdd = order.status !== "cancelled";

  async function register(value: number) {
    if (saving || value <= 0) return;
    setSaving(true);
    try {
      const saved = await getBusinessStore().addPayment(order.id, { amount: value, method, paidAt, note });
      onPaymentAdded(saved);
      setAmount(0);
      setNote("");
      toast.push({ variant: "success", title: `Pago de ${formatCop(saved.amount)} registrado.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? "");
      toast.push({
        variant: "danger",
        title: message.includes("order_payments")
          ? "Falta aplicar la migración de pagos en Supabase (order_payments)."
          : "No se pudo registrar el pago.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await register(amount);
  }

  async function handleDelete(payment: OrderPayment) {
    if (!window.confirm(`¿Eliminar el pago de ${formatCop(payment.amount)}?`)) return;
    try {
      await getBusinessStore().deletePayment(payment.id);
      onPaymentDeleted(payment.id);
      toast.push({ variant: "success", title: "Pago eliminado." });
    } catch {
      toast.push({ variant: "danger", title: "No se pudo eliminar el pago." });
    }
  }

  return (
    <Card className="shadow-none">
      <div className="flex items-start justify-between gap-3">
        <CardTitle>Pagos</CardTitle>
        <PaymentBadge status={summary.status} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-foreground-muted">Total</dt>
          <dd className="font-medium text-foreground">{formatCop(order.total)}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Pagado</dt>
          <dd className="font-medium text-success">{formatCop(summary.paid)}</dd>
        </div>
        <div>
          <dt className="text-foreground-muted">Por cobrar</dt>
          <dd className={summary.balance > 0 ? "font-semibold text-danger" : "font-medium text-foreground"}>
            {formatCop(summary.balance)}
          </dd>
        </div>
      </dl>

      {summary.status === "legacy" ? (
        <p className="mt-3 text-xs text-foreground-muted">
          Pedido importado sin pagos registrados; no se cuenta como deuda. Márcalo como pagado si ya se cobró.
        </p>
      ) : null}

      {sortedPayments.length > 0 ? (
        <ul className="mt-4 divide-y divide-border text-sm">
          {sortedPayments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <span className="block font-medium text-foreground">{formatCop(payment.amount)}</span>
                <span className="block truncate text-xs text-foreground-muted">
                  {payment.paidAt} · {PAYMENT_METHOD_LABELS[payment.method]}
                  {payment.note ? ` · ${payment.note}` : ""}
                </span>
              </div>
              <IconButton type="button" label="Eliminar pago" variant="ghost" onClick={() => void handleDelete(payment)}>
                <Trash2 className="size-4" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}

      {canAdd ? (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <FormField label="Monto">
            <CurrencyInput value={amount} onValueChange={setAmount} />
          </FormField>
          <FormField label="Método">
            <Select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((item) => (
                <option key={item} value={item}>
                  {PAYMENT_METHOD_LABELS[item]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Fecha">
            <DatePicker value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />
          </FormField>
          <FormField label="Nota (opcional)">
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej. abono 1 de 2" />
          </FormField>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" size="sm" loading={saving} disabled={amount <= 0}>
              <Wallet className="size-4" aria-hidden="true" />
              Registrar pago
            </Button>
            {summary.balance > 0 || summary.status === "legacy" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                loading={saving}
                onClick={() => void register(summary.balance > 0 ? summary.balance : order.total)}
              >
                {summary.balance > 0 ? `Pagar saldo (${formatCop(summary.balance)})` : "Marcar como pagado"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </Card>
  );
}
