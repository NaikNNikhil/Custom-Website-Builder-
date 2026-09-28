"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "success" | "error" | "warning" | "info"

export interface ToastItem {
  id: string
  title?: string
  description?: React.ReactNode
  variant?: ToastVariant
  duration?: number
}

interface ToastContextType {
  toasts: ToastItem[]
  toast: (options: Omit<ToastItem, "id">) => string
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

let toastListener: ((toast: Omit<ToastItem, "id">) => string) | null = null

export function toast(options: Omit<ToastItem, "id">) {
  if (toastListener) {
    return toastListener(options)
  }
  return ""
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = React.useCallback((options: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { id, duration: 4000, ...options }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [dismiss])

  React.useEffect(() => {
    toastListener = addToast
    return () => {
      toastListener = null
    }
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, toast: addToast, dismiss }}>
      {children}
      <ToasterViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    return {
      toast,
      dismiss: () => {},
      toasts: [],
    }
  }
  return context
}

function ToasterViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  return (
    <div
      data-slot="toaster-viewport"
      className="fixed bottom-4 right-4 z-50 flex max-h-screen w-full max-w-sm flex-col gap-2 p-4 pointer-events-none"
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </div>
  )
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem
  onDismiss: () => void
}) {
  const variantIcons: Record<ToastVariant, React.ReactNode> = {
    default: null,
    success: <CheckCircle2 className="size-5 text-success shrink-0" />,
    error: <AlertCircle className="size-5 text-destructive shrink-0" />,
    warning: <AlertTriangle className="size-5 text-warning shrink-0" />,
    info: <Info className="size-5 text-info shrink-0" />,
  }

  return (
    <div
      data-slot="toast-card"
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg transition-all animate-in slide-in-from-bottom-5",
        item.variant === "error" && "border-destructive/30 bg-destructive/5 text-destructive",
        item.variant === "success" && "border-success/30 bg-success/5",
        item.variant === "warning" && "border-warning/30 bg-warning/5",
        item.variant === "info" && "border-info/30 bg-info/5"
      )}
    >
      {item.variant ? variantIcons[item.variant] : null}
      <div className="flex-1 gap-1 grid">
        {item.title ? <p className="text-sm font-semibold">{item.title}</p> : null}
        {item.description ? (
          <div className="text-xs text-muted-foreground">{item.description}</div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 hover:bg-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
