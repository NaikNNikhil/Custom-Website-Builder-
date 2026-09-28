"use client";

import Link from "next/link";
import { BookOpen, Shield, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { AppContent } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  if (!user.permissions.includes("admin:access")) {
    redirect("/dashboard");
  }

  const tiles = [
    {
      href: "/dashboard/admin/roles",
      title: "Roles",
      description: "Manage platform roles and naming.",
      icon: Shield,
    },
    {
      href: "/dashboard/admin/users",
      title: "Users",
      description: "Review accounts and activation.",
      icon: Users,
    },
    {
      href: "/dashboard/admin/ui-library",
      title: "UI Library",
      description: "Application component reference.",
      icon: BookOpen,
    },
  ];

  return (
    <AppContent width="lg">
      <PageHeader
        eyebrow="Admin"
        title="Welcome back"
        description="Choose a masters area from the sidebar or jump in below."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group">
            <Card className="h-full transition-colors group-hover:border-primary/30 group-hover:bg-secondary/40">
              <CardHeader>
                <div className="mb-2 w-fit rounded-lg bg-secondary p-2 text-primary">
                  <tile.icon className="size-4" />
                </div>
                <CardTitle>{tile.title}</CardTitle>
                <CardDescription>{tile.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs font-medium text-primary">Open →</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </AppContent>
  );
}
