"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

function Drawer({ children, ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
}

function DrawerTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="drawer-close" {...props} />
}

const drawerContentVariants = cva(
  "fixed z-50 flex flex-col bg-background p-6 shadow-xl transition-transform duration-300 ease-in-out border-border",
  {
    variants: {
      placement: {
        right: "inset-y-0 right-0 h-full w-full max-w-md border-l animate-in slide-in-from-right",
        left: "inset-y-0 left-0 h-full w-full max-w-md border-r animate-in slide-in-from-left",
        top: "inset-x-0 top-0 w-full max-h-[85vh] border-b animate-in slide-in-from-top",
        bottom: "inset-x-0 bottom-0 w-full max-h-[85vh] border-t rounded-t-xl animate-in slide-in-from-bottom",
      },
    },
    defaultVariants: {
      placement: "right",
    },
  }
)

export interface DrawerContentProps
  extends DialogPrimitive.Popup.Props,
    VariantProps<typeof drawerContentVariants> {}

function DrawerContent({
  className,
  children,
  placement = "right",
  ...props
}: DrawerContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in-0" />
      <DialogPrimitive.Popup
        data-slot="drawer-content"
        className={cn(drawerContentVariants({ placement, className }))}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  )
}

function DrawerPortal(props: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 text-left pb-4 border-b border-border", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 pt-4 border-t border-border sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function DrawerDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerPortal,
}
