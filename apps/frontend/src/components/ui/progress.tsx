"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value = 0,
  ...props
}: ProgressPrimitive.Root.Props & { value?: number }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Track className="size-full">
        <ProgressPrimitive.Indicator
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${value}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
