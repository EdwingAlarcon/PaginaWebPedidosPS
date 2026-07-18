import { forwardRef } from "react";
import * as RadixRadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export const RadioGroup = RadixRadioGroup.Root;

export const RadioGroupItem = forwardRef<
  React.ElementRef<typeof RadixRadioGroup.Item>,
  React.ComponentPropsWithoutRef<typeof RadixRadioGroup.Item>
>(({ className, ...props }, ref) => (
  <RadixRadioGroup.Item
    ref={ref}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-surface transition-colors data-[state=checked]:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <RadixRadioGroup.Indicator className="size-2.5 rounded-full bg-primary" />
  </RadixRadioGroup.Item>
));
RadioGroupItem.displayName = "RadioGroupItem";
