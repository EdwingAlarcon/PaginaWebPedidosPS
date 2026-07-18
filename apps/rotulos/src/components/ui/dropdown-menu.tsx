import { forwardRef } from "react";
import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const DropdownMenu = RadixDropdown.Root;
export const DropdownMenuTrigger = RadixDropdown.Trigger;

export const DropdownMenuContent = forwardRef<
  React.ElementRef<typeof RadixDropdown.Content>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-40 rounded-md border border-border bg-surface p-1 shadow-popover",
        className,
      )}
      {...props}
    />
  </RadixDropdown.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = forwardRef<
  React.ElementRef<typeof RadixDropdown.Item>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Item>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(
      "flex h-9 cursor-pointer items-center gap-2 rounded px-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-surface-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof RadixDropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <RadixDropdown.CheckboxItem
    ref={ref}
    className={cn(
      "flex h-9 cursor-pointer items-center gap-2 rounded px-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-surface-muted",
      className,
    )}
    {...props}
  >
    <RadixDropdown.ItemIndicator>
      <Check className="size-3.5" aria-hidden="true" />
    </RadixDropdown.ItemIndicator>
    {children}
  </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

export const DropdownMenuSeparator = forwardRef<
  React.ElementRef<typeof RadixDropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.Separator>
>(({ className, ...props }, ref) => (
  <RadixDropdown.Separator ref={ref} className={cn("my-1 h-px bg-border", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";
