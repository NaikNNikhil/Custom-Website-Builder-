"use client";

import { useParams, redirect } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { BuilderShell } from "@/features/builder/BuilderShell";

export default function WebsiteBuilderPage() {
  const params = useParams<{ orgId: string; websiteId: string }>();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center">Loading...</main>;
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  if (user.permissions.includes("admin:access")) {
    redirect("/dashboard/admin");
  }

  return <BuilderShell orgId={params.orgId} websiteId={params.websiteId} />;
}
