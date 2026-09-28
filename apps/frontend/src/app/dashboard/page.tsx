"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/auth-provider";
import { redirect } from "next/navigation";
import { apiRequest } from "@/features/auth/lib/api";

export default function DashboardPage() {
  const { isLoading, isAuthenticated, user, accessToken, logout } = useAuth();

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    void apiRequest("/api/auth/me", {
      method: "GET",
      accessToken,
    }).catch(() => logout());
  }, [accessToken, logout]);

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    redirect("/login");
    return null;
  }

  if (user.permissions.includes("admin:access")) {
    redirect("/dashboard/admin");
    return null;
  }

  redirect("/dashboard/customer");
  return null;
}
