import { forwardRef } from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export const Checkbox = forwardRef<
  React.ElementRef<typeof RadixCheckbox.Root>,
  React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root>
>(({ className, ...props }, ref) => (
  <RadixCheckbox.Root
    ref={ref}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded border border-border bg-surface transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadixCheckbox.Indicator>
      <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
    </RadixCheckbox.Indicator>
  </RadixCheckbox.Root>
));
Checkbox.displayName = "Checkbox";
