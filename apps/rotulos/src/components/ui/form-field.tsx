import { useId } from "react";
import type { ReactNode } from "react";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/cn";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, required, className, children }: FormFieldProps) {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const child =
    isValidElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>(children) &&
    !htmlFor
      ? cloneElement(children, {
          id,
          "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
          "aria-invalid": Boolean(error) || undefined,
        })
      : children;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {child}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-foreground-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
