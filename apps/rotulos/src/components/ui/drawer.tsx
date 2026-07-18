import { forwardRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export const Drawer = Dialog.Root;
export const DrawerTrigger = Dialog.Trigger;

export const DrawerContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content> & { title: string; description?: string }
>(({ className, title, description, children, ...props }, ref) => (
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200" />
    <Dialog.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-surface p-5 shadow-popover focus-visible:outline-none",
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
      <div className="flex-1 overflow-y-auto">{children}</div>
    </Dialog.Content>
  </Dialog.Portal>
));
DrawerContent.displayName = "DrawerContent";
