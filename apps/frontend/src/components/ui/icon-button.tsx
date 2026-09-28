"use client"

import * as React from "react"
import { Button, buttonVariants } from "./button"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface IconButtonProps
  extends React.ComponentProps<typeof Button>,
    VariantProps<typeof buttonVariants> {
  "aria-label": string
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "icon", "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        className={cn("shrink-0", className)}
        {...props}
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
