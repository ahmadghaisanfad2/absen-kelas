import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center w-fit border border-transparent font-medium whitespace-nowrap outline-none transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-border text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-[var(--badge-success)] text-[var(--badge-success-fg)]",
        "success-light":
          "bg-[var(--badge-success)]/10 border-none text-[var(--badge-success-fg)] dark:bg-[var(--badge-success)]/20",
        warning:
          "bg-[var(--badge-warning)] text-[var(--badge-warning-fg)]",
        "warning-light":
          "bg-[var(--badge-warning)]/10 border-none text-[var(--badge-warning-fg)] dark:bg-[var(--badge-warning)]/20",
        info:
          "bg-[var(--badge-info)] text-[var(--badge-info-fg)]",
        "info-light":
          "bg-[var(--badge-info)]/10 border-none text-[var(--badge-info-fg)] dark:bg-[var(--badge-info)]/20",
        "destructive-light":
          "bg-destructive/10 border-none text-destructive dark:bg-destructive/20",
      },
      size: {
        xs: "px-1 py-0.5 text-[0.6rem] leading-none h-4 min-w-4 gap-1",
        sm: "px-1 py-0.5 text-[0.625rem] leading-none h-4.5 min-w-4.5 gap-1",
        default: "px-2 py-0.5 text-xs h-5 min-w-5 gap-1",
        lg: "px-1.5 py-0.5 text-xs h-5.5 min-w-5.5 gap-1",
        xl: "px-2 py-0.75 text-sm h-6 min-w-6 gap-1.5",
      },
      radius: {
        default: "rounded-sm",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "full",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  radius,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size, radius }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
