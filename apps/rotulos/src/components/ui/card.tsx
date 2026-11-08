import type { HTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-surface p-5 shadow-card", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-card-title", className)} {...props} />;
}

export type ChipTone = "lila" | "chicle" | "limon";

const CHIP_TONES: Record<ChipTone, string> = {
  lila: "bg-[var(--lila)]",
  chicle: "bg-[var(--accent)]",
  limon: "bg-[var(--lime)]",
};

/** Icono dentro de un chip de color de marca. El icono va siempre en Noche para que se lea. */
export function IconChip({ icon: Icon, tone = "lila", className }: { icon: LucideIcon; tone?: ChipTone; className?: string }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--on-accent)]", CHIP_TONES[tone], className)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tone?: ChipTone;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  loading?: boolean;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, tone = "lila", trend, loading, className }: MetricCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-surface-muted" />
      </Card>
    );
  }

  const trendColor =
    trend?.direction === "up" ? "text-success" : trend?.direction === "down" ? "text-danger" : "text-foreground-muted";

  return (
    <Card className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground-muted">{label}</span>
        {Icon ? <IconChip icon={Icon} tone={tone} /> : null}
      </div>
      <span className="font-display text-2xl font-semibold text-foreground">{value}</span>
      {trend ? <span className={cn("text-xs font-medium", trendColor)}>{trend.value}</span> : null}
    </Card>
  );
}
