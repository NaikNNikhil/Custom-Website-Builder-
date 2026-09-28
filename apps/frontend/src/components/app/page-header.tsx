import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  className?: string;
};

/** Shared application page header — not website theme. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {breadcrumb ? <div className="text-sm text-muted-foreground">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary/80">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
