import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          // "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
          "border-transparent bg-foreground/5 dark:bg-foreground/10 text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost:
          "border-transparent bg-transparent hover:bg-foreground/5 dark:hover:bg-foreground/10 [a&]:hover:bg-foreground/10",
        purple:
          "border-transparent bg-purple-500 dark:bg-purple-600 text-white [a&]:hover:bg-purple-600",
        "purple-outline":
          "border-purple-500 text-purple-500 dark:text-purple-400 bg-purple-500/10 dark:bg-purple-500/10 [a&]:hover:bg-purple-500/10",
        blue: "border-transparent bg-blue-500 dark:bg-blue-600 text-white [a&]:hover:bg-blue-600",
        "blue-outline":
          "border-blue-500 text-blue-500 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/10 [a&]:hover:bg-blue-500/10",
        green:
          "border-transparent bg-green-500 dark:bg-green-600 text-white [a&]:hover:bg-green-600",
        "green-outline":
          "border-green-500 text-green-500 dark:text-green-400 bg-green-500/10 dark:bg-green-500/10 [a&]:hover:bg-green-500/10",
        yellow:
          "border-transparent bg-amber-500 dark:bg-amber-600 text-white [a&]:hover:bg-amber-600",
        "yellow-outline":
          "border-amber-500 text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/10 [a&]:hover:bg-amber-500/10",
        red: "border-transparent bg-red-500 text-white [a&]:hover:bg-red-600",
        "red-outline":
          "border-red-500 text-red-500 dark:text-red-400 bg-red-500/10 dark:bg-red-500/10 [a&]:hover:bg-red-500/10",
        gray: "border-transparent bg-gray-500 text-white [a&]:hover:bg-gray-600",
        "gray-outline":
          "border-gray-500 text-gray-500 dark:text-gray-400 bg-gray-500/10 dark:bg-gray-500/10 [a&]:hover:bg-gray-500/10",
      },
      size: {
        default: "text-xs px-2 py-1.5",
        sm: "md:text-xs px-1.5 py-0.5 md:px-2 md:py-1",
        lg: "text-base px-3 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
