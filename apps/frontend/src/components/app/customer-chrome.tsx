"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

type CustomerChromeProps = {
  children: ReactNode;
};

/** Light top chrome for customer application pages. */
export function CustomerChrome({ children }: CustomerChromeProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-sidebar/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0">
            <Link href="/dashboard/customer" className="text-sm font-semibold text-primary">
              Website Builder
            </Link>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/customer"
              className="inline-flex h-7 items-center rounded-lg px-2.5 text-[0.8rem] font-medium text-foreground hover:bg-muted"
            >
              Organizations
            </Link>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
