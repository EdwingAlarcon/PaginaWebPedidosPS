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

interface MetricCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  loading?: boolean;
  className?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, loading, className }: MetricCardProps) {
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
        {Icon ? <Icon className="size-4 text-primary" aria-hidden="true" /> : null}
      </div>
      <span className="text-2xl font-semibold text-foreground">{value}</span>
      {trend ? <span className={cn("text-xs font-medium", trendColor)}>{trend.value}</span> : null}
    </Card>
  );
}
