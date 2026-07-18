import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  loading,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none">
          <Dialog.Title className="text-card-title">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-foreground-muted">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="secondary" size="sm">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button variant={variant} size="sm" loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
