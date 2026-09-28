"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-12",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface SpinnerProps
  extends Omit<React.ComponentProps<typeof Loader2>, "size">,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
