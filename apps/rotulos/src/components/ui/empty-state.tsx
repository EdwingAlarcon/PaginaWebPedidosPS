import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-surface-muted">
        <Icon className="size-5 text-foreground-muted" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? <p className="max-w-sm text-sm text-foreground-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
