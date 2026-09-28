import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppNavItemProps = {
  href: string;
  label: string;
  active?: boolean;
  icon?: ReactNode;
  indent?: boolean;
};

export function AppNavItem({ href, label, active, icon, indent }: AppNavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        indent && "ml-1",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {icon ? <span className="opacity-80 [&_svg]:size-4">{icon}</span> : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}

type AppNavSectionProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function AppNavSection({ title, children, action }: AppNavSectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 pb-1 pt-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
