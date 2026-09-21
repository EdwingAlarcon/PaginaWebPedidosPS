"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { businessToday } from "@/lib/date";
import { formatCop } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/business-types";
import type { OrderRecord, PaymentMethod } from "@/lib/business-types";
import type { CompletionOptions } from "@/lib/order-completion";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/input";
import { Modal, ModalContent } from "@/components/ui/modal";

export type CompletionTarget = {
  order: OrderRecord;
  /** Saldo pendiente de ese pedido (0 si ya esta pagado). */
  balance: number;
};

type CompleteOrdersDialogProps = {
  targets: CompletionTarget[];
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (options: CompletionOptions) => void;
};

/**
 * Una sola accion para "completar": cambia el estado y, si hay saldo, puede
 * registrar el pago en el mismo paso. Se usa igual desde Despacho (uno o varios)
 * y desde Pedidos, para no actualizar el pago aparte.
 */
export function CompleteOrdersDialog({ targets, loading, onCancel, onConfirm }: CompleteOrdersDialogProps) {
  const open = targets.length > 0;
  const totalBalance = targets.reduce((sum, target) => sum + target.balance, 0);
  const withBalance = targets.filter((target) => target.balance > 0).length;
  const [registerPayment, setRegisterPayment] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>("transferencia");

  const title = targets.length === 1 ? "Completar pedido" : `Completar ${targets.length} pedidos`;
  const customer = targets.length === 1 ? targets[0].order.customer.fullName : "";

  return (
    <Modal open={open} onOpenChange={(next) => (!next && !loading ? onCancel() : undefined)}>
      <ModalContent title={title} description={customer || undefined} className="max-w-md">
        {totalBalance > 0 ? (
          <div className="grid gap-4">
            <p className="text-sm text-foreground-muted">
              {withBalance === 1 ? "Este pedido tiene" : `${withBalance} pedido(s) tienen`} un saldo pendiente de{" "}
              <strong className="text-foreground">{formatCop(totalBalance)}</strong>.
            </p>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-foreground">
              <Checkbox
                checked={registerPayment}
                onCheckedChange={(checked) => setRegisterPayment(checked === true)}
                aria-label="Registrar también el pago del saldo"
              />
              <span>
                Registrar también el pago del saldo
                <span className="block text-xs text-foreground-muted">
                  Si lo desmarcas, el pedido se completa pero el saldo queda en &quot;Por cobrar&quot;.
                </span>
              </span>
            </label>
            <FormField label="Método de pago">
              <Select
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                disabled={!registerPayment}
              >
                {PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>
                    {PAYMENT_METHOD_LABELS[item]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">
            {targets.length === 1 ? "El pedido" : "Los pedidos"} no tiene(n) saldo pendiente. Solo se marcará como completado.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            loading={loading}
            onClick={() => onConfirm({ registerPayment: registerPayment && totalBalance > 0, method, paidAt: businessToday() })}
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {totalBalance > 0 && registerPayment ? "Completar y marcar pagado" : "Completar"}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
