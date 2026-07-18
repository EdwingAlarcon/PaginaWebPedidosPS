import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CurrencyInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  value: number;
  onValueChange: (value: number) => void;
  currency?: string;
}

const formatter = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onValueChange, currency = "COP", ...props }, ref) => (
    <div
      className={cn(
        "flex h-10 items-center gap-1 rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring",
        className,
      )}
    >
      <span className="text-foreground-muted">{currency}</span>
      <input
        ref={ref}
        inputMode="numeric"
        className="w-full bg-transparent text-right outline-none"
        value={Number.isFinite(value) ? formatter.format(value) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/[^\d]/g, "");
          onValueChange(digits ? Number(digits) : 0);
        }}
        {...props}
      />
    </div>
  ),
);
CurrencyInput.displayName = "CurrencyInput";
