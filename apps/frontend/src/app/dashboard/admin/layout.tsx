"use client";

import { usePathname, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { BookOpen, LayoutDashboard, Shield, Users } from "lucide-react";
import { AppShell, AppSidebar } from "@/components/app/app-shell";
import { AppNavItem, AppNavSection } from "@/components/app/app-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
    return null;
  }

  if (!user.permissions.includes("admin:access")) {
    redirect("/dashboard");
    return null;
  }

  const isDashboard = pathname === "/dashboard/admin";
  const isRolesActive = pathname.startsWith("/dashboard/admin/roles");
  const isUsersActive = pathname.startsWith("/dashboard/admin/users");
  const isUiLibraryActive = pathname.startsWith("/dashboard/admin/ui-library");

  return (
    <AppShell
      sidebar={
        <AppSidebar
          title="Admin Dashboard"
          subtitle="Platform administration"
          footer={
            <div className="space-y-2">
              <p className="truncate px-1 text-xs text-muted-foreground">{user.email}</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => void logout()}>
                Log out
              </Button>
            </div>
          }
        >
          <AppNavSection title="Overview">
            <AppNavItem
              href="/dashboard/admin"
              label="Dashboard"
              active={isDashboard}
              icon={<LayoutDashboard />}
            />
          </AppNavSection>

          <AppNavSection title="Masters">
            <AppNavItem
              href="/dashboard/admin/roles"
              label="Roles"
              active={isRolesActive}
              icon={<Shield />}
              indent
            />
            <AppNavItem
              href="/dashboard/admin/users"
              label="Users"
              active={isUsersActive}
              icon={<Users />}
              indent
            />
            <AppNavItem
              href="/dashboard/admin/ui-library"
              label="UI Library"
              active={isUiLibraryActive}
              icon={<BookOpen />}
              indent
            />
          </AppNavSection>
        </AppSidebar>
      }
    >
      {children}
    </AppShell>
  );
}
