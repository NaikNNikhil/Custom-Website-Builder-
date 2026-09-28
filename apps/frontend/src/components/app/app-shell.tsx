import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Light SaaS shell for application chrome (admin/customer). */
export function AppShell({ sidebar, children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen bg-background text-foreground", className)}>
      {sidebar}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

type AppSidebarProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function AppSidebar({ title, subtitle, children, footer, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar text-sidebar-foreground md:min-h-screen md:w-64 md:border-b-0 md:border-r lg:w-72",
        className,
      )}
    >
      <div className="border-b border-sidebar-border px-5 py-5">
        <p className="text-base font-semibold tracking-tight text-primary">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <nav aria-label="Application navigation" className="flex-1 space-y-4 p-3">
        {children}
      </nav>
      {footer ? (
        <div className="mt-auto border-t border-sidebar-border p-3">{footer}</div>
      ) : null}
    </aside>
  );
}

type AppContentProps = {
  children: ReactNode;
  className?: string;
  width?: "md" | "lg" | "xl" | "full";
};

export function AppContent({ children, className, width = "lg" }: AppContentProps) {
  const max =
    width === "md"
      ? "max-w-3xl"
      : width === "xl"
        ? "max-w-6xl"
        : width === "full"
          ? "max-w-none"
          : "max-w-5xl";

  return (
    <div className={cn("mx-auto w-full space-y-6 p-5 md:p-8", max, className)}>{children}</div>
  );
}
