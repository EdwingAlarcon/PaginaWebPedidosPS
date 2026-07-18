import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const alertVariants = cva("flex items-start gap-3 rounded-md border p-3 text-sm", {
  variants: {
    variant: {
      info: "border-border bg-surface-muted text-foreground",
      success: "border-transparent bg-[var(--success-soft)] text-success",
      warning: "border-transparent bg-[var(--warning-soft)] text-warning",
      danger: "border-transparent bg-[var(--danger-soft)] text-danger",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: ReactNode;
}

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps) {
  const Icon = ICONS[variant ?? "info"];
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-foreground-muted">{children}</div> : null}
      </div>
    </div>
  );
}
