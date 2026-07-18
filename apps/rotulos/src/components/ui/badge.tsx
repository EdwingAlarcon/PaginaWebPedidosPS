import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-foreground-muted",
        primary: "bg-[var(--primary-soft)] text-primary",
        success: "bg-[var(--success-soft)] text-success",
        warning: "bg-[var(--warning-soft)] text-warning",
        danger: "bg-[var(--danger-soft)] text-danger",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export type OrderStatus = "pending" | "completed" | "cancelled";

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: BadgeProps["variant"] }> = {
  pending: { label: "Pendiente", variant: "warning" },
  completed: { label: "Completado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "danger" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = ORDER_STATUS_MAP[status];
  return (
    <Badge variant={config.variant}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}

export type LabelStatus = "borrador" | "generado" | "impreso" | "anulado";

const LABEL_STATUS_MAP: Record<LabelStatus, { label: string; variant: BadgeProps["variant"] }> = {
  borrador: { label: "Borrador", variant: "neutral" },
  generado: { label: "Generado", variant: "primary" },
  impreso: { label: "Impreso", variant: "success" },
  anulado: { label: "Anulado", variant: "danger" },
};

export function LabelStatusBadge({ status }: { status: LabelStatus }) {
  const config = LABEL_STATUS_MAP[status];
  return (
    <Badge variant={config.variant}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
