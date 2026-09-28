"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Select<Value = unknown>({ children, ...props }: SelectPrimitive.Root.Props<Value>) {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="ml-2 size-4 shrink-0 opacity-50">
        <ChevronDown className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({ className, placeholder, ...props }: SelectPrimitive.Value.Props & { placeholder?: string }) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      placeholder={placeholder}
      className={cn("block truncate text-sm", className)}
      {...props}
    />
  )
}

function SelectContent({ className, children, ...props }: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={4}>
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md transition-all animate-in fade-in-80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 p-1",
            className
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: SelectPrimitive.Item.Props & { value: string | number }) {
  return (
    <SelectPrimitive.Item
      value={value}
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute left-2 flex size-3.5 items-center justify-center">
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group className={cn("p-1", className)} {...props} />
}

function SelectLabel({ className, ...props }: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          "flex h-9 w-full appearance-none rounded-lg border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 opacity-50" />
    </div>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  NativeSelect,
}
