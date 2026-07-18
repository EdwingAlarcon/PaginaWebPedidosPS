"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "danger" | "info";
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((toast) => (
          <RadixToast.Root
            key={toast.id}
            onOpenChange={(open) => !open && remove(toast.id)}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-surface p-4 shadow-popover data-[state=closed]:opacity-0 data-[swipe=end]:translate-x-full",
              "transition-all duration-200",
            )}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
            ) : toast.variant === "danger" ? (
              <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            ) : null}
            <div className="flex-1">
              <RadixToast.Title className="text-sm font-medium text-foreground">
                {toast.title}
              </RadixToast.Title>
              {toast.description ? (
                <RadixToast.Description className="mt-1 text-sm text-foreground-muted">
                  {toast.description}
                </RadixToast.Description>
              ) : null}
            </div>
            <RadixToast.Close aria-label="Cerrar notificacion" className="text-foreground-muted">
              <X className="size-4" aria-hidden="true" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
