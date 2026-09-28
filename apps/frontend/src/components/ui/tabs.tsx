"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({ children, ...props }: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" {...props}>{children}</TabsPrimitive.Root>
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, value, children, ...props }: TabsPrimitive.Tab.Props & { value: string | number }) {
  return (
    <TabsPrimitive.Tab
      value={value}
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-xs cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Tab>
  )
}

function TabsContent({ className, value, children, ...props }: TabsPrimitive.Panel.Props & { value: string | number }) {
  return (
    <TabsPrimitive.Panel
      value={value}
      data-slot="tabs-content"
      className={cn("mt-2 ring-offset-background focus-visible:outline-none", className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Panel>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
