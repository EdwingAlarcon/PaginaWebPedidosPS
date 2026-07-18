import { forwardRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Modal = Dialog.Root;
export const ModalTrigger = Dialog.Trigger;

export const ModalContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & { title: string; description?: string }
>(({ className, title, description, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Dialog.Title className="text-card-title">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-sm text-foreground-muted">
              {description}
            </Dialog.Description>
          ) : null}
        </div>
        <Dialog.Close
          aria-label="Cerrar"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </Dialog.Close>
      </div>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
));
ModalContent.displayName = "ModalContent";
