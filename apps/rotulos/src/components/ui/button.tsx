import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-surface text-foreground border border-border hover:bg-surface-muted",
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        danger: "bg-danger text-white hover:brightness-95",
        link: "bg-transparent text-primary hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", label, children, ...props }, ref) => {
    const sizeClass = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-10";
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(buttonVariants({ variant, size: undefined }), sizeClass, "p-0", className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";
