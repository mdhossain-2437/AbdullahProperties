import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center min-h-11 rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive:
          "bg-[#ba1a1a1a] text-destructive hover:opacity-90",
        link: "text-primary underline-offset-4 hover:underline",
        brand:
          "rounded-full bg-brand-orange text-brand-black font-bold shadow-sm hover:opacity-90",
        "brand-outline":
          "rounded-full border-brand-black bg-transparent text-brand-black font-bold hover:bg-brand-black hover:text-white",
        "brand-light":
          "rounded-full border-white bg-white text-brand-black font-bold shadow-sm hover:opacity-90",
      },
      size: {
        default: "h-11 gap-2 px-4 py-2",
        xs: "gap-1 rounded-md px-2.5 py-1 text-xs",
        sm: "gap-1.5 rounded-md px-3 py-1.5 text-xs",
        lg: "h-12 gap-2.5 px-6 py-2.5 text-base",
        icon: "size-11",
        "icon-xs": "size-11 rounded-md",
        "icon-sm": "size-11 rounded-md",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
